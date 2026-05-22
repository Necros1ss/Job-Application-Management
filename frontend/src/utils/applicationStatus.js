const INTERVIEW_STATUSES = new Set(["interview", "interviewing", "scheduled_interview", "reviewed"]);
const OFFER_STATUSES = new Set(["accepted", "offered"]);
const REJECTED_STATUSES = new Set(["rejected"]);

export const normalizeApplicationStatus = (status) => (status || "").trim().toLowerCase();

export const getApplicationDisplayStatus = (status) => {
  const normalized = normalizeApplicationStatus(status);

  if (INTERVIEW_STATUSES.has(normalized)) return "interview";
  if (OFFER_STATUSES.has(normalized)) return "offered";
  if (REJECTED_STATUSES.has(normalized)) return "rejected";
  if (!normalized) return "applied";

  return normalized;
};

export const isInterviewStatus = (status) => getApplicationDisplayStatus(status) === "interview";
export const isOfferStatus = (status) => getApplicationDisplayStatus(status) === "offered";
export const isRejectedStatus = (status) => getApplicationDisplayStatus(status) === "rejected";

export const getApplicationStatusLabel = (status) => {
  const displayStatus = getApplicationDisplayStatus(status);

  if (displayStatus === "interview") return "INTERVIEW";
  if (displayStatus === "offered") return "OFFER";
  if (displayStatus === "applied") return "APPLIED";

  return displayStatus.toUpperCase();
};