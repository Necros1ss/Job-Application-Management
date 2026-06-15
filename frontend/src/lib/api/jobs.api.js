import { request } from "./client";

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
