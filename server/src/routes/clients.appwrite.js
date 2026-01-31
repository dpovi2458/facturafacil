const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { clientService } = require('../database/appwrite');
const { authMiddleware, requireBusiness } = require('../middleware/auth.appwrite');

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(requireBusiness);

// Get all clients
router.get('/', async (req, res) => {
  try {
    const clients = await clientService.findByBusinessId(req.user.business_id);
    res.json({ clients });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

// Search clients
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    const clients = await clientService.search(req.user.business_id, q);
    res.json({ clients });
  } catch (error) {
    console.error('Search clients error:', error);
    res.status(500).json({ error: 'Error al buscar clientes' });
  }
});

// Get single client
router.get('/:id', async (req, res) => {
  try {
    const client = await clientService.findById(req.params.id, req.user.business_id);

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
router.post('/', clientValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tipoDocumento, numeroDocumento, nombre, direccion, email, telefono } = req.body;

    // Check if client with same document exists
    const existing = await clientService.findByDocument(
      req.user.business_id,
      tipoDocumento,
      numeroDocumento
    );

    if (existing) {
      return res.status(400).json({ error: 'Ya existe un cliente con este documento' });
    }

    const client = await clientService.create({
      businessId: req.user.business_id,
      tipoDocumento,
      numeroDocumento,
      nombre,
      direccion: direccion || '',
      email: email || '',
      telefono: telefono || ''
    });

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
router.put('/:id', clientValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tipoDocumento, numeroDocumento, nombre, direccion, email, telefono } = req.body;

    // Check if client exists
    const existing = await clientService.findById(req.params.id, req.user.business_id);
    if (!existing) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Check for duplicate document (excluding current client)
    const duplicate = await clientService.findByDocument(
      req.user.business_id,
      tipoDocumento,
      numeroDocumento
    );

    if (duplicate && duplicate.id !== req.params.id) {
      return res.status(400).json({ error: 'Ya existe otro cliente con este documento' });
    }

    const client = await clientService.update(req.params.id, {
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumento,
      nombre,
      direccion: direccion || '',
      email: email || '',
      telefono: telefono || ''
    });

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
router.delete('/:id', async (req, res) => {
  try {
    const client = await clientService.findById(req.params.id, req.user.business_id);

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    await clientService.delete(req.params.id);

    res.json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

module.exports = router;
