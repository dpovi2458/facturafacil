import { Link } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  ShieldCheckIcon,
  ChartBarIcon,
  ArrowRightIcon,
  StarIcon,
  SparklesIcon,
  BanknotesIcon,
  BellAlertIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: DocumentTextIcon,
    title: 'Boletas y Facturas Electrónicas',
    description: 'Emite comprobantes válidos ante SUNAT en segundos. Sin complicaciones técnicas.',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    icon: SparklesIcon,
    title: 'Contador AI Integrado',
    description: 'Inteligencia artificial que analiza tus finanzas y te da recomendaciones personalizadas.',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: BanknotesIcon,
    title: 'Control de Ingresos y Gastos',
    description: 'Registra todos tus movimientos y visualiza tu balance en tiempo real.',
    gradient: 'from-green-500 to-emerald-600'
  },
  {
    icon: ShieldCheckIcon,
    title: '100% Compatible con SUNAT',
    description: 'Cumple con todas las normativas vigentes. Evita multas y problemas legales.',
    gradient: 'from-red-500 to-orange-500'
  },
  {
    icon: ChartBarIcon,
    title: 'Reportes Inteligentes',
    description: 'Visualiza tendencias, proyecciones y alertas fiscales automáticas.',
    gradient: 'from-cyan-500 to-blue-500'
  },
  {
    icon: BellAlertIcon,
    title: 'Alertas SUNAT',
    description: 'Recordatorios automáticos de declaraciones y pagos de impuestos.',
    gradient: 'from-yellow-500 to-orange-500'
  }
];

const plans = [
  {
    name: 'Prueba Gratis',
    price: '0',
    period: '7 días',
    features: [
      '10 comprobantes',
      'Boletas y facturas',
      'Control básico de gastos',
      'Soporte por email'
    ],
    cta: 'Empezar Gratis',
    popular: false
  },
  {
    name: 'Básico',
    price: '29',
    period: '/mes',
    features: [
      '50 comprobantes/mes',
      'Boletas y facturas',
      'Control de ingresos/gastos',
      'Reportes básicos',
      'PDF descargable',
      'Soporte prioritario'
    ],
    cta: 'Elegir Básico',
    popular: true
  },
  {
    name: 'Negocio',
    price: '59',
    period: '/mes',
    features: [
      'Comprobantes ilimitados',
      'Todo del plan Básico',
      '🤖 Contador AI incluido',
      'Análisis predictivo',
      'Alertas fiscales',
      'Múltiples series',
      'Soporte telefónico'
    ],
    cta: 'Elegir Negocio',
    popular: false
  }
];

const testimonials = [
  {
    name: 'María García',
    business: 'Restaurante El Sabor',
    text: 'El Contador AI me ayudó a identificar gastos innecesarios. ¡Ahorro S/500 mensuales!',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
  },
  {
    name: 'Carlos Rodríguez',
    business: 'Taller Mecánico CR',
    text: 'Ahora tengo control total de mis finanzas. Las alertas de SUNAT me salvaron de multas.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
  },
  {
    name: 'Ana Quispe',
    business: 'Bodega Doña Ana',
    text: 'Por fin puedo ver cuánto gano realmente. La interfaz es muy fácil de usar.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop'
  }
];

const stats = [
  { value: '5,000+', label: 'Negocios activos' },
  { value: '2M+', label: 'Comprobantes emitidos' },
  { value: '99.9%', label: 'Uptime garantizado' },
  { value: '4.9/5', label: 'Calificación usuarios' }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
                <DocumentTextIcon className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl">FacturaFácil<span className="text-primary-600">.pe</span></span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Características</a>
              <a href="#ai" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1">
                <SparklesIcon className="w-4 h-4 text-purple-500" />
                Contador AI
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Precios</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Testimonios</a>
            </nav>
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="btn-primary shadow-lg shadow-primary-500/25">
                Crear Cuenta Gratis
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-purple-800"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
          <div className="text-center max-w-4xl mx-auto text-white">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
              <SparklesIcon className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-medium">Nuevo: Contador AI con Inteligencia Artificial</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
              Tu Negocio Merece
              <br />
              <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Finanzas Inteligentes
              </span>
            </h1>
            
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto leading-relaxed">
              Facturación electrónica + Control de gastos + Contador AI.
              Todo lo que necesitas para hacer crecer tu MYPE, en una sola plataforma.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link 
                to="/register" 
                className="group bg-white text-primary-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-50 transition-all duration-300 flex items-center gap-2 w-full sm:w-auto justify-center shadow-2xl hover:shadow-white/25 hover:scale-105"
              >
                Empezar Gratis - 7 Días
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="#demo"
                className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all duration-300 border border-white/20 w-full sm:w-auto"
              >
                Ver Demo
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-white/20">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-primary-200 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas para tu negocio
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Una plataforma completa que combina facturación, contabilidad e inteligencia artificial.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div 
                key={feature.title}
                className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-transparent hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section id="ai" className="py-20 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMyIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
                <SparklesIcon className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-medium">Powered by AI</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Tu Contador Personal
                <br />
                <span className="text-purple-300">con Inteligencia Artificial</span>
              </h2>
              <p className="text-lg text-purple-200 mb-8 leading-relaxed">
                Nuestro Contador AI analiza tus finanzas en tiempo real y te proporciona 
                insights valiosos, alertas fiscales y recomendaciones personalizadas 
                para optimizar tu negocio.
              </p>
              
              <div className="space-y-4">
                {[
                  '📊 Análisis automático de tendencias de ventas',
                  '🎯 Recomendaciones personalizadas de ahorro',
                  '⚠️ Alertas de obligaciones tributarias SUNAT',
                  '📈 Proyecciones de flujo de caja',
                  '💡 Tips para optimizar gastos'
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-purple-100">
                    <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              
              <Link 
                to="/register"
                className="mt-8 inline-flex items-center gap-2 bg-white text-purple-700 px-6 py-3 rounded-xl font-bold hover:bg-purple-50 transition-colors"
              >
                Probar Contador AI
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
            </div>
            
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-white">Contador AI</div>
                    <div className="text-sm text-purple-300">Análisis en tiempo real</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-sm text-purple-300 mb-1">💡 Insight del día</div>
                    <div className="text-white">Tus ventas de los jueves son 35% mayores. Considera promociones los días más flojos.</div>
                  </div>
                  
                  <div className="bg-yellow-500/20 rounded-xl p-4 border border-yellow-500/30">
                    <div className="text-sm text-yellow-400 mb-1">⚠️ Alerta SUNAT</div>
                    <div className="text-white">Recuerda: Declaración mensual de IGV vence el 15 de febrero.</div>
                  </div>
                  
                  <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
                    <div className="text-sm text-green-400 mb-1">📈 Proyección</div>
                    <div className="text-white">Basado en tu tendencia, podrías facturar S/15,000 este mes (+12%).</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
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
              <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Regístrate</h3>
              <p className="text-gray-600">Crea tu cuenta con tu RUC en menos de 2 minutos.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Configura</h3>
              <p className="text-gray-600">Agrega tus productos y clientes frecuentes.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">¡Factura!</h3>
              <p className="text-gray-600">Emite boletas y facturas electrónicas al instante.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Planes que crecen contigo
            </h2>
            <p className="text-xl text-gray-600">
              Sin contratos largos. Cancela cuando quieras.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div 
                key={plan.name}
                className={`relative rounded-2xl p-8 transition-all duration-300 ${
                  plan.popular 
                    ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-2xl shadow-primary-500/25 scale-105' 
                    : 'bg-white border border-gray-200 hover:border-primary-200 hover:shadow-lg'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-bold">
                      ⭐ Más Popular
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className={`text-xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-4xl font-extrabold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                      S/{plan.price}
                    </span>
                    <span className={plan.popular ? 'text-primary-200' : 'text-gray-500'}>
                      {plan.period}
                    </span>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircleIcon className={`w-5 h-5 flex-shrink-0 ${
                        plan.popular ? 'text-primary-200' : 'text-green-500'
                      }`} />
                      <span className={plan.popular ? 'text-primary-100' : 'text-gray-600'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Link 
                  to="/register"
                  className={`block w-full py-3 rounded-xl font-bold text-center transition-all duration-300 ${
                    plan.popular 
                      ? 'bg-white text-primary-700 hover:bg-primary-50' 
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          
          <p className="text-center mt-8 text-gray-500">
            ¿Tienes dudas? <a href="mailto:gorgojomagneto@gmail.com" className="text-primary-600 hover:underline">Contáctanos</a>
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Lo que dicen nuestros clientes
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div 
                key={testimonial.name}
                className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow border border-gray-100"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.business}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-purple-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            ¿Listo para transformar tu negocio?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Únete a miles de emprendedores que ya usan FacturaFácil
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
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl text-white">FacturaFácil<span className="text-primary-500">.pe</span></span>
              </div>
              <p className="text-sm">
                Facturación electrónica simple y accesible para MYPES peruanas.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Características</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Precios</a></li>
                <li><a href="#ai" className="hover:text-white transition-colors">Contador AI</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:gorgojomagneto@gmail.com" className="hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Centro de Ayuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tutoriales</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Términos de Servicio</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidad</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm">© 2026 FacturaFácil.pe - Todos los derechos reservados</p>
            <div className="flex items-center gap-2">
              <LockClosedIcon className="w-4 h-4" />
              <span className="text-sm">Datos protegidos con encriptación SSL</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
