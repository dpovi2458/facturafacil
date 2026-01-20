import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CurrencyDollarIcon, 
  DocumentTextIcon, 
  UsersIcon,
  CubeIcon,
  PlusCircleIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardApi } from '../services/api';
import { DashboardStats } from '../types';
import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ¡Hola, {user?.business?.nombreComercial || user?.business?.razonSocial || 'Usuario'}!
          </h1>
          <p className="text-gray-500">Resumen de tu negocio</p>
        </div>
        <Link to="/app/documents/new" className="btn-primary flex items-center gap-2 justify-center">
          <PlusCircleIcon className="w-5 h-5" />
          Nuevo Comprobante
        </Link>
      </div>

      {/* Plan Usage */}
      {stats?.plan && (
        <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Uso del Plan {stats.plan.name}</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.plan.used} / {stats.plan.limit === Infinity ? '∞' : stats.plan.limit} comprobantes
              </p>
            </div>
            <div className="w-24 h-24">
              <div className="relative w-full h-full">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#2563eb"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(stats.plan.used / stats.plan.limit) * 251.2} 251.2`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-900">
                    {stats.plan.limit === Infinity ? '∞' : Math.round((stats.plan.used / stats.plan.limit) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          {stats.plan.limit !== Infinity && stats.plan.used >= stats.plan.limit * 0.8 && (
            <div className="mt-4 p-3 bg-yellow-100 rounded-lg text-sm text-yellow-800">
              ⚠️ Estás cerca del límite. <Link to="/app/settings" className="font-medium underline">Actualiza tu plan</Link>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ventas Hoy</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.today.total || 0)}
              </p>
              <p className="text-xs text-gray-400">{stats?.today.count || 0} comprobantes</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ventas del Mes</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.month.total || 0)}
              </p>
              <p className="text-xs text-gray-400">{stats?.month.count || 0} comprobantes</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <ArrowTrendingUpIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.clients || 0}</p>
              <p className="text-xs text-gray-400">registrados</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Productos</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.products || 0}</p>
              <p className="text-xs text-gray-400">activos</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <CubeIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Recent Documents */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 card">
          <h3 className="font-semibold text-gray-900 mb-4">Ventas Mensuales</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.monthlySales || []}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis 
                  tickFormatter={(value) => `S/${value}`}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Documents */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Últimos Comprobantes</h3>
            <Link to="/app/documents" className="text-sm text-primary-600 hover:text-primary-700">
              Ver todos
            </Link>
          </div>
          
          {stats?.recentDocuments && stats.recentDocuments.length > 0 ? (
            <div className="space-y-3">
              {stats.recentDocuments.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      doc.tipo === 'factura' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <DocumentTextIcon className={`w-5 h-5 ${
                        doc.tipo === 'factura' ? 'text-blue-600' : 'text-green-600'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {doc.serie}-{String(doc.numero).padStart(8, '0')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {doc.client_nombre || 'Varios'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(doc.total)}
                    </p>
                    <span className={`badge ${
                      doc.estado === 'aceptado' ? 'badge-success' :
                      doc.estado === 'anulado' ? 'badge-danger' :
                      doc.estado === 'pendiente' ? 'badge-warning' : 'badge-info'
                    }`}>
                      {doc.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No hay comprobantes aún</p>
              <Link to="/app/documents/new" className="text-primary-600 text-sm font-medium">
                Crear el primero
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Documents Summary */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
            <DocumentTextIcon className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Boletas Emitidas</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.documents.boletas || 0}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
            <DocumentTextIcon className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Facturas Emitidas</p>
            <p className="text-2xl font-bold text-gray-900">{stats?.documents.facturas || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
