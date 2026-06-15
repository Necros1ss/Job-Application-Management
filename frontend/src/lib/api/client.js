import { useAuthStore } from "../../store/authStore";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const ROLE_KEY = "userRole";

let _initializeSessionPromise = null;

const getRoleStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const base64UrlDecode = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
};

const getTokenPayload = (token) => {
  if (!token || typeof token !== "string") {
    return null;
  }

  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  const payload = getTokenPayload(token);
  if (!payload?.exp) {
    return false;
  }

  return Date.now() >= payload.exp * 1000;
};

export const getToken = () => useAuthStore.getState().accessToken;
export const getRole = () => useAuthStore.getState().user?.role || getRoleStorage()?.getItem(ROLE_KEY) || null;

export const setToken = (token) => {
  useAuthStore.getState().setAccessToken(token);
};

export const setRole = (role) => {
  const user = useAuthStore.getState().user || {};
  useAuthStore.getState().setUser({ ...user, role });
};

export const clearSession = () => {
  useAuthStore.getState().logout();
};

export const authFetch = async (path, options = {}) => {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMessage = "Request failed";
    try {
      const payload = await response.json();
      errorMessage = payload?.detail ? `${payload.message || errorMessage}: ${payload.detail}` : payload.message || errorMessage;
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

export const normalizeAuthPayload = (payload) => payload?.data || payload || null;

export const persistAuthData = (authData) => {
  const token = authData?.token || authData?.accessToken;
  const user = authData?.user;

  if (token || user) {
    useAuthStore.getState().setAuth(user || useAuthStore.getState().user, token || useAuthStore.getState().accessToken);
  }

  return authData;
};

export const refreshSession = async () => {
  const payload = await authFetch("/auth/refresh", { method: "POST" });
  return persistAuthData(normalizeAuthPayload(payload));
};

export const initializeSession = async () => {
  const currentToken = getToken();

  if (currentToken && !isTokenExpired(currentToken) && getRole()) {
    return { token: currentToken, user: { role: getRole() } };
  }

  if (_initializeSessionPromise) {
    return _initializeSessionPromise;
  }

  _initializeSessionPromise = refreshSession()
    .catch(() => {
      clearSession();
      return null;
    })
    .finally(() => {
      _initializeSessionPromise = null;
    });

  return _initializeSessionPromise;
};

export const request = async (path, options = {}) => {
  const { tryRefresh = true, ...requestOptions } = options;
  const token = getToken();

  const isFormData = requestOptions.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(requestOptions.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      headers,
      credentials: "include",
    });
  } catch (error) {
    throw new Error(
      `Unable to reach the backend API at ${API_BASE_URL}. Make sure the backend server is running.`,
      { cause: error },
    );
  }

  if (!response.ok) {
    let errorMessage = "Request failed";
    try {
      const payload = await response.json();
      if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
        errorMessage = payload.errors.map((error) => error.message).join("; ");
      }
      if (payload?.detail) {
        errorMessage = `${payload.message || errorMessage}: ${payload.detail}`;
      } else {
        errorMessage = payload.message || errorMessage;
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    if (response.status === 401 && tryRefresh) {
      try {
        await refreshSession();
        return request(path, { ...requestOptions, tryRefresh: false });
      } catch {
        clearSession();
        errorMessage = "Session expired. Please log in again.";
      }
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json();

  if (payload && typeof payload === "object" && payload.success === true && Object.prototype.hasOwnProperty.call(payload, "data")) {
    return payload.data;
  }

  return payload;
};

export const requestBlob = async (path, options = {}) => {
  const token = getToken();
  const { tryRefresh = true, ...requestOptions } = options;

  const headers = {
    Accept: "application/pdf,application/octet-stream,*/*",
    ...(requestOptions.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      headers,
      credentials: "include",
    });
  } catch (error) {
    throw new Error(
      `Unable to reach the backend API at ${API_BASE_URL}. Make sure the backend server is running.`,
      { cause: error },
    );
  }

  if (!response.ok) {
    let errorMessage = "Request failed";
    try {
      const payload = await response.json();
      if (payload?.detail) {
        errorMessage = `${payload.message || errorMessage}: ${payload.detail}`;
      } else {
        errorMessage = payload.message || errorMessage;
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    if (response.status === 401 && tryRefresh) {
      try {
        await refreshSession();
        return requestBlob(path, { ...requestOptions, tryRefresh: false });
      } catch {
        clearSession();
        errorMessage = "Session expired. Please log in again.";
      }
    }

    throw new Error(errorMessage);
  }

  return response.blob();
};

export const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const tokenStorage = {
  getToken,
  getRole,
  setToken,
  setRole,
  clearSession,
  isTokenExpired,
};

