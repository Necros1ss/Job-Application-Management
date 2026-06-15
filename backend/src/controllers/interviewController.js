import { interviewService } from "../services/interviewService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getRecruiterInterviews = asyncHandler(async (req, res) => {
  if (req.user.role !== "recruiter") {
    const error = new Error("Only recruiter accounts can view recruiter interviews");
    error.status = 403;
    throw error;
  }
  const upcomingOnly = String(req.query.upcoming || "").toLowerCase() === "true";
  const result = await interviewService.getRecruiterInterviews(req.user.id, upcomingOnly);
  return res.json(result);
});

export const getCandidateInterviews = asyncHandler(async (req, res) => {
  if (req.user.role !== "candidate") {
    const error = new Error("Only candidate accounts can view their interviews");
    error.status = 403;
    throw error;
  }
  const result = await interviewService.getCandidateInterviews(req.user.id);
  return res.json(result);
});

export const scheduleInterview = asyncHandler(async (req, res) => {
  if (req.user.role !== "recruiter") {
    const error = new Error("Only recruiter accounts can schedule interviews");
    error.status = 403;
    throw error;
  }
  const result = await interviewService.scheduleInterview(req.user.id, req.body).catch(error => {
    error.status = error.message.includes("not found") ? 404 : 400;
    throw error;
  });
  return res.status(201).json(result);
});

export const updateInterview = asyncHandler(async (req, res) => {
  if (req.user.role !== "recruiter") {
    const error = new Error("Only recruiter accounts can update interviews");
    error.status = 403;
    throw error;
  }
  const result = await interviewService.updateInterview(Number(req.params.id), req.user.id, req.body).catch(error => {
    error.status = error.message.includes("not found") ? 404 : 400;
    throw error;
  });
  return res.json(result);
});

export const deleteInterview = asyncHandler(async (req, res) => {
  if (req.user.role !== "recruiter") {
    const error = new Error("Only recruiter accounts can delete interviews");
    error.status = 403;
    throw error;
  }
  const result = await interviewService.deleteInterview(Number(req.params.id), req.user.id).catch(error => {
    if (error.message.includes("not found")) error.status = 404;
    throw error;
  });
  return res.json(result);
});

export const listInterviewers = asyncHandler(async (req, res) => {
  if (req.user.role !== "recruiter") {
    const error = new Error("Only recruiter accounts can view interviewers");
    error.status = 403;
    throw error;
  }
  const result = await interviewService.listInterviewers();
  return res.json(result);
});

export const getInterviewerInterviews = asyncHandler(async (req, res) => {
  if (req.user.role !== "interviewer") {
    const error = new Error("Only interviewer accounts can view their interviews");
    error.status = 403;
    throw error;
  }
  const upcomingOnly = String(req.query.upcoming || "").toLowerCase() === "true";
  const result = await interviewService.getInterviewerInterviews(req.user.id, upcomingOnly);
  return res.json(result);
});

export const submitEvaluation = asyncHandler(async (req, res) => {
  if (req.user.role !== "interviewer") {
    const error = new Error("Only interviewers can submit evaluations");
    error.status = 403;
    throw error;
  }
  const result = await interviewService.submitEvaluation(Number(req.params.id), req.user.id, req.body).catch(error => {
    error.status = error.message.includes("not found") ? 404 : 400;
    throw error;
  });
  return res.status(201).json(result);
});

export const getEvaluation = asyncHandler(async (req, res) => {
  const result = await interviewService.getEvaluation(Number(req.params.id), req.user.role, req.user.id).catch(error => {
    error.status = error.message.includes("permission") ? 403 : 404;
    throw error;
  });
  return res.json(result);
});
