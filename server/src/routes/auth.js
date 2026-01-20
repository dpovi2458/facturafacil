const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../database/init');
const { authMiddleware } = require('../middleware/auth');

// Validation middleware
const registerValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('ruc').isLength({ min: 11, max: 11 }).withMessage('RUC debe tener 11 dígitos'),
  body('razonSocial').notEmpty().withMessage('Razón social es requerida'),
  body('direccion').notEmpty().withMessage('Dirección es requerida')
];

const loginValidation = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña requerida')
];

// Register
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, ruc, razonSocial, nombreComercial, direccion, telefono } = req.body;
    const db = getDb();

    // Check if email exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Este email ya está registrado' });
    }

    // Check if RUC exists
    const existingRuc = db.prepare('SELECT id FROM businesses WHERE ruc = ?').get(ruc);
    if (existingRuc) {
      return res.status(400).json({ error: 'Este RUC ya está registrado' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userResult = db.prepare(`
      INSERT INTO users (email, password) VALUES (?, ?)
    `).run(email, hashedPassword);

    const userId = userResult.lastInsertRowid;

    // Create business
    db.prepare(`
      INSERT INTO businesses (user_id, ruc, razon_social, nombre_comercial, direccion, telefono, email, plan)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'trial')
    `).run(userId, ruc, razonSocial, nombreComercial || razonSocial, direccion, telefono || '', email);

    const business = db.prepare('SELECT * FROM businesses WHERE user_id = ?').get(userId);

    // Create default series
    db.prepare(`
      INSERT INTO series (business_id, tipo, serie, ultimo_numero) VALUES (?, 'boleta', 'B001', 0)
    `).run(business.id);

    db.prepare(`
      INSERT INTO series (business_id, tipo, serie, ultimo_numero) VALUES (?, 'factura', 'F001', 0)
    `).run(business.id);

    // Generate token
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registro exitoso. ¡Bienvenido a FacturaFácil!',
      token,
      user: {
        id: userId,
        email,
        business: {
          id: business.id,
          ruc,
          razonSocial,
          nombreComercial: nombreComercial || razonSocial,
          direccion,
          plan: 'trial'
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Login
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const db = getDb();

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Get business info
    const business = db.prepare('SELECT * FROM businesses WHERE user_id = ?').get(user.id);

    // Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        business: business ? {
          id: business.id,
          ruc: business.ruc,
          razonSocial: business.razon_social,
          nombreComercial: business.nombre_comercial,
          direccion: business.direccion,
          plan: business.plan,
          documentsThisMonth: business.documents_this_month
        } : null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Get current user
router.get('/me', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const business = db.prepare('SELECT * FROM businesses WHERE user_id = ?').get(req.user.id);
    
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        business: business ? {
          id: business.id,
          ruc: business.ruc,
          razonSocial: business.razon_social,
          nombreComercial: business.nombre_comercial,
          direccion: business.direccion,
          telefono: business.telefono,
          email: business.email,
          plan: business.plan,
          documentsThisMonth: business.documents_this_month,
          logo: business.logo
        } : null
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Error al obtener datos del usuario' });
  }
});

module.exports = router;
