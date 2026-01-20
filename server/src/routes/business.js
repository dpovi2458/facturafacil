const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getDb } = require('../database/init');
const { authMiddleware, requireBusiness } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(requireBusiness);

// Get business info
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.user.business_id);
    const series = db.prepare('SELECT * FROM series WHERE business_id = ?').all(req.user.business_id);

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
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const db = getDb();
    const { 
      razonSocial, nombreComercial, direccion, ubigeo,
      departamento, provincia, distrito, telefono, email 
    } = req.body;

    db.prepare(`
      UPDATE businesses SET 
        razon_social = ?, nombre_comercial = ?, direccion = ?,
        ubigeo = ?, departamento = ?, provincia = ?, distrito = ?,
        telefono = ?, email = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      razonSocial, nombreComercial || razonSocial, direccion,
      ubigeo || '', departamento || '', provincia || '', distrito || '',
      telefono || '', email || '', req.user.business_id
    );

    const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.user.business_id);

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
router.get('/series', (req, res) => {
  try {
    const db = getDb();
    const series = db.prepare(`
      SELECT * FROM series WHERE business_id = ? ORDER BY tipo, serie
    `).all(req.user.business_id);

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
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const db = getDb();
    const { tipo, serie } = req.body;

    // Check if series exists
    const existing = db.prepare(`
      SELECT id FROM series WHERE business_id = ? AND tipo = ? AND serie = ?
    `).get(req.user.business_id, tipo, serie);

    if (existing) {
      return res.status(400).json({ error: 'Esta serie ya existe' });
    }

    db.prepare(`
      INSERT INTO series (business_id, tipo, serie, ultimo_numero) VALUES (?, ?, ?, 0)
    `).run(req.user.business_id, tipo, serie);

    const newSeries = db.prepare('SELECT * FROM series WHERE business_id = ?').all(req.user.business_id);

    res.status(201).json({ 
      message: 'Serie creada exitosamente',
      series: newSeries 
    });
  } catch (error) {
    console.error('Create series error:', error);
    res.status(500).json({ error: 'Error al crear serie' });
  }
});

module.exports = router;
