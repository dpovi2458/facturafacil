import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  PlusIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  UserPlusIcon,
  XMarkIcon,
  SparklesIcon
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

interface QuickClientForm {
  tipoDocumento: 'DNI' | 'RUC';
  numeroDocumento: string;
  nombre: string;
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
  
  // Apple Philosophy: Quick inline client creation
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [quickClientForm, setQuickClientForm] = useState<QuickClientForm>({
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    nombre: ''
  });
  const [creatingClient, setCreatingClient] = useState(false);
  
  // Product search state
  const [activeProductIndex, setActiveProductIndex] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const productInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const clientSearchRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, control, watch, setValue } = useForm<DocumentForm>({
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
    // Auto-set client type based on document type
    if (watchTipo === 'factura') {
      setQuickClientForm(prev => ({ ...prev, tipoDocumento: 'RUC' }));
    }
  }, [watchTipo, setValue]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientSearchRef.current && !clientSearchRef.current.contains(event.target as Node)) {
        setShowClientSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const filteredProducts = products.filter(product => {
    if (!productSearch) return true;
    const search = productSearch.toLowerCase();
    return (
      product.descripcion.toLowerCase().includes(search) ||
      product.codigo?.toLowerCase().includes(search)
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
    setActiveProductIndex(null);
    setProductSearch('');
  };

  // Apple Philosophy: Quick client creation
  const handleQuickClientCreate = async () => {
    if (!quickClientForm.numeroDocumento || !quickClientForm.nombre) {
      toast.error('Completa documento y nombre');
      return;
    }

    // Validate document length
    const docLength = quickClientForm.tipoDocumento === 'DNI' ? 8 : 11;
    if (quickClientForm.numeroDocumento.length !== docLength) {
      toast.error(`${quickClientForm.tipoDocumento} debe tener ${docLength} dígitos`);
      return;
    }

    setCreatingClient(true);
    try {
      const response = await clientsApi.create({
        tipoDocumento: quickClientForm.tipoDocumento,
        numeroDocumento: quickClientForm.numeroDocumento,
        nombre: quickClientForm.nombre,
        direccion: '',
        email: '',
        telefono: ''
      });

      const newClient = response.data.client;
      setClients(prev => [...prev, newClient]);
      selectClient(newClient);
      setShowQuickClient(false);
      setQuickClientForm({ tipoDocumento: 'DNI', numeroDocumento: '', nombre: '' });
      toast.success('¡Cliente creado!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear cliente');
    } finally {
      setCreatingClient(false);
    }
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

  const resetForm = () => {
    setShowSuccess(false);
    setCreatedDocument(null);
    setValue('items', [{ descripcion: '', cantidad: 1, precioUnitario: 0, unidadMedida: 'NIU' }]);
    setSelectedClient(null);
  };

  // Success screen - Apple-style celebration
  if (showSuccess && createdDocument) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center animate-fadeIn">
        <div className="max-w-md w-full text-center">
          <div className="relative">
            {/* Celebration effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 bg-green-400/20 rounded-full animate-ping" />
            </div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-500/30">
              <CheckCircleIcon className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Listo!
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            {createdDocument.tipo === 'boleta' ? 'Boleta' : 'Factura'}{' '}
            <span className="font-mono font-bold text-gray-900">
              {createdDocument.serie}-{String(createdDocument.numero).padStart(8, '0')}
            </span>
          </p>

          {/* Simple total display */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8 shadow-inner">
            <p className="text-gray-500 text-sm mb-1">Total</p>
            <p className="text-4xl font-bold text-gray-900">
              {formatCurrency(createdDocument.total)}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              IGV incluido: {formatCurrency(createdDocument.igv)}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={resetForm}
              className="flex-1 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all active:scale-98"
            >
              <PlusIcon className="w-5 h-5 inline mr-2" />
              Crear Otro
            </button>
            <button
              onClick={() => navigate('/app/documents')}
              className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
            >
              Ver Todos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-8 animate-fadeIn">
      {/* Minimalist Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nueva Factura</h1>
        <p className="text-gray-500">Simple y rápido</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Document Type - Apple Style Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-gray-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setValue('tipo', 'boleta')}
              className={`px-8 py-3 rounded-lg font-medium transition-all ${
                watchTipo === 'boleta'
                  ? 'bg-white text-green-600 shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <DocumentTextIcon className="w-5 h-5 inline mr-2" />
              Boleta
            </button>
            <button
              type="button"
              onClick={() => setValue('tipo', 'factura')}
              className={`px-8 py-3 rounded-lg font-medium transition-all ${
                watchTipo === 'factura'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <DocumentTextIcon className="w-5 h-5 inline mr-2" />
              Factura
            </button>
          </div>
        </div>

        {/* Client Section - Simplified */}
        <div className="card relative" ref={clientSearchRef}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">
              {watchTipo === 'factura' ? 'Cliente (RUC requerido)' : 'Cliente (opcional)'}
            </h3>
            {!selectedClient && (
              <button
                type="button"
                onClick={() => setShowQuickClient(true)}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <UserPlusIcon className="w-4 h-4" />
                Nuevo
              </button>
            )}
          </div>
          
          {selectedClient ? (
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                  selectedClient.tipo_documento === 'RUC' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-green-100 text-green-600'
                }`}>
                  {selectedClient.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedClient.nombre}</p>
                  <p className="text-sm text-gray-500">
                    {selectedClient.tipo_documento}: {selectedClient.numero_documento}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedClient(null);
                  setValue('clientId', undefined);
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cliente por nombre o documento..."
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 text-lg"
                value={searchClient}
                onChange={(e) => setSearchClient(e.target.value)}
                onFocus={() => setShowClientSearch(true)}
              />
              
              {showClientSearch && filteredClients.length > 0 && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                  {filteredClients.slice(0, 8).map(client => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => selectClient(client)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-center gap-3 ${
                        watchTipo === 'factura' && client.tipo_documento !== 'RUC' 
                          ? 'opacity-50' 
                          : ''
                      }`}
                      disabled={watchTipo === 'factura' && client.tipo_documento !== 'RUC'}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        client.tipo_documento === 'RUC' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {client.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{client.nombre}</p>
                        <p className="text-sm text-gray-500">
                          {client.tipo_documento}: {client.numero_documento}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Client Creation Modal */}
        {showQuickClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-primary-500" />
                    Cliente Rápido
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowQuickClient(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickClientForm(prev => ({ ...prev, tipoDocumento: 'DNI' }))}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      quickClientForm.tipoDocumento === 'DNI'
                        ? 'bg-green-100 text-green-700 ring-2 ring-green-500'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    DNI
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickClientForm(prev => ({ ...prev, tipoDocumento: 'RUC' }))}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      quickClientForm.tipoDocumento === 'RUC'
                        ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    RUC
                  </button>
                </div>

                <input
                  type="text"
                  placeholder={`Número de ${quickClientForm.tipoDocumento}`}
                  className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 text-center text-xl font-mono tracking-wider"
                  maxLength={quickClientForm.tipoDocumento === 'DNI' ? 8 : 11}
                  value={quickClientForm.numeroDocumento}
                  onChange={(e) => setQuickClientForm(prev => ({ 
                    ...prev, 
                    numeroDocumento: e.target.value.replace(/\D/g, '') 
                  }))}
                  autoFocus
                />

                <input
                  type="text"
                  placeholder={quickClientForm.tipoDocumento === 'RUC' ? 'Razón Social' : 'Nombre Completo'}
                  className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500"
                  value={quickClientForm.nombre}
                  onChange={(e) => setQuickClientForm(prev => ({ ...prev, nombre: e.target.value }))}
                />

                <button
                  type="button"
                  onClick={handleQuickClientCreate}
                  disabled={creatingClient}
                  className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all disabled:opacity-50"
                >
                  {creatingClient ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creando...
                    </span>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5 inline mr-2" />
                      Crear y Seleccionar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Items Section - Simplified */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Productos o Servicios</h3>
          
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div 
                key={field.id} 
                className="group relative bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="grid grid-cols-12 gap-3 items-center">
                  {/* Description - Takes most space */}
                  <div className="col-span-12 sm:col-span-5 relative">
                    <input
                      type="text"
                      placeholder="Descripción del producto..."
                      className="w-full px-3 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      {...register(`items.${index}.descripcion`, { required: true })}
                      ref={(el) => { productInputRefs.current[index] = el; }}
                      onFocus={() => setActiveProductIndex(index)}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setValue(`items.${index}.descripcion`, e.target.value);
                      }}
                    />
                    
                    {/* Product suggestions dropdown */}
                    {activeProductIndex === index && productSearch && filteredProducts.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredProducts.slice(0, 5).map(product => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => selectProduct(index, product)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 flex justify-between items-center"
                          >
                            <span className="font-medium text-gray-900">{product.descripcion}</span>
                            <span className="text-primary-600 font-semibold">S/ {product.precio.toFixed(2)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Quantity */}
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="Cant."
                      className="w-full px-3 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 text-center"
                      {...register(`items.${index}.cantidad`, { 
                        required: true, 
                        valueAsNumber: true,
                        min: 1 
                      })}
                    />
                  </div>
                  
                  {/* Unit Price */}
                  <div className="col-span-4 sm:col-span-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">S/</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="w-full pl-8 pr-3 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                        {...register(`items.${index}.precioUnitario`, { 
                          required: true, 
                          valueAsNumber: true,
                          min: 0 
                        })}
                      />
                    </div>
                  </div>
                  
                  {/* Line Total */}
                  <div className="col-span-3 sm:col-span-2">
                    <div className="px-3 py-3 bg-white border border-gray-200 rounded-lg text-right font-semibold text-gray-900">
                      {formatCurrency((watchItems[index]?.cantidad || 0) * (watchItems[index]?.precioUnitario || 0))}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <div className="col-span-1 flex justify-center">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
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
            onClick={() => {
              append({ descripcion: '', cantidad: 1, precioUnitario: 0, unidadMedida: 'NIU' });
              // Focus the new input after React renders it
              setTimeout(() => {
                const lastIndex = fields.length;
                productInputRefs.current[lastIndex]?.focus();
              }, 100);
            }}
            className="mt-4 w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-all flex items-center justify-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Agregar Producto
          </button>
        </div>

        {/* Total - Apple Style */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-400">Subtotal</span>
            <span className="text-xl">{formatCurrency(calculateSubtotal())}</span>
          </div>
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
            <span className="text-gray-400">IGV (18%)</span>
            <span className="text-xl">{formatCurrency(calculateIGV())}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-semibold">Total</span>
            <span className="text-4xl font-bold">{formatCurrency(calculateTotal())}</span>
          </div>
        </div>

        {/* Submit Button - Apple Style */}
        <button
          type="submit"
          disabled={isSubmitting || calculateTotal() === 0}
          className={`w-full py-5 rounded-2xl text-xl font-semibold transition-all ${
            calculateTotal() > 0
              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 active:scale-[0.99]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Emitiendo...
            </span>
          ) : (
            <>
              Emitir {watchTipo === 'boleta' ? 'Boleta' : 'Factura'}
              <span className="ml-2 opacity-70">→</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
