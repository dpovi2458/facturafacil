const jwt = require('jsonwebtoken');
const { getDb } = require('../database/init');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const db = getDb();
    // Get user with business info
    const user = db.prepare(`
      SELECT u.id, u.email, b.id as business_id, b.ruc, b.razon_social, b.plan, b.documents_this_month
      FROM users u
      LEFT JOIN businesses b ON b.user_id = u.id
      WHERE u.id = ?
    `).get(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Por favor, inicia sesión nuevamente.' });
    }
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
  const { plan, documents_this_month } = req.user;
  
  const limits = {
    'basico': 50,
    'negocio': Infinity,
    'trial': 10
  };

  const limit = limits[plan] || 10;

  if (documents_this_month >= limit) {
    return res.status(403).json({
      error: `Has alcanzado el límite de ${limit} comprobantes para tu plan ${plan}. Actualiza tu plan para continuar.`,
      code: 'LIMIT_REACHED'
    });
  }

  next();
};

module.exports = { authMiddleware, requireBusiness, checkDocumentLimit };
