import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { clientsApi } from '../services/api';
import { Client } from '../types';

interface ClientForm {
  tipoDocumento: 'DNI' | 'RUC' | 'CE' | 'PASAPORTE';
  numeroDocumento: string;
  nombre: string;
  direccion: string;
  email: string;
  telefono: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ClientForm>({
    defaultValues: {
      tipoDocumento: 'DNI'
    }
  });

  const tipoDocumento = watch('tipoDocumento');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await clientsApi.getAll();
      setClients(response.data.clients);
    } catch (error) {
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      reset({
        tipoDocumento: client.tipo_documento,
        numeroDocumento: client.numero_documento,
        nombre: client.nombre,
        direccion: client.direccion || '',
        email: client.email || '',
        telefono: client.telefono || ''
      });
    } else {
      setEditingClient(null);
      reset({
        tipoDocumento: 'DNI',
        numeroDocumento: '',
        nombre: '',
        direccion: '',
        email: '',
        telefono: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClient(null);
    reset();
  };

  const onSubmit = async (data: ClientForm) => {
    setIsSubmitting(true);
    try {
      if (editingClient) {
        await clientsApi.update(editingClient.id, data);
        toast.success('Cliente actualizado');
      } else {
        await clientsApi.create(data);
        toast.success('Cliente creado');
      }
      closeModal();
      loadClients();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (client: Client) => {
    if (!confirm(`¿Eliminar cliente ${client.nombre}?`)) return;

    try {
      await clientsApi.delete(client.id);
      toast.success('Cliente eliminado');
      loadClients();
    } catch (error) {
      toast.error('Error al eliminar cliente');
    }
  };

  const filteredClients = clients.filter(client => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      client.nombre.toLowerCase().includes(search) ||
      client.numero_documento.includes(search) ||
      client.email?.toLowerCase().includes(search)
    );
  });

  const getDocumentMaxLength = () => {
    switch (tipoDocumento) {
      case 'DNI': return 8;
      case 'RUC': return 11;
      case 'CE': return 12;
      case 'PASAPORTE': return 20;
      default: return 20;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500">{clients.length} clientes registrados</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2 justify-center">
          <PlusIcon className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, documento o email..."
          className="input pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Clients List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredClients.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <div key={client.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    client.tipo_documento === 'RUC' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    <span className={`font-bold ${
                      client.tipo_documento === 'RUC' ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {client.nombre.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{client.nombre}</h3>
                    <p className="text-sm text-gray-500">
                      {client.tipo_documento}: {client.numero_documento}
                    </p>
                  </div>
                </div>
                <span className={`badge ${
                  client.tipo_documento === 'RUC' ? 'badge-info' : 'badge-success'
                }`}>
                  {client.tipo_documento}
                </span>
              </div>

              {(client.email || client.telefono || client.direccion) && (
                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  {client.email && <p>📧 {client.email}</p>}
                  {client.telefono && <p>📱 {client.telefono}</p>}
                  {client.direccion && <p className="line-clamp-1">📍 {client.direccion}</p>}
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openModal(client)}
                  className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-1"
                >
                  <PencilIcon className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(client)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay clientes</h3>
          <p className="text-gray-500 mb-4">Agrega tu primer cliente para empezar a facturar</p>
          <button onClick={() => openModal()} className="btn-primary inline-flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Crear Cliente
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold">
                {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Tipo Documento</label>
                  <select className="input" {...register('tipoDocumento')}>
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                    <option value="CE">CE</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="label">Número *</label>
                  <input
                    type="text"
                    maxLength={getDocumentMaxLength()}
                    className={`input ${errors.numeroDocumento ? 'input-error' : ''}`}
                    {...register('numeroDocumento', { 
                      required: 'Requerido',
                      minLength: { value: tipoDocumento === 'DNI' ? 8 : tipoDocumento === 'RUC' ? 11 : 1, message: 'Longitud inválida' }
                    })}
                  />
                  {errors.numeroDocumento && (
                    <p className="text-xs text-red-500 mt-1">{errors.numeroDocumento.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="label">
                  {tipoDocumento === 'RUC' ? 'Razón Social' : 'Nombre Completo'} *
                </label>
                <input
                  type="text"
                  className={`input ${errors.nombre ? 'input-error' : ''}`}
                  {...register('nombre', { required: 'Requerido' })}
                />
                {errors.nombre && (
                  <p className="text-xs text-red-500 mt-1">{errors.nombre.message}</p>
                )}
              </div>

              <div>
                <label className="label">Dirección</label>
                <input
                  type="text"
                  className="input"
                  {...register('direccion')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    {...register('email')}
                  />
                </div>
                <div>
                  <label className="label">Teléfono</label>
                  <input
                    type="tel"
                    className="input"
                    {...register('telefono')}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                  {isSubmitting ? 'Guardando...' : (editingClient ? 'Actualizar' : 'Crear')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
