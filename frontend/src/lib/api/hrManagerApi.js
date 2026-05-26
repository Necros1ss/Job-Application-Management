import { request } from "../api";

export const hrManagerApi = {
  getDashboard: () => request("/hr-manager/dashboard"),

  getJobs: ({ search = "", page = 1, limit = 10, status = "" } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    return request(`/hr-manager/jobs?${params.toString()}`);
  },

  setJobVisibility: (jobId, visible) =>
    request(`/hr-manager/jobs/${jobId}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ approved: visible }),
    }),

  getRecruiters: ({ page = 1, limit = 10 } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    return request(`/hr-manager/recruiters?${params.toString()}`);
  },

  getSummaryReport: () => request("/hr-manager/reports/summary"),
};
