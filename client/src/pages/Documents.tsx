import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircleIcon, 
  DocumentTextIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  XCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { documentsApi } from '../services/api';
import { Document } from '../types';

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    tipo: '',
    estado: '',
    desde: '',
    hasta: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [filters.tipo, filters.estado, filters.desde, filters.hasta]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await documentsApi.getAll({
        tipo: filters.tipo || undefined,
        estado: filters.estado || undefined,
        desde: filters.desde || undefined,
        hasta: filters.hasta || undefined
      });
      setDocuments(response.data.documents);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (doc: Document) => {
    try {
      const response = await documentsApi.downloadPdf(doc.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.tipo}-${doc.serie}-${String(doc.numero).padStart(8, '0')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Error al descargar PDF');
    }
  };

  const handleAnular = async (doc: Document) => {
    if (!confirm(`¿Estás seguro de anular ${doc.tipo} ${doc.serie}-${String(doc.numero).padStart(8, '0')}?`)) {
      return;
    }

    try {
      await documentsApi.anular(doc.id);
      toast.success('Documento anulado');
      loadDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al anular documento');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PE');
  };

  const filteredDocuments = documents.filter(doc => {
    if (!filters.search) return true;
    const search = filters.search.toLowerCase();
    return (
      doc.serie.toLowerCase().includes(search) ||
      String(doc.numero).includes(search) ||
      doc.client_nombre?.toLowerCase().includes(search) ||
      doc.client_documento?.includes(search)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comprobantes</h1>
          <p className="text-gray-500">{total} documentos emitidos</p>
        </div>
        <Link to="/app/documents/new" className="btn-primary flex items-center gap-2 justify-center">
          <PlusCircleIcon className="w-5 h-5" />
          Nuevo Comprobante
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por serie, número o cliente..."
              className="input pl-10"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-gray-300' : ''}`}
          >
            <FunnelIcon className="w-5 h-5" />
            Filtros
          </button>
        </div>

        {showFilters && (
          <div className="grid sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <label className="label">Tipo</label>
              <select
                className="input"
                value={filters.tipo}
                onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="boleta">Boleta</option>
                <option value="factura">Factura</option>
              </select>
            </div>
            <div>
              <label className="label">Estado</label>
              <select
                className="input"
                value={filters.estado}
                onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="aceptado">Aceptado</option>
                <option value="pendiente">Pendiente</option>
                <option value="anulado">Anulado</option>
              </select>
            </div>
            <div>
              <label className="label">Desde</label>
              <input
                type="date"
                className="input"
                value={filters.desde}
                onChange={(e) => setFilters({ ...filters, desde: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Hasta</label>
              <input
                type="date"
                className="input"
                value={filters.hasta}
                onChange={(e) => setFilters({ ...filters, hasta: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Documents Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredDocuments.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Documento</th>
                  <th className="table-header">Cliente</th>
                  <th className="table-header">Fecha</th>
                  <th className="table-header text-right">Total</th>
                  <th className="table-header text-center">Estado</th>
                  <th className="table-header text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          doc.tipo === 'factura' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          <DocumentTextIcon className={`w-5 h-5 ${
                            doc.tipo === 'factura' ? 'text-blue-600' : 'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">
                            {doc.serie}-{String(doc.numero).padStart(8, '0')}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">{doc.tipo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <p className="font-medium">{doc.client_nombre || 'Varios'}</p>
                      <p className="text-xs text-gray-500">{doc.client_documento || '-'}</p>
                    </td>
                    <td className="table-cell text-gray-600">
                      {formatDate(doc.fecha_emision)}
                    </td>
                    <td className="table-cell text-right font-medium">
                      {formatCurrency(doc.total)}
                    </td>
                    <td className="table-cell text-center">
                      <span className={`badge ${
                        doc.estado === 'aceptado' ? 'badge-success' :
                        doc.estado === 'anulado' ? 'badge-danger' :
                        doc.estado === 'pendiente' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {doc.estado}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownloadPdf(doc)}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Descargar PDF"
                        >
                          <ArrowDownTrayIcon className="w-5 h-5" />
                        </button>
                        {doc.estado !== 'anulado' && (
                          <button
                            onClick={() => handleAnular(doc)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Anular"
                          >
                            <XCircleIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay comprobantes</h3>
          <p className="text-gray-500 mb-4">Emite tu primer comprobante electrónico</p>
          <Link to="/app/documents/new" className="btn-primary inline-flex items-center gap-2">
            <PlusCircleIcon className="w-5 h-5" />
            Crear Comprobante
          </Link>
        </div>
      )}
    </div>
  );
}
