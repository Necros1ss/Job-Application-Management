import { request } from "./client";

export const interviewerApi = {
  getMyInterviews: () => request("/interviews/interviewer"),

  getEvaluation: (interviewId) => request(`/interviews/${interviewId}/evaluation`),

  submitEvaluation: (interviewId, payload) =>
    request(`/interviews/${interviewId}/evaluation`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
