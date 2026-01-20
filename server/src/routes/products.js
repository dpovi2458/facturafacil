const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getDb } = require('../database/init');
const { authMiddleware, requireBusiness } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(requireBusiness);

// Get all products
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { activo } = req.query;
    let query = 'SELECT * FROM products WHERE business_id = ?';
    const params = [req.user.business_id];

    if (activo !== undefined) {
      query += ' AND activo = ?';
      params.push(activo === 'true' ? 1 : 0);
    }

    query += ' ORDER BY descripcion ASC';

    const products = db.prepare(query).all(...params);

    res.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Search products
router.get('/search', (req, res) => {
  try {
    const db = getDb();
    const { q } = req.query;
    const products = db.prepare(`
      SELECT * FROM products 
      WHERE business_id = ? 
      AND activo = 1
      AND (descripcion LIKE ? OR codigo LIKE ?)
      ORDER BY descripcion ASC
      LIMIT 20
    `).all(req.user.business_id, `%${q}%`, `%${q}%`);

    res.json({ products });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ error: 'Error al buscar productos' });
  }
});

// Get single product
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const product = db.prepare(`
      SELECT * FROM products 
      WHERE id = ? AND business_id = ?
    `).get(req.params.id, req.user.business_id);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// Validation
const productValidation = [
  body('descripcion').notEmpty().withMessage('Descripción requerida'),
  body('precio').isFloat({ min: 0 }).withMessage('Precio debe ser un número positivo'),
  body('tipo').optional().isIn(['producto', 'servicio']).withMessage('Tipo inválido')
];

// Create product
router.post('/', productValidation, (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const db = getDb();
    const { codigo, descripcion, unidadMedida, precio, tipo, igvIncluido } = req.body;

    const result = db.prepare(`
      INSERT INTO products (business_id, codigo, descripcion, unidad_medida, precio, tipo, igv_incluido)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.business_id, 
      codigo || '', 
      descripcion, 
      unidadMedida || 'NIU', 
      precio, 
      tipo || 'producto',
      igvIncluido !== false ? 1 : 0
    );

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ 
      message: 'Producto creado exitosamente',
      product 
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// Update product
router.put('/:id', productValidation, (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const db = getDb();
    const { codigo, descripcion, unidadMedida, precio, tipo, igvIncluido, activo } = req.body;

    // Check if product exists and belongs to business
    const existing = db.prepare(`
      SELECT id FROM products WHERE id = ? AND business_id = ?
    `).get(req.params.id, req.user.business_id);

    if (!existing) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    db.prepare(`
      UPDATE products 
      SET codigo = ?, descripcion = ?, unidad_medida = ?, precio = ?, tipo = ?, igv_incluido = ?, activo = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      codigo || '', 
      descripcion, 
      unidadMedida || 'NIU', 
      precio, 
      tipo || 'producto',
      igvIncluido !== false ? 1 : 0,
      activo !== false ? 1 : 0,
      req.params.id
    );

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

    res.json({ 
      message: 'Producto actualizado exitosamente',
      product 
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// Delete product (soft delete)
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare(`
      SELECT id FROM products WHERE id = ? AND business_id = ?
    `).get(req.params.id, req.user.business_id);

    if (!existing) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Soft delete - just mark as inactive
    db.prepare('UPDATE products SET activo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);

    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

module.exports = router;
