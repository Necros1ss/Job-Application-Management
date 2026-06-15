import { jobPostService } from "../services/jobPostService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getJobPosts = asyncHandler(async (req, res) => {
  const result = await jobPostService.getJobPosts(req.query);
  return res.json(result);
});

export const getMine = asyncHandler(async (req, res) => {
  if (req.user?.role !== "recruiter") {
    const error = new Error("Only recruiters can access this resource");
    error.status = 403;
    throw error;
  }
  const jobs = await jobPostService.getMine(req.user.id);
  return res.json(jobs);
});

export const getById = asyncHandler(async (req, res) => {
  const job = await jobPostService.getById(req.params.id).catch(error => {
    if (error.message === "Job post not found") error.status = 404;
    else error.status = 400;
    throw error;
  });
  return res.json(job);
});

export const create = asyncHandler(async (req, res) => {
  if (req.user.role !== "recruiter") {
    const error = new Error("Only recruiter accounts can create job posts");
    error.status = 403;
    throw error;
  }
  const job = await jobPostService.create(req.user.id, req.validated.body);
  return res.status(201).json({ id: job.id, ...req.validated.body });
});

export const update = asyncHandler(async (req, res) => {
  if (req.user.role !== "recruiter") {
    const error = new Error("Only recruiter accounts can update job posts");
    error.status = 403;
    throw error;
  }
  await jobPostService.update(req.params.id, req.user.id, req.validated.body).catch(error => {
    if (error.message.includes("not found")) error.status = 404;
    throw error;
  });
  return res.json({ id: req.params.id, ...req.validated.body });
});

export const remove = asyncHandler(async (req, res) => {
  if (req.user.role !== "recruiter") {
    const error = new Error("Only recruiter accounts can delete job posts");
    error.status = 403;
    throw error;
  }
  await jobPostService.delete(req.params.id, req.user.id).catch(error => {
    if (error.message.includes("not found")) error.status = 404;
    throw error;
  });
  return res.status(204).send();
});
