import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import * as adminService from "../services/adminService.js";

export const listUsers = asyncHandler(async (req, res) => {
  const result = await adminService.getUsers(req.validated.query);
  return res.json(
    successResponse({
      items: result.items,
      pagination: {
        page: req.validated.query.page,
        limit: req.validated.query.limit,
        total: result.total,
      },
    })
  );
});

export const listJobs = asyncHandler(async (req, res) => {
  const result = await adminService.getJobs(req.validated.query);
  return res.json(
    successResponse({
      items: result.items,
      pagination: {
        page: req.validated.query.page,
        limit: req.validated.query.limit,
        total: result.total,
      },
    })
  );
});

export const lockUser = asyncHandler(async (req, res) => {
  const result = await adminService.lockUser({ actorId: req.user.id, userId: req.validated.params.id });
  return res.json(successResponse(result, "User locked"));
});

export const unlockUser = asyncHandler(async (req, res) => {
  const result = await adminService.unlockUser({ actorId: req.user.id, userId: req.validated.params.id });
  return res.json(successResponse(result, "User unlocked"));
});

export const deleteUser = asyncHandler(async (req, res) => {
  const result = await adminService.deleteUser({ actorId: req.user.id, userId: req.validated.params.id });
  return res.json(successResponse(result, "User deleted"));
});

export const hideJob = asyncHandler(async (req, res) => {
  const result = await adminService.hideJob({ jobId: req.validated.params.id, moderatorId: req.user.id });
  return res.json(successResponse(result, "Job hidden"));
});

export const unhideJob = asyncHandler(async (req, res) => {
  const result = await adminService.unhideJob({ jobId: req.validated.params.id, moderatorId: req.user.id });
  return res.json(successResponse(result, "Job made active"));
});

export const deleteJob = asyncHandler(async (req, res) => {
  const result = await adminService.deleteJob({ jobId: req.validated.params.id, moderatorId: req.user.id });
  return res.json(successResponse(result, "Job deleted"));
});

export const platformStats = asyncHandler(async (_req, res) => {
  const result = await adminService.getPlatformStats();
  return res.json(successResponse(result));
});
