import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  register: (data: {
    email: string;
    password: string;
    ruc: string;
    razonSocial: string;
    nombreComercial?: string;
    direccion: string;
    telefono?: string;
  }) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

// Clients
export const clientsApi = {
  getAll: () => api.get('/clients'),
  search: (q: string) => api.get(`/clients/search?q=${encodeURIComponent(q)}`),
  getById: (id: number) => api.get(`/clients/${id}`),
  create: (data: {
    tipoDocumento: string;
    numeroDocumento: string;
    nombre: string;
    direccion?: string;
    email?: string;
    telefono?: string;
  }) => api.post('/clients', data),
  update: (id: number, data: {
    tipoDocumento: string;
    numeroDocumento: string;
    nombre: string;
    direccion?: string;
    email?: string;
    telefono?: string;
  }) => api.put(`/clients/${id}`, data),
  delete: (id: number) => api.delete(`/clients/${id}`),
};

// Products
export const productsApi = {
  getAll: (activo?: boolean) => 
    api.get(`/products${activo !== undefined ? `?activo=${activo}` : ''}`),
  search: (q: string) => api.get(`/products/search?q=${encodeURIComponent(q)}`),
  getById: (id: number) => api.get(`/products/${id}`),
  create: (data: {
    codigo?: string;
    descripcion: string;
    unidadMedida?: string;
    precio: number;
    tipo?: string;
    igvIncluido?: boolean;
  }) => api.post('/products', data),
  update: (id: number, data: {
    codigo?: string;
    descripcion: string;
    unidadMedida?: string;
    precio: number;
    tipo?: string;
    igvIncluido?: boolean;
    activo?: boolean;
  }) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
};

// Documents
export const documentsApi = {
  getAll: (params?: {
    tipo?: string;
    estado?: string;
    desde?: string;
    hasta?: string;
    limit?: number;
    offset?: number;
  }) => api.get('/documents', { params }),
  getById: (id: number) => api.get(`/documents/${id}`),
  create: (data: {
    tipo: 'boleta' | 'factura';
    clientId?: number;
    fechaEmision?: string;
    fechaVencimiento?: string;
    moneda?: string;
    items: {
      productId?: number;
      cantidad: number;
      unidadMedida?: string;
      descripcion: string;
      precioUnitario: number;
    }[];
    observaciones?: string;
  }) => api.post('/documents', data),
  downloadPdf: (id: number) => 
    api.get(`/documents/${id}/pdf`, { responseType: 'blob' }),
  anular: (id: number) => api.post(`/documents/${id}/anular`),
};

// Business
export const businessApi = {
  get: () => api.get('/business'),
  update: (data: {
    razonSocial: string;
    nombreComercial?: string;
    direccion: string;
    ubigeo?: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
    telefono?: string;
    email?: string;
  }) => api.put('/business', data),
  getSeries: () => api.get('/business/series'),
  createSeries: (data: { tipo: 'boleta' | 'factura'; serie: string }) => 
    api.post('/business/series', data),
};

export default api;
