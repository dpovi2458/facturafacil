const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for PDFs
app.use('/pdfs', express.static(path.join(__dirname, '../pdfs')));

// Static files for admin panel
app.use('/admin', express.static(path.join(__dirname, '../public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FacturaFácil API running with Appwrite' });
});

// Load Appwrite routes
const authRoutes = require('./routes/auth.appwrite');
const clientRoutes = require('./routes/clients.appwrite');
const productRoutes = require('./routes/products.appwrite');
const documentRoutes = require('./routes/documents.appwrite');
const dashboardRoutes = require('./routes/dashboard.appwrite');
const businessRoutes = require('./routes/business.appwrite');
const financeRoutes = require('./routes/finances.appwrite');
const paymentRoutes = require('./routes/payments.appwrite');
const licenseRoutes = require('./routes/licenses.appwrite');

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/products', productRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/finances', financeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/licenses', licenseRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal. Por favor, intenta de nuevo.' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FacturaFácil API corriendo en http://localhost:${PORT}`);
  console.log('📦 Usando Appwrite como base de datos');
});
