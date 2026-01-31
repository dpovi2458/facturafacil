/**
 * Servicio de Appwrite para el cliente
 * Este servicio permite interactuar directamente con Appwrite desde el frontend
 * para casos donde se necesite autenticación con Appwrite Account directamente
 */

import { account, databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../config/appwrite';
import type { Models } from 'appwrite';

// ==================== AUTH SERVICE ====================
export const appwriteAuthService = {
  /**
   * Crear sesión con email y contraseña
   * Nota: Para usar esto, necesitas configurar Appwrite Auth
   */
  async createEmailSession(email: string, password: string): Promise<Models.Session> {
    return await account.createEmailPasswordSession(email, password);
  },

  /**
   * Crear cuenta con email y contraseña
   */
  async createAccount(email: string, password: string, name?: string): Promise<Models.User<Models.Preferences>> {
    const userId = ID.unique();
    return await account.create(userId, email, password, name);
  },

  /**
   * Obtener sesión actual
   */
  async getSession(): Promise<Models.Session | null> {
    try {
      return await account.getSession('current');
    } catch {
      return null;
    }
  },

  /**
   * Obtener cuenta actual
   */
  async getAccount(): Promise<Models.User<Models.Preferences> | null> {
    try {
      return await account.get();
    } catch {
      return null;
    }
  },

  /**
   * Cerrar sesión
   */
  async deleteSession(): Promise<void> {
    await account.deleteSession('current');
  },

  /**
   * Cerrar todas las sesiones
   */
  async deleteSessions(): Promise<void> {
    await account.deleteSessions();
  }
};

// ==================== DATABASE HELPERS ====================
interface DocumentBase {
  $id?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

/**
 * Servicio genérico para operaciones de base de datos
 */
export const appwriteDbService = {
  /**
   * Crear documento
   */
  async create<T extends DocumentBase>(
    collectionId: string,
    data: Omit<T, '$id' | '$createdAt' | '$updatedAt'>
  ): Promise<T> {
    const doc = await databases.createDocument(
      DATABASE_ID,
      collectionId,
      ID.unique(),
      data
    );
    return doc as unknown as T;
  },

  /**
   * Obtener documento por ID
   */
  async get<T extends DocumentBase>(collectionId: string, documentId: string): Promise<T | null> {
    try {
      const doc = await databases.getDocument(DATABASE_ID, collectionId, documentId);
      return doc as unknown as T;
    } catch {
      return null;
    }
  },

  /**
   * Listar documentos
   */
  async list<T extends DocumentBase>(
    collectionId: string,
    queries: string[] = []
  ): Promise<{ documents: T[]; total: number }> {
    const result = await databases.listDocuments(DATABASE_ID, collectionId, queries);
    return {
      documents: result.documents as unknown as T[],
      total: result.total
    };
  },

  /**
   * Actualizar documento
   */
  async update<T extends DocumentBase>(
    collectionId: string,
    documentId: string,
    data: Partial<Omit<T, '$id' | '$createdAt' | '$updatedAt'>>
  ): Promise<T> {
    const doc = await databases.updateDocument(DATABASE_ID, collectionId, documentId, data);
    return doc as unknown as T;
  },

  /**
   * Eliminar documento
   */
  async delete(collectionId: string, documentId: string): Promise<void> {
    await databases.deleteDocument(DATABASE_ID, collectionId, documentId);
  }
};

// ==================== SPECIFIC SERVICES ====================

export interface ClientDocument extends DocumentBase {
  business_id: string;
  tipo_documento: string;
  numero_documento: string;
  nombre: string;
  direccion?: string;
  email?: string;
  telefono?: string;
}

export const clientsAppwriteService = {
  async getAll(businessId: string): Promise<ClientDocument[]> {
    const result = await appwriteDbService.list<ClientDocument>(
      COLLECTIONS.CLIENTS,
      [
        Query.equal('business_id', businessId),
        Query.orderAsc('nombre'),
        Query.limit(1000)
      ]
    );
    return result.documents;
  },

  async search(businessId: string, query: string): Promise<ClientDocument[]> {
    const result = await appwriteDbService.list<ClientDocument>(
      COLLECTIONS.CLIENTS,
      [
        Query.equal('business_id', businessId),
        Query.contains('nombre', query),
        Query.limit(20)
      ]
    );
    return result.documents;
  },

  async create(data: Omit<ClientDocument, '$id' | '$createdAt' | '$updatedAt'>): Promise<ClientDocument> {
    return appwriteDbService.create<ClientDocument>(COLLECTIONS.CLIENTS, data);
  },

  async update(id: string, data: Partial<ClientDocument>): Promise<ClientDocument> {
    return appwriteDbService.update<ClientDocument>(COLLECTIONS.CLIENTS, id, data);
  },

  async delete(id: string): Promise<void> {
    return appwriteDbService.delete(COLLECTIONS.CLIENTS, id);
  }
};

export interface ProductDocument extends DocumentBase {
  business_id: string;
  codigo?: string;
  descripcion: string;
  unidad_medida: string;
  precio: number;
  tipo: string;
  igv_incluido: boolean;
  activo: boolean;
}

export const productsAppwriteService = {
  async getAll(businessId: string, activo?: boolean): Promise<ProductDocument[]> {
    const queries = [
      Query.equal('business_id', businessId),
      Query.orderAsc('descripcion'),
      Query.limit(1000)
    ];
    
    if (activo !== undefined) {
      queries.push(Query.equal('activo', activo));
    }

    const result = await appwriteDbService.list<ProductDocument>(COLLECTIONS.PRODUCTS, queries);
    return result.documents;
  },

  async search(businessId: string, query: string): Promise<ProductDocument[]> {
    const result = await appwriteDbService.list<ProductDocument>(
      COLLECTIONS.PRODUCTS,
      [
        Query.equal('business_id', businessId),
        Query.equal('activo', true),
        Query.contains('descripcion', query),
        Query.limit(20)
      ]
    );
    return result.documents;
  },

  async create(data: Omit<ProductDocument, '$id' | '$createdAt' | '$updatedAt'>): Promise<ProductDocument> {
    return appwriteDbService.create<ProductDocument>(COLLECTIONS.PRODUCTS, data);
  },

  async update(id: string, data: Partial<ProductDocument>): Promise<ProductDocument> {
    return appwriteDbService.update<ProductDocument>(COLLECTIONS.PRODUCTS, id, data);
  },

  async delete(id: string): Promise<void> {
    return appwriteDbService.update<ProductDocument>(COLLECTIONS.PRODUCTS, id, { activo: false }) as unknown as Promise<void>;
  }
};

export { Query };
