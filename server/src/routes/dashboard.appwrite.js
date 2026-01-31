const express = require('express');
const router = express.Router();
const { documentService, clientService, productService, businessService } = require('../database/appwrite');
const { authMiddleware, requireBusiness } = require('../middleware/auth.appwrite');

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(requireBusiness);

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const businessId = req.user.business_id;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString().split('T')[0];
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1)
      .toISOString().split('T')[0];

    // Today's sales
    const todayDocs = await documentService.findByBusinessId(businessId, {
      desde: today,
      hasta: today,
      limit: 1000
    });
    const todayTotal = todayDocs.documents
      .filter(d => d.estado !== 'anulado')
      .reduce((sum, d) => sum + (d.total || 0), 0);

    // This month's sales
    const monthDocs = await documentService.findByBusinessId(businessId, {
      desde: firstDayOfMonth,
      limit: 1000
    });
    const monthDocsFiltered = monthDocs.documents.filter(d => d.estado !== 'anulado');
    const monthTotal = monthDocsFiltered.reduce((sum, d) => sum + (d.total || 0), 0);

    // This year's sales
    const yearDocs = await documentService.findByBusinessId(businessId, {
      desde: firstDayOfYear,
      limit: 1000
    });
    const yearDocsFiltered = yearDocs.documents.filter(d => d.estado !== 'anulado');
    const yearTotal = yearDocsFiltered.reduce((sum, d) => sum + (d.total || 0), 0);

    // Documents by type
    const boletasCount = await documentService.count(businessId, { tipo: 'boleta' });
    const facturasCount = await documentService.count(businessId, { tipo: 'factura' });

    // Clients count
    const clientsCount = await clientService.count(businessId);

    // Products count
    const productsCount = await productService.count(businessId);

    // Recent documents
    const recentDocuments = await documentService.getRecentDocuments(businessId, 5);

    // Monthly sales chart data (last 6 months)
    const monthlySales = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const monthData = await documentService.findByBusinessId(businessId, {
        desde: firstDay,
        hasta: lastDay,
        limit: 1000
      });

      const monthTotal = monthData.documents
        .filter(d => d.estado !== 'anulado')
        .reduce((sum, d) => sum + (d.total || 0), 0);

      monthlySales.push({
        month: date.toLocaleString('es-PE', { month: 'short' }),
        year: year,
        total: monthTotal
      });
    }

    // Plan info
    const business = await businessService.findById(businessId);

    const limits = {
      'basico': 50,
      'negocio': 999999,
      'trial': 10
    };

    res.json({
      today: { 
        total: todayTotal, 
        count: todayDocs.documents.filter(d => d.estado !== 'anulado').length 
      },
      month: { 
        total: monthTotal, 
        count: monthDocsFiltered.length 
      },
      year: { 
        total: yearTotal, 
        count: yearDocsFiltered.length 
      },
      documents: { 
        boletas: boletasCount, 
        facturas: facturasCount 
      },
      clients: clientsCount,
      products: productsCount,
      recentDocuments,
      monthlySales,
      plan: {
        name: business?.plan || 'trial',
        used: business?.documents_this_month || 0,
        limit: limits[business?.plan] || 10
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;
