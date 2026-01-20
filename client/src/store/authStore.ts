import { create } from 'zustand';
import { authApi } from '../services/api';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    ruc: string;
    razonSocial: string;
    nombreComercial?: string;
    direccion: string;
    telefono?: string;
  }) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  token: localStorage.getItem('token'),

  login: async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  register: async (data) => {
    const response = await authApi.register(data);
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const response = await authApi.getMe();
      set({ 
        user: response.data.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch {
      localStorage.removeItem('token');
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
    }
  },
}));

// Check auth on app load
useAuthStore.getState().checkAuth();
