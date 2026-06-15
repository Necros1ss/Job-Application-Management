import { request } from "./client";

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
