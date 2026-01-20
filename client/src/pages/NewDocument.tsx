import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  PlusIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { documentsApi, clientsApi, productsApi } from '../services/api';
import { Client, Product } from '../types';

interface DocumentForm {
  tipo: 'boleta' | 'factura';
  clientId?: number;
  fechaEmision: string;
  items: {
    productId?: number;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    unidadMedida: string;
  }[];
  observaciones: string;
}

export default function NewDocument() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchClient, setSearchClient] = useState('');
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdDocument, setCreatedDocument] = useState<any>(null);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<DocumentForm>({
    defaultValues: {
      tipo: 'boleta',
      fechaEmision: new Date().toISOString().split('T')[0],
      items: [{ descripcion: '', cantidad: 1, precioUnitario: 0, unidadMedida: 'NIU' }],
      observaciones: ''
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = watch('items');
  const watchTipo = watch('tipo');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (watchTipo === 'boleta') {
      setSelectedClient(null);
      setValue('clientId', undefined);
    }
  }, [watchTipo, setValue]);

  const loadData = async () => {
    try {
      const [clientsRes, productsRes] = await Promise.all([
        clientsApi.getAll(),
        productsApi.getAll(true)
      ]);
      setClients(clientsRes.data.clients);
      setProducts(productsRes.data.products);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const filteredClients = clients.filter(client => {
    if (!searchClient) return true;
    const search = searchClient.toLowerCase();
    return (
      client.nombre.toLowerCase().includes(search) ||
      client.numero_documento.includes(search)
    );
  });

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setValue('clientId', client.id);
    setShowClientSearch(false);
    setSearchClient('');
  };

  const selectProduct = (index: number, product: Product) => {
    setValue(`items.${index}.productId`, product.id);
    setValue(`items.${index}.descripcion`, product.descripcion);
    setValue(`items.${index}.precioUnitario`, product.precio);
    setValue(`items.${index}.unidadMedida`, product.unidad_medida);
  };

  const calculateSubtotal = () => {
    return watchItems.reduce((sum, item) => {
      return sum + (item.cantidad * item.precioUnitario);
    }, 0);
  };

  const calculateIGV = () => calculateSubtotal() * 0.18;
  const calculateTotal = () => calculateSubtotal() + calculateIGV();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const onSubmit = async (data: DocumentForm) => {
    // Validate factura requires RUC client
    if (data.tipo === 'factura') {
      if (!selectedClient) {
        toast.error('Factura requiere un cliente');
        return;
      }
      if (selectedClient.tipo_documento !== 'RUC') {
        toast.error('Factura requiere un cliente con RUC');
        return;
      }
    }

    // Validate items
    const validItems = data.items.filter(item => item.descripcion && item.cantidad > 0);
    if (validItems.length === 0) {
      toast.error('Agrega al menos un item');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await documentsApi.create({
        tipo: data.tipo,
        clientId: data.clientId,
        fechaEmision: data.fechaEmision,
        items: validItems,
        observaciones: data.observaciones
      });

      setCreatedDocument(response.data.document);
      setShowSuccess(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear documento');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess && createdDocument) {
    return (
      <div className="max-w-lg mx-auto py-12 animate-fadeIn">
        <div className="card text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Comprobante Emitido!
          </h2>
          <p className="text-gray-600 mb-6">
            {createdDocument.tipo === 'boleta' ? 'Boleta' : 'Factura'}{' '}
            <span className="font-semibold">
              {createdDocument.serie}-{String(createdDocument.numero).padStart(8, '0')}
            </span>
            {' '}creada exitosamente
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Subtotal:</span>
              <span>{formatCurrency(createdDocument.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">IGV (18%):</span>
              <span>{formatCurrency(createdDocument.igv)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{formatCurrency(createdDocument.total)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowSuccess(false);
                setCreatedDocument(null);
                setValue('items', [{ descripcion: '', cantidad: 1, precioUnitario: 0, unidadMedida: 'NIU' }]);
                setSelectedClient(null);
              }}
              className="flex-1 btn-primary"
            >
              Crear Otro
            </button>
            <button
              onClick={() => navigate('/app/documents')}
              className="flex-1 btn-secondary"
            >
              Ver Comprobantes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Comprobante</h1>
        <p className="text-gray-500">Emite una boleta o factura electrónica</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Document Type */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Tipo de Comprobante</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className={`relative flex items-center justify-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
              watchTipo === 'boleta' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                value="boleta"
                className="sr-only"
                {...register('tipo')}
              />
              <DocumentTextIcon className={`w-8 h-8 ${watchTipo === 'boleta' ? 'text-green-600' : 'text-gray-400'}`} />
              <div>
                <p className={`font-semibold ${watchTipo === 'boleta' ? 'text-green-700' : 'text-gray-700'}`}>
                  Boleta
                </p>
                <p className="text-xs text-gray-500">Para clientes con DNI</p>
              </div>
              {watchTipo === 'boleta' && (
                <CheckCircleIcon className="absolute top-2 right-2 w-5 h-5 text-green-600" />
              )}
            </label>

            <label className={`relative flex items-center justify-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
              watchTipo === 'factura' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                value="factura"
                className="sr-only"
                {...register('tipo')}
              />
              <DocumentTextIcon className={`w-8 h-8 ${watchTipo === 'factura' ? 'text-blue-600' : 'text-gray-400'}`} />
              <div>
                <p className={`font-semibold ${watchTipo === 'factura' ? 'text-blue-700' : 'text-gray-700'}`}>
                  Factura
                </p>
                <p className="text-xs text-gray-500">Para clientes con RUC</p>
              </div>
              {watchTipo === 'factura' && (
                <CheckCircleIcon className="absolute top-2 right-2 w-5 h-5 text-blue-600" />
              )}
            </label>
          </div>
        </div>

        {/* Client (for facturas or optional for boletas) */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">
            Cliente {watchTipo === 'factura' && <span className="text-red-500">*</span>}
          </h3>
          
          {selectedClient ? (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{selectedClient.nombre}</p>
                <p className="text-sm text-gray-500">
                  {selectedClient.tipo_documento}: {selectedClient.numero_documento}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedClient(null);
                  setValue('clientId', undefined);
                }}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Buscar cliente ${watchTipo === 'factura' ? '(requerido RUC)' : '(opcional)'}...`}
                  className="input pl-10"
                  value={searchClient}
                  onChange={(e) => setSearchClient(e.target.value)}
                  onFocus={() => setShowClientSearch(true)}
                />
              </div>
              
              {showClientSearch && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredClients.length > 0 ? (
                    filteredClients.slice(0, 10).map(client => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => selectClient(client)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                      >
                        <p className="font-medium">{client.nombre}</p>
                        <p className="text-sm text-gray-500">
                          {client.tipo_documento}: {client.numero_documento}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No hay clientes. <a href="/app/clients" className="text-primary-600">Crear uno</a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Date */}
        <div className="card">
          <label className="label">Fecha de Emisión</label>
          <input
            type="date"
            className="input max-w-xs"
            {...register('fechaEmision', { required: true })}
          />
        </div>

        {/* Items */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Detalle del Comprobante</h3>
          
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-12 sm:col-span-5">
                    <label className="label text-xs">Descripción</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar producto o escribir..."
                        className={`input ${errors.items?.[index]?.descripcion ? 'input-error' : ''}`}
                        list={`products-${index}`}
                        {...register(`items.${index}.descripcion`, { required: true })}
                      />
                      <datalist id={`products-${index}`}>
                        {products.map(product => (
                          <option 
                            key={product.id} 
                            value={product.descripcion}
                            onClick={() => selectProduct(index, product)}
                          >
                            S/{product.precio.toFixed(2)}
                          </option>
                        ))}
                      </datalist>
                    </div>
                  </div>
                  
                  <div className="col-span-4 sm:col-span-2">
                    <label className="label text-xs">Cantidad</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="input"
                      {...register(`items.${index}.cantidad`, { 
                        required: true, 
                        valueAsNumber: true,
                        min: 0.01 
                      })}
                    />
                  </div>
                  
                  <div className="col-span-4 sm:col-span-2">
                    <label className="label text-xs">P. Unitario</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input"
                      {...register(`items.${index}.precioUnitario`, { 
                        required: true, 
                        valueAsNumber: true,
                        min: 0 
                      })}
                    />
                  </div>
                  
                  <div className="col-span-3 sm:col-span-2">
                    <label className="label text-xs">Total</label>
                    <div className="input bg-gray-100 font-medium">
                      {formatCurrency((watchItems[index]?.cantidad || 0) * (watchItems[index]?.precioUnitario || 0))}
                    </div>
                  </div>

                  <div className="col-span-1 flex items-end">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => append({ descripcion: '', cantidad: 1, precioUnitario: 0, unidadMedida: 'NIU' })}
            className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Agregar Item
          </button>
        </div>

        {/* Totals */}
        <div className="card">
          <div className="max-w-xs ml-auto space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal:</span>
              <span>{formatCurrency(calculateSubtotal())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">IGV (18%):</span>
              <span>{formatCurrency(calculateIGV())}</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200">
              <span>Total:</span>
              <span>{formatCurrency(calculateTotal())}</span>
            </div>
          </div>
        </div>

        {/* Observations */}
        <div className="card">
          <label className="label">Observaciones (opcional)</label>
          <textarea
            rows={3}
            className="input"
            placeholder="Notas adicionales..."
            {...register('observaciones')}
          />
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary flex-1"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Emitiendo...
              </span>
            ) : (
              `Emitir ${watchTipo === 'boleta' ? 'Boleta' : 'Factura'}`
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
