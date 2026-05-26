export const USER_ROLES = Object.freeze({
  CANDIDATE: "candidate",
  RECRUITER: "recruiter",
  ADMIN: "admin",
  HR_MANAGER: "hr_manager",
  INTERVIEWER: "interviewer",
});

export const ACCESSIBLE_ROLES = Object.freeze(Object.values(USER_ROLES));
