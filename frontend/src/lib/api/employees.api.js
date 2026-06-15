import { request } from "./client";

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
