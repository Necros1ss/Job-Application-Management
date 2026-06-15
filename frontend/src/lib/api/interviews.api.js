import { request } from "./client";

export const interviewsApi = {
  listForCandidate: () => request("/interviews/candidate"),
  listForRecruiter: ({ upcoming = false } = {}) => {
    const query = upcoming ? "?upcoming=true" : "";
    return request(`/interviews/recruiter${query}`);
  },
  listInterviewers: () => request("/interviews/interviewers"),
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
