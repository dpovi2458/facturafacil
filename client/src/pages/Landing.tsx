import { Link } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  ArrowRightIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: DocumentTextIcon,
    title: 'Boletas y Facturas Electrónicas',
    description: 'Emite comprobantes válidos ante SUNAT en segundos. Sin complicaciones técnicas.'
  },
  {
    icon: ShieldCheckIcon,
    title: '100% Compatible con SUNAT',
    description: 'Cumple con todas las normativas vigentes. Evita multas y problemas legales.'
  },
  {
    icon: DevicePhoneMobileIcon,
    title: 'Fácil de Usar',
    description: 'Interfaz simple e intuitiva. No necesitas ser experto en tecnología.'
  },
  {
    icon: ChartBarIcon,
    title: 'Reportes y Estadísticas',
    description: 'Visualiza tus ventas, clientes frecuentes y productos más vendidos.'
  },
  {
    icon: CurrencyDollarIcon,
    title: 'Ahorra Dinero',
    description: 'Desde S/29/mes. Mucho más económico que pagar a un contador.'
  },
  {
    icon: CheckCircleIcon,
    title: 'Soporte Incluido',
    description: 'Te ayudamos a configurar tu cuenta y resolver cualquier duda.'
  }
];

const plans = [
  {
    name: 'Prueba Gratis',
    price: '0',
    period: '7 días',
    features: ['10 comprobantes', 'Boletas y facturas', 'Soporte por email'],
    cta: 'Empezar Gratis',
    popular: false
  },
  {
    name: 'Básico',
    price: '29',
    period: '/mes',
    features: ['50 comprobantes/mes', 'Boletas y facturas', 'PDF descargable', 'Gestión de clientes', 'Soporte prioritario'],
    cta: 'Elegir Básico',
    popular: true
  },
  {
    name: 'Negocio',
    price: '59',
    period: '/mes',
    features: ['Comprobantes ilimitados', 'Todo del plan Básico', 'Múltiples series', 'Reportes avanzados', 'Soporte telefónico'],
    cta: 'Elegir Negocio',
    popular: false
  }
];

const testimonials = [
  {
    name: 'María García',
    business: 'Restaurante El Sabor',
    text: 'Antes pagaba S/150 mensuales a mi contador solo por las facturas. Ahora lo hago yo misma en minutos.',
    rating: 5
  },
  {
    name: 'Carlos Rodríguez',
    business: 'Taller Mecánico CR',
    text: 'La interfaz es muy fácil. Mis empleados aprendieron a usarla en 10 minutos.',
    rating: 5
  },
  {
    name: 'Ana Quispe',
    business: 'Bodega Doña Ana',
    text: 'Por fin puedo emitir boletas electrónicas sin depender de nadie. ¡Excelente servicio!',
    rating: 5
  }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl">FacturaFácil<span className="text-primary-600">.pe</span></span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Características</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">Precios</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900">Testimonios</a>
            </nav>
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="btn-primary">
                Crear Cuenta
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
              <ShieldCheckIcon className="w-5 h-5 text-green-400" />
              <span className="text-sm">Autorizado por SUNAT</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
              Facturación Electrónica
              <br />
              <span className="text-primary-200">Simple para tu Negocio</span>
            </h1>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Emite boletas y facturas electrónicas válidas ante SUNAT en segundos. 
              Sin complicaciones. Desde S/29/mes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/register" 
                className="bg-white text-primary-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-50 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                Empezar Gratis
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <a 
                href="#pricing"
                className="text-white border-2 border-white/30 px-8 py-4 rounded-xl font-medium hover:bg-white/10 transition-colors w-full sm:w-auto"
              >
                Ver Planes
              </a>
            </div>
            <p className="mt-6 text-primary-200 text-sm">
              ✓ 7 días gratis  ✓ Sin tarjeta de crédito  ✓ Cancela cuando quieras
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary-600">2M+</p>
              <p className="text-gray-600 mt-1">MYPES en Perú</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary-600">100%</p>
              <p className="text-gray-600 mt-1">Compatible SUNAT</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary-600">S/29</p>
              <p className="text-gray-600 mt-1">Plan desde</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-primary-600">5min</p>
              <p className="text-gray-600 mt-1">Para empezar</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas para facturar
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Una herramienta completa y fácil de usar para cumplir con SUNAT sin dolores de cabeza.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Cómo funciona?
            </h2>
            <p className="text-xl text-gray-600">
              3 simples pasos para empezar a facturar
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Regístrate</h3>
              <p className="text-gray-600">Crea tu cuenta con tu RUC en menos de 2 minutos.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Configura</h3>
              <p className="text-gray-600">Agrega tus productos y clientes frecuentes.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">¡Factura!</h3>
              <p className="text-gray-600">Emite boletas y facturas electrónicas al instante.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Planes simples y accesibles
            </h2>
            <p className="text-xl text-gray-600">
              Elige el plan que mejor se adapte a tu negocio
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`card relative ${plan.popular ? 'ring-2 ring-primary-600 shadow-lg' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Más Popular
                    </span>
                  </div>
                )}
                <div className="text-center pb-6 border-b border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900">S/{plan.price}</span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>
                </div>
                <ul className="py-6 space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link 
                  to="/register"
                  className={`w-full block text-center py-3 rounded-lg font-medium transition-colors ${
                    plan.popular 
                      ? 'bg-primary-600 text-white hover:bg-primary-700' 
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Lo que dicen nuestros clientes
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.business}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Listo para simplificar tu facturación?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Únete a miles de negocios que ya confían en FacturaFácil.pe
          </p>
          <Link 
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-50 transition-colors"
          >
            Crear Cuenta Gratis
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl text-white">FacturaFácil.pe</span>
              </div>
              <p className="mb-4">
                Sistema de facturación electrónica simple y accesible para MYPES peruanas.
              </p>
              <p className="text-sm">
                Autorizado por SUNAT para emisión de comprobantes electrónicos.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Producto</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition-colors">Características</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Precios</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Testimonios</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Soporte</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Centro de Ayuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Términos de Uso</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© 2024 FacturaFácil.pe. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
