import { listJobs, listUsers, getStats, moderateJob, setUserLockState, softDeleteUser } from "../repositories/adminRepository.js";
import { broadcast } from "../utils/notificationBroadcast.js";

const assertNotSelf = (actorId, targetId, action) => {
  if (String(actorId) === String(targetId)) {
    const error = new Error(`You cannot ${action} your own account`);
    error.status = 400;
    throw error;
  }
};

export const getUsers = async ({ page, limit, search, role, locked, deleted }) => {
  const result = await listUsers({ page, limit, search, role, locked, deleted });
  return result;
};

export const lockUser = async ({ actorId, userId }) => {
  assertNotSelf(actorId, userId, "lock");
  const updated = await setUserLockState({ userId, isLocked: true });
  if (!updated) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }
  broadcast(updated.id, "account_locked", {
    id: `account-locked-${updated.id}-${Date.now()}`,
    title: "Account locked",
    message: "Your account has been locked by an administrator.",
    url: "/login",
  });

  return updated;
};

export const unlockUser = async ({ actorId, userId }) => {
  assertNotSelf(actorId, userId, "unlock");
  const updated = await setUserLockState({ userId, isLocked: false });
  if (!updated) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }
  broadcast(updated.id, "account_unlocked", {
    id: `account-unlocked-${updated.id}-${Date.now()}`,
    title: "Account unlocked",
    message: "Your account has been unlocked by an administrator.",
    url: updated.role === "recruiter" ? "/recruiter" : "/candidate",
  });

  return updated;
};

export const deleteUser = async ({ actorId, userId }) => {
  assertNotSelf(actorId, userId, "delete");
  const updated = await softDeleteUser({ userId });
  if (!updated) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }
  return updated;
};

export const getJobs = async ({ page, limit, search, status, recruiterId }) => {
  return listJobs({ page, limit, search, status, recruiterId });
};

export const hideJob = async ({ jobId, moderatorId }) => {
  const updated = await moderateJob({ jobId, status: "hidden", moderatorId });
  if (!updated) {
    const error = new Error("Job post not found");
    error.status = 404;
    throw error;
  }
  return updated;
};

export const unhideJob = async ({ jobId, moderatorId }) => {
  const updated = await moderateJob({ jobId, status: "active", moderatorId });
  if (!updated) {
    const error = new Error("Job post not found");
    error.status = 404;
    throw error;
  }
  return updated;
};

export const deleteJob = async ({ jobId, moderatorId }) => {
  const updated = await moderateJob({ jobId, status: "deleted", moderatorId });
  if (!updated) {
    const error = new Error("Job post not found");
    error.status = 404;
    throw error;
  }
  return updated;
};

export const getPlatformStats = async () => getStats();
