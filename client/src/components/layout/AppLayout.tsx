import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  UsersIcon, 
  CubeIcon,
  Cog6ToothIcon,
  PlusCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: HomeIcon },
  { name: 'Comprobantes', href: '/app/documents', icon: DocumentTextIcon },
  { name: 'Clientes', href: '/app/clients', icon: UsersIcon },
  { name: 'Productos', href: '/app/products', icon: CubeIcon },
  { name: 'Configuración', href: '/app/settings', icon: Cog6ToothIcon },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">FacturaFácil</h1>
                <p className="text-xs text-gray-500">.pe</p>
              </div>
            </div>
            <button 
              className="lg:hidden p-1"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* New Document Button */}
          <div className="p-4">
            <NavLink
              to="/app/documents/new"
              className="btn-primary w-full flex items-center justify-center gap-2"
              onClick={() => setSidebarOpen(false)}
            >
              <PlusCircleIcon className="w-5 h-5" />
              Nuevo Comprobante
            </NavLink>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `
                  sidebar-link
                  ${isActive ? 'sidebar-link-active' : ''}
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-medium text-sm">
                  {user?.business?.razonSocial?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.business?.nombreComercial || user?.business?.razonSocial || 'Mi Negocio'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  RUC: {user?.business?.ruc || '---'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors text-sm"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button 
              className="lg:hidden p-2 -ml-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="w-6 h-6 text-gray-600" />
            </button>
            
            <div className="flex items-center gap-4 ml-auto">
              <div className="text-right">
                <span className={`badge ${
                  user?.business?.plan === 'negocio' ? 'badge-success' :
                  user?.business?.plan === 'basico' ? 'badge-info' : 'badge-warning'
                }`}>
                  Plan {user?.business?.plan || 'trial'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
