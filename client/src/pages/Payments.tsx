import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  KeyIcon,
  CheckCircleIcon,
  SparklesIcon,
  PhoneIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

interface PlanStatus {
  plan: string;
  plan_nombre: string;
  estado: string;
  expira: string | null;
  dias_restantes: number | null;
  features: string[];
  plan_expirado?: boolean;
  mensaje_urgente?: string | null;
}

const planes = [
  {
    id: 'basico',
    name: 'Plan Básico',
    price: 29,
    color: 'green',
    features: [
      '50 comprobantes/mes',
      'Boletas y facturas',
      'Control de ingresos/gastos',
      'Reportes básicos',
      'PDF descargable',
      'Soporte prioritario'
    ]
  },
  {
    id: 'negocio',
    name: 'Plan Negocio',
    price: 59,
    color: 'purple',
    popular: true,
    features: [
      'Comprobantes ilimitados',
      'Todo del plan Básico',
      '🤖 Contador AI incluido',
      'Análisis predictivo',
      'Alertas fiscales',
      'Múltiples series',
      'Soporte telefónico'
    ]
  }
];

export default function Payments() {
  const [planStatus, setPlanStatus] = useState<PlanStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [licenseCode, setLicenseCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activatedPlan, setActivatedPlan] = useState<any>(null);

  useEffect(() => {
    loadPlanStatus();
  }, []);

  const loadPlanStatus = async () => {
    try {
      const response = await api.get('/licenses/status');
      setPlanStatus(response.data);
    } catch (error) {
      console.error('Error loading plan status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateLicense = async () => {
    if (!licenseCode.trim()) {
      toast.error('Ingresa tu código de licencia');
      return;
    }

    setIsActivating(true);
    try {
      const response = await api.post('/licenses/activate', { codigo: licenseCode });
      setActivatedPlan(response.data.plan);
      setShowSuccess(true);
      setLicenseCode('');
      loadPlanStatus();
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al activar licencia');
    } finally {
      setIsActivating(false);
    }
  };

  const formatLicenseInput = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join('-').substring(0, 19);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (showSuccess && activatedPlan) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center animate-fadeIn">
        <div className="max-w-md w-full text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 bg-green-400/20 rounded-full animate-ping" />
            </div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-500/30">
              <CheckCircleIcon className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Plan Activado!
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            {activatedPlan.nombre}
          </p>

          <div className="bg-gray-50 rounded-2xl p-6 mb-8 shadow-inner">
            <p className="text-gray-500 text-sm mb-1">Válido por</p>
            <p className="text-4xl font-bold text-gray-900">
              {activatedPlan.duracion_dias} días
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Expira: {new Date(activatedPlan.expira).toLocaleDateString('es-PE')}
            </p>
          </div>

          <button
            onClick={() => setShowSuccess(false)}
            className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all"
          >
            ¡Empezar a Facturar!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Planes y Precios</h1>
        <p className="text-gray-500">Elige el plan perfecto para tu negocio</p>
      </div>

      {/* Alerta de plan expirado o por vencer */}
      {planStatus?.mensaje_urgente && (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-4 text-white text-center animate-pulse">
          <p className="font-bold">{planStatus.mensaje_urgente}</p>
        </div>
      )}

      {/* Plan expirado */}
      {planStatus?.plan === 'gratis' && (
        <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-200 text-sm">⚠️ Sin plan activo</p>
              <h3 className="text-2xl font-bold">Plan Gratis</h3>
              <p className="text-red-200 mt-2">No puedes crear comprobantes. Activa una licencia para continuar.</p>
            </div>
          </div>
        </div>
      )}

      {/* Plan trial activo */}
      {planStatus?.plan === 'trial' && (
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm">🎁 Prueba Gratis</p>
              <h3 className="text-2xl font-bold">{planStatus.plan_nombre}</h3>
              {planStatus.dias_restantes !== null && (
                <div className="flex items-center gap-2 mt-2">
                  <ClockIcon className="w-4 h-4" />
                  <span className={planStatus.dias_restantes <= 3 ? 'text-yellow-300 font-bold' : ''}>
                    {planStatus.dias_restantes} días restantes
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <SparklesIcon className="w-12 h-12 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Plan pagado activo */}
      {planStatus && ['basico', 'negocio'].includes(planStatus.plan) && (
        <div className={`rounded-2xl p-6 text-white ${
          planStatus.plan === 'negocio' 
            ? 'bg-gradient-to-br from-purple-600 to-purple-800' 
            : 'bg-gradient-to-br from-green-600 to-green-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Tu plan actual</p>
              <h3 className="text-2xl font-bold">{planStatus.plan_nombre}</h3>
              {planStatus.dias_restantes !== null && (
                <div className="flex items-center gap-2 mt-2">
                  <ClockIcon className="w-4 h-4" />
                  <span className={planStatus.dias_restantes <= 7 ? 'text-yellow-300' : ''}>
                    {planStatus.dias_restantes} días restantes
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <SparklesIcon className="w-12 h-12 opacity-50" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-8 border-2 border-primary-200">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyIcon className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">¿Tienes un código de licencia?</h2>
          <p className="text-gray-600 mt-1">Ingresa tu código para activar tu plan al instante</p>
        </div>

        <div className="max-w-sm mx-auto">
          <input
            type="text"
            value={licenseCode}
            onChange={(e) => setLicenseCode(formatLicenseInput(e.target.value))}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            className="w-full px-6 py-4 text-center text-xl font-mono tracking-widest bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
            maxLength={19}
          />
          <button
            onClick={handleActivateLicense}
            disabled={isActivating || licenseCode.length < 19}
            className={`mt-4 w-full py-4 rounded-xl font-semibold transition-all ${
              licenseCode.length >= 19
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isActivating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Activando...
              </span>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5 inline mr-2" />
                Activar Licencia
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {planes.map((plan) => (
          <div 
            key={plan.id}
            className={`relative bg-white rounded-2xl border-2 p-6 transition-all hover:shadow-lg ${
              plan.popular 
                ? 'border-purple-400 shadow-purple-100' 
                : 'border-gray-200'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <StarIcon className="w-3 h-3" />
                  MÁS POPULAR
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-900">S/{plan.price}</span>
                <span className="text-gray-500">/mes</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircleIcon className={`w-5 h-5 flex-shrink-0 ${
                    plan.popular ? 'text-purple-500' : 'text-green-500'
                  }`} />
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>

            {planStatus?.plan === plan.id ? (
              <div className={`py-3 text-center rounded-xl font-semibold ${
                plan.popular 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                ✓ Plan Actual
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500">
                Contacta para obtener tu licencia
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-2xl p-8 text-white text-center">
        <PhoneIcon className="w-12 h-12 mx-auto mb-4 text-primary-400" />
        <h3 className="text-2xl font-bold mb-2">¿Listo para comenzar?</h3>
        <p className="text-gray-400 mb-6">
          Contáctanos y te enviamos tu código de licencia al instante
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://wa.me/51944507095?text=Hola!%20Quiero%20adquirir%20una%20licencia%20de%20FacturaFácil"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-600 rounded-xl font-semibold transition-colors"
          >
            <span className="text-xl">📱</span>
            WhatsApp: 944 507 095
          </a>
        </div>

        <p className="text-gray-500 text-sm mt-6">
          Aceptamos Yape, Plin, y transferencias bancarias
        </p>
      </div>
    </div>
  );
}
