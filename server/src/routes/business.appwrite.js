const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { businessService, seriesService } = require('../database/appwrite');
const { authMiddleware, requireBusiness } = require('../middleware/auth.appwrite');

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(requireBusiness);

// Get business info
router.get('/', async (req, res) => {
  try {
    const business = await businessService.findById(req.user.business_id);
    const series = await seriesService.findByBusinessId(req.user.business_id);

    res.json({ 
      business: {
        id: business.id,
        ruc: business.ruc,
        razonSocial: business.razon_social,
        nombreComercial: business.nombre_comercial,
        direccion: business.direccion,
        ubigeo: business.ubigeo,
        departamento: business.departamento,
        provincia: business.provincia,
        distrito: business.distrito,
        telefono: business.telefono,
        email: business.email,
        logo: business.logo,
        plan: business.plan,
        documentsThisMonth: business.documents_this_month
      },
      series 
    });
  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({ error: 'Error al obtener datos del negocio' });
  }
});

// Update business info
router.put('/', [
  body('razonSocial').notEmpty().withMessage('Razón social es requerida'),
  body('direccion').notEmpty().withMessage('Dirección es requerida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      razonSocial, nombreComercial, direccion, ubigeo,
      departamento, provincia, distrito, telefono, email 
    } = req.body;

    const business = await businessService.update(req.user.business_id, {
      razon_social: razonSocial,
      nombre_comercial: nombreComercial || razonSocial,
      direccion,
      ubigeo: ubigeo || '',
      departamento: departamento || '',
      provincia: provincia || '',
      distrito: distrito || '',
      telefono: telefono || '',
      email: email || ''
    });

    res.json({ 
      message: 'Datos del negocio actualizados',
      business 
    });
  } catch (error) {
    console.error('Update business error:', error);
    res.status(500).json({ error: 'Error al actualizar datos del negocio' });
  }
});

// Get series
router.get('/series', async (req, res) => {
  try {
    const series = await seriesService.findByBusinessId(req.user.business_id);
    res.json({ series });
  } catch (error) {
    console.error('Get series error:', error);
    res.status(500).json({ error: 'Error al obtener series' });
  }
});

// Create series
router.post('/series', [
  body('tipo').isIn(['boleta', 'factura']).withMessage('Tipo inválido'),
  body('serie').matches(/^[BF][0-9]{3}$/).withMessage('Serie debe ser formato B001 o F001')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tipo, serie } = req.body;

    // Check if series exists
    const existing = await seriesService.findBySerieAndTipo(req.user.business_id, tipo, serie);

    if (existing) {
      return res.status(400).json({ error: 'Esta serie ya existe' });
    }

    await seriesService.create({
      businessId: req.user.business_id,
      tipo,
      serie,
      ultimoNumero: 0
    });

    const allSeries = await seriesService.findByBusinessId(req.user.business_id);

    res.status(201).json({ 
      message: 'Serie creada exitosamente',
      series: allSeries 
    });
  } catch (error) {
    console.error('Create series error:', error);
    res.status(500).json({ error: 'Error al crear serie' });
  }
});

module.exports = router;
