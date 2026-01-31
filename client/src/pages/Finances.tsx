import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  TrashIcon,
  PencilIcon,
  FunnelIcon,
  CalendarIcon,
  XMarkIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

interface Transaction {
  $id: string;
  tipo: 'ingreso' | 'gasto';
  monto: number;
  descripcion: string;
  categoria: string;
  fecha: string;
  $createdAt: string;
}

interface TransactionForm {
  tipo: 'ingreso' | 'gasto';
  monto: number;
  descripcion: string;
  categoria: string;
  fecha: string;
}

const categorias = {
  ingreso: [
    'Ventas',
    'Servicios',
    'Comisiones',
    'Intereses',
    'Otros ingresos'
  ],
  gasto: [
    'Compras/Inventario',
    'Alquiler',
    'Servicios públicos',
    'Sueldos',
    'Marketing',
    'Transporte',
    'Impuestos',
    'Mantenimiento',
    'Otros gastos'
  ]
};

export default function Finances() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'ingreso' | 'gasto'>('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<TransactionForm>({
    defaultValues: {
      tipo: 'ingreso',
      fecha: new Date().toISOString().split('T')[0]
    }
  });

  const tipoActual = watch('tipo');

  useEffect(() => {
    loadTransactions();
  }, [dateRange]);

  const loadTransactions = async () => {
    try {
      const response = await api.get('/finances', {
        params: { startDate: dateRange.start, endDate: dateRange.end }
      });
      setTransactions(response.data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (transaction?: Transaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setValue('tipo', transaction.tipo);
      setValue('monto', transaction.monto);
      setValue('descripcion', transaction.descripcion);
      setValue('categoria', transaction.categoria);
      setValue('fecha', transaction.fecha.split('T')[0]);
    } else {
      setEditingTransaction(null);
      reset({
        tipo: 'ingreso',
        monto: 0,
        descripcion: '',
        categoria: '',
        fecha: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    reset();
  };

  const onSubmit = async (data: TransactionForm) => {
    try {
      if (editingTransaction) {
        await api.put(`/finances/${editingTransaction.$id}`, data);
        toast.success('Transacción actualizada');
      } else {
        await api.post('/finances', data);
        toast.success('Transacción registrada');
      }
      closeModal();
      loadTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta transacción?')) return;
    try {
      await api.delete(`/finances/${id}`);
      toast.success('Transacción eliminada');
      loadTransactions();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  // Calcular totales
  const totales = transactions.reduce(
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
  const balance = totales.ingresos - totales.gastos;

  const filteredTransactions = transactions.filter(t => 
    filterType === 'all' || t.tipo === filterType
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control de Finanzas</h1>
          <p className="text-gray-500">Registra y monitorea tus ingresos y gastos</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Nueva Transacción
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg shadow-green-500/25">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <ArrowTrendingUpIcon className="w-6 h-6" />
            </div>
            <span className="text-green-100 font-medium">Ingresos</span>
          </div>
          <p className="text-3xl font-bold">S/{totales.ingresos.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg shadow-red-500/25">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <ArrowTrendingDownIcon className="w-6 h-6" />
            </div>
            <span className="text-red-100 font-medium">Gastos</span>
          </div>
          <p className="text-3xl font-bold">S/{totales.gastos.toFixed(2)}</p>
        </div>

        <div className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} rounded-2xl p-6 text-white shadow-lg ${balance >= 0 ? 'shadow-blue-500/25' : 'shadow-orange-500/25'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <BanknotesIcon className="w-6 h-6" />
            </div>
            <span className={`font-medium ${balance >= 0 ? 'text-blue-100' : 'text-orange-100'}`}>Balance</span>
          </div>
          <p className="text-3xl font-bold">S/{balance.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="input py-2"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="input py-2"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="input py-2"
            >
              <option value="all">Todos</option>
              <option value="ingreso">Solo Ingresos</option>
              <option value="gasto">Solo Gastos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <ChartBarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay transacciones en este período</p>
            <button onClick={() => openModal()} className="mt-4 text-primary-600 font-medium hover:underline">
              Registrar primera transacción
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.$id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    transaction.tipo === 'ingreso' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {transaction.tipo === 'ingreso' 
                      ? <ArrowTrendingUpIcon className="w-5 h-5" />
                      : <ArrowTrendingDownIcon className="w-5 h-5" />
                    }
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{transaction.descripcion}</p>
                    <p className="text-sm text-gray-500">
                      {transaction.categoria} • {new Date(transaction.fecha).toLocaleDateString('es-PE')}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      transaction.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.tipo === 'ingreso' ? '+' : '-'}S/{transaction.monto.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openModal(transaction)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTransaction(transaction.$id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={closeModal}></div>
            
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingTransaction ? 'Editar Transacción' : 'Nueva Transacción'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="label">Tipo</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      tipoActual === 'ingreso' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        value="ingreso"
                        className="sr-only"
                        {...register('tipo')}
                      />
                      <ArrowTrendingUpIcon className="w-5 h-5" />
                      Ingreso
                    </label>
                    <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      tipoActual === 'gasto' 
                        ? 'border-red-500 bg-red-50 text-red-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        value="gasto"
                        className="sr-only"
                        {...register('tipo')}
                      />
                      <ArrowTrendingDownIcon className="w-5 h-5" />
                      Gasto
                    </label>
                  </div>
                </div>

                <div>
                  <label className="label">Monto (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`input ${errors.monto ? 'input-error' : ''}`}
                    {...register('monto', { 
                      required: 'El monto es requerido',
                      min: { value: 0.01, message: 'Monto debe ser mayor a 0' }
                    })}
                  />
                  {errors.monto && <p className="mt-1 text-sm text-red-600">{errors.monto.message}</p>}
                </div>

                <div>
                  <label className="label">Descripción</label>
                  <input
                    type="text"
                    className={`input ${errors.descripcion ? 'input-error' : ''}`}
                    placeholder="Ej: Venta de productos"
                    {...register('descripcion', { required: 'La descripción es requerida' })}
                  />
                  {errors.descripcion && <p className="mt-1 text-sm text-red-600">{errors.descripcion.message}</p>}
                </div>

                <div>
                  <label className="label">Categoría</label>
                  <select
                    className={`input ${errors.categoria ? 'input-error' : ''}`}
                    {...register('categoria', { required: 'Selecciona una categoría' })}
                  >
                    <option value="">Seleccionar...</option>
                    {categorias[tipoActual]?.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.categoria && <p className="mt-1 text-sm text-red-600">{errors.categoria.message}</p>}
                </div>

                <div>
                  <label className="label">Fecha</label>
                  <input
                    type="date"
                    className="input"
                    {...register('fecha', { required: 'La fecha es requerida' })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingTransaction ? 'Actualizar' : 'Registrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
