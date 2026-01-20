const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for PDFs
app.use('/pdfs', express.static(path.join(__dirname, '../pdfs')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FacturaFácil API running' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal. Por favor, intenta de nuevo.' });
});

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();
    
    // Load routes after database is initialized
    const authRoutes = require('./routes/auth');
    const clientRoutes = require('./routes/clients');
    const productRoutes = require('./routes/products');
    const documentRoutes = require('./routes/documents');
    const dashboardRoutes = require('./routes/dashboard');
    const businessRoutes = require('./routes/business');
    
    app.use('/api/auth', authRoutes);
    app.use('/api/clients', clientRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/documents', documentRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/business', businessRoutes);
    
    app.listen(PORT, () => {
      console.log(`🚀 FacturaFácil API corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();
