const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Ensure pdfs directory exists
const pdfsDir = path.join(__dirname, '../../pdfs');
if (!fs.existsSync(pdfsDir)) {
  fs.mkdirSync(pdfsDir, { recursive: true });
}

/**
 * Generate PDF for a document (boleta or factura)
 */
async function generateDocumentPDF(document) {
  return new Promise((resolve, reject) => {
    try {
      const { id, tipo, serie, numero, fechaEmision, subtotal, igv, total, items, business, client, hash } = document;
      
      const fileName = `${tipo}-${serie}-${String(numero).padStart(8, '0')}.pdf`;
      const filePath = path.join(pdfsDir, fileName);
      
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filePath);
      
      doc.pipe(stream);

      // Header - Business Info
      doc.fontSize(18).font('Helvetica-Bold')
         .text(business.razon_social, { align: 'center' });
      
      doc.fontSize(10).font('Helvetica')
         .text(`RUC: ${business.ruc}`, { align: 'center' })
         .text(business.direccion, { align: 'center' });

      if (business.telefono) {
        doc.text(`Tel: ${business.telefono}`, { align: 'center' });
      }

      doc.moveDown();

      // Document Type Box
      const tipoLabel = tipo === 'boleta' ? 'BOLETA DE VENTA ELECTRÓNICA' : 'FACTURA ELECTRÓNICA';
      const numeroFormateado = `${serie}-${String(numero).padStart(8, '0')}`;

      doc.rect(350, 100, 200, 80).stroke();
      doc.fontSize(11).font('Helvetica-Bold')
         .text(tipoLabel, 360, 115, { width: 180, align: 'center' });
      doc.fontSize(10).font('Helvetica')
         .text(`RUC: ${business.ruc}`, 360, 140, { width: 180, align: 'center' })
         .text(numeroFormateado, 360, 155, { width: 180, align: 'center' });

      doc.moveDown(4);

      // Client Info
      const clientY = 200;
      doc.fontSize(10).font('Helvetica-Bold');
      
      if (client) {
        doc.text('CLIENTE:', 50, clientY);
        doc.font('Helvetica')
           .text(`${client.tipo_documento}: ${client.numero_documento}`, 110, clientY)
           .text(`Nombre: ${client.nombre}`, 50, clientY + 15);
        if (client.direccion) {
          doc.text(`Dirección: ${client.direccion}`, 50, clientY + 30);
        }
      } else {
        doc.text('CLIENTE:', 50, clientY);
        doc.font('Helvetica').text('VARIOS - VENTA AL PÚBLICO', 110, clientY);
      }

      // Date
      doc.font('Helvetica-Bold').text('Fecha de Emisión:', 350, clientY);
      doc.font('Helvetica').text(formatDate(fechaEmision), 450, clientY);

      doc.moveDown(3);

      // Items Table Header
      const tableTop = 280;
      const tableHeaders = ['Cant.', 'Unidad', 'Descripción', 'P. Unit.', 'Total'];
      const colWidths = [50, 50, 220, 80, 80];
      let xPos = 50;

      doc.fontSize(9).font('Helvetica-Bold');
      doc.rect(50, tableTop - 5, 500, 20).fill('#f0f0f0').stroke();
      doc.fillColor('black');

      tableHeaders.forEach((header, i) => {
        doc.text(header, xPos + 5, tableTop, { width: colWidths[i] - 10, align: i >= 3 ? 'right' : 'left' });
        xPos += colWidths[i];
      });

      // Items
      let yPos = tableTop + 25;
      doc.font('Helvetica').fontSize(9);

      items.forEach((item, index) => {
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }

        xPos = 50;
        const rowData = [
          item.cantidad.toFixed(2),
          item.unidadMedida || 'NIU',
          item.descripcion,
          `S/ ${item.precioUnitario.toFixed(2)}`,
          `S/ ${item.total.toFixed(2)}`
        ];

        rowData.forEach((data, i) => {
          doc.text(data, xPos + 5, yPos, { 
            width: colWidths[i] - 10, 
            align: i >= 3 ? 'right' : 'left'
          });
          xPos += colWidths[i];
        });

        yPos += 20;
      });

      // Totals
      const totalsY = Math.max(yPos + 20, 500);
      doc.font('Helvetica-Bold').fontSize(10);

      // Line
      doc.moveTo(350, totalsY - 10).lineTo(550, totalsY - 10).stroke();

      doc.text('Op. Gravada:', 350, totalsY);
      doc.font('Helvetica').text(`S/ ${subtotal.toFixed(2)}`, 450, totalsY, { width: 100, align: 'right' });

      doc.font('Helvetica-Bold').text('IGV (18%):', 350, totalsY + 18);
      doc.font('Helvetica').text(`S/ ${igv.toFixed(2)}`, 450, totalsY + 18, { width: 100, align: 'right' });

      doc.font('Helvetica-Bold').fontSize(12).text('TOTAL:', 350, totalsY + 40);
      doc.text(`S/ ${total.toFixed(2)}`, 450, totalsY + 40, { width: 100, align: 'right' });

      // Amount in words
      doc.fontSize(9).font('Helvetica')
         .text(`SON: ${numberToWords(total)} SOLES`, 50, totalsY + 70);

      // Footer
      doc.fontSize(8).font('Helvetica')
         .text('Representación impresa del Comprobante de Pago Electrónico', 50, 730, { align: 'center' });
      
      if (hash) {
        doc.text(`Hash: ${hash}`, 50, 745, { align: 'center' });
      }
      
      doc.text('Autorizado mediante Resolución de Intendencia N° 0340050008490', 50, 760, { align: 'center' });
      doc.text('Consulte su comprobante en: www.sunat.gob.pe', 50, 775, { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve(`pdfs/${fileName}`);
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function numberToWords(num) {
  const units = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const tens = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  const integer = Math.floor(num);
  const decimal = Math.round((num - integer) * 100);

  if (integer === 0) return `CERO CON ${decimal}/100`;
  if (integer === 100) return `CIEN CON ${decimal}/100`;

  let words = '';
  
  if (integer >= 1000) {
    const thousands = Math.floor(integer / 1000);
    if (thousands === 1) {
      words += 'MIL ';
    } else {
      words += convertHundreds(thousands, units, tens, teens, hundreds) + ' MIL ';
    }
  }
  
  const remainder = integer % 1000;
  if (remainder > 0) {
    words += convertHundreds(remainder, units, tens, teens, hundreds);
  }

  return `${words.trim()} CON ${String(decimal).padStart(2, '0')}/100`;
}

function convertHundreds(num, units, tens, teens, hundreds) {
  let result = '';
  
  if (num >= 100) {
    if (num === 100) return 'CIEN';
    result += hundreds[Math.floor(num / 100)] + ' ';
    num %= 100;
  }
  
  if (num >= 20) {
    result += tens[Math.floor(num / 10)];
    if (num % 10 > 0) {
      result += ' Y ' + units[num % 10];
    }
  } else if (num >= 10) {
    result += teens[num - 10];
  } else if (num > 0) {
    result += units[num];
  }
  
  return result.trim();
}

module.exports = { generateDocumentPDF };
