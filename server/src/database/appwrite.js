const { databases, users, DATABASE_ID, COLLECTIONS, ID, Query } = require('../config/appwrite');
const bcrypt = require('bcryptjs');

// ==================== USER OPERATIONS ====================
const userService = {
  async create(email, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = ID.unique();
    
    const user = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.USERS,
      userId,
      {
        email,
        password: hashedPassword,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    );
    
    return { id: user.$id, ...user };
  },

  async findByEmail(email) {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USERS,
        [Query.equal('email', email)]
      );
      
      if (result.documents.length === 0) return null;
      const doc = result.documents[0];
      return { id: doc.$id, ...doc };
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  },

  async findById(id) {
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, id);
      return { id: doc.$id, ...doc };
    } catch (error) {
      return null;
    }
  },

  async validatePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  },

  async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.USERS,
      userId,
      {
        password: hashedPassword,
        updated_at: new Date().toISOString()
      }
    );
    return true;
  }
};

// ==================== BUSINESS OPERATIONS ====================
const businessService = {
  async create(data) {
    const businessId = ID.unique();
    
    // Calcular fecha de expiración del trial (7 días)
    const trialExpira = new Date();
    trialExpira.setDate(trialExpira.getDate() + 7);
    
    const business = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.BUSINESSES,
      businessId,
      {
        user_id: data.userId,
        ruc: data.ruc,
        razon_social: data.razonSocial,
        nombre_comercial: data.nombreComercial || data.razonSocial,
        direccion: data.direccion,
        ubigeo: data.ubigeo || '',
        departamento: data.departamento || '',
        provincia: data.provincia || '',
        distrito: data.distrito || '',
        telefono: data.telefono || '',
        email: data.email || '',
        logo: data.logo || '',
        plan: data.plan || 'trial',
        plan_expira: data.planExpira || trialExpira.toISOString(),
        documents_this_month: 0,
        subscription_start: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    );
    
    return { id: business.$id, ...business };
  },

  async findByUserId(userId) {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.BUSINESSES,
        [Query.equal('user_id', userId)]
      );
      
      if (result.documents.length === 0) return null;
      const doc = result.documents[0];
      return { id: doc.$id, ...doc };
    } catch (error) {
      return null;
    }
  },

  async findByRuc(ruc) {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.BUSINESSES,
        [Query.equal('ruc', ruc)]
      );
      
      if (result.documents.length === 0) return null;
      const doc = result.documents[0];
      return { id: doc.$id, ...doc };
    } catch (error) {
      return null;
    }
  },

  async findById(id) {
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.BUSINESSES, id);
      return { id: doc.$id, ...doc };
    } catch (error) {
      return null;
    }
  },

  async update(id, data) {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    };
    
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.BUSINESSES,
      id,
      updateData
    );
    
    return { id: doc.$id, ...doc };
  },

  async incrementDocumentCount(id) {
    const business = await this.findById(id);
    if (!business) return null;
    
    return this.update(id, {
      documents_this_month: (business.documents_this_month || 0) + 1
    });
  }
};

// ==================== CLIENT OPERATIONS ====================
const clientService = {
  async create(data) {
    const clientId = ID.unique();
    
    const client = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.CLIENTS,
      clientId,
      {
        business_id: data.businessId,
        tipo_documento: data.tipoDocumento,
        numero_documento: data.numeroDocumento,
        razon_social: data.nombre || data.razonSocial,
        direccion: data.direccion || '',
        email: data.email || '',
        telefono: data.telefono || ''
      }
    );
    
    // Map razon_social to nombre for frontend compatibility
    return { 
      id: client.$id, 
      nombre: client.razon_social,
      razon_social: client.razon_social,
      tipo_documento: client.tipo_documento,
      numero_documento: client.numero_documento,
      direccion: client.direccion,
      email: client.email,
      telefono: client.telefono,
      business_id: client.business_id
    };
  },

  async findByBusinessId(businessId) {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CLIENTS,
        [
          Query.equal('business_id', businessId),
          Query.limit(1000)
        ]
      );
      
      return result.documents.map(doc => ({ 
        id: doc.$id, 
        nombre: doc.razon_social,
        razon_social: doc.razon_social,
        tipo_documento: doc.tipo_documento,
        numero_documento: doc.numero_documento,
        direccion: doc.direccion,
        email: doc.email,
        telefono: doc.telefono,
        business_id: doc.business_id
      }));
    } catch (error) {
      console.error('Error finding clients:', error);
      return [];
    }
  },

  async search(businessId, query) {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CLIENTS,
        [
          Query.equal('business_id', businessId),
          Query.limit(100)
        ]
      );
      
      // Filter in memory since Appwrite search is limited
      const filtered = result.documents.filter(doc => 
        doc.razon_social?.toLowerCase().includes(query.toLowerCase()) ||
        doc.numero_documento?.includes(query)
      );
      
      return filtered.slice(0, 20).map(doc => ({ 
        id: doc.$id, 
        nombre: doc.razon_social,
        razon_social: doc.razon_social,
        tipo_documento: doc.tipo_documento,
        numero_documento: doc.numero_documento,
        direccion: doc.direccion,
        email: doc.email,
        telefono: doc.telefono,
        business_id: doc.business_id
      }));
    } catch (error) {
      console.error('Error searching clients:', error);
      return [];
    }
  },

  async findById(id, businessId) {
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.CLIENTS, id);
      if (doc.business_id !== businessId) return null;
      return { 
        id: doc.$id, 
        nombre: doc.razon_social,
        razon_social: doc.razon_social,
        tipo_documento: doc.tipo_documento,
        numero_documento: doc.numero_documento,
        direccion: doc.direccion,
        email: doc.email,
        telefono: doc.telefono,
        business_id: doc.business_id
      };
    } catch (error) {
      return null;
    }
  },

  async findByDocument(businessId, tipoDocumento, numeroDocumento) {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CLIENTS,
        [
          Query.equal('business_id', businessId),
          Query.equal('tipo_documento', tipoDocumento),
          Query.equal('numero_documento', numeroDocumento)
        ]
      );
      
      if (result.documents.length === 0) return null;
      const doc = result.documents[0];
      return { 
        id: doc.$id, 
        nombre: doc.razon_social,
        razon_social: doc.razon_social,
        tipo_documento: doc.tipo_documento,
        numero_documento: doc.numero_documento,
        direccion: doc.direccion,
        email: doc.email,
        telefono: doc.telefono,
        business_id: doc.business_id
      };
    } catch (error) {
      return null;
    }
  },

  async update(id, data) {
    const updateData = {
      razon_social: data.nombre || data.razonSocial,
      tipo_documento: data.tipoDocumento,
      numero_documento: data.numeroDocumento,
      direccion: data.direccion || '',
      email: data.email || '',
      telefono: data.telefono || ''
    };
    
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.CLIENTS,
      id,
      updateData
    );
    
    return { 
      id: doc.$id, 
      nombre: doc.razon_social,
      razon_social: doc.razon_social,
      tipo_documento: doc.tipo_documento,
      numero_documento: doc.numero_documento,
      direccion: doc.direccion,
      email: doc.email,
      telefono: doc.telefono,
      business_id: doc.business_id
    };
  },

  async delete(id) {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.CLIENTS, id);
    return true;
  },

  async count(businessId) {
    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CLIENTS,
      [
        Query.equal('business_id', businessId),
        Query.limit(1)
      ]
    );
    return result.total;
  }
};

// ==================== PRODUCT OPERATIONS ====================
const productService = {
  async create(data) {
    const productId = ID.unique();
    
    const product = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.PRODUCTS,
      productId,
      {
        business_id: data.businessId,
        codigo: data.codigo || '',
        descripcion: data.descripcion,
        unidad_medida: data.unidadMedida || 'NIU',
        precio: data.precio,
        tipo: data.tipo || 'producto',
        igv_incluido: data.igvIncluido !== false,
        activo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    );
    
    return { id: product.$id, ...product };
  },

  async findByBusinessId(businessId, activo = undefined) {
    try {
      const queries = [
        Query.equal('business_id', businessId),
        Query.orderAsc('descripcion'),
        Query.limit(1000)
      ];
      
      if (activo !== undefined) {
        queries.push(Query.equal('activo', activo));
      }
      
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        queries
      );
      
      return result.documents.map(doc => ({ id: doc.$id, ...doc }));
    } catch (error) {
      console.error('Error finding products:', error);
      return [];
    }
  },

  async search(businessId, query) {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS,
        [
          Query.equal('business_id', businessId),
          Query.equal('activo', true),
          Query.or([
            Query.contains('descripcion', query),
            Query.contains('codigo', query)
          ]),
          Query.limit(20)
        ]
      );
      
      return result.documents.map(doc => ({ id: doc.$id, ...doc }));
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  },

  async findById(id, businessId) {
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, id);
      if (doc.business_id !== businessId) return null;
      return { id: doc.$id, ...doc };
    } catch (error) {
      return null;
    }
  },

  async update(id, data) {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    };
    
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.PRODUCTS,
      id,
      updateData
    );
    
    return { id: doc.$id, ...doc };
  },

  async delete(id) {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, id);
    return true;
  },

  async count(businessId) {
    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PRODUCTS,
      [
        Query.equal('business_id', businessId),
        Query.equal('activo', true),
        Query.limit(1)
      ]
    );
    return result.total;
  }
};

// ==================== SERIES OPERATIONS ====================
const seriesService = {
  async create(data) {
    const seriesId = ID.unique();
    
    const series = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.SERIES,
      seriesId,
      {
        business_id: data.businessId,
        tipo: data.tipo,
        serie: data.serie,
        ultimo_numero: data.ultimoNumero || 0,
        activo: true,
        created_at: new Date().toISOString()
      }
    );
    
    return { id: series.$id, ...series };
  },

  async findByBusinessId(businessId) {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SERIES,
        [Query.equal('business_id', businessId)]
      );
      
      return result.documents.map(doc => ({ id: doc.$id, ...doc }));
    } catch (error) {
      return [];
    }
  },

  async findActiveByTipo(businessId, tipo) {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SERIES,
        [
          Query.equal('business_id', businessId),
          Query.equal('tipo', tipo),
          Query.equal('activo', true),
          Query.limit(1)
        ]
      );
      
      if (result.documents.length === 0) return null;
      const doc = result.documents[0];
      return { id: doc.$id, ...doc };
    } catch (error) {
      return null;
    }
  },

  async findBySerieAndTipo(businessId, tipo, serie) {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SERIES,
        [
          Query.equal('business_id', businessId),
          Query.equal('tipo', tipo),
          Query.equal('serie', serie)
        ]
      );
      
      if (result.documents.length === 0) return null;
      const doc = result.documents[0];
      return { id: doc.$id, ...doc };
    } catch (error) {
      return null;
    }
  },

  async incrementNumber(id) {
    const series = await databases.getDocument(DATABASE_ID, COLLECTIONS.SERIES, id);
    const newNumber = (series.ultimo_numero || 0) + 1;
    
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.SERIES,
      id,
      { ultimo_numero: newNumber }
    );
    
    return { id: doc.$id, ...doc, ultimo_numero: newNumber };
  },

  async update(id, data) {
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.SERIES,
      id,
      data
    );
    
    return { id: doc.$id, ...doc };
  }
};

// ==================== DOCUMENT OPERATIONS ====================
const documentService = {
  async create(data) {
    const documentId = ID.unique();
    
    const document = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.DOCUMENTS,
      documentId,
      {
        business_id: data.businessId,
        client_id: data.clientId || null,
        tipo: data.tipo,
        serie: data.serie,
        numero: data.numero,
        fecha_emision: data.fechaEmision,
        fecha_vencimiento: data.fechaVencimiento || null,
        moneda: data.moneda || 'PEN',
        subtotal: data.subtotal,
        igv: data.igv,
        total: data.total,
        estado: data.estado || 'emitido',
        sunat_respuesta: data.sunatRespuesta || null,
        sunat_codigo: data.sunatCodigo || null,
        hash_cpe: data.hashCpe || null,
        pdf_path: data.pdfPath || null,
        xml_path: data.xmlPath || null,
        observaciones: data.observaciones || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    );
    
    return { id: document.$id, ...document };
  },

  async createItems(documentId, items) {
    const createdItems = [];
    
    for (const item of items) {
      const itemId = ID.unique();
      const docItem = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.DOCUMENT_ITEMS,
        itemId,
        {
          document_id: documentId,
          product_id: item.productId || null,
          cantidad: item.cantidad,
          unidad_medida: item.unidadMedida || 'NIU',
          descripcion: item.descripcion,
          precio_unitario: item.precioUnitario,
          valor_venta: item.valorVenta,
          igv: item.igv,
          total: item.total
        }
      );
      createdItems.push({ id: docItem.$id, ...docItem });
    }
    
    return createdItems;
  },

  async findByBusinessId(businessId, options = {}) {
    try {
      const queries = [Query.equal('business_id', businessId)];
      
      if (options.tipo) {
        queries.push(Query.equal('tipo', options.tipo));
      }
      
      if (options.estado) {
        queries.push(Query.equal('estado', options.estado));
      }
      
      if (options.desde) {
        queries.push(Query.greaterThanEqual('fecha_emision', options.desde));
      }
      
      if (options.hasta) {
        queries.push(Query.lessThanEqual('fecha_emision', options.hasta));
      }
      
      queries.push(Query.orderDesc('created_at'));
      queries.push(Query.limit(options.limit || 50));
      queries.push(Query.offset(options.offset || 0));
      
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DOCUMENTS,
        queries
      );
      
      // Get client info for each document
      const documents = await Promise.all(result.documents.map(async (doc) => {
        let client = null;
        if (doc.client_id) {
          try {
            client = await databases.getDocument(DATABASE_ID, COLLECTIONS.CLIENTS, doc.client_id);
          } catch (e) {
            // Client may have been deleted
          }
        }
        return {
          id: doc.$id,
          ...doc,
          client_nombre: client?.nombre || null,
          client_documento: client?.numero_documento || null
        };
      }));
      
      return { documents, total: result.total };
    } catch (error) {
      console.error('Error finding documents:', error);
      return { documents: [], total: 0 };
    }
  },

  async findById(id, businessId) {
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.DOCUMENTS, id);
      if (doc.business_id !== businessId) return null;
      
      // Get client info
      let client = null;
      if (doc.client_id) {
        try {
          client = await databases.getDocument(DATABASE_ID, COLLECTIONS.CLIENTS, doc.client_id);
        } catch (e) {
          // Client may have been deleted
        }
      }
      
      // Get items
      const itemsResult = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.DOCUMENT_ITEMS,
        [Query.equal('document_id', id)]
      );
      
      const items = itemsResult.documents.map(item => ({ id: item.$id, ...item }));
      
      return {
        id: doc.$id,
        ...doc,
        client_nombre: client?.nombre || null,
        client_documento: client?.numero_documento || null,
        client_tipo_documento: client?.tipo_documento || null,
        client_direccion: client?.direccion || null,
        items
      };
    } catch (error) {
      return null;
    }
  },

  async update(id, data) {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    };
    
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.DOCUMENTS,
      id,
      updateData
    );
    
    return { id: doc.$id, ...doc };
  },

  async count(businessId, options = {}) {
    const queries = [Query.equal('business_id', businessId)];
    
    if (options.tipo) {
      queries.push(Query.equal('tipo', options.tipo));
    }
    
    if (options.desde) {
      queries.push(Query.greaterThanEqual('fecha_emision', options.desde));
    }
    
    if (options.hasta) {
      queries.push(Query.lessThanEqual('fecha_emision', options.hasta));
    }
    
    queries.push(Query.limit(1));
    
    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.DOCUMENTS,
      queries
    );
    
    return result.total;
  },

  async sumTotal(businessId, options = {}) {
    const queries = [Query.equal('business_id', businessId)];
    
    if (options.desde) {
      queries.push(Query.greaterThanEqual('fecha_emision', options.desde));
    }
    
    if (options.hasta) {
      queries.push(Query.lessThanEqual('fecha_emision', options.hasta));
    }
    
    queries.push(Query.limit(1000));
    
    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.DOCUMENTS,
      queries
    );
    
    return result.documents.reduce((sum, doc) => sum + (doc.total || 0), 0);
  },

  async getRecentDocuments(businessId, limit = 5) {
    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.DOCUMENTS,
      [
        Query.equal('business_id', businessId),
        Query.orderDesc('created_at'),
        Query.limit(limit)
      ]
    );
    
    const documents = await Promise.all(result.documents.map(async (doc) => {
      let client = null;
      if (doc.client_id) {
        try {
          client = await databases.getDocument(DATABASE_ID, COLLECTIONS.CLIENTS, doc.client_id);
        } catch (e) {}
      }
      return {
        id: doc.$id,
        ...doc,
        client_nombre: client?.nombre || null,
        client_documento: client?.numero_documento || null
      };
    }));
    
    return documents;
  },

  async getMonthlySales(businessId) {
    // Get documents from last 12 months
    const now = new Date();
    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    
    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.DOCUMENTS,
      [
        Query.equal('business_id', businessId),
        Query.greaterThanEqual('fecha_emision', yearAgo.toISOString().split('T')[0]),
        Query.limit(1000)
      ]
    );
    
    // Group by month
    const monthlyData = {};
    result.documents.forEach(doc => {
      const date = new Date(doc.fecha_emision);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[key]) {
        monthlyData[key] = {
          month: date.toLocaleString('es-PE', { month: 'short' }),
          year: date.getFullYear(),
          total: 0
        };
      }
      monthlyData[key].total += doc.total || 0;
    });
    
    // Convert to array and sort
    return Object.values(monthlyData).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return new Date(`${a.month} 1, ${a.year}`) - new Date(`${b.month} 1, ${b.year}`);
    });
  }
};

// ==================== TRANSACTION (FINANCES) OPERATIONS ====================
const transactionService = {
  async create(data) {
    const transactionId = ID.unique();
    
    const transaction = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.TRANSACTIONS,
      transactionId,
      {
        business_id: data.businessId,
        tipo: data.tipo,
        monto: data.monto,
        descripcion: data.descripcion,
        categoria: data.categoria,
        fecha: data.fecha,
        created_at: new Date().toISOString()
      }
    );
    
    return { id: transaction.$id, ...transaction };
  },

  async findByBusinessId(businessId, startDate, endDate) {
    try {
      const queries = [
        Query.equal('business_id', businessId),
        Query.orderDesc('fecha'),
        Query.limit(500)
      ];
      
      if (startDate) {
        queries.push(Query.greaterThanEqual('fecha', startDate));
      }
      if (endDate) {
        queries.push(Query.lessThanEqual('fecha', endDate));
      }

      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.TRANSACTIONS,
        queries
      );
      
      return result.documents.map(doc => ({ ...doc, $id: doc.$id }));
    } catch (error) {
      console.error('Error finding transactions:', error);
      return [];
    }
  },

  async update(id, data) {
    const transaction = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.TRANSACTIONS,
      id,
      {
        tipo: data.tipo,
        monto: data.monto,
        descripcion: data.descripcion,
        categoria: data.categoria,
        fecha: data.fecha
      }
    );
    
    return { id: transaction.$id, ...transaction };
  },

  async delete(id) {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.TRANSACTIONS, id);
    return true;
  },

  async getBalance(businessId, startDate, endDate) {
    const transactions = await this.findByBusinessId(businessId, startDate, endDate);
    
    return transactions.reduce(
      (acc, t) => {
        if (t.tipo === 'ingreso') {
          acc.ingresos += t.monto;
        } else {
          acc.gastos += t.monto;
        }
        return acc;
      },
      { ingresos: 0, gastos: 0 }
    );
  }
};

// ==================== PAYMENT OPERATIONS ====================
const paymentService = {
  async create(data) {
    const paymentId = ID.unique();
    
    const payment = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.PAYMENTS,
      paymentId,
      {
        user_id: data.userId,
        business_id: data.businessId,
        plan: data.plan,
        monto: data.monto,
        metodo_pago: data.metodoPago,
        referencia: data.referencia,
        notas: data.notas || '',
        estado: 'pendiente',
        created_at: new Date().toISOString()
      }
    );
    
    return { id: payment.$id, ...payment };
  },

  async findByUserId(userId) {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PAYMENTS,
        [
          Query.equal('user_id', userId),
          Query.orderDesc('$createdAt'),
          Query.limit(50)
        ]
      );
      
      return result.documents.map(doc => ({
        $id: doc.$id,
        userId: doc.user_id,
        plan: doc.plan,
        monto: doc.monto,
        metodoPago: doc.metodo_pago,
        referencia: doc.referencia,
        notas: doc.notas,
        estado: doc.estado,
        $createdAt: doc.$createdAt
      }));
    } catch (error) {
      console.error('Error finding payments:', error);
      return [];
    }
  },

  async updateStatus(id, estado) {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.PAYMENTS,
      id,
      { estado }
    );
    return true;
  }
};

module.exports = {
  userService,
  businessService,
  clientService,
  productService,
  seriesService,
  documentService,
  transactionService,
  paymentService,
  Query
};
