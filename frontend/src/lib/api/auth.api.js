import { request, authFetch, persistAuthData, refreshSession, clearSession } from "./client";

export const authApi = {
  signup: async (payload) => {
    const authData = await request("/auth/signup", {
      method: "POST",
      tryRefresh: false,
      body: JSON.stringify(payload),
    });
    return persistAuthData(authData);
  },
  login: async (payload) => {
    const authData = await request("/auth/login", {
      method: "POST",
      tryRefresh: false,
      body: JSON.stringify(payload),
    });
    return persistAuthData(authData);
  },
  refresh: () => refreshSession(),
  logout: async () => {
    try {
      return await authFetch("/auth/logout", { method: "POST" });
    } finally {
      clearSession();
    }
  },
  forgotPassword: (payload) =>
    request("/auth/forgot-password", {
      method: "POST",
      tryRefresh: false,
      body: JSON.stringify(payload),
    }),
  resetPassword: (payload) =>
    request("/auth/reset-password", {
      method: "POST",
      tryRefresh: false,
      body: JSON.stringify(payload),
    }),
};

export const accountApi = {
  changePassword: (payload) =>
    request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteMe: () =>
    request("/users/me", {
      method: "DELETE",
    }),
};
