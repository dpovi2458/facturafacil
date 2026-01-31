const { Client, Databases, Users, ID, Query } = require('node-appwrite');

// Inicializar cliente de Appwrite
const client = new Client();

client
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const users = new Users(client);

// IDs de la base de datos y colecciones
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'facturafacil';

const COLLECTIONS = {
  USERS: 'users',
  BUSINESSES: 'businesses',
  CLIENTS: 'clients',
  PRODUCTS: 'products',
  DOCUMENTS: 'documents',
  DOCUMENT_ITEMS: 'document_items',
  SERIES: 'series',
  TRANSACTIONS: 'transactions',
  PAYMENTS: 'payments'
};

module.exports = {
  client,
  databases,
  users,
  DATABASE_ID,
  COLLECTIONS,
  ID,
  Query
};
