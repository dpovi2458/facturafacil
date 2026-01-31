const bcrypt = require('bcryptjs');
const { initDatabase, getDb } = require('./database/init');

async function seedDatabase() {
  console.log('🌱 Iniciando carga de datos de prueba...\n');
  
  await initDatabase();
  const db = getDb();

  // Limpiar datos existentes
  db.prepare('DELETE FROM document_items').run();
  db.prepare('DELETE FROM documents').run();
  db.prepare('DELETE FROM products').run();
  db.prepare('DELETE FROM clients').run();
  db.prepare('DELETE FROM series').run();
  db.prepare('DELETE FROM businesses').run();
  db.prepare('DELETE FROM users').run();

  // ==================== USUARIO DE PRUEBA ====================
  console.log('👤 Creando usuario de prueba...');
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const userResult = db.prepare(`
    INSERT INTO users (email, password) VALUES (?, ?)
  `).run('demo@facturafacil.pe', hashedPassword);
  
  const userId = userResult.lastInsertRowid;

  // ==================== NEGOCIO ====================
  console.log('🏢 Creando negocio de prueba...');
  db.prepare(`
    INSERT INTO businesses (user_id, ruc, razon_social, nombre_comercial, direccion, departamento, provincia, distrito, telefono, email, plan)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    '20123456789',
    'TECNOLOGÍA PERUANA S.A.C.',
    'TecPerú',
    'Av. Javier Prado Este 4600, Oficina 301',
    'Lima',
    'Lima',
    'Santiago de Surco',
    '01-555-1234',
    'contacto@tecperu.com',
    'profesional'
  );

  const business = db.prepare('SELECT id FROM businesses WHERE user_id = ?').get(userId);
  const businessId = business.id;

  // ==================== SERIES ====================
  console.log('📋 Creando series...');
  db.prepare(`INSERT INTO series (business_id, tipo, serie, ultimo_numero) VALUES (?, 'boleta', 'B001', 15)`).run(businessId);
  db.prepare(`INSERT INTO series (business_id, tipo, serie, ultimo_numero) VALUES (?, 'factura', 'F001', 8)`).run(businessId);

  // ==================== CLIENTES ====================
  console.log('👥 Creando clientes de prueba...');
  
  const clientes = [
    { tipo: 'DNI', numero: '12345678', nombre: 'Juan Carlos Pérez García', direccion: 'Jr. Las Flores 123, Miraflores', email: 'jperez@gmail.com', telefono: '999-111-222' },
    { tipo: 'DNI', numero: '87654321', nombre: 'María Elena Rodríguez López', direccion: 'Av. Arequipa 2500, Lince', email: 'maria.rodriguez@hotmail.com', telefono: '999-333-444' },
    { tipo: 'RUC', numero: '20567891234', nombre: 'DISTRIBUIDORA EL SOL E.I.R.L.', direccion: 'Jr. Comercio 456, La Victoria', email: 'ventas@elsol.pe', telefono: '01-432-1000' },
    { tipo: 'RUC', numero: '20987654321', nombre: 'IMPORTACIONES GLOBAL S.A.C.', direccion: 'Av. Argentina 1500, Callao', email: 'compras@globalsac.com', telefono: '01-555-9876' },
    { tipo: 'DNI', numero: '45678912', nombre: 'Carlos Alberto Mendoza Torres', direccion: 'Calle Los Pinos 789, San Isidro', email: 'cmendoza@empresa.com', telefono: '999-555-666' },
    { tipo: 'DNI', numero: '78912345', nombre: 'Ana Lucía Fernández Vega', direccion: 'Av. Brasil 1200, Jesús María', email: 'ana.fernandez@gmail.com', telefono: '999-777-888' },
    { tipo: 'RUC', numero: '20111222333', nombre: 'SERVICIOS DIGITALES PERÚ S.A.', direccion: 'Av. El Golf 250, San Borja', email: 'info@serviciosdigitales.pe', telefono: '01-700-5000' },
    { tipo: 'DNI', numero: '36925814', nombre: 'Roberto Jesús Vargas Díaz', direccion: 'Jr. Huancavelica 350, Centro de Lima', email: 'rvargas@outlook.com', telefono: '999-999-111' },
  ];

  for (const c of clientes) {
    db.prepare(`
      INSERT INTO clients (business_id, tipo_documento, numero_documento, nombre, direccion, email, telefono)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(businessId, c.tipo, c.numero, c.nombre, c.direccion, c.email, c.telefono);
  }

  // ==================== PRODUCTOS ====================
  console.log('📦 Creando productos de prueba...');
  
  const productos = [
    { codigo: 'SERV001', descripcion: 'Servicio de Consultoría en TI', unidad: 'ZZ', precio: 500.00, tipo: 'servicio' },
    { codigo: 'SERV002', descripcion: 'Desarrollo de Software a Medida', unidad: 'ZZ', precio: 2500.00, tipo: 'servicio' },
    { codigo: 'SERV003', descripcion: 'Soporte Técnico Mensual', unidad: 'ZZ', precio: 350.00, tipo: 'servicio' },
    { codigo: 'SERV004', descripcion: 'Capacitación en Sistemas (por hora)', unidad: 'ZZ', precio: 150.00, tipo: 'servicio' },
    { codigo: 'PROD001', descripcion: 'Laptop HP ProBook 450 G8', unidad: 'NIU', precio: 3500.00, tipo: 'producto' },
    { codigo: 'PROD002', descripcion: 'Monitor LG 24" Full HD', unidad: 'NIU', precio: 650.00, tipo: 'producto' },
    { codigo: 'PROD003', descripcion: 'Teclado Mecánico Logitech', unidad: 'NIU', precio: 280.00, tipo: 'producto' },
    { codigo: 'PROD004', descripcion: 'Mouse Inalámbrico Logitech MX Master', unidad: 'NIU', precio: 350.00, tipo: 'producto' },
    { codigo: 'PROD005', descripcion: 'Memoria USB 64GB Kingston', unidad: 'NIU', precio: 45.00, tipo: 'producto' },
    { codigo: 'PROD006', descripcion: 'Disco Duro Externo 1TB Seagate', unidad: 'NIU', precio: 280.00, tipo: 'producto' },
    { codigo: 'PROD007', descripcion: 'Cable HDMI 2m Premium', unidad: 'NIU', precio: 35.00, tipo: 'producto' },
    { codigo: 'PROD008', descripcion: 'Webcam Logitech C920', unidad: 'NIU', precio: 320.00, tipo: 'producto' },
    { codigo: 'SERV005', descripcion: 'Mantenimiento Preventivo de Equipos', unidad: 'ZZ', precio: 120.00, tipo: 'servicio' },
    { codigo: 'SERV006', descripcion: 'Instalación de Red LAN', unidad: 'ZZ', precio: 800.00, tipo: 'servicio' },
    { codigo: 'PROD009', descripcion: 'Impresora HP LaserJet Pro', unidad: 'NIU', precio: 1200.00, tipo: 'producto' },
  ];

  for (const p of productos) {
    db.prepare(`
      INSERT INTO products (business_id, codigo, descripcion, unidad_medida, precio, tipo, igv_incluido, activo)
      VALUES (?, ?, ?, ?, ?, ?, 1, 1)
    `).run(businessId, p.codigo, p.descripcion, p.unidad, p.precio, p.tipo);
  }

  // ==================== DOCUMENTOS ====================
  console.log('📄 Creando documentos de prueba...');
  
  // Obtener IDs de clientes
  const clientesDb = db.prepare('SELECT id, nombre FROM clients WHERE business_id = ?').all(businessId);
  
  // Documentos del mes actual (enero 2026)
  const documentos = [
    // Boletas
    { tipo: 'boleta', serie: 'B001', numero: 1, clienteIdx: 0, fecha: '2026-01-05', items: [{ prodIdx: 4, cant: 1 }], estado: 'aceptado' },
    { tipo: 'boleta', serie: 'B001', numero: 2, clienteIdx: 1, fecha: '2026-01-07', items: [{ prodIdx: 5, cant: 2 }, { prodIdx: 6, cant: 3 }], estado: 'aceptado' },
    { tipo: 'boleta', serie: 'B001', numero: 3, clienteIdx: 4, fecha: '2026-01-10', items: [{ prodIdx: 7, cant: 1 }, { prodIdx: 8, cant: 1 }], estado: 'aceptado' },
    { tipo: 'boleta', serie: 'B001', numero: 4, clienteIdx: 5, fecha: '2026-01-12', items: [{ prodIdx: 9, cant: 2 }], estado: 'aceptado' },
    { tipo: 'boleta', serie: 'B001', numero: 5, clienteIdx: 7, fecha: '2026-01-15', items: [{ prodIdx: 10, cant: 5 }, { prodIdx: 11, cant: 1 }], estado: 'aceptado' },
    { tipo: 'boleta', serie: 'B001', numero: 6, clienteIdx: 0, fecha: '2026-01-18', items: [{ prodIdx: 0, cant: 2 }], estado: 'aceptado' },
    { tipo: 'boleta', serie: 'B001', numero: 7, clienteIdx: 1, fecha: '2026-01-20', items: [{ prodIdx: 2, cant: 1 }], estado: 'aceptado' },
    { tipo: 'boleta', serie: 'B001', numero: 8, clienteIdx: 4, fecha: '2026-01-22', items: [{ prodIdx: 12, cant: 3 }], estado: 'aceptado' },
    { tipo: 'boleta', serie: 'B001', numero: 9, clienteIdx: 5, fecha: '2026-01-25', items: [{ prodIdx: 4, cant: 1 }, { prodIdx: 5, cant: 1 }], estado: 'emitido' },
    { tipo: 'boleta', serie: 'B001', numero: 10, clienteIdx: 7, fecha: '2026-01-28', items: [{ prodIdx: 14, cant: 1 }], estado: 'emitido' },
    
    // Facturas
    { tipo: 'factura', serie: 'F001', numero: 1, clienteIdx: 2, fecha: '2026-01-03', items: [{ prodIdx: 1, cant: 1 }, { prodIdx: 0, cant: 5 }], estado: 'aceptado' },
    { tipo: 'factura', serie: 'F001', numero: 2, clienteIdx: 3, fecha: '2026-01-08', items: [{ prodIdx: 4, cant: 5 }, { prodIdx: 5, cant: 10 }], estado: 'aceptado' },
    { tipo: 'factura', serie: 'F001', numero: 3, clienteIdx: 6, fecha: '2026-01-14', items: [{ prodIdx: 13, cant: 2 }], estado: 'aceptado' },
    { tipo: 'factura', serie: 'F001', numero: 4, clienteIdx: 2, fecha: '2026-01-19', items: [{ prodIdx: 2, cant: 12 }], estado: 'aceptado' },
    { tipo: 'factura', serie: 'F001', numero: 5, clienteIdx: 3, fecha: '2026-01-23', items: [{ prodIdx: 14, cant: 3 }, { prodIdx: 11, cant: 5 }], estado: 'aceptado' },
    { tipo: 'factura', serie: 'F001', numero: 6, clienteIdx: 6, fecha: '2026-01-27', items: [{ prodIdx: 1, cant: 2 }], estado: 'emitido' },
    
    // Documentos del mes anterior (diciembre 2025)
    { tipo: 'boleta', serie: 'B001', numero: 11, clienteIdx: 0, fecha: '2025-12-05', items: [{ prodIdx: 8, cant: 2 }], estado: 'aceptado' },
    { tipo: 'boleta', serie: 'B001', numero: 12, clienteIdx: 1, fecha: '2025-12-12', items: [{ prodIdx: 9, cant: 1 }], estado: 'aceptado' },
    { tipo: 'boleta', serie: 'B001', numero: 13, clienteIdx: 4, fecha: '2025-12-20', items: [{ prodIdx: 10, cant: 10 }], estado: 'aceptado' },
    { tipo: 'boleta', serie: 'B001', numero: 14, clienteIdx: 5, fecha: '2025-12-28', items: [{ prodIdx: 4, cant: 1 }], estado: 'aceptado' },
    { tipo: 'factura', serie: 'F001', numero: 7, clienteIdx: 2, fecha: '2025-12-10', items: [{ prodIdx: 0, cant: 8 }], estado: 'aceptado' },
    { tipo: 'factura', serie: 'F001', numero: 8, clienteIdx: 3, fecha: '2025-12-22', items: [{ prodIdx: 1, cant: 1 }, { prodIdx: 13, cant: 1 }], estado: 'aceptado' },
    
    // Un documento anulado
    { tipo: 'boleta', serie: 'B001', numero: 15, clienteIdx: 7, fecha: '2026-01-10', items: [{ prodIdx: 6, cant: 2 }], estado: 'anulado' },
  ];

  // Obtener productos
  const productosDb = db.prepare('SELECT id, precio FROM products WHERE business_id = ?').all(businessId);

  for (const doc of documentos) {
    // Calcular totales
    let subtotal = 0;
    for (const item of doc.items) {
      const precio = productosDb[item.prodIdx].precio;
      subtotal += (precio / 1.18) * item.cant; // Precio sin IGV
    }
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    const docResult = db.prepare(`
      INSERT INTO documents (business_id, client_id, tipo, serie, numero, fecha_emision, moneda, subtotal, igv, total, estado)
      VALUES (?, ?, ?, ?, ?, ?, 'PEN', ?, ?, ?, ?)
    `).run(
      businessId,
      clientesDb[doc.clienteIdx].id,
      doc.tipo,
      doc.serie,
      doc.numero,
      doc.fecha,
      subtotal.toFixed(2),
      igv.toFixed(2),
      total.toFixed(2),
      doc.estado
    );

    const docId = docResult.lastInsertRowid;

    // Insertar items
    // Obtener productos con descripción
    const productosConDesc = db.prepare('SELECT id, descripcion, precio FROM products WHERE business_id = ?').all(businessId);
    
    for (const item of doc.items) {
      const producto = productosConDesc[item.prodIdx];
      const precioUnitario = producto.precio / 1.18;
      const valorVenta = precioUnitario * item.cant;
      const igvItem = valorVenta * 0.18;
      
      db.prepare(`
        INSERT INTO document_items (document_id, product_id, cantidad, descripcion, precio_unitario, valor_venta, igv, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        docId,
        producto.id,
        item.cant,
        producto.descripcion,
        precioUnitario.toFixed(2),
        valorVenta.toFixed(2),
        igvItem.toFixed(2),
        (valorVenta + igvItem).toFixed(2)
      );
    }
  }

  // ==================== RESUMEN ====================
  console.log('\n✅ Datos de prueba cargados exitosamente!\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  📧 Email:     demo@facturafacil.pe');
  console.log('  🔐 Password:  123456');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n📊 Resumen de datos creados:');
  console.log(`   • 1 usuario de prueba`);
  console.log(`   • 1 negocio (${clientes.length} clientes)`);
  console.log(`   • ${productos.length} productos/servicios`);
  console.log(`   • ${documentos.length} documentos (boletas y facturas)`);
  console.log('\n🚀 ¡Listo para probar en http://localhost:5173!\n');
}

seedDatabase().catch(console.error);
