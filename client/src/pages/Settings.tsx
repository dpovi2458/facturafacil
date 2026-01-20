import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  BuildingOfficeIcon, 
  CreditCardIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { businessApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Series } from '../types';

interface BusinessForm {
  razonSocial: string;
  nombreComercial: string;
  direccion: string;
  departamento: string;
  provincia: string;
  distrito: string;
  telefono: string;
  email: string;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'business' | 'plan' | 'series'>('business');
  const [series, setSeries] = useState<Series[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, checkAuth } = useAuthStore();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BusinessForm>();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await businessApi.get();
      const { business, series: seriesData } = response.data;
      
      reset({
        razonSocial: business.razonSocial,
        nombreComercial: business.nombreComercial || '',
        direccion: business.direccion,
        departamento: business.departamento || '',
        provincia: business.provincia || '',
        distrito: business.distrito || '',
        telefono: business.telefono || '',
        email: business.email || ''
      });

      setSeries(seriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onSubmitBusiness = async (data: BusinessForm) => {
    setIsSubmitting(true);
    try {
      await businessApi.update(data);
      toast.success('Datos actualizados');
      checkAuth();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const plans = [
    {
      id: 'trial',
      name: 'Prueba Gratis',
      price: 0,
      limit: 10,
      features: ['10 comprobantes', 'Soporte por email']
    },
    {
      id: 'basico',
      name: 'Básico',
      price: 29,
      limit: 50,
      features: ['50 comprobantes/mes', 'PDF descargable', 'Gestión de clientes', 'Soporte prioritario']
    },
    {
      id: 'negocio',
      name: 'Negocio',
      price: 59,
      limit: Infinity,
      features: ['Comprobantes ilimitados', 'Todo del plan Básico', 'Múltiples series', 'Reportes avanzados', 'Soporte telefónico']
    }
  ];

  const currentPlan = plans.find(p => p.id === user?.business?.plan) || plans[0];

  const tabs = [
    { id: 'business' as const, name: 'Datos del Negocio', icon: BuildingOfficeIcon },
    { id: 'plan' as const, name: 'Mi Plan', icon: CreditCardIcon },
    { id: 'series' as const, name: 'Series', icon: DocumentTextIcon }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500">Administra tu cuenta y configuración</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Business Tab */}
      {activeTab === 'business' && (
        <div className="card max-w-2xl">
          <h2 className="text-lg font-semibold mb-6">Información del Negocio</h2>
          
          <form onSubmit={handleSubmit(onSubmitBusiness)} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">RUC:</span> {user?.business?.ruc}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                El RUC no se puede modificar
              </p>
            </div>

            <div>
              <label className="label">Razón Social *</label>
              <input
                type="text"
                className={`input ${errors.razonSocial ? 'input-error' : ''}`}
                {...register('razonSocial', { required: 'Requerido' })}
              />
            </div>

            <div>
              <label className="label">Nombre Comercial</label>
              <input
                type="text"
                className="input"
                {...register('nombreComercial')}
              />
            </div>

            <div>
              <label className="label">Dirección Fiscal *</label>
              <input
                type="text"
                className={`input ${errors.direccion ? 'input-error' : ''}`}
                {...register('direccion', { required: 'Requerido' })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Departamento</label>
                <input
                  type="text"
                  className="input"
                  {...register('departamento')}
                />
              </div>
              <div>
                <label className="label">Provincia</label>
                <input
                  type="text"
                  className="input"
                  {...register('provincia')}
                />
              </div>
              <div>
                <label className="label">Distrito</label>
                <input
                  type="text"
                  className="input"
                  {...register('distrito')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Teléfono</label>
                <input
                  type="tel"
                  className="input"
                  {...register('telefono')}
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  {...register('email')}
                />
              </div>
            </div>

            <div className="pt-4">
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plan Tab */}
      {activeTab === 'plan' && (
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tu plan actual</p>
                <p className="text-2xl font-bold text-gray-900">{currentPlan.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {user?.business?.documentsThisMonth || 0} / {currentPlan.limit === Infinity ? '∞' : currentPlan.limit} comprobantes este mes
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary-600">
                  S/{currentPlan.price}
                  <span className="text-sm font-normal text-gray-500">/mes</span>
                </p>
              </div>
            </div>
          </div>

          {/* Available Plans */}
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`card ${plan.id === user?.business?.plan ? 'ring-2 ring-primary-500' : ''}`}
              >
                {plan.id === user?.business?.plan && (
                  <div className="flex items-center gap-1 text-primary-600 text-sm mb-2">
                    <CheckCircleIcon className="w-4 h-4" />
                    Plan actual
                  </div>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-3xl font-bold mt-2">
                  S/{plan.price}
                  <span className="text-sm font-normal text-gray-500">/mes</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {plan.id !== user?.business?.plan && (
                  <button 
                    className={`w-full mt-6 ${plan.id === 'negocio' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => toast.success('Contacta a ventas para cambiar de plan')}
                  >
                    {plan.price > currentPlan.price ? 'Actualizar' : 'Cambiar'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Series Tab */}
      {activeTab === 'series' && (
        <div className="card max-w-2xl">
          <h2 className="text-lg font-semibold mb-6">Series de Comprobantes</h2>
          
          <div className="space-y-4">
            {series.map((s) => (
              <div 
                key={s.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    s.tipo === 'factura' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    <DocumentTextIcon className={`w-6 h-6 ${
                      s.tipo === 'factura' ? 'text-blue-600' : 'text-green-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold">{s.serie}</p>
                    <p className="text-sm text-gray-500 capitalize">{s.tipo}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Último número</p>
                  <p className="font-mono font-semibold">
                    {s.serie}-{String(s.ultimo_numero).padStart(8, '0')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              💡 <strong>Nota:</strong> Las series se crean automáticamente al registrar tu cuenta.
              Para agregar series adicionales, contacta a soporte.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
