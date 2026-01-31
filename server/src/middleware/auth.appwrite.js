const jwt = require('jsonwebtoken');
const { userService, businessService } = require('../database/appwrite');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from Appwrite
    const user = await userService.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Get business info
    const business = await businessService.findByUserId(user.id);
    
    // Verificar si el plan expiró
    let planActual = business?.plan || 'gratis';
    let planExpirado = false;
    
    if (business?.plan_expira && ['trial', 'basico', 'negocio'].includes(planActual)) {
      const expira = new Date(business.plan_expira);
      if (expira < new Date()) {
        planActual = 'gratis';
        planExpirado = true;
      }
    }

    req.user = {
      id: user.id,
      email: user.email,
      business_id: business?.id || null,
      ruc: business?.ruc || null,
      razon_social: business?.razon_social || null,
      plan: planActual,
      plan_expira: business?.plan_expira || null,
      plan_expirado: planExpirado,
      documents_this_month: business?.documents_this_month || 0
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Por favor, inicia sesión nuevamente.' });
    }
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Check if business profile is complete
const requireBusiness = (req, res, next) => {
  if (!req.user.business_id) {
    return res.status(403).json({ 
      error: 'Debes completar los datos de tu negocio primero',
      code: 'BUSINESS_REQUIRED'
    });
  }
  next();
};

// Check document limits
const checkDocumentLimit = (req, res, next) => {
  const { plan, documents_this_month, plan_expirado } = req.user;
  
  // Si el plan expiró, no puede crear documentos
  if (plan === 'gratis' || plan_expirado) {
    return res.status(403).json({
      error: 'Tu plan ha expirado. Activa una licencia para continuar facturando.',
      code: 'PLAN_EXPIRED',
      upgrade_required: true
    });
  }
  
  const limits = {
    'basico': 50,
    'negocio': Infinity,
    'trial': 10
  };

  const limit = limits[plan] || 10;

  if (documents_this_month >= limit) {
    return res.status(403).json({
      error: `Has alcanzado el límite de ${limit} comprobantes para tu plan ${plan}. Actualiza tu plan para continuar.`,
      code: 'LIMIT_REACHED',
      upgrade_required: true
    });
  }

  next();
};

// Middleware para verificar plan activo (sin límite de documentos)
const requireActivePlan = (req, res, next) => {
  const { plan, plan_expirado } = req.user;
  
  if (plan === 'gratis' || plan_expirado) {
    return res.status(403).json({
      error: 'Necesitas un plan activo para usar esta función. Activa tu licencia.',
      code: 'PLAN_REQUIRED',
      upgrade_required: true
    });
  }
  
  next();
};

module.exports = { authMiddleware, requireBusiness, checkDocumentLimit, requireActivePlan };
