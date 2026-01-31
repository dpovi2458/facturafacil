/**
 * Script para crear las colecciones en Appwrite
 * Ejecutar: node src/setup-appwrite.js
 */

require('dotenv').config();
const { Client, Databases, ID } = require('node-appwrite');

const client = new Client();

client
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'facturafacil';

const COLLECTIONS = {
  USERS: 'users',
  BUSINESSES: 'businesses',
  CLIENTS: 'clients',
  PRODUCTS: 'products',
  DOCUMENTS: 'documents',
  DOCUMENT_ITEMS: 'document_items',
  SERIES: 'series'
};

async function createDatabase() {
  try {
    console.log('📦 Creando base de datos...');
    await databases.create(DATABASE_ID, 'FacturaFácil DB');
    console.log('✅ Base de datos creada');
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️  Base de datos ya existe');
    } else {
      throw error;
    }
  }
}

async function createUsersCollection() {
  const collectionId = COLLECTIONS.USERS;
  
  try {
    console.log(`📋 Creando colección ${collectionId}...`);
    
    await databases.createCollection(DATABASE_ID, collectionId, 'Users', [
      // Permisos: cualquiera puede leer su propio documento
    ]);

    // Atributos
    await databases.createEmailAttribute(DATABASE_ID, collectionId, 'email', true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'password', 255, true);
    await databases.createDatetimeAttribute(DATABASE_ID, collectionId, 'created_at', false);
    await databases.createDatetimeAttribute(DATABASE_ID, collectionId, 'updated_at', false);

    // Índices (esperar a que se creen los atributos)
    await new Promise(resolve => setTimeout(resolve, 2000));
    await databases.createIndex(DATABASE_ID, collectionId, 'email_idx', 'unique', ['email']);

    console.log(`✅ Colección ${collectionId} creada`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`ℹ️  Colección ${collectionId} ya existe`);
    } else {
      console.error(`❌ Error creando ${collectionId}:`, error.message);
    }
  }
}

async function createBusinessesCollection() {
  const collectionId = COLLECTIONS.BUSINESSES;
  
  try {
    console.log(`📋 Creando colección ${collectionId}...`);
    
    await databases.createCollection(DATABASE_ID, collectionId, 'Businesses');

    // Atributos
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'user_id', 36, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'ruc', 11, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'razon_social', 255, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'nombre_comercial', 255, false);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'direccion', 500, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'ubigeo', 10, false);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'departamento', 100, false);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'provincia', 100, false);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'distrito', 100, false);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'telefono', 20, false);
    await databases.createEmailAttribute(DATABASE_ID, collectionId, 'email', false);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'logo', 500, false);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'plan', 20, false, 'trial');
    await databases.createIntegerAttribute(DATABASE_ID, collectionId, 'documents_this_month', false, 0, 99999, 0);
    await databases.createDatetimeAttribute(DATABASE_ID, collectionId, 'subscription_start', false);
    await databases.createDatetimeAttribute(DATABASE_ID, collectionId, 'created_at', false);
    await databases.createDatetimeAttribute(DATABASE_ID, collectionId, 'updated_at', false);

    // Índices
    await new Promise(resolve => setTimeout(resolve, 3000));
    await databases.createIndex(DATABASE_ID, collectionId, 'user_id_idx', 'unique', ['user_id']);
    await databases.createIndex(DATABASE_ID, collectionId, 'ruc_idx', 'unique', ['ruc']);

    console.log(`✅ Colección ${collectionId} creada`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`ℹ️  Colección ${collectionId} ya existe`);
    } else {
      console.error(`❌ Error creando ${collectionId}:`, error.message);
    }
  }
}

async function createClientsCollection() {
  const collectionId = COLLECTIONS.CLIENTS;
  
  try {
    console.log(`📋 Creando colección ${collectionId}...`);
    
    await databases.createCollection(DATABASE_ID, collectionId, 'Clients');

    // Atributos
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'business_id', 36, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'tipo_documento', 20, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'numero_documento', 20, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'nombre', 255, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'direccion', 500, false);
    await databases.createEmailAttribute(DATABASE_ID, collectionId, 'email', false);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'telefono', 20, false);
    await databases.createDatetimeAttribute(DATABASE_ID, collectionId, 'created_at', false);
    await databases.createDatetimeAttribute(DATABASE_ID, collectionId, 'updated_at', false);

    // Índices
    await new Promise(resolve => setTimeout(resolve, 2000));
    await databases.createIndex(DATABASE_ID, collectionId, 'business_id_idx', 'key', ['business_id']);
    await databases.createIndex(DATABASE_ID, collectionId, 'nombre_idx', 'fulltext', ['nombre']);

    console.log(`✅ Colección ${collectionId} creada`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`ℹ️  Colección ${collectionId} ya existe`);
    } else {
      console.error(`❌ Error creando ${collectionId}:`, error.message);
    }
  }
}

async function createProductsCollection() {
  const collectionId = COLLECTIONS.PRODUCTS;
  
  try {
    console.log(`📋 Creando colección ${collectionId}...`);
    
    await databases.createCollection(DATABASE_ID, collectionId, 'Products');

    // Atributos
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'business_id', 36, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'codigo', 50, false);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'descripcion', 500, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'unidad_medida', 10, false, 'NIU');
    await databases.createFloatAttribute(DATABASE_ID, collectionId, 'precio', true, 0);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'tipo', 20, false, 'producto');
    await databases.createBooleanAttribute(DATABASE_ID, collectionId, 'igv_incluido', false, true);
    await databases.createBooleanAttribute(DATABASE_ID, collectionId, 'activo', false, true);
    await databases.createDatetimeAttribute(DATABASE_ID, collectionId, 'created_at', false);
    await databases.createDatetimeAttribute(DATABASE_ID, collectionId, 'updated_at', false);

    // Índices
    await new Promise(resolve => setTimeout(resolve, 2000));
    await databases.createIndex(DATABASE_ID, collectionId, 'business_id_idx', 'key', ['business_id']);
    await databases.createIndex(DATABASE_ID, collectionId, 'descripcion_idx', 'fulltext', ['descripcion']);

    console.log(`✅ Colección ${collectionId} creada`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`ℹ️  Colección ${collectionId} ya existe`);
    } else {
      console.error(`❌ Error creando ${collectionId}:`, error.message);
    }
  }
}

async function createDocumentsCollection() {
  const collectionId = COLLECTIONS.DOCUMENTS;
  
  try {
    console.log(`📋 Creando colección ${collectionId}...`);
    
    await databases.createCollection(DATABASE_ID, collectionId, 'Documents');

    // Atributos
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'business_id', 36, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'client_id', 36, false);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'tipo', 20, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'serie', 10, true);
    await databases.createIntegerAttribute(DATABASE_ID, collectionId, 'numero', true, 1);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'fecha_emision', 10, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'fecha_vencimiento', 10, false);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'moneda', 5, false, 'PEN');
    await databases.createFloatAttribute(DATABASE_ID, collectionId, 'subtotal', true, 0);
    await databases.createFloatAttribute(DATABASE_ID, collectionId, 'igv', true, 0);
    await databases.createFloatAttribute(DATABASE_ID, collectionId, 'total', true, 0);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'estado', 20, false, 'emitido');
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'sunat_respuesta', 500, false);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'sunat_codigo', 10, false);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'hash_cpe', 100, false);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'pdf_path', 255, false);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'xml_path', 255, false);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'observaciones', 1000, false);
    await databases.createDatetimeAttribute(DATABASE_ID, collectionId, 'created_at', false);
    await databases.createDatetimeAttribute(DATABASE_ID, collectionId, 'updated_at', false);

    // Índices
    await new Promise(resolve => setTimeout(resolve, 3000));
    await databases.createIndex(DATABASE_ID, collectionId, 'business_id_idx', 'key', ['business_id']);
    await databases.createIndex(DATABASE_ID, collectionId, 'tipo_idx', 'key', ['tipo']);
    await databases.createIndex(DATABASE_ID, collectionId, 'fecha_emision_idx', 'key', ['fecha_emision']);

    console.log(`✅ Colección ${collectionId} creada`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`ℹ️  Colección ${collectionId} ya existe`);
    } else {
      console.error(`❌ Error creando ${collectionId}:`, error.message);
    }
  }
}

async function createDocumentItemsCollection() {
  const collectionId = COLLECTIONS.DOCUMENT_ITEMS;
  
  try {
    console.log(`📋 Creando colección ${collectionId}...`);
    
    await databases.createCollection(DATABASE_ID, collectionId, 'Document Items');

    // Atributos
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'document_id', 36, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'product_id', 36, false);
    await databases.createFloatAttribute(DATABASE_ID, collectionId, 'cantidad', true, 0);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'unidad_medida', 10, false, 'NIU');
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'descripcion', 500, true);
    await databases.createFloatAttribute(DATABASE_ID, collectionId, 'precio_unitario', true, 0);
    await databases.createFloatAttribute(DATABASE_ID, collectionId, 'valor_venta', true, 0);
    await databases.createFloatAttribute(DATABASE_ID, collectionId, 'igv', true, 0);
    await databases.createFloatAttribute(DATABASE_ID, collectionId, 'total', true, 0);

    // Índices
    await new Promise(resolve => setTimeout(resolve, 2000));
    await databases.createIndex(DATABASE_ID, collectionId, 'document_id_idx', 'key', ['document_id']);

    console.log(`✅ Colección ${collectionId} creada`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`ℹ️  Colección ${collectionId} ya existe`);
    } else {
      console.error(`❌ Error creando ${collectionId}:`, error.message);
    }
  }
}

async function createSeriesCollection() {
  const collectionId = COLLECTIONS.SERIES;
  
  try {
    console.log(`📋 Creando colección ${collectionId}...`);
    
    await databases.createCollection(DATABASE_ID, collectionId, 'Series');

    // Atributos
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'business_id', 36, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'tipo', 20, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'serie', 10, true);
    await databases.createIntegerAttribute(DATABASE_ID, collectionId, 'ultimo_numero', false, 0, 99999999, 0);
    await databases.createBooleanAttribute(DATABASE_ID, collectionId, 'activo', false, true);
    await databases.createDatetimeAttribute(DATABASE_ID, collectionId, 'created_at', false);

    // Índices
    await new Promise(resolve => setTimeout(resolve, 2000));
    await databases.createIndex(DATABASE_ID, collectionId, 'business_id_idx', 'key', ['business_id']);

    console.log(`✅ Colección ${collectionId} creada`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`ℹ️  Colección ${collectionId} ya existe`);
    } else {
      console.error(`❌ Error creando ${collectionId}:`, error.message);
    }
  }
}

async function setup() {
  console.log('🚀 Iniciando configuración de Appwrite para FacturaFácil\n');
  
  if (!process.env.APPWRITE_PROJECT_ID || !process.env.APPWRITE_API_KEY) {
    console.error('❌ Error: Faltan variables de entorno APPWRITE_PROJECT_ID y/o APPWRITE_API_KEY');
    console.log('\nAsegúrate de tener un archivo .env con:');
    console.log('  APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1');
    console.log('  APPWRITE_PROJECT_ID=tu_project_id');
    console.log('  APPWRITE_API_KEY=tu_api_key');
    console.log('  APPWRITE_DATABASE_ID=facturafacil');
    process.exit(1);
  }

  try {
    await createDatabase();
    
    // Crear colecciones secuencialmente para evitar rate limits
    await createUsersCollection();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await createBusinessesCollection();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await createClientsCollection();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await createProductsCollection();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await createDocumentsCollection();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await createDocumentItemsCollection();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await createSeriesCollection();

    console.log('\n✅ Configuración de Appwrite completada exitosamente!');
    console.log('\n📝 Ahora puedes iniciar el servidor con: npm run dev');
  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
    process.exit(1);
  }
}

setup();
