const express = require('express');
const router = express.Router();
const { getDb } = require('../database/init');
const { authMiddleware, requireBusiness } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(requireBusiness);

// Get dashboard stats
router.get('/stats', (req, res) => {
  try {
    const db = getDb();
    const businessId = req.user.business_id;
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];
    const firstDayOfYear = new Date(new Date().getFullYear(), 0, 1)
      .toISOString().split('T')[0];

    // Today's sales
    const todaySales = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count
      FROM documents 
      WHERE business_id = ? AND fecha_emision = ? AND estado != 'anulado'
    `).get(businessId, today);

    // This month's sales
    const monthSales = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count
      FROM documents 
      WHERE business_id = ? AND fecha_emision >= ? AND estado != 'anulado'
    `).get(businessId, firstDayOfMonth);

    // This year's sales
    const yearSales = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count
      FROM documents 
      WHERE business_id = ? AND fecha_emision >= ? AND estado != 'anulado'
    `).get(businessId, firstDayOfYear);

    // Documents by type
    const boletasCount = db.prepare(`
      SELECT COUNT(*) as count FROM documents 
      WHERE business_id = ? AND tipo = 'boleta' AND estado != 'anulado'
    `).get(businessId);

    const facturasCount = db.prepare(`
      SELECT COUNT(*) as count FROM documents 
      WHERE business_id = ? AND tipo = 'factura' AND estado != 'anulado'
    `).get(businessId);

    // Clients count
    const clientsCount = db.prepare(`
      SELECT COUNT(*) as count FROM clients WHERE business_id = ?
    `).get(businessId);

    // Products count
    const productsCount = db.prepare(`
      SELECT COUNT(*) as count FROM products WHERE business_id = ? AND activo = 1
    `).get(businessId);

    // Recent documents
    const recentDocuments = db.prepare(`
      SELECT d.id, d.tipo, d.serie, d.numero, d.total, d.estado, d.fecha_emision,
             c.nombre as client_nombre
      FROM documents d
      LEFT JOIN clients c ON d.client_id = c.id
      WHERE d.business_id = ?
      ORDER BY d.created_at DESC
      LIMIT 5
    `).all(businessId);

    // Monthly sales chart data (last 6 months)
    const monthlySales = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const sales = db.prepare(`
        SELECT COALESCE(SUM(total), 0) as total
        FROM documents 
        WHERE business_id = ? AND fecha_emision >= ? AND fecha_emision <= ? AND estado != 'anulado'
      `).get(businessId, firstDay, lastDay);

      monthlySales.push({
        month: date.toLocaleString('es-PE', { month: 'short' }),
        year: year,
        total: sales.total
      });
    }

    // Plan info
    const business = db.prepare('SELECT plan, documents_this_month FROM businesses WHERE id = ?')
      .get(businessId);

    const planLimits = {
      'trial': 10,
      'basico': 50,
      'negocio': Infinity
    };

    res.json({
      today: {
        total: todaySales.total,
        count: todaySales.count
      },
      month: {
        total: monthSales.total,
        count: monthSales.count
      },
      year: {
        total: yearSales.total,
        count: yearSales.count
      },
      documents: {
        boletas: boletasCount.count,
        facturas: facturasCount.count
      },
      clients: clientsCount.count,
      products: productsCount.count,
      recentDocuments,
      monthlySales,
      plan: {
        name: business.plan,
        used: business.documents_this_month,
        limit: planLimits[business.plan] || 10
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;
