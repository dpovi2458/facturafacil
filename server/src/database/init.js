const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/facturafacil.db');
const dataDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;

async function getDatabase() {
  if (db) return db;
  
  const SQL = await initSqlJs();
  
  // Load existing database or create new
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  return db;
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Helper functions that mimic better-sqlite3 API
const dbWrapper = {
  prepare: function(sql) {
    return {
      run: function(...params) {
        if (!db) throw new Error('Database not initialized');
        db.run(sql, params);
        saveDatabase();
        const result = db.exec("SELECT last_insert_rowid() as id");
        return { lastInsertRowid: result[0]?.values[0]?.[0] || 0 };
      },
      get: function(...params) {
        if (!db) throw new Error('Database not initialized');
        const stmt = db.prepare(sql);
        if (params.length) stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
      all: function(...params) {
        if (!db) throw new Error('Database not initialized');
        const stmt = db.prepare(sql);
        if (params.length) stmt.bind(params);
        const results = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      }
    };
  }
};

async function initDatabase() {
  await getDatabase();
  
  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS businesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      ruc TEXT UNIQUE NOT NULL,
      razon_social TEXT NOT NULL,
      nombre_comercial TEXT,
      direccion TEXT NOT NULL,
      ubigeo TEXT,
      departamento TEXT,
      provincia TEXT,
      distrito TEXT,
      telefono TEXT,
      email TEXT,
      logo TEXT,
      plan TEXT DEFAULT 'basico',
      documents_this_month INTEGER DEFAULT 0,
      subscription_start DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      tipo_documento TEXT NOT NULL DEFAULT 'DNI',
      numero_documento TEXT NOT NULL,
      nombre TEXT NOT NULL,
      direccion TEXT,
      email TEXT,
      telefono TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      codigo TEXT,
      descripcion TEXT NOT NULL,
      unidad_medida TEXT DEFAULT 'NIU',
      precio REAL NOT NULL,
      tipo TEXT DEFAULT 'producto',
      igv_incluido INTEGER DEFAULT 1,
      activo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      client_id INTEGER,
      tipo TEXT NOT NULL,
      serie TEXT NOT NULL,
      numero INTEGER NOT NULL,
      fecha_emision DATE NOT NULL,
      fecha_vencimiento DATE,
      moneda TEXT DEFAULT 'PEN',
      subtotal REAL NOT NULL,
      igv REAL NOT NULL,
      total REAL NOT NULL,
      estado TEXT DEFAULT 'emitido',
      sunat_respuesta TEXT,
      sunat_codigo TEXT,
      hash_cpe TEXT,
      pdf_path TEXT,
      xml_path TEXT,
      observaciones TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS document_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      product_id INTEGER,
      cantidad REAL NOT NULL,
      unidad_medida TEXT DEFAULT 'NIU',
      descripcion TEXT NOT NULL,
      precio_unitario REAL NOT NULL,
      valor_venta REAL NOT NULL,
      igv REAL NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS series (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      serie TEXT NOT NULL,
      ultimo_numero INTEGER DEFAULT 0,
      activo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    )
  `);

  saveDatabase();
  console.log('✅ Base de datos inicializada correctamente');
}

module.exports = { db: dbWrapper, initDatabase, getDatabase };
