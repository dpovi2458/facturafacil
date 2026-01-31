const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { transactionService, businessService } = require('../database/appwrite');
const { authMiddleware } = require('../middleware/auth.appwrite');

// All routes require authentication
router.use(authMiddleware);

// Validation
const transactionValidation = [
  body('tipo').isIn(['ingreso', 'gasto']).withMessage('Tipo debe ser ingreso o gasto'),
  body('monto').isFloat({ min: 0.01 }).withMessage('Monto debe ser mayor a 0'),
  body('descripcion').notEmpty().withMessage('Descripción es requerida'),
  body('categoria').notEmpty().withMessage('Categoría es requerida'),
  body('fecha').notEmpty().withMessage('Fecha es requerida')
];

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const business = await businessService.findByUserId(req.user.id);
    if (!business) {
      return res.status(404).json({ error: 'Negocio no encontrado' });
    }

    const { startDate, endDate } = req.query;
    const transactions = await transactionService.findByBusinessId(business.id, startDate, endDate);
    
    res.json(transactions);
  } catch (error) {
    console.error('Error loading transactions:', error);
    res.status(500).json({ error: 'Error al cargar transacciones' });
  }
});

// Get balance summary
router.get('/balance', async (req, res) => {
  try {
    const business = await businessService.findByUserId(req.user.id);
    if (!business) {
      return res.status(404).json({ error: 'Negocio no encontrado' });
    }

    const { startDate, endDate } = req.query;
    const balance = await transactionService.getBalance(business.id, startDate, endDate);
    
    res.json({
      ...balance,
      balance: balance.ingresos - balance.gastos
    });
  } catch (error) {
    console.error('Error getting balance:', error);
    res.status(500).json({ error: 'Error al calcular balance' });
  }
});

// Create transaction
router.post('/', transactionValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const business = await businessService.findByUserId(req.user.id);
    if (!business) {
      return res.status(404).json({ error: 'Negocio no encontrado' });
    }

    const { tipo, monto, descripcion, categoria, fecha } = req.body;

    const transaction = await transactionService.create({
      businessId: business.id,
      tipo,
      monto: parseFloat(monto),
      descripcion,
      categoria,
      fecha
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Error al crear transacción' });
  }
});

// Update transaction
router.put('/:id', transactionValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tipo, monto, descripcion, categoria, fecha } = req.body;

    const transaction = await transactionService.update(req.params.id, {
      tipo,
      monto: parseFloat(monto),
      descripcion,
      categoria,
      fecha
    });

    res.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Error al actualizar transacción' });
  }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
  try {
    await transactionService.delete(req.params.id);
    res.json({ message: 'Transacción eliminada' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Error al eliminar transacción' });
  }
});

// AI Analysis endpoint - Contador AI
router.get('/ai-analysis', async (req, res) => {
  try {
    const business = await businessService.findByUserId(req.user.id);
    if (!business) {
      return res.status(404).json({ error: 'Negocio no encontrado' });
    }

    // Get last 3 months of transactions
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const startDate = threeMonthsAgo.toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];
    
    const transactions = await transactionService.findByBusinessId(business.id, startDate, endDate);
    const balance = await transactionService.getBalance(business.id, startDate, endDate);
    
    // Get current month data
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const currentBalance = await transactionService.getBalance(business.id, currentMonthStart, endDate);
    
    // Analyze categories
    const gastosPorCategoria = {};
    const ingresosPorCategoria = {};
    
    transactions.forEach(t => {
      if (t.tipo === 'gasto') {
        gastosPorCategoria[t.categoria] = (gastosPorCategoria[t.categoria] || 0) + t.monto;
      } else {
        ingresosPorCategoria[t.categoria] = (ingresosPorCategoria[t.categoria] || 0) + t.monto;
      }
    });
    
    // Find top expense category
    const topGasto = Object.entries(gastosPorCategoria).sort((a, b) => b[1] - a[1])[0];
    const topIngreso = Object.entries(ingresosPorCategoria).sort((a, b) => b[1] - a[1])[0];
    
    // Calculate month-over-month growth
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
    const lastMonthBalance = await transactionService.getBalance(business.id, lastMonthStart, lastMonthEnd);
    
    const crecimiento = lastMonthBalance.ingresos > 0 
      ? ((currentBalance.ingresos - lastMonthBalance.ingresos) / lastMonthBalance.ingresos * 100).toFixed(1)
      : 0;

    // Generate AI insights using DigitalOcean GenAI
    let aiInsights = [];
    
    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({
        baseURL: 'https://cloud.digitalocean.com/gen-ai/api/v1',
        apiKey: process.env.DIGITALOCEAN_GENAI_API_KEY
      });

      const prompt = `Eres un contador experto peruano. Analiza estos datos financieros de un negocio y da 3 recomendaciones breves y accionables en español:

Datos del mes actual:
- Ingresos: S/ ${currentBalance.ingresos.toFixed(2)}
- Gastos: S/ ${currentBalance.gastos.toFixed(2)}
- Balance: S/ ${(currentBalance.ingresos - currentBalance.gastos).toFixed(2)}
- Principal categoría de ingreso: ${topIngreso ? topIngreso[0] : 'N/A'} (S/ ${topIngreso ? topIngreso[1].toFixed(2) : 0})
- Principal categoría de gasto: ${topGasto ? topGasto[0] : 'N/A'} (S/ ${topGasto ? topGasto[1].toFixed(2) : 0})
- Crecimiento vs mes anterior: ${crecimiento}%

Responde SOLO con un JSON array de 3 objetos, cada uno con "tipo" (success/warning/info) y "mensaje" (máximo 60 caracteres). Ejemplo:
[{"tipo":"success","mensaje":"Buen margen de ganancia del 48%"},{"tipo":"warning","mensaje":"Gastos de planilla muy altos"},{"tipo":"info","mensaje":"Considera diversificar ingresos"}]`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7
      });

      const content = response.choices[0]?.message?.content || '';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        aiInsights = JSON.parse(jsonMatch[0]);
      }
    } catch (aiError) {
      console.log('AI analysis not available, using rule-based insights');
      
      // Fallback to rule-based insights
      const margen = currentBalance.ingresos > 0 
        ? ((currentBalance.ingresos - currentBalance.gastos) / currentBalance.ingresos * 100).toFixed(0)
        : 0;
      
      if (currentBalance.ingresos > currentBalance.gastos) {
        aiInsights.push({ tipo: 'success', mensaje: `Margen de ganancia del ${margen}% este mes` });
      } else if (currentBalance.ingresos < currentBalance.gastos) {
        aiInsights.push({ tipo: 'warning', mensaje: 'Gastos superan ingresos este mes' });
      }
      
      if (topGasto && topGasto[1] > currentBalance.gastos * 0.4) {
        aiInsights.push({ tipo: 'warning', mensaje: `${topGasto[0]} representa ${((topGasto[1]/currentBalance.gastos)*100).toFixed(0)}% de gastos` });
      }
      
      if (parseFloat(crecimiento) > 10) {
        aiInsights.push({ tipo: 'success', mensaje: `Crecimiento del ${crecimiento}% vs mes anterior` });
      } else if (parseFloat(crecimiento) < -10) {
        aiInsights.push({ tipo: 'warning', mensaje: `Caída del ${Math.abs(crecimiento)}% en ingresos` });
      }
      
      if (aiInsights.length < 3) {
        aiInsights.push({ tipo: 'info', mensaje: 'Registra más transacciones para análisis detallado' });
      }
    }

    res.json({
      balance: {
        ingresos: currentBalance.ingresos,
        gastos: currentBalance.gastos,
        total: currentBalance.ingresos - currentBalance.gastos
      },
      trimestre: {
        ingresos: balance.ingresos,
        gastos: balance.gastos,
        total: balance.ingresos - balance.gastos
      },
      crecimiento: parseFloat(crecimiento),
      topCategoria: {
        ingreso: topIngreso ? { nombre: topIngreso[0], monto: topIngreso[1] } : null,
        gasto: topGasto ? { nombre: topGasto[0], monto: topGasto[1] } : null
      },
      insights: aiInsights.slice(0, 3),
      totalTransacciones: transactions.length
    });
  } catch (error) {
    console.error('Error in AI analysis:', error);
    res.status(500).json({ error: 'Error al generar análisis' });
  }
});

module.exports = router;
