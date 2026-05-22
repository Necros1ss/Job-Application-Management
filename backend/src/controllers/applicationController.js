import { asyncHandler } from "../utils/asyncHandler.js";
import * as applicationService from "../services/applicationService.js";

const sendError = (res, error) =>
  res.status(error.status || 500).json({
    message: error.message || "Unexpected error",
    ...(process.env.NODE_ENV === "production" || !error.detail ? {} : { detail: error.detail }),
  });

export const listForCandidate = asyncHandler(async (req, res) => {
  try {
    const result = await applicationService.listForCandidate({ user: req.user, query: req.query });
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

export const listForRecruiter = asyncHandler(async (req, res) => {
  try {
    const result = await applicationService.listForRecruiter({ user: req.user, query: req.query });
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

export const getActivity = asyncHandler(async (req, res) => {
  try {
    const result = await applicationService.getActivity({ user: req.user });
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

export const getForRecruiter = asyncHandler(async (req, res) => {
  try {
    const result = await applicationService.getForRecruiter({ user: req.user, applicationId: req.params.id });
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

export const downloadCv = asyncHandler(async (req, res) => {
  try {
    const file = await applicationService.downloadCv({ user: req.user, applicationId: req.params.id });
    res.setHeader("Content-Type", file.mimeType);
    if (file.size) {
      res.setHeader("Content-Length", String(file.size));
    }
    res.setHeader("Content-Disposition", `attachment; filename="${file.fileName}"`);
    return res.sendFile(file.path);
  } catch (error) {
    return sendError(res, error);
  }
});

export const update = asyncHandler(async (req, res) => {
  try {
    const result = await applicationService.update({
      user: req.user,
      applicationId: req.params.id,
      payload: req.body,
    });
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

export const remove = asyncHandler(async (req, res) => {
  try {
    await applicationService.remove({ user: req.user, applicationId: req.params.id });
    return res.status(204).send();
  } catch (error) {
    return sendError(res, error);
  }
});

export const apply = asyncHandler(async (req, res) => {
  try {
    const result = await applicationService.apply({
      user: req.user,
      body: req.body,
      file: req.file,
    });
    return res.status(201).json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

export const updateStatus = asyncHandler(async (req, res) => {
  try {
    const result = await applicationService.updateStatus({
      user: req.user,
      applicationId: req.params.id,
      status: req.body.status,
    });
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

export const updateRating = asyncHandler(async (req, res) => {
  try {
    const result = await applicationService.updateRating({
      user: req.user,
      applicationId: req.params.id,
      rating: req.body.rating,
    });
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

export const addNote = asyncHandler(async (req, res) => {
  try {
    const result = await applicationService.addNote({
      user: req.user,
      applicationId: req.params.id,
      note: req.body.note,
    });
    return res.status(201).json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

export const updateNote = asyncHandler(async (req, res) => {
  try {
    const result = await applicationService.updateNote({
      user: req.user,
      applicationId: req.params.id,
      noteId: req.params.noteId,
      note: req.body.note,
    });
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

export const deleteNote = asyncHandler(async (req, res) => {
  try {
    await applicationService.deleteNote({
      user: req.user,
      applicationId: req.params.id,
      noteId: req.params.noteId,
    });
    return res.status(204).send();
  } catch (error) {
    return sendError(res, error);
  }
});

export const reject = asyncHandler(async (req, res) => {
  try {
    const result = await applicationService.reject({
      user: req.user,
      applicationId: req.params.id,
      reason: req.body.reason,
      emailBody: req.body.emailBody,
    });
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

export const offer = asyncHandler(async (req, res) => {
  try {
    const result = await applicationService.offer({
      user: req.user,
      applicationId: req.params.id,
      subject: req.body.subject,
      content: req.body.content,
    });
    return res.status(201).json(result);
  } catch (error) {
    return sendError(res, error);
  }
});
