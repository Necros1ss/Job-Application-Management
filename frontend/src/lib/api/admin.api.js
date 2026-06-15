import { request, buildQueryString } from "./client";

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
