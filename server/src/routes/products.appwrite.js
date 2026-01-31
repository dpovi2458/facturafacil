const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { productService } = require('../database/appwrite');
const { authMiddleware, requireBusiness } = require('../middleware/auth.appwrite');

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(requireBusiness);

// Get all products
router.get('/', async (req, res) => {
  try {
    const { activo } = req.query;
    let activoValue = undefined;
    
    if (activo !== undefined) {
      activoValue = activo === 'true';
    }

    const products = await productService.findByBusinessId(req.user.business_id, activoValue);
    res.json({ products });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Search products
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    const products = await productService.search(req.user.business_id, q);
    res.json({ products });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ error: 'Error al buscar productos' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await productService.findById(req.params.id, req.user.business_id);

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
router.post('/', productValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { codigo, descripcion, unidadMedida, precio, tipo, igvIncluido } = req.body;

    const product = await productService.create({
      businessId: req.user.business_id,
      codigo: codigo || '',
      descripcion,
      unidadMedida: unidadMedida || 'NIU',
      precio,
      tipo: tipo || 'producto',
      igvIncluido: igvIncluido !== false
    });

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
router.put('/:id', productValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { codigo, descripcion, unidadMedida, precio, tipo, igvIncluido, activo } = req.body;

    // Check if product exists
    const existing = await productService.findById(req.params.id, req.user.business_id);
    if (!existing) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const product = await productService.update(req.params.id, {
      codigo: codigo || '',
      descripcion,
      unidad_medida: unidadMedida || 'NIU',
      precio,
      tipo: tipo || 'producto',
      igv_incluido: igvIncluido !== false,
      activo: activo !== false
    });

    res.json({
      message: 'Producto actualizado exitosamente',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// Delete product (soft delete - set activo = false)
router.delete('/:id', async (req, res) => {
  try {
    const product = await productService.findById(req.params.id, req.user.business_id);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await productService.update(req.params.id, { activo: false });

    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

module.exports = router;
