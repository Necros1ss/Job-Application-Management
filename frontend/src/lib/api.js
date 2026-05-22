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

const requestBlob = async (path, options = {}) => {
  const token = getToken();
  const headers = {
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

  return response.blob();
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
  forgotPassword: (payload) =>
    request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  resetPassword: (payload) =>
    request("/auth/reset-password", {
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
  getForRecruiter: (id) => request(`/applications/recruiter/${id}`),
  getRecruiterCvFile: (id) => requestBlob(`/applications/recruiter/${id}/cv`),
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

  listPaginated: ({ search = "", page = 1, limit = 10 } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    const normalizedSearch = search.trim();
    if (normalizedSearch) {
      params.set("search", normalizedSearch);
    }

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
  clearSession: () => {
    clearToken();
    clearRole();
  },
};
