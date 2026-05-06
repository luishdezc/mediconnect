import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authApi } from '../api';

interface AuthState {
  user: User | null;
  profile: any | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null, profile?: any) => void;
  setToken: (token: string | null) => void;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      setUser: (user, profile = null) =>
        set({ user, profile, isAuthenticated: !!user }),

      setToken: (token) => set({ token }),

      fetchMe: async () => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.getMe();
          set({ user: data.user, profile: data.profile, isAuthenticated: true, isLoading: false });
        } catch {
          set({ user: null, profile: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },

      logout: async () => {
        try { await authApi.logout(); } catch {}
        set({ user: null, profile: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'mediconnect-auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    }
  )
);
