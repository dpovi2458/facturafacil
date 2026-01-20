import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { DocumentTextIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  direccion: string;
  telefono: string;
}

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        ruc: data.ruc,
        razonSocial: data.razonSocial,
        nombreComercial: data.nombreComercial,
        direccion: data.direccion,
        telefono: data.telefono
      });
      toast.success('¡Cuenta creada exitosamente! Bienvenido a FacturaFácil');
      navigate('/app/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <Link to="/" className="flex items-center justify-center gap-2">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
            <DocumentTextIcon className="w-7 h-7 text-white" />
          </div>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Crear Cuenta
        </h2>
        <p className="mt-2 text-center text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-gray-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Datos de acceso */}
            <div className="pb-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Datos de Acceso</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="label">
                    Correo electrónico *
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`input ${errors.email ? 'input-error' : ''}`}
                    {...register('email', { 
                      required: 'El correo es requerido',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Correo inválido'
                      }
                    })}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="label">
                      Contraseña *
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                        {...register('password', { 
                          required: 'La contraseña es requerida',
                          minLength: { value: 6, message: 'Mínimo 6 caracteres' }
                        })}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="label">
                      Confirmar *
                    </label>
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                      {...register('confirmPassword', { 
                        required: 'Confirma tu contraseña',
                        validate: value => value === password || 'Las contraseñas no coinciden'
                      })}
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Datos del negocio */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Datos del Negocio</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="ruc" className="label">
                    RUC *
                  </label>
                  <input
                    id="ruc"
                    type="text"
                    maxLength={11}
                    placeholder="20123456789"
                    className={`input ${errors.ruc ? 'input-error' : ''}`}
                    {...register('ruc', { 
                      required: 'El RUC es requerido',
                      pattern: {
                        value: /^\d{11}$/,
                        message: 'El RUC debe tener 11 dígitos'
                      }
                    })}
                  />
                  {errors.ruc && (
                    <p className="mt-1 text-sm text-red-600">{errors.ruc.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="razonSocial" className="label">
                    Razón Social *
                  </label>
                  <input
                    id="razonSocial"
                    type="text"
                    placeholder="MI EMPRESA S.A.C."
                    className={`input ${errors.razonSocial ? 'input-error' : ''}`}
                    {...register('razonSocial', { required: 'La razón social es requerida' })}
                  />
                  {errors.razonSocial && (
                    <p className="mt-1 text-sm text-red-600">{errors.razonSocial.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="nombreComercial" className="label">
                    Nombre Comercial
                  </label>
                  <input
                    id="nombreComercial"
                    type="text"
                    placeholder="Mi Tienda (opcional)"
                    className="input"
                    {...register('nombreComercial')}
                  />
                </div>

                <div>
                  <label htmlFor="direccion" className="label">
                    Dirección Fiscal *
                  </label>
                  <input
                    id="direccion"
                    type="text"
                    placeholder="Av. Principal 123, Lima"
                    className={`input ${errors.direccion ? 'input-error' : ''}`}
                    {...register('direccion', { required: 'La dirección es requerida' })}
                  />
                  {errors.direccion && (
                    <p className="mt-1 text-sm text-red-600">{errors.direccion.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="telefono" className="label">
                    Teléfono
                  </label>
                  <input
                    id="telefono"
                    type="tel"
                    placeholder="999 999 999"
                    className="input"
                    {...register('telefono')}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creando cuenta...
                  </span>
                ) : (
                  'Crear Cuenta'
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Al registrarte, aceptas nuestros{' '}
              <a href="#" className="text-primary-600">Términos de Servicio</a> y{' '}
              <a href="#" className="text-primary-600">Política de Privacidad</a>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
