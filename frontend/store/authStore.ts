'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthTokens, User } from '@/types';

interface AuthState {
  tokens: AuthTokens | null;
  user: User | null;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      tokens: null,
      user: null,
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      setTokens: (tokens) => {
        set({ tokens });
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_tokens', JSON.stringify(tokens));
        }
      },

      setUser: (user) => set({ user }),

      logout: () => {
        set({ tokens: null, user: null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_tokens');
          localStorage.removeItem('auth-storage');
        }
      },

      isAuthenticated: () => !!get().tokens?.access,
      isAdmin: () => get().tokens?.role === 'admin',
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ tokens: state.tokens, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
