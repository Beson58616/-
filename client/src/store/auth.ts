import { create } from 'zustand';
import { authAPI } from '../services/api';

interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar: string;
  department: string;
  roles: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  loading: false,

  login: async (username: string, password: string) => {
    set({ loading: true });
    try {
      const res = await authAPI.login(username, password);
      const { token, refreshToken, user } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, loading: false });
    } catch (err: any) {
      set({ loading: false });
      throw new Error(err.response?.data?.message || '登录失败');
    }
  },

  logout: () => {
    authAPI.logout().catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, token: null });
    window.location.href = '/login';
  },

  fetchUser: async () => {
    try {
      const res = await authAPI.me();
      const user = res.data.data;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
    } catch {
      get().logout();
    }
  },

  isAuthenticated: () => {
    return !!get().token;
  },
}));
