const { Client, Databases, ID } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;

async function createLicensesCollection() {
  try {
    // Create licenses collection
    await databases.createCollection(
      DATABASE_ID,
      'licenses',
      'Licenses',
      ['read("any")', 'create("users")', 'update("users")', 'delete("users")']
    );
    console.log('✅ Licenses collection created');

    // Add attributes
    await databases.createStringAttribute(DATABASE_ID, 'licenses', 'codigo', 20, true);
    await databases.createStringAttribute(DATABASE_ID, 'licenses', 'plan', 20, true);
    await databases.createIntegerAttribute(DATABASE_ID, 'licenses', 'duracion_dias', true, 1, 365, 30);
    await databases.createBooleanAttribute(DATABASE_ID, 'licenses', 'usado', true);
    await databases.createStringAttribute(DATABASE_ID, 'licenses', 'usado_por', 50, false);
    await databases.createDatetimeAttribute(DATABASE_ID, 'licenses', 'fecha_uso', false);
    await databases.createDatetimeAttribute(DATABASE_ID, 'licenses', 'created_at', false);
    
    console.log('✅ Attributes created');
    
    // Wait for attributes
    await new Promise(r => setTimeout(r, 3000));
    
    // Create index
    await databases.createIndex(DATABASE_ID, 'licenses', 'idx_codigo', 'unique', ['codigo']);
    console.log('✅ Index created');
    
  } catch (error) {
    if (error.code === 409) {
      console.log('⚠️ Collection already exists');
    } else {
      console.error('Error:', error.message);
    }
  }
}

createLicensesCollection();
