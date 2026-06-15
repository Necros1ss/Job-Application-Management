import { applicationService } from "../services/applicationService.js";
import { successResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getApplications = asyncHandler(async (req, res) => {
  const applications = await applicationService.getApplications(req.user);
  return res.json(successResponse(applications));
});

export const getRecruiterApplications = asyncHandler(async (req, res) => {
  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    jobPostId: req.query.jobPostId
  };
  const result = await applicationService.getRecruiterApplications(req.user.id, options);
  return res.json(successResponse(result.applications, result.pagination));
});

export const getApplicationById = asyncHandler(async (req, res) => {
  const application = await applicationService.getApplicationById(req.params.id).catch(error => {
    if (error.message === "Application not found") error.status = 404;
    throw error;
  });
  return res.json(successResponse(application));
});

export const applyForJob = asyncHandler(async (req, res) => {
  if (!req.file) {
    const error = new Error("CV file is required");
    error.status = 400;
    throw error;
  }
  const application = await applicationService.applyForJob(req.user.id, req.body, req.file);
  return res.status(201).json(successResponse(application, "Application submitted successfully"));
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const application = await applicationService.updateStatus(req.params.id, status, req.user.id);
  return res.json(successResponse(application, "Status updated successfully"));
});

export const updateRating = asyncHandler(async (req, res) => {
  const { rating } = req.body;
  const application = await applicationService.updateRating(req.params.id, rating, req.user.id);
  return res.json(successResponse(application, "Rating updated successfully"));
});

export const getNotes = asyncHandler(async (req, res) => {
  const notes = await applicationService.getNotes(req.params.id);
  return res.json(successResponse(notes));
});

export const addNote = asyncHandler(async (req, res) => {
  const note = await applicationService.addNote(req.params.id, req.user.id, req.body.note);
  return res.status(201).json(successResponse(note, "Note added successfully"));
});

export const updateNote = asyncHandler(async (req, res) => {
  const note = await applicationService.updateNote(req.params.noteId, req.body.note);
  return res.json(successResponse(note, "Note updated successfully"));
});

export const deleteNote = asyncHandler(async (req, res) => {
  await applicationService.deleteNote(req.params.noteId);
  return res.json(successResponse(null, "Note deleted successfully"));
});
