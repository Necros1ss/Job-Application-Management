import { hrManagerService } from "../services/hrManagerService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const result = await hrManagerService.getDashboard();
  return res.json(result);
});

export const getJobs = asyncHandler(async (req, res) => {
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    search: req.query.search,
    status: req.query.status
  };
  const result = await hrManagerService.getJobs(options).catch(error => {
    if (error.message.includes("Invalid")) error.status = 400;
    throw error;
  });
  return res.json(result);
});

export const approveJob = asyncHandler(async (req, res) => {
  const result = await hrManagerService.approveJob(Number(req.params.id), req.body.approved, req.user.id).catch(error => {
    error.status = error.message.includes("not found") ? 404 : 400;
    throw error;
  });
  return res.json(result);
});

export const getRecruiters = asyncHandler(async (req, res) => {
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10
  };
  const result = await hrManagerService.getRecruiters(options);
  return res.json(result);
});

export const getSummaryReport = asyncHandler(async (req, res) => {
  const result = await hrManagerService.getSummaryReport();
  return res.json(result);
});
