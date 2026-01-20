import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { productsApi } from '../services/api';
import { Product } from '../types';

interface ProductForm {
  codigo: string;
  descripcion: string;
  unidadMedida: string;
  precio: number;
  tipo: 'producto' | 'servicio';
  igvIncluido: boolean;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductForm>({
    defaultValues: {
      tipo: 'producto',
      unidadMedida: 'NIU',
      igvIncluido: true
    }
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productsApi.getAll();
      setProducts(response.data.products);
    } catch (error) {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      reset({
        codigo: product.codigo || '',
        descripcion: product.descripcion,
        unidadMedida: product.unidad_medida,
        precio: product.precio,
        tipo: product.tipo,
        igvIncluido: product.igv_incluido
      });
    } else {
      setEditingProduct(null);
      reset({
        codigo: '',
        descripcion: '',
        unidadMedida: 'NIU',
        precio: 0,
        tipo: 'producto',
        igvIncluido: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    reset();
  };

  const onSubmit = async (data: ProductForm) => {
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, data);
        toast.success('Producto actualizado');
      } else {
        await productsApi.create(data);
        toast.success('Producto creado');
      }
      closeModal();
      loadProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Eliminar ${product.descripcion}?`)) return;

    try {
      await productsApi.delete(product.id);
      toast.success('Producto eliminado');
      loadProducts();
    } catch (error) {
      toast.error('Error al eliminar producto');
    }
  };

  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      product.descripcion.toLowerCase().includes(search) ||
      product.codigo?.toLowerCase().includes(search)
    );
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const unidadMedidaOptions = [
    { value: 'NIU', label: 'Unidad' },
    { value: 'KGM', label: 'Kilogramo' },
    { value: 'LTR', label: 'Litro' },
    { value: 'MTR', label: 'Metro' },
    { value: 'HUR', label: 'Hora' },
    { value: 'DAY', label: 'Día' },
    { value: 'MON', label: 'Mes' },
    { value: 'ZZ', label: 'Servicio' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos y Servicios</h1>
          <p className="text-gray-500">{products.length} items registrados</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2 justify-center">
          <PlusIcon className="w-5 h-5" />
          Nuevo Producto
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o código..."
          className="input pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Products List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Producto / Servicio</th>
                  <th className="table-header">Código</th>
                  <th className="table-header">Unidad</th>
                  <th className="table-header text-right">Precio</th>
                  <th className="table-header text-center">Estado</th>
                  <th className="table-header text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          product.tipo === 'servicio' ? 'bg-purple-100' : 'bg-orange-100'
                        }`}>
                          <CubeIcon className={`w-5 h-5 ${
                            product.tipo === 'servicio' ? 'text-purple-600' : 'text-orange-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">{product.descripcion}</p>
                          <p className="text-xs text-gray-500 capitalize">{product.tipo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-gray-600">
                      {product.codigo || '-'}
                    </td>
                    <td className="table-cell text-gray-600">
                      {unidadMedidaOptions.find(u => u.value === product.unidad_medida)?.label || product.unidad_medida}
                    </td>
                    <td className="table-cell text-right font-medium">
                      {formatCurrency(product.precio)}
                      {product.igv_incluido && (
                        <span className="text-xs text-gray-400 block">inc. IGV</span>
                      )}
                    </td>
                    <td className="table-cell text-center">
                      <span className={`badge ${product.activo ? 'badge-success' : 'badge-danger'}`}>
                        {product.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(product)}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
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
          <CubeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos</h3>
          <p className="text-gray-500 mb-4">Agrega productos o servicios para facturar más rápido</p>
          <button onClick={() => openModal()} className="btn-primary inline-flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Crear Producto
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
              <div>
                <label className="label">Descripción *</label>
                <input
                  type="text"
                  className={`input ${errors.descripcion ? 'input-error' : ''}`}
                  placeholder="Ej: Hamburguesa clásica"
                  {...register('descripcion', { required: 'Requerido' })}
                />
                {errors.descripcion && (
                  <p className="text-xs text-red-500 mt-1">{errors.descripcion.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Código (opcional)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="SKU-001"
                    {...register('codigo')}
                  />
                </div>
                <div>
                  <label className="label">Tipo</label>
                  <select className="input" {...register('tipo')}>
                    <option value="producto">Producto</option>
                    <option value="servicio">Servicio</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Precio *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`input ${errors.precio ? 'input-error' : ''}`}
                    placeholder="0.00"
                    {...register('precio', { 
                      required: 'Requerido',
                      valueAsNumber: true,
                      min: { value: 0, message: 'Debe ser positivo' }
                    })}
                  />
                  {errors.precio && (
                    <p className="text-xs text-red-500 mt-1">{errors.precio.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Unidad de Medida</label>
                  <select className="input" {...register('unidadMedida')}>
                    {unidadMedidaOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="igvIncluido"
                  className="w-4 h-4 text-primary-600 rounded"
                  {...register('igvIncluido')}
                />
                <label htmlFor="igvIncluido" className="text-sm text-gray-700">
                  Precio incluye IGV
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                  {isSubmitting ? 'Guardando...' : (editingProduct ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
