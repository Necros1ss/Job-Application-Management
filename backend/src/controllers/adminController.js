import { asyncHandler } from "../utils/asyncHandler.js";
import { errorResponse, successResponse } from "../utils/apiResponse.js";
import * as adminService from "../services/adminService.js";

const sendError = (res, error) =>
  res.status(error.status || 500).json(errorResponse(error.message || "Unexpected error", process.env.NODE_ENV === "production" ? undefined : error.detail));

export const listUsers = asyncHandler(async (req, res) => {
  try {
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
  } catch (error) {
    return sendError(res, error);
  }
});

export const listJobs = asyncHandler(async (req, res) => {
  try {
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
  } catch (error) {
    return sendError(res, error);
  }
});

export const lockUser = asyncHandler(async (req, res) => {
  try {
    const result = await adminService.lockUser({ actorId: req.user.id, userId: req.validated.params.id });
    return res.json(successResponse(result, "User locked"));
  } catch (error) {
    return sendError(res, error);
  }
});

export const unlockUser = asyncHandler(async (req, res) => {
  try {
    const result = await adminService.unlockUser({ actorId: req.user.id, userId: req.validated.params.id });
    return res.json(successResponse(result, "User unlocked"));
  } catch (error) {
    return sendError(res, error);
  }
});

export const deleteUser = asyncHandler(async (req, res) => {
  try {
    const result = await adminService.deleteUser({ actorId: req.user.id, userId: req.validated.params.id });
    return res.json(successResponse(result, "User deleted"));
  } catch (error) {
    return sendError(res, error);
  }
});

export const hideJob = asyncHandler(async (req, res) => {
  try {
    const result = await adminService.hideJob({ jobId: req.validated.params.id, moderatorId: req.user.id });
    return res.json(successResponse(result, "Job hidden"));
  } catch (error) {
    return sendError(res, error);
  }
});

export const unhideJob = asyncHandler(async (req, res) => {
  try {
    const result = await adminService.unhideJob({ jobId: req.validated.params.id, moderatorId: req.user.id });
    return res.json(successResponse(result, "Job made active"));
  } catch (error) {
    return sendError(res, error);
  }
});

export const deleteJob = asyncHandler(async (req, res) => {
  try {
    const result = await adminService.deleteJob({ jobId: req.validated.params.id, moderatorId: req.user.id });
    return res.json(successResponse(result, "Job deleted"));
  } catch (error) {
    return sendError(res, error);
  }
});

export const platformStats = asyncHandler(async (_req, res) => {
  try {
    const result = await adminService.getPlatformStats();
    return res.json(successResponse(result));
  } catch (error) {
    return sendError(res, error);
  }
});
