export interface User {
  id: number;
  email: string;
  business: Business | null;
}

export interface Business {
  id: number;
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  direccion: string;
  telefono?: string;
  email?: string;
  logo?: string;
  plan: 'trial' | 'basico' | 'negocio';
  documentsThisMonth: number;
}

export interface Client {
  id: number;
  tipo_documento: 'DNI' | 'RUC' | 'CE' | 'PASAPORTE';
  numero_documento: string;
  nombre: string;
  direccion?: string;
  email?: string;
  telefono?: string;
}

export interface Product {
  id: number;
  codigo?: string;
  descripcion: string;
  unidad_medida: string;
  precio: number;
  tipo: 'producto' | 'servicio';
  igv_incluido: boolean;
  activo: boolean;
}

export interface DocumentItem {
  id?: number;
  productId?: number;
  cantidad: number;
  unidadMedida: string;
  descripcion: string;
  precioUnitario: number;
  valorVenta?: number;
  igv?: number;
  total?: number;
}

export interface Document {
  id: number;
  tipo: 'boleta' | 'factura';
  serie: string;
  numero: number;
  fecha_emision: string;
  fecha_vencimiento?: string;
  moneda: string;
  subtotal: number;
  igv: number;
  total: number;
  estado: 'emitido' | 'aceptado' | 'rechazado' | 'anulado' | 'pendiente';
  client_nombre?: string;
  client_documento?: string;
  pdf_path?: string;
  items?: DocumentItem[];
}

export interface DashboardStats {
  today: { total: number; count: number };
  month: { total: number; count: number };
  year: { total: number; count: number };
  documents: { boletas: number; facturas: number };
  clients: number;
  products: number;
  recentDocuments: Document[];
  monthlySales: { month: string; year: number; total: number }[];
  plan: { name: string; used: number; limit: number };
}

export interface Series {
  id: number;
  tipo: 'boleta' | 'factura';
  serie: string;
  ultimo_numero: number;
  activo: boolean;
}
