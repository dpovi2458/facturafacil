const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getDb } = require('../database/init');
const { authMiddleware, requireBusiness, checkDocumentLimit } = require('../middleware/auth');
const { generateDocumentPDF } = require('../services/pdfGenerator');
const { simulateSunatValidation } = require('../services/sunatService');
const path = require('path');
const fs = require('fs');

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(requireBusiness);

// Get all documents
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { tipo, estado, desde, hasta, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT d.*, c.nombre as client_nombre, c.numero_documento as client_documento
      FROM documents d
      LEFT JOIN clients c ON d.client_id = c.id
      WHERE d.business_id = ?
    `;
    const params = [req.user.business_id];

    if (tipo) {
      query += ' AND d.tipo = ?';
      params.push(tipo);
    }

    if (estado) {
      query += ' AND d.estado = ?';
      params.push(estado);
    }

    if (desde) {
      query += ' AND d.fecha_emision >= ?';
      params.push(desde);
    }

    if (hasta) {
      query += ' AND d.fecha_emision <= ?';
      params.push(hasta);
    }

    query += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const documents = db.prepare(query).all(...params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM documents WHERE business_id = ?';
    const countParams = [req.user.business_id];
    
    if (tipo) {
      countQuery += ' AND tipo = ?';
      countParams.push(tipo);
    }

    const { total } = db.prepare(countQuery).get(...countParams);

    res.json({ documents, total });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Error al obtener documentos' });
  }
});

// Get single document with items
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const document = db.prepare(`
      SELECT d.*, c.nombre as client_nombre, c.numero_documento as client_documento,
             c.tipo_documento as client_tipo_documento, c.direccion as client_direccion
      FROM documents d
      LEFT JOIN clients c ON d.client_id = c.id
      WHERE d.id = ? AND d.business_id = ?
    `).get(req.params.id, req.user.business_id);

    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    const items = db.prepare(`
      SELECT * FROM document_items WHERE document_id = ?
    `).all(document.id);

    res.json({ document: { ...document, items } });
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

    const db = getDb();
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
      const client = db.prepare('SELECT * FROM clients WHERE id = ? AND business_id = ?')
        .get(clientId, req.user.business_id);
      
      if (!client || client.tipo_documento !== 'RUC') {
        return res.status(400).json({ error: 'Factura requiere un cliente con RUC' });
      }
    }

    // Get next number for series
    const serie = db.prepare(`
      SELECT * FROM series 
      WHERE business_id = ? AND tipo = ? AND activo = 1
      ORDER BY id ASC LIMIT 1
    `).get(req.user.business_id, tipo);

    if (!serie) {
      return res.status(400).json({ error: 'No hay serie configurada para este tipo de documento' });
    }

    const nuevoNumero = serie.ultimo_numero + 1;

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
    const docResult = db.prepare(`
      INSERT INTO documents (
        business_id, client_id, tipo, serie, numero, 
        fecha_emision, fecha_vencimiento, moneda,
        subtotal, igv, total, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.business_id,
      clientId || null,
      tipo,
      serie.serie,
      nuevoNumero,
      fechaEmision || new Date().toISOString().split('T')[0],
      fechaVencimiento || null,
      moneda,
      subtotal,
      igvTotal,
      total,
      observaciones || ''
    );

    const documentId = docResult.lastInsertRowid;

    // Create items
    const insertItem = db.prepare(`
      INSERT INTO document_items (
        document_id, product_id, cantidad, unidad_medida, descripcion,
        precio_unitario, valor_venta, igv, total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of processedItems) {
      insertItem.run(
        documentId,
        item.productId || null,
        item.cantidad,
        item.unidadMedida || 'NIU',
        item.descripcion,
        item.precioUnitario,
        item.valorVenta,
        item.igv,
        item.total
      );
    }

    // Update series
    db.prepare('UPDATE series SET ultimo_numero = ? WHERE id = ?').run(nuevoNumero, serie.id);

    // Update documents count
    db.prepare(`
      UPDATE businesses SET documents_this_month = documents_this_month + 1 WHERE id = ?
    `).run(req.user.business_id);

    // Simulate SUNAT validation
    const sunatResult = await simulateSunatValidation({
      tipo,
      serie: serie.serie,
      numero: nuevoNumero,
      total
    });

    // Update with SUNAT response
    db.prepare(`
      UPDATE documents SET sunat_codigo = ?, sunat_respuesta = ?, hash_cpe = ?, estado = ?
      WHERE id = ?
    `).run(sunatResult.codigo, sunatResult.mensaje, sunatResult.hash, sunatResult.estado, documentId);

    // Get business info for PDF
    const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.user.business_id);
    const client = clientId ? db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId) : null;

    // Generate PDF
    const pdfPath = await generateDocumentPDF({
      id: documentId,
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
    db.prepare('UPDATE documents SET pdf_path = ? WHERE id = ?').run(pdfPath, documentId);

    // Fetch complete document
    const document = db.prepare(`
      SELECT d.*, c.nombre as client_nombre, c.numero_documento as client_documento
      FROM documents d
      LEFT JOIN clients c ON d.client_id = c.id
      WHERE d.id = ?
    `).get(documentId);

    const documentItems = db.prepare('SELECT * FROM document_items WHERE document_id = ?').all(documentId);

    res.status(201).json({
      message: `${tipo === 'boleta' ? 'Boleta' : 'Factura'} ${serie.serie}-${String(nuevoNumero).padStart(8, '0')} creada exitosamente`,
      document: { ...document, items: documentItems }
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: 'Error al crear documento' });
  }
});

// Download PDF
router.get('/:id/pdf', (req, res) => {
  try {
    const db = getDb();
    const document = db.prepare(`
      SELECT pdf_path FROM documents WHERE id = ? AND business_id = ?
    `).get(req.params.id, req.user.business_id);

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
router.post('/:id/anular', (req, res) => {
  try {
    const db = getDb();
    const document = db.prepare(`
      SELECT * FROM documents WHERE id = ? AND business_id = ?
    `).get(req.params.id, req.user.business_id);

    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    if (document.estado === 'anulado') {
      return res.status(400).json({ error: 'El documento ya está anulado' });
    }

    db.prepare(`
      UPDATE documents SET estado = 'anulado', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.params.id);

    res.json({ message: 'Documento anulado exitosamente' });
  } catch (error) {
    console.error('Anular document error:', error);
    res.status(500).json({ error: 'Error al anular documento' });
  }
});

module.exports = router;
