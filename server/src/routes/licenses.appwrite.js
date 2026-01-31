const express = require('express');
const router = express.Router();
const { Client, Databases, Query, ID } = require('node-appwrite');
const { authMiddleware, requireBusiness } = require('../middleware/auth.appwrite');

// Appwrite client
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;

// Contraseña de admin para generar licencias (cambiar en producción)
const ADMIN_PASSWORD = process.env.ADMIN_LICENSE_PASSWORD || 'facil2026admin';

// Middleware de autenticación admin
const adminAuth = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'] || req.query.admin_key;
  
  if (adminKey !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Acceso no autorizado' });
  }
  next();
};

// Generar código de licencia aleatorio
function generateLicenseCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    if (i > 0) code += '-';
    for (let j = 0; j < 4; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return code; // Formato: XXXX-XXXX-XXXX-XXXX
}

// ==================== RUTAS ADMIN (protegidas con clave) ====================

// Crear nueva licencia (ADMIN)
router.post('/admin/create', adminAuth, async (req, res) => {
  try {
    const { plan, duracion_dias = 30, cantidad = 1 } = req.body;
    
    // Validar plan
    if (!['basico', 'negocio'].includes(plan)) {
      return res.status(400).json({ error: 'Plan inválido. Use: basico o negocio' });
    }

    const licenses = [];
    
    for (let i = 0; i < cantidad; i++) {
      const codigo = generateLicenseCode();
      
      const license = await databases.createDocument(
        DATABASE_ID,
        'licenses',
        ID.unique(),
        {
          codigo,
          plan,
          duracion_dias,
          usado: false,
          usado_por: null,
          fecha_uso: null,
          created_at: new Date().toISOString()
        }
      );
      
      licenses.push({
        codigo: license.codigo,
        plan: license.plan,
        duracion_dias: license.duracion_dias
      });
    }
    
    res.json({
      message: `${cantidad} licencia(s) creada(s) exitosamente`,
      licenses
    });
  } catch (error) {
    console.error('Error creating license:', error);
    res.status(500).json({ error: 'Error al crear licencia' });
  }
});

// Listar licencias (ADMIN)
router.get('/admin/list', adminAuth, async (req, res) => {
  try {
    const { usado } = req.query;
    
    let queries = [Query.orderDesc('$createdAt'), Query.limit(100)];
    
    if (usado === 'true') {
      queries.push(Query.equal('usado', true));
    } else if (usado === 'false') {
      queries.push(Query.equal('usado', false));
    }
    
    const result = await databases.listDocuments(DATABASE_ID, 'licenses', queries);
    
    res.json({
      total: result.total,
      licenses: result.documents.map(l => ({
        id: l.$id,
        codigo: l.codigo,
        plan: l.plan,
        duracion_dias: l.duracion_dias,
        usado: l.usado,
        usado_por: l.usado_por,
        fecha_uso: l.fecha_uso,
        created_at: l.created_at
      }))
    });
  } catch (error) {
    console.error('Error listing licenses:', error);
    res.status(500).json({ error: 'Error al listar licencias' });
  }
});

// ==================== RUTAS USUARIO ====================

// Activar licencia
router.post('/activate', authMiddleware, requireBusiness, async (req, res) => {
  try {
    const { codigo } = req.body;
    
    if (!codigo) {
      return res.status(400).json({ error: 'Código de licencia requerido' });
    }
    
    // Normalizar código (mayúsculas, quitar espacios)
    const codigoNormalizado = codigo.toUpperCase().replace(/\s/g, '');
    
    // Buscar licencia
    const result = await databases.listDocuments(DATABASE_ID, 'licenses', [
      Query.equal('codigo', codigoNormalizado)
    ]);
    
    if (result.documents.length === 0) {
      return res.status(404).json({ error: 'Código de licencia inválido' });
    }
    
    const license = result.documents[0];
    
    // Verificar si ya fue usada
    if (license.usado) {
      return res.status(400).json({ 
        error: 'Esta licencia ya fue utilizada',
        fecha_uso: license.fecha_uso
      });
    }
    
    // Calcular fecha de expiración
    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + license.duracion_dias);
    
    // Marcar licencia como usada
    await databases.updateDocument(DATABASE_ID, 'licenses', license.$id, {
      usado: true,
      usado_por: req.user.business_id,
      fecha_uso: new Date().toISOString()
    });
    
    // Actualizar plan del negocio
    await databases.updateDocument(DATABASE_ID, 'businesses', req.user.business_id, {
      plan: license.plan,
      plan_expira: fechaExpiracion.toISOString()
    });
    
    // Nombre del plan para mostrar
    const planNombre = license.plan === 'negocio' ? 'Plan Negocio' : 'Plan Básico';
    const precio = license.plan === 'negocio' ? 59 : 29;
    
    res.json({
      success: true,
      message: `¡${planNombre} activado exitosamente!`,
      plan: {
        nombre: planNombre,
        codigo: license.plan,
        duracion_dias: license.duracion_dias,
        expira: fechaExpiracion.toISOString(),
        precio
      }
    });
  } catch (error) {
    console.error('Error activating license:', error);
    res.status(500).json({ error: 'Error al activar licencia' });
  }
});

// Ver estado del plan actual
router.get('/status', authMiddleware, requireBusiness, async (req, res) => {
  try {
    const business = await databases.getDocument(DATABASE_ID, 'businesses', req.user.business_id);
    
    let plan = business.plan || 'gratis';
    const planExpira = business.plan_expira ? new Date(business.plan_expira) : null;
    const ahora = new Date();
    
    let estado = 'activo';
    let diasRestantes = null;
    let planExpirado = false;
    
    // Verificar expiración para todos los planes pagos y trial
    if (planExpira && ['trial', 'basico', 'negocio'].includes(plan)) {
      diasRestantes = Math.ceil((planExpira - ahora) / (1000 * 60 * 60 * 24));
      
      if (diasRestantes <= 0) {
        estado = 'expirado';
        diasRestantes = 0;
        planExpirado = true;
        
        // Automáticamente degradar a gratis si expiró
        await databases.updateDocument(DATABASE_ID, 'businesses', req.user.business_id, {
          plan: 'gratis',
          plan_expira: null
        });
        plan = 'gratis';
      } else if (diasRestantes <= 3) {
        estado = 'por_vencer';
      }
    }
    
    const planNombres = {
      gratis: 'Plan Gratis',
      trial: 'Prueba Gratis (7 días)',
      basico: 'Plan Básico',
      negocio: 'Plan Negocio'
    };
    
    res.json({
      plan: plan,
      plan_nombre: planNombres[plan] || plan,
      estado,
      expira: plan === 'gratis' ? null : (planExpira?.toISOString() || null),
      dias_restantes: plan === 'gratis' ? null : diasRestantes,
      plan_expirado: planExpirado,
      features: getFeatures(plan),
      mensaje_urgente: estado === 'por_vencer' 
        ? `⚠️ Tu plan vence en ${diasRestantes} días. ¡Renueva ahora!`
        : null
    });
  } catch (error) {
    console.error('Error getting plan status:', error);
    res.status(500).json({ error: 'Error al obtener estado del plan' });
  }
});

function getFeatures(plan) {
  const features = {
    gratis: [
      'Plan expirado',
      'No puedes crear comprobantes',
      'Renueva tu plan para continuar'
    ],
    trial: [
      '10 comprobantes',
      'Boletas y facturas',
      'Control básico de gastos',
      'Soporte por email',
      'Válido por 7 días'
    ],
    basico: [
      '50 comprobantes/mes',
      'Boletas y facturas',
      'Control de ingresos/gastos',
      'Reportes básicos',
      'PDF descargable',
      'Soporte prioritario'
    ],
    negocio: [
      'Comprobantes ilimitados',
      'Todo del plan Básico',
      '🤖 Contador AI incluido',
      'Análisis predictivo',
      'Alertas fiscales',
      'Múltiples series',
      'Soporte telefónico'
    ]
  };
  return features[plan] || features.gratis;
}

module.exports = router;
