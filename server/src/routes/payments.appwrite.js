const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { paymentService, businessService } = require('../database/appwrite');
const { authMiddleware } = require('../middleware/auth.appwrite');

// Email notification (in production, use proper email service)
const sendPaymentNotification = async (paymentData, userEmail) => {
  const adminEmail = 'gorgojomagneto@gmail.com';
  
  console.log('📧 PAYMENT NOTIFICATION');
  console.log('To:', adminEmail);
  console.log('Subject: Nuevo pago recibido - FacturaFácil');
  console.log('---');
  console.log(`
    🔔 NUEVO PAGO RECIBIDO
    
    Usuario: ${userEmail}
    Plan: ${paymentData.plan}
    Monto: S/${paymentData.monto}
    Método: ${paymentData.metodoPago}
    Referencia: ${paymentData.referencia}
    Notas: ${paymentData.notas || 'Sin notas'}
    Fecha: ${new Date().toLocaleString('es-PE')}
    
    Accede al panel de administración para verificar el pago.
  `);
  
  // In production, integrate with nodemailer, SendGrid, etc.
  // Example with nodemailer:
  // const transporter = nodemailer.createTransport({...});
  // await transporter.sendMail({
  //   from: 'noreply@facturafacil.pe',
  //   to: adminEmail,
  //   subject: 'Nuevo pago recibido - FacturaFácil',
  //   html: `...`
  // });
  
  return true;
};

// All routes require authentication
router.use(authMiddleware);

// Validation
const paymentValidation = [
  body('plan').isIn(['basico', 'negocio']).withMessage('Plan inválido'),
  body('monto').isFloat({ min: 1 }).withMessage('Monto inválido'),
  body('metodoPago').notEmpty().withMessage('Método de pago es requerido'),
  body('referencia').notEmpty().withMessage('Número de referencia es requerido')
];

// Get user payments
router.get('/', async (req, res) => {
  try {
    const payments = await paymentService.findByUserId(req.user.id);
    res.json(payments);
  } catch (error) {
    console.error('Error loading payments:', error);
    res.status(500).json({ error: 'Error al cargar pagos' });
  }
});

// Create payment request
router.post('/', paymentValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const business = await businessService.findByUserId(req.user.id);
    if (!business) {
      return res.status(404).json({ error: 'Negocio no encontrado' });
    }

    const { plan, monto, metodoPago, referencia, notas } = req.body;

    const payment = await paymentService.create({
      userId: req.user.id,
      businessId: business.id,
      plan,
      monto: parseFloat(monto),
      metodoPago,
      referencia,
      notas
    });

    // Send notification to admin
    await sendPaymentNotification(
      { plan, monto, metodoPago, referencia, notas },
      req.user.email
    );

    res.status(201).json({
      message: 'Solicitud de pago enviada exitosamente',
      payment
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Error al registrar pago' });
  }
});

// Admin: Update payment status (would need admin middleware in production)
router.put('/:id/status', async (req, res) => {
  try {
    const { estado } = req.body;
    
    if (!['pendiente', 'verificado', 'rechazado'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    await paymentService.updateStatus(req.params.id, estado);

    // If verified, update user's plan
    if (estado === 'verificado') {
      // TODO: Update business plan
      console.log('Payment verified, update user plan');
    }

    res.json({ message: 'Estado actualizado' });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

module.exports = router;
