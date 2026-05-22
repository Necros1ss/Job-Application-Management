const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const LEGACY_TOKEN_KEY = "token";
const ROLE_KEY = "userRole";

// Access tokens are intentionally kept in module memory only. The refresh token
// lives in an httpOnly cookie, so a page reload can restore the access token
// without exposing long-lived credentials to JavaScript-readable storage.
let _accessToken = null;
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

const isTokenExpired = (token) => {
  const payload = getTokenPayload(token);
  if (!payload?.exp) {
    return false;
  }

  return Date.now() >= payload.exp * 1000;
};

const getToken = () => _accessToken;
const getRole = () => getRoleStorage()?.getItem(ROLE_KEY) || null;

const setToken = (token) => {
  if (token) {
    _accessToken = token;
    // Remove tokens left by older builds that used sessionStorage.
    getRoleStorage()?.removeItem(LEGACY_TOKEN_KEY);
  }
};

const setRole = (role) => {
  if (role) {
    // Role is non-sensitive UI routing state, so keeping it in sessionStorage is OK.
    getRoleStorage()?.setItem(ROLE_KEY, role);
  }
};

const clearToken = () => {
  _accessToken = null;
  getRoleStorage()?.removeItem(LEGACY_TOKEN_KEY);
};

const clearRole = () => {
  getRoleStorage()?.removeItem(ROLE_KEY);
};

const clearSession = () => {
  clearToken();
  clearRole();
};

const authFetch = async (path, options = {}) => {
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

const normalizeAuthPayload = (payload) => payload?.data || payload || null;

const persistAuthData = (authData) => {
  const token = authData?.token || authData?.accessToken;

  if (token) {
    setToken(token);
  }

  if (authData?.user?.role) {
    setRole(authData.user.role);
  }

  return authData;
};

const refreshSession = async () => {
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

  // A missing/expired refresh cookie is a normal unauthenticated state, so this
  // function clears local session hints and returns null instead of throwing.
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

const request = async (path, options = {}) => {
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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers,
    credentials: "include",
  });

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

const requestBlob = async (path, options = {}) => {
  const token = getToken();
  const { tryRefresh = true, ...requestOptions } = options;

  const headers = {
    ...(requestOptions.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers,
    credentials: "include",
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

export const usersApi = {
  me: () => request("/users/me"),
  updateMe: (payload) =>
    request("/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  updateNotificationPreferences: (preferences) =>
    request("/users/notification-preferences", {
      method: "PATCH",
      body: JSON.stringify({ preferences }),
    }),
};

export const applicationsApi = {
  list: () => request("/applications"),
  listForRecruiter: async () => {
    const response = await request("/applications/recruiter");
    return Array.isArray(response) ? response : response.data || [];
  },
  listForRecruiterPaginated: ({ page = 1, limit = 10, jobPostId = "" } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (jobPostId && jobPostId !== "all") {
      params.set("jobPostId", String(jobPostId));
    }

    return request(`/applications/recruiter?${params.toString()}`);
  },
  listRecruiterActivity: () => request("/applications/recruiter/activity"),
  getRecruiterAnalytics: (params = {}) => request(`/applications/recruiter/analytics${buildQueryString(params)}`),
  getForRecruiter: (id) => request(`/applications/recruiter/${id}`),
  getRecruiterCvFile: (id) => requestBlob(`/applications/recruiter/${id}/cv`),
  getAiScreening: (id) => request(`/applications/recruiter/${id}/ai-screen`),
  analyzeAiScreening: (id) =>
    request(`/applications/recruiter/${id}/ai-screen`, {
      method: "POST",
    }),
  update: (id, payload) =>
    request(`/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  updateStatus: (id, status) =>
    request(`/applications/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  updateRating: (id, rating) =>
    request(`/applications/${id}/rating`, {
      method: "PATCH",
      body: JSON.stringify({ rating }),
    }),
  addNote: (id, payload) =>
    request(`/applications/${id}/notes`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateNote: (id, noteId, payload) =>
    request(`/applications/${id}/notes/${noteId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteNote: (id, noteId) =>
    request(`/applications/${id}/notes/${noteId}`, {
      method: "DELETE",
    }),
  reject: (id, payload) =>
    request(`/applications/${id}/reject`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  offer: (id, payload) =>
    request(`/applications/${id}/offer`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    request(`/applications/${id}`, {
      method: "DELETE",
    }),
};

export const interviewsApi = {
  listForCandidate: () => request("/interviews/candidate"),
  listForRecruiter: ({ upcoming = false } = {}) => {
    const query = upcoming ? "?upcoming=true" : "";
    return request(`/interviews/recruiter${query}`);
  },
  create: (payload) =>
    request("/interviews", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/interviews/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) =>
    request(`/interviews/${id}`, {
      method: "DELETE",
    }),
};

export const onboardingApi = {
  listForRecruiter: () => request("/onboarding/recruiter"),
  listForCandidate: () => request("/onboarding/candidate"),
  listAcceptedApplications: () => request("/onboarding/accepted-applications"),
  createTask: (payload) =>
    request("/onboarding/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTaskStatus: (id, status) =>
    request(`/onboarding/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deleteTask: (id) =>
    request(`/onboarding/tasks/${id}`, {
      method: "DELETE",
    }),
};

export const employeesApi = {
  listForRecruiter: () => request("/employees/recruiter"),
  getMine: () => request("/employees/me"),
  listAcceptedApplications: () => request("/employees/accepted-applications"),
  convertCandidate: (payload) =>
    request("/employees/convert", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateEmployee: (id, payload) =>
    request(`/employees/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  listAttendance: () => request("/employees/attendance"),
  recordAttendance: (payload) =>
    request("/employees/attendance", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listLeaveRequests: () => request("/employees/leave-requests"),
  submitLeaveRequest: (payload) =>
    request("/employees/leave-requests", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  reviewLeaveRequest: (id, status) =>
    request(`/employees/leave-requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

export const jobPostsApi = {
  list: async (search = "") => {
    const normalizedSearch = search.trim();
    const query = normalizedSearch ? `?search=${encodeURIComponent(normalizedSearch)}` : "";
    const response = await request(`/job-posts${query}`);
    return Array.isArray(response) ? response : response.data || [];
  },

  listPaginated: ({
    search = "",
    location = "",
    employment_type = "",
    experience = "",
    salary_min = "",
    salary_max = "",
    sort = "newest",
    page = 1,
    limit = 10,
  } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    const filterParams = {
      search: search.trim(),
      location: location.trim(),
      employment_type,
      experience,
      salary_min,
      salary_max,
      sort,
    };

    Object.entries(filterParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, String(value));
      }
    });

    return request(`/job-posts?${params.toString()}`);
  },

  listMine: () => request("/job-posts/mine"),

  getById: (id) => request(`/job-posts/${id}`),

  create: (payload) =>
    request("/job-posts", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id, payload) =>
    request(`/job-posts/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  remove: (id) =>
    request(`/job-posts/${id}`, {
      method: "DELETE",
    }),
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
  isTokenExpired,
  clearSession,
};

const buildQueryString = (params = {}) => {
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

export const adminApi = {
  getStats: () => request("/admin/stats"),
  listUsers: (params = {}) => request(`/admin/users${buildQueryString(params)}`),
  listJobs: (params = {}) => request(`/admin/jobs${buildQueryString(params)}`),
  lockUser: (id) => request(`/admin/users/${id}/lock`, { method: "PATCH" }),
  unlockUser: (id) => request(`/admin/users/${id}/unlock`, { method: "PATCH" }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: "DELETE" }),
  hideJob: (id) => request(`/admin/jobs/${id}/hide`, { method: "PATCH" }),
  unhideJob: (id) => request(`/admin/jobs/${id}/unhide`, { method: "PATCH" }),
  deleteJob: (id) => request(`/admin/jobs/${id}`, { method: "DELETE" }),
};
