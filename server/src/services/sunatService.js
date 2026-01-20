const crypto = require('crypto');

/**
 * Simulate SUNAT validation for documents
 * In production, this would integrate with the real SUNAT API
 */
async function simulateSunatValidation(document) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Generate a hash similar to SUNAT's format
  const dataToHash = `${document.tipo}|${document.serie}|${document.numero}|${document.total}|${Date.now()}`;
  const hash = crypto.createHash('sha256').update(dataToHash).digest('base64').substring(0, 28);

  // Simulate success response (99% success rate)
  const isSuccess = Math.random() > 0.01;

  if (isSuccess) {
    return {
      codigo: '0',
      mensaje: 'La Factura/Boleta numero ' + document.serie + '-' + document.numero + ', ha sido aceptada',
      hash: hash,
      estado: 'aceptado'
    };
  } else {
    return {
      codigo: '2800',
      mensaje: 'Error de conexión con SUNAT. Reintentando...',
      hash: null,
      estado: 'pendiente'
    };
  }
}

/**
 * Validate RUC with SUNAT
 * Returns business info if valid
 */
async function validateRuc(ruc) {
  // In production, this would call the real SUNAT API
  await new Promise(resolve => setTimeout(resolve, 200));

  if (!/^\d{11}$/.test(ruc)) {
    return { valid: false, message: 'RUC debe tener 11 dígitos' };
  }

  // Validate RUC check digit (simplified)
  const validPrefixes = ['10', '15', '17', '20'];
  const prefix = ruc.substring(0, 2);
  
  if (!validPrefixes.includes(prefix)) {
    return { valid: false, message: 'RUC no válido' };
  }

  return {
    valid: true,
    data: {
      ruc: ruc,
      razonSocial: null, // Would come from SUNAT
      estado: 'ACTIVO',
      condicion: 'HABIDO'
    }
  };
}

/**
 * Validate DNI with RENIEC
 */
async function validateDni(dni) {
  await new Promise(resolve => setTimeout(resolve, 200));

  if (!/^\d{8}$/.test(dni)) {
    return { valid: false, message: 'DNI debe tener 8 dígitos' };
  }

  return {
    valid: true,
    data: {
      dni: dni,
      nombres: null, // Would come from RENIEC
      apellidos: null
    }
  };
}

module.exports = { 
  simulateSunatValidation,
  validateRuc,
  validateDni
};
