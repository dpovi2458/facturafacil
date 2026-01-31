const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { documentService, clientService, seriesService, businessService } = require('../database/appwrite');
const { authMiddleware, requireBusiness, checkDocumentLimit } = require('../middleware/auth.appwrite');
const { generateDocumentPDF } = require('../services/pdfGenerator');
const { simulateSunatValidation } = require('../services/sunatService');
const path = require('path');
const fs = require('fs');

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(requireBusiness);

// Get all documents
router.get('/', async (req, res) => {
  try {
    const { tipo, estado, desde, hasta, limit = 50, offset = 0 } = req.query;
    
    const result = await documentService.findByBusinessId(req.user.business_id, {
      tipo,
      estado,
      desde,
      hasta,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(result);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Error al obtener documentos' });
  }
});

// Get single document with items
router.get('/:id', async (req, res) => {
  try {
    const document = await documentService.findById(req.params.id, req.user.business_id);

    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    res.json({ document });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Error al obtener documento' });
  }
});

// Validation
const documentValidation = [
  body('tipo').isIn(['boleta', 'factura']).withMessage('Tipo debe ser boleta o factura'),
  body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un item'),
  body('items.*.descripcion').notEmpty().withMessage('Descripción del item requerida'),
  body('items.*.cantidad').isFloat({ min: 0.01 }).withMessage('Cantidad inválida'),
  body('items.*.precioUnitario').isFloat({ min: 0 }).withMessage('Precio unitario inválido')
];

// Create document
router.post('/', checkDocumentLimit, documentValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      tipo, 
      clientId, 
      fechaEmision, 
      fechaVencimiento,
      moneda = 'PEN',
      items,
      observaciones 
    } = req.body;

    // Validate client for facturas
    if (tipo === 'factura') {
      if (!clientId) {
        return res.status(400).json({ error: 'Factura requiere un cliente con RUC' });
      }
      const client = await clientService.findById(clientId, req.user.business_id);
      
      if (!client || client.tipo_documento !== 'RUC') {
        return res.status(400).json({ error: 'Factura requiere un cliente con RUC' });
      }
    }

    // Get next number for series
    const serie = await seriesService.findActiveByTipo(req.user.business_id, tipo);

    if (!serie) {
      return res.status(400).json({ error: 'No hay serie configurada para este tipo de documento' });
    }

    // Increment series number
    const updatedSerie = await seriesService.incrementNumber(serie.id);
    const nuevoNumero = updatedSerie.ultimo_numero;

    // Calculate totals
    let subtotal = 0;
    const processedItems = items.map(item => {
      const valorVenta = item.cantidad * item.precioUnitario;
      const igv = valorVenta * 0.18;
      const total = valorVenta + igv;
      subtotal += valorVenta;

      return {
        ...item,
        valorVenta,
        igv,
        total
      };
    });

    const igvTotal = subtotal * 0.18;
    const total = subtotal + igvTotal;

    // Create document
    const document = await documentService.create({
      businessId: req.user.business_id,
      clientId: clientId || null,
      tipo,
      serie: serie.serie,
      numero: nuevoNumero,
      fechaEmision: fechaEmision || new Date().toISOString().split('T')[0],
      fechaVencimiento: fechaVencimiento || null,
      moneda,
      subtotal,
      igv: igvTotal,
      total,
      observaciones: observaciones || ''
    });

    // Create items
    await documentService.createItems(document.id, processedItems);

    // Update documents count
    await businessService.incrementDocumentCount(req.user.business_id);

    // Simulate SUNAT validation
    const sunatResult = await simulateSunatValidation({
      tipo,
      serie: serie.serie,
      numero: nuevoNumero,
      total
    });

    // Update with SUNAT response
    await documentService.update(document.id, {
      sunat_codigo: sunatResult.codigo,
      sunat_respuesta: sunatResult.mensaje,
      hash_cpe: sunatResult.hash,
      estado: sunatResult.estado
    });

    // Get business info for PDF
    const business = await businessService.findById(req.user.business_id);
    const client = clientId ? await clientService.findById(clientId, req.user.business_id) : null;

    // Generate PDF
    const pdfPath = await generateDocumentPDF({
      id: document.id,
      tipo,
      serie: serie.serie,
      numero: nuevoNumero,
      fechaEmision: fechaEmision || new Date().toISOString().split('T')[0],
      subtotal,
      igv: igvTotal,
      total,
      items: processedItems,
      business,
      client,
      hash: sunatResult.hash
    });

    // Update PDF path
    await documentService.update(document.id, { pdf_path: pdfPath });

    // Fetch complete document
    const completeDocument = await documentService.findById(document.id, req.user.business_id);

    res.status(201).json({
      message: `${tipo === 'boleta' ? 'Boleta' : 'Factura'} ${serie.serie}-${String(nuevoNumero).padStart(8, '0')} creada exitosamente`,
      document: completeDocument
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: 'Error al crear documento' });
  }
});

// Download PDF
router.get('/:id/pdf', async (req, res) => {
  try {
    const document = await documentService.findById(req.params.id, req.user.business_id);

    if (!document || !document.pdf_path) {
      return res.status(404).json({ error: 'PDF no encontrado' });
    }

    const pdfPath = path.join(__dirname, '../../', document.pdf_path);
    
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'Archivo PDF no encontrado' });
    }

    res.download(pdfPath);
  } catch (error) {
    console.error('Download PDF error:', error);
    res.status(500).json({ error: 'Error al descargar PDF' });
  }
});

// Anular document
router.post('/:id/anular', async (req, res) => {
  try {
    const document = await documentService.findById(req.params.id, req.user.business_id);

    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    if (document.estado === 'anulado') {
      return res.status(400).json({ error: 'El documento ya está anulado' });
    }

    await documentService.update(req.params.id, { estado: 'anulado' });

    res.json({ message: 'Documento anulado exitosamente' });
  } catch (error) {
    console.error('Anular document error:', error);
    res.status(500).json({ error: 'Error al anular documento' });
  }
});

module.exports = router;
