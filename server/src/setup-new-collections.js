/**
 * Script para agregar nuevas colecciones de transactions y payments
 * Ejecutar: node src/setup-new-collections.js
 */

require('dotenv').config();
const { Client, Databases, ID } = require('node-appwrite');

const client = new Client();
client
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'facturafacil';

async function createCollection(id, name, attributes) {
  try {
    console.log(`Creating collection: ${name}...`);
    
    await databases.createCollection(
      DATABASE_ID,
      id,
      name,
      ['read("any")', 'create("any")', 'update("any")', 'delete("any")']
    );
    
    // Create attributes
    for (const attr of attributes) {
      console.log(`  Adding attribute: ${attr.key}`);
      
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            DATABASE_ID,
            id,
            attr.key,
            attr.size || 255,
            attr.required || false,
            attr.default,
            attr.array || false
          );
        } else if (attr.type === 'float') {
          await databases.createFloatAttribute(
            DATABASE_ID,
            id,
            attr.key,
            attr.required || false,
            attr.min,
            attr.max,
            attr.default,
            attr.array || false
          );
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(
            DATABASE_ID,
            id,
            attr.key,
            attr.required || false,
            attr.default,
            attr.array || false
          );
        }
      } catch (attrError) {
        if (attrError.code === 409) {
          console.log(`    Attribute ${attr.key} already exists`);
        } else {
          throw attrError;
        }
      }
    }
    
    console.log(`✓ Collection ${name} created successfully`);
    return true;
  } catch (error) {
    if (error.code === 409) {
      console.log(`Collection ${name} already exists`);
      return true;
    }
    console.error(`Error creating collection ${name}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('Setting up new collections for FacturaFácil');
  console.log('='.repeat(50));
  console.log('');

  // Transactions collection
  await createCollection('transactions', 'Transactions', [
    { key: 'business_id', type: 'string', size: 36, required: true },
    { key: 'tipo', type: 'string', size: 20, required: true }, // ingreso | gasto
    { key: 'monto', type: 'float', required: true, min: 0 },
    { key: 'descripcion', type: 'string', size: 500, required: true },
    { key: 'categoria', type: 'string', size: 100, required: true },
    { key: 'fecha', type: 'string', size: 20, required: true },
    { key: 'created_at', type: 'datetime', required: false }
  ]);

  // Wait for attributes to be created
  console.log('Waiting for attributes to be processed...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Payments collection
  await createCollection('payments', 'Payments', [
    { key: 'user_id', type: 'string', size: 36, required: true },
    { key: 'business_id', type: 'string', size: 36, required: true },
    { key: 'plan', type: 'string', size: 50, required: true },
    { key: 'monto', type: 'float', required: true, min: 0 },
    { key: 'metodo_pago', type: 'string', size: 50, required: true },
    { key: 'referencia', type: 'string', size: 100, required: true },
    { key: 'notas', type: 'string', size: 500, required: false },
    { key: 'estado', type: 'string', size: 20, required: true }, // pendiente | verificado | rechazado
    { key: 'created_at', type: 'datetime', required: false }
  ]);

  console.log('');
  console.log('='.repeat(50));
  console.log('✅ Setup complete!');
  console.log('='.repeat(50));
}

main().catch(console.error);
