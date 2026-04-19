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
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
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
      if (payload?.detail) {
        errorMessage = `${payload.message || errorMessage}: ${payload.detail}`;
      } else {
        errorMessage = payload.message || errorMessage;
      }
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

export const jobPostsApi = {
  list: (search = "") => {
    const normalizedSearch = search.trim();
    const query = normalizedSearch ? `?search=${encodeURIComponent(normalizedSearch)}` : "";
    return request(`/job-posts${query}`);
  },

  getById: (id) => request(`/job-posts/${id}`),
};

export const savedJobsApi = {
  save: (jobId) => request('/saved-jobs', { 
    method: 'POST', 
    body: JSON.stringify({ jobId }) 
  }),
  
  list: () => request('/saved-jobs'),

  remove: (id) =>
    request(`/saved-jobs/${id}`, {
      method: "DELETE",
    }),
  };

export const messagesApi = {
  inbox: ({ limit = 10, offset = 0 } = {}) =>
    request(`/messages/inbox?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`),
  unreadCount: () => request("/messages/unread-count"),
  markRead: (id) =>
    request(`/messages/${id}/read`, {
      method: "PATCH",
    }),
  send: (payload) =>
    request("/messages", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const applyFromJob = (jobId, cvFile, coverLetter = "") => {
  const normalizedJobId = Number(jobId);

  if (!Number.isInteger(normalizedJobId) || normalizedJobId <= 0) {
  throw new Error("Invalid jobId");
  }

  if (!(cvFile instanceof File)) {
    throw new Error("Invalid CV file");
  }

  const formData = new FormData();
  formData.append("jobId", String(normalizedJobId));
  formData.append("coverLetter", coverLetter);
  formData.append("cvFile", cvFile);

  return request("/applications/apply", {
    method: "POST",
    body: formData,
    });
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
