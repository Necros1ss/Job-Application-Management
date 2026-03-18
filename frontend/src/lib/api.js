const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TOKEN_KEY = "token";
const ROLE_KEY = "userRole";

const getToken = () => localStorage.getItem(TOKEN_KEY);
const getRole = () => localStorage.getItem(ROLE_KEY);

const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

const setRole = (role) => {
  if (role) {
    localStorage.setItem(ROLE_KEY, role);
  }
};

const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

const clearRole = () => {
  localStorage.removeItem(ROLE_KEY);
};

const request = async (path, options = {}) => {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = "Request failed";
    try {
      const payload = await response.json();
      errorMessage = payload.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const authApi = {
  signup: (payload) =>
    request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const usersApi = {
  me: () => request("/users/me"),
  updateMe: (payload) =>
    request("/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

export const applicationsApi = {
  list: () => request("/applications"),
  create: (payload) =>
    request("/applications", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    request(`/applications/${id}`, {
      method: "DELETE",
    }),
};

export const tokenStorage = {
  getToken,
  getRole,
  setToken,
  setRole,
  clearToken,
  clearRole,
  clearSession: () => {
    clearToken();
    clearRole();
  },
};
