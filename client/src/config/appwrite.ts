import { Client, Account, Databases, ID, Query } from 'appwrite';

// Configuración de Appwrite
const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '');

export const account = new Account(client);
export const databases = new Databases(client);

// IDs de la base de datos y colecciones
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'facturafacil';

export const COLLECTIONS = {
  USERS: 'users',
  BUSINESSES: 'businesses',
  CLIENTS: 'clients',
  PRODUCTS: 'products',
  DOCUMENTS: 'documents',
  DOCUMENT_ITEMS: 'document_items',
  SERIES: 'series'
} as const;

export { client, ID, Query };
