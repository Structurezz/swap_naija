import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getMe } from '../api/users.api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      initialized: false,

      init: () => {
        // Already loaded from persisted storage
        set({ initialized: true });
      },

      setAuth: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken });
      },

      setAccessToken: (accessToken) => {
        set({ accessToken });
      },

      updateUser: (updates) => {
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : null }));
      },

      refreshUser: async () => {
        try {
          const user = await getMe();
          set({ user });
        } catch {}
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null });
      },

      isAuthenticated: () => !!get().accessToken && !!get().user,
    }),
    {
      name: 'swapnaija-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.initialized = true;
      },
    }
  )
);
