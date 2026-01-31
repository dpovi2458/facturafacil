const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { userService, businessService, seriesService } = require('../database/appwrite');
const { authMiddleware } = require('../middleware/auth.appwrite');

// Simple email sending (in production, use a proper email service)
const sendEmail = async (to, subject, html) => {
  // Log for development - in production, integrate with SendGrid, Mailgun, etc.
  console.log('📧 Email to:', to);
  console.log('Subject:', subject);
  console.log('Content:', html);
  
  // For now, we'll just log the email
  // In production, integrate with nodemailer or an email service
  return true;
};

// Store reset tokens temporarily (in production, use Redis or database)
const resetTokens = new Map();

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

    // Check if email exists
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Este email ya está registrado' });
    }

    // Check if RUC exists
    const existingRuc = await businessService.findByRuc(ruc);
    if (existingRuc) {
      return res.status(400).json({ error: 'Este RUC ya está registrado' });
    }

    // Create user
    const user = await userService.create(email, password);

    // Create business
    const business = await businessService.create({
      userId: user.id,
      ruc,
      razonSocial,
      nombreComercial: nombreComercial || razonSocial,
      direccion,
      telefono: telefono || '',
      email,
      plan: 'trial'
    });

    // Create default series
    await seriesService.create({
      businessId: business.id,
      tipo: 'boleta',
      serie: 'B001',
      ultimoNumero: 0
    });

    await seriesService.create({
      businessId: business.id,
      tipo: 'factura',
      serie: 'F001',
      ultimoNumero: 0
    });

    // Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registro exitoso. ¡Bienvenido a FacturaFácil!',
      token,
      user: {
        id: user.id,
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

    // Find user
    const user = await userService.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Check password
    const isValidPassword = await userService.validatePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Get business info
    const business = await businessService.findByUserId(user.id);

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
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const business = await businessService.findByUserId(req.user.id);
    
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

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email es requerido' });
    }

    // Find user
    const user = await userService.findByEmail(email);
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 3600000; // 1 hour

    // Store token
    resetTokens.set(resetToken, { userId: user.id, email, expiresAt });

    // Build reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}&userId=${user.id}`;

    // Send email (in production, use proper email service)
    await sendEmail(
      email,
      'Restablecer contraseña - FacturaFácil',
      `
        <h2>Restablecer tu contraseña</h2>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px;">
          Restablecer Contraseña
        </a>
        <p>Este enlace expira en 1 hora.</p>
        <p>Si no solicitaste restablecer tu contraseña, ignora este correo.</p>
      `
    );

    res.json({ message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Error al procesar solicitud' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { userId, token, password } = req.body;

    if (!userId || !token || !password) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verify token
    const tokenData = resetTokens.get(token);
    if (!tokenData || tokenData.userId !== userId) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    if (Date.now() > tokenData.expiresAt) {
      resetTokens.delete(token);
      return res.status(400).json({ error: 'Token expirado' });
    }

    // Update password
    await userService.updatePassword(userId, password);

    // Delete token
    resetTokens.delete(token);

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Error al restablecer contraseña' });
  }
});

module.exports = router;
