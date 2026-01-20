const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getDb } = require('../database/init');
const { authMiddleware, requireBusiness } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(requireBusiness);

// Get all clients
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const clients = db.prepare(`
      SELECT * FROM clients 
      WHERE business_id = ? 
      ORDER BY nombre ASC
    `).all(req.user.business_id);

    res.json({ clients });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

// Search clients
router.get('/search', (req, res) => {
  try {
    const db = getDb();
    const { q } = req.query;
    const clients = db.prepare(`
      SELECT * FROM clients 
      WHERE business_id = ? 
      AND (nombre LIKE ? OR numero_documento LIKE ?)
      ORDER BY nombre ASC
      LIMIT 20
    `).all(req.user.business_id, `%${q}%`, `%${q}%`);

    res.json({ clients });
  } catch (error) {
    console.error('Search clients error:', error);
    res.status(500).json({ error: 'Error al buscar clientes' });
  }
});

// Get single client
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const client = db.prepare(`
      SELECT * FROM clients 
      WHERE id = ? AND business_id = ?
    `).get(req.params.id, req.user.business_id);

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ client });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
});

// Validation
const clientValidation = [
  body('tipoDocumento').isIn(['DNI', 'RUC', 'CE', 'PASAPORTE']).withMessage('Tipo de documento inválido'),
  body('numeroDocumento').notEmpty().withMessage('Número de documento requerido'),
  body('nombre').notEmpty().withMessage('Nombre requerido')
];

// Create client
router.post('/', clientValidation, (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const db = getDb();
    const { tipoDocumento, numeroDocumento, nombre, direccion, email, telefono } = req.body;

    // Check if client with same document exists
    const existing = db.prepare(`
      SELECT id FROM clients 
      WHERE business_id = ? AND tipo_documento = ? AND numero_documento = ?
    `).get(req.user.business_id, tipoDocumento, numeroDocumento);

    if (existing) {
      return res.status(400).json({ error: 'Ya existe un cliente con este documento' });
    }

    const result = db.prepare(`
      INSERT INTO clients (business_id, tipo_documento, numero_documento, nombre, direccion, email, telefono)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.business_id, tipoDocumento, numeroDocumento, nombre, direccion || '', email || '', telefono || '');

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ 
      message: 'Cliente creado exitosamente',
      client 
    });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
});

// Update client
router.put('/:id', clientValidation, (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const db = getDb();
    const { tipoDocumento, numeroDocumento, nombre, direccion, email, telefono } = req.body;

    // Check if client exists and belongs to business
    const existing = db.prepare(`
      SELECT id FROM clients WHERE id = ? AND business_id = ?
    `).get(req.params.id, req.user.business_id);

    if (!existing) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    db.prepare(`
      UPDATE clients 
      SET tipo_documento = ?, numero_documento = ?, nombre = ?, direccion = ?, email = ?, telefono = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(tipoDocumento, numeroDocumento, nombre, direccion || '', email || '', telefono || '', req.params.id);

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);

    res.json({ 
      message: 'Cliente actualizado exitosamente',
      client 
    });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

// Delete client
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare(`
      SELECT id FROM clients WHERE id = ? AND business_id = ?
    `).get(req.params.id, req.user.business_id);

    if (!existing) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);

    res.json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

module.exports = router;
