import { create } from "zustand";

const ROLE_KEY = "userRole";

const getRoleStorage = () => {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setAuth: (user, accessToken) => {
    if (user?.role) {
      getRoleStorage()?.setItem(ROLE_KEY, user.role);
    }
    set({
      user,
      accessToken,
      isAuthenticated: !!accessToken,
    });
  },

  setAccessToken: (accessToken) => {
    set({ accessToken, isAuthenticated: !!accessToken });
  },

  setUser: (user) => {
    if (user?.role) {
      getRoleStorage()?.setItem(ROLE_KEY, user.role);
    }
    set({ user });
  },

  logout: () => {
    getRoleStorage()?.removeItem(ROLE_KEY);
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
  },
}));
