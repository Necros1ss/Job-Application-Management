import bcrypt from "bcryptjs";
import fs from "fs";
import { promises as fsPromises } from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import * as applicationRepository from "../repositories/applicationRepository.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CV_UPLOAD_DIR = path.resolve(__dirname, "../../uploads/cv");
const ALLOWED_CV_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);
const VALID_STATUSES = new Set(["applied", "reviewed", "scheduled_interview", "accepted", "rejected"]);
const VALID_TRANSITIONS = {
  applied: new Set(["reviewed"]),
  reviewed: new Set(["scheduled_interview"]),
  scheduled_interview: new Set(["accepted", "rejected"]),
  rejected: new Set([]),
  accepted: new Set([]),
};

fs.mkdirSync(CV_UPLOAD_DIR, { recursive: true });

const createHttpError = (status, message, detail) => {
  const error = new Error(message);
  error.status = status;
  if (detail) {
    error.detail = detail;
  }
  return error;
};

const getPagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 50);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

const assertRole = (user, role, message) => {
  if (user?.role !== role) {
    throw createHttpError(403, message);
  }
};

const parsePositiveId = (value, label) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw createHttpError(400, `Invalid ${label}`);
  }

  return id;
};

const normalizeUploadedFilename = (originalName) => {
  if (typeof originalName !== "string" || originalName.length === 0) {
    return "cv-upload";
  }

  const hasMojibakeSignals = /[ÃÂÌ]/.test(originalName) || /[\u0080-\u009f]/.test(originalName);
  const candidate = hasMojibakeSignals
    ? Buffer.from(originalName, "latin1").toString("utf8")
    : originalName;

  return candidate.replace(/[\u0000-\u001f\u007f-\u009f]/g, "").normalize("NFC").trim() || "cv-upload";
};

const sanitizeCvFilename = (originalName) => {
  const normalized = normalizeUploadedFilename(path.basename(originalName || "cv-upload"));
  const extension = path.extname(normalized).toLowerCase();
  const safeExtension = ALLOWED_CV_EXTENSIONS.has(extension) ? extension : "";
  const rawBaseName = path.basename(normalized, extension);
  const safeBaseName = rawBaseName
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "cv-upload";

  return `${safeBaseName}${safeExtension}`;
};

const buildStoredCvFilename = (applicationId, originalName, timestamp = Date.now()) => {
  const safeOriginalName = sanitizeCvFilename(originalName);
  const extension = path.extname(safeOriginalName);
  const baseName = path.basename(safeOriginalName, extension);
  const prefix = `${applicationId}_${timestamp}_`;
  const maxBaseLength = Math.max(1, 255 - prefix.length - extension.length);

  return `${prefix}${baseName.slice(0, maxBaseLength)}${extension}`;
};

const resolveCvPath = (fileName) => {
  if (!fileName) {
    return null;
  }

  const safeFileName = path.basename(fileName);
  if (safeFileName !== fileName) {
    return null;
  }

  const resolvedPath = path.resolve(CV_UPLOAD_DIR, safeFileName);
  const uploadRoot = `${CV_UPLOAD_DIR}${path.sep}`;

  if (!resolvedPath.startsWith(uploadRoot)) {
    return null;
  }

  return resolvedPath;
};

const cleanupFile = async (filePath) => {
  if (!filePath) {
    return;
  }

  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

const cleanupUploadedCv = async (file) => {
  await cleanupFile(file?.path);
};

const deleteStoredCvByName = async (fileName) => {
  await cleanupFile(resolveCvPath(fileName));
};

export const uploadCv = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, CV_UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      const safeOriginalName = sanitizeCvFilename(file.originalname);
      cb(null, `tmp_${Date.now()}_${Math.round(Math.random() * 1e9)}_${safeOriginalName}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMime = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/octet-stream",
      "",
    ];
    const extension = path.extname(file.originalname || "").toLowerCase();

    if (ALLOWED_CV_EXTENSIONS.has(extension) || allowedMime.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error("Only PDF, DOC and DOCX files are allowed"));
  },
});

export const toDbStatus = (status) => {
  switch (status) {
    case "applied":
      return "applied";
    case "interview":
    case "scheduled_interview":
      return "reviewed";
    case "offered":
      return "accepted";
    case "rejected":
      return "rejected";
    default:
      return null;
  }
};

const toClientStatus = (status) => {
  switch (status) {
    case "reviewed":
      return "interview";
    case "accepted":
      return "offered";
    case "scheduled_interview":
      return "interview";
    default:
      return status;
  }
};

const mapRow = (row) => ({
  id: row.id,
  jobTitle: row.job_title,
  companyName: row.company_name,
  applicationDate: row.application_date,
  status: toClientStatus(row.status),
  jobPostId: row.job_post_id,
});

const mapRecruiterRow = (row) => ({
  id: row.id,
  candidateId: row.candidate_id,
  jobPostId: row.job_post_id,
  applicationDate: row.application_date,
  status: row.status,
  coverLetter: row.cover_letter || "",
  rating: row.rating,
  noteCount: Number(row.note_count || 0),
  candidateName: row.candidate_name,
  candidateEmail: row.candidate_email,
  candidatePhone: row.candidate_phone,
  jobTitle: row.job_title,
  companyName: row.company_name,
  cvFileName: row.cv_file_name,
});

const mapNoteRow = (row) => ({
  id: row.id,
  applicationId: row.application_id,
  recruiterId: row.recruiter_id,
  note: row.note,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapEventRow = (row) => ({
  id: row.id,
  applicationId: row.application_id,
  actorUserId: row.actor_user_id,
  eventType: row.event_type,
  title: row.title,
  description: row.description,
  metadata: row.metadata || {},
  createdAt: row.created_at,
});

const mapRecruiterDetailRow = (row) => ({
  ...mapRecruiterRow(row),
  coverLetter: row.cover_letter || "",
  rating: row.rating,
});

const mapActivityRow = (row) => ({
  id: row.id,
  applicationId: row.application_id,
  eventType: row.event_type,
  title: row.title,
  description: row.description,
  createdAt: row.created_at,
  candidateName: row.candidate_name,
  jobTitle: row.job_title,
});

const ensureRecruiterForCompany = async (client, companyName) => {
  const normalizedCompanyName = companyName.trim();
  const existing = await applicationRepository.findRecruiterByCompanyName(client, { companyName: normalizedCompanyName });

  if (existing) {
    return existing.id;
  }

  const loginName = `recruiter_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const passwordHash = await bcrypt.hash(loginName, 10);

  return applicationRepository.createRecruiter(client, {
    loginName,
    passwordHash,
    companyName: normalizedCompanyName,
    email: `${loginName}@local.invalid`,
  });
};

const assertValidTransition = (currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) {
    return;
  }

  const allowedNext = VALID_TRANSITIONS[currentStatus] || new Set();
  if (!allowedNext.has(nextStatus)) {
    throw createHttpError(400, `Invalid status transition from ${currentStatus} to ${nextStatus}`);
  }
};

const findOwnedApplicationOrThrow = async (client, { applicationId, recruiterId, action }) => {
  const application = await applicationRepository.findOwnedApplicationForUpdate(client, { applicationId, recruiterId });

  if (!application) {
    throw createHttpError(404, `Application not found or you don't have permission to ${action}`);
  }

  return application;
};

export const listForCandidate = async ({ user, query }) => {
  if (user.role !== "candidate") {
    return [];
  }

  const rawStatus = typeof query.status === "string" ? query.status.trim().toLowerCase() : "";
  const status = toDbStatus(rawStatus);
  const rows = await applicationRepository.findByCandidate({ candidateId: user.id, status });
  return rows.map(mapRow);
};

export const listForRecruiter = async ({ user, query }) => {
  assertRole(user, "recruiter", "Only recruiter accounts can access this resource");

  const { page, limit, offset } = getPagination(query);
  const rawJobPostId = Number(query.jobPostId);
  const jobPostId = Number.isInteger(rawJobPostId) && rawJobPostId > 0 ? rawJobPostId : null;
  const rawStatus = typeof query.status === "string" ? query.status.trim().toLowerCase() : "";
  const status = VALID_STATUSES.has(rawStatus) ? rawStatus : null;
  const result = await applicationRepository.findByRecruiter({
    recruiterId: user.id,
    page,
    limit,
    offset,
    jobPostId,
    status,
  });

  return {
    ...result,
    data: result.data.map(mapRecruiterRow),
  };
};

export const getActivity = async ({ user }) => {
  assertRole(user, "recruiter", "Only recruiter accounts can access activity");
  const rows = await applicationRepository.findActivity({ recruiterId: user.id });
  return rows.map(mapActivityRow);
};

export const getForRecruiter = async ({ user, applicationId }) => {
  assertRole(user, "recruiter", "Only recruiter accounts can access this resource");
  const id = parsePositiveId(applicationId, "application id");
  const application = await applicationRepository.findById({ applicationId: id, recruiterId: user.id });

  if (!application) {
    throw createHttpError(404, "Application not found");
  }

  const [notes, events] = await Promise.all([
    applicationRepository.findNotes({ applicationId: id }),
    applicationRepository.findEvents({ applicationId: id }),
  ]);

  return {
    ...mapRecruiterDetailRow(application),
    notes: notes.map(mapNoteRow),
    events: events.map(mapEventRow),
  };
};

export const downloadCv = async ({ user, applicationId }) => {
  assertRole(user, "recruiter", "Only recruiter accounts can access this resource");
  const id = parsePositiveId(applicationId, "application id");
  const cvFile = await applicationRepository.findCvForRecruiter({ applicationId: id, recruiterId: user.id });

  if (!cvFile) {
    throw createHttpError(404, "Application not found or you don't have permission to access this CV");
  }

  const filePath = resolveCvPath(cvFile.cv_file_name);
  if (!cvFile.cv_file_name || !filePath) {
    throw createHttpError(404, "CV file not found");
  }

  try {
    await fsPromises.access(filePath, fs.constants.R_OK);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw createHttpError(404, "CV file not found");
    }
    throw error;
  }

  return {
    applicationId: id,
    path: filePath,
    fileName: cvFile.cv_file_name,
    mimeType: cvFile.cv_mime_type || "application/octet-stream",
    size: cvFile.cv_file_size_bytes,
  };
};

export const update = async ({ user, applicationId, payload }) => {
  assertRole(user, "candidate", "Only candidate accounts can update applications");

  const id = parsePositiveId(applicationId, "application id");
  const { jobTitle, companyName, applicationDate, status } = payload;
  const dbStatus = toDbStatus(status);

  if (!jobTitle || !companyName || !applicationDate || !status || !dbStatus) {
    throw createHttpError(400, "jobTitle, companyName, applicationDate and status are required");
  }

  return applicationRepository.withTransaction(async (client) => {
    const existing = await applicationRepository.findCandidateApplicationForUpdate(client, {
      applicationId: id,
      candidateId: user.id,
    });

    if (!existing) {
      throw createHttpError(404, "Application not found");
    }

    const recruiterId = await ensureRecruiterForCompany(client, companyName);
    await applicationRepository.updateJobForCandidateApplication(client, {
      jobPostId: existing.job_post_id,
      title: jobTitle,
      recruiterId,
    });

    const updated = await applicationRepository.updateCandidateApplication(client, {
      applicationId: id,
      candidateId: user.id,
      applicationDate,
      status: dbStatus,
    });

    return {
      id: updated.id,
      jobTitle,
      companyName,
      applicationDate: updated.application_date,
      status: toClientStatus(updated.status),
    };
  });
};

export const remove = async ({ user, applicationId }) => {
  assertRole(user, "candidate", "Only candidate accounts can delete applications");
  const id = parsePositiveId(applicationId, "application id");
  const result = await applicationRepository.withTransaction(async (client) => {
    const deleted = await applicationRepository.delete(client, {
      applicationId: id,
      candidateId: user.id,
    });

    if (!deleted) {
      throw createHttpError(404, "Application not found");
    }

    return deleted;
  });

  try {
    await deleteStoredCvByName(result.cv_file_name);
  } catch (cleanupError) {
    console.error("Failed to delete CV file after application removal:", cleanupError.message);
  }
};

export const apply = async ({ user, body, file }) => {
  let storedCvPath = null;

  try {
    assertRole(user, "candidate", "Access Denied");

    const jobId = Number(body?.jobId);
    const coverLetter = typeof body?.coverLetter === "string" ? body.coverLetter.trim() : "";

    if (!jobId || Number.isNaN(jobId)) {
      throw createHttpError(400, "Invalid Job ID provided.");
    }

    if (!file) {
      throw createHttpError(400, "CV file is required.");
    }

    return await applicationRepository.withTransaction(async (client) => {
      const job = await applicationRepository.findJobById(client, { jobId });

      if (!job) {
        throw createHttpError(404, "Job post not found.");
      }

      if (job.deadline) {
        const deadlineDate = new Date(job.deadline);
        deadlineDate.setHours(23, 59, 59, 999);
        if (deadlineDate < new Date()) {
          throw createHttpError(400, "This job posting has closed and is no longer accepting applications.");
        }
      }

      const existing = await applicationRepository.findExistingCandidateApplication(client, {
        candidateId: user.id,
        jobId,
      });

      if (existing) {
        throw createHttpError(409, "You have already applied for this job.");
      }

      const application = await applicationRepository.create(client, {
        candidateId: user.id,
        jobId,
        coverLetter,
      });

      await applicationRepository.createApplicationEvent(client, {
        applicationId: application.id,
        actorUserId: user.id,
        eventType: "application_submitted",
        title: "Application submitted",
        description: coverLetter ? "Candidate included a cover letter." : "",
        metadata: { jobId },
      });

      const storedCvFileName = buildStoredCvFilename(application.id, file.originalname);
      storedCvPath = resolveCvPath(storedCvFileName);

      if (!storedCvPath) {
        throw new Error("Failed to build a safe CV storage path");
      }

      await fsPromises.rename(file.path, storedCvPath);
      await applicationRepository.updateCvMetadata(client, {
        applicationId: application.id,
        fileName: storedCvFileName,
        mimeType: file.mimetype || "application/octet-stream",
        fileSizeBytes: file.size,
      });

      return [{
        ...application,
        cv_file_name: storedCvFileName,
        cv_mime_type: file.mimetype || "application/octet-stream",
        cv_file_size_bytes: file.size,
      }];
    });
  } catch (error) {
    await cleanupUploadedCv(file);
    await cleanupFile(storedCvPath);

    if (error.code === "23503") {
      throw createHttpError(400, "Invalid job post reference.");
    }

    throw error;
  }
};

export const updateStatus = async ({ user, applicationId, status }) => {
  assertRole(user, "recruiter", "Only recruiter accounts can update application status");
  const id = parsePositiveId(applicationId, "application id");

  if (!status || !VALID_STATUSES.has(status)) {
    throw createHttpError(400, "Invalid status. Must be one of: applied, reviewed, scheduled_interview, accepted, rejected");
  }

  return applicationRepository.withTransaction(async (client) => {
    const application = await findOwnedApplicationOrThrow(client, {
      applicationId: id,
      recruiterId: user.id,
      action: "update it",
    });

    assertValidTransition(application.status, status);
    const updated = await applicationRepository.updateStatus(client, { applicationId: id, status });

    await applicationRepository.createApplicationEvent(client, {
      applicationId: id,
      actorUserId: user.id,
      eventType: "status_changed",
      title: `Status changed to ${status}`,
      metadata: { from: application.status, to: status, changedBy: user.id },
    });

    return { id: updated.id, status: updated.status };
  });
};

export const updateRating = async ({ user, applicationId, rating }) => {
  assertRole(user, "recruiter", "Only recruiter accounts can rate applications");
  const id = parsePositiveId(applicationId, "application id");
  const normalizedRating = rating === null ? null : Number(rating);

  if (normalizedRating !== null && (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5)) {
    throw createHttpError(400, "Rating must be between 1 and 5");
  }

  return applicationRepository.withTransaction(async (client) => {
    const updated = await applicationRepository.updateRating(client, {
      applicationId: id,
      recruiterId: user.id,
      rating: normalizedRating,
    });

    if (!updated) {
      throw createHttpError(404, "Application not found or you don't have permission to update it");
    }

    await applicationRepository.createApplicationEvent(client, {
      applicationId: id,
      actorUserId: user.id,
      eventType: "rating_updated",
      title: normalizedRating === null ? "Rating cleared" : `Rating set to ${normalizedRating}/5`,
      metadata: { rating: normalizedRating },
    });

    return { id, rating: updated.rating };
  });
};

export const addNote = async ({ user, applicationId, note }) => {
  assertRole(user, "recruiter", "Only recruiter accounts can add notes");
  const id = parsePositiveId(applicationId, "application id");
  const normalizedNote = typeof note === "string" ? note.trim() : "";

  if (!normalizedNote) {
    throw createHttpError(400, "Note is required");
  }

  return applicationRepository.withTransaction(async (client) => {
    await findOwnedApplicationOrThrow(client, {
      applicationId: id,
      recruiterId: user.id,
      action: "add notes",
    });

    const row = await applicationRepository.addNote(client, {
      applicationId: id,
      recruiterId: user.id,
      note: normalizedNote,
    });

    await applicationRepository.createApplicationEvent(client, {
      applicationId: id,
      actorUserId: user.id,
      eventType: "note_added",
      title: "Internal note added",
      description: normalizedNote,
      metadata: { noteId: row.id },
    });

    return mapNoteRow(row);
  });
};

export const updateNote = async ({ user, applicationId, noteId, note }) => {
  assertRole(user, "recruiter", "Only recruiter accounts can update notes");
  const id = parsePositiveId(applicationId, "application id");
  const normalizedNoteId = parsePositiveId(noteId, "note reference");
  const normalizedNote = typeof note === "string" ? note.trim() : "";

  if (!normalizedNote) {
    throw createHttpError(400, "Note is required");
  }

  return applicationRepository.withTransaction(async (client) => {
    const updated = await applicationRepository.updateNote(client, {
      applicationId: id,
      noteId: normalizedNoteId,
      recruiterId: user.id,
      note: normalizedNote,
    });

    if (!updated) {
      throw createHttpError(404, "Note not found or you don't have permission to update it");
    }

    await applicationRepository.createApplicationEvent(client, {
      applicationId: id,
      actorUserId: user.id,
      eventType: "note_updated",
      title: "Internal note updated",
      description: normalizedNote,
      metadata: { noteId: normalizedNoteId },
    });

    return mapNoteRow(updated);
  });
};

export const deleteNote = async ({ user, applicationId, noteId }) => {
  assertRole(user, "recruiter", "Only recruiter accounts can delete notes");
  const id = parsePositiveId(applicationId, "application id");
  const normalizedNoteId = parsePositiveId(noteId, "note reference");

  await applicationRepository.withTransaction(async (client) => {
    const deleted = await applicationRepository.deleteNote(client, {
      applicationId: id,
      noteId: normalizedNoteId,
      recruiterId: user.id,
    });

    if (!deleted) {
      throw createHttpError(404, "Note not found or you don't have permission to delete it");
    }

    await applicationRepository.createApplicationEvent(client, {
      applicationId: id,
      actorUserId: user.id,
      eventType: "note_deleted",
      title: "Internal note deleted",
      metadata: { noteId: normalizedNoteId },
    });
  });
};

export const reject = async ({ user, applicationId, reason, emailBody }) => {
  assertRole(user, "recruiter", "Only recruiter accounts can reject applications");
  const id = parsePositiveId(applicationId, "application id");
  const normalizedReason = typeof reason === "string" ? reason.trim() : "";
  const normalizedEmailBody = typeof emailBody === "string" ? emailBody.trim() : "";

  if (!normalizedEmailBody) {
    throw createHttpError(400, "emailBody is required");
  }

  return applicationRepository.withTransaction(async (client) => {
    const ownedApplication = await findOwnedApplicationOrThrow(client, {
      applicationId: id,
      recruiterId: user.id,
      action: "update it",
    });
    assertValidTransition(ownedApplication.status, "rejected");

    const application = await applicationRepository.reject(client, {
      applicationId: id,
      recruiterId: user.id,
      reason: normalizedReason,
      emailBody: normalizedEmailBody,
    });

    if (!application) {
      throw createHttpError(404, "Application not found or you don't have permission to update it");
    }

    await applicationRepository.createApplicationEvent(client, {
      applicationId: id,
      actorUserId: user.id,
      eventType: "application_rejected",
      title: "Application rejected",
      description: normalizedReason || normalizedEmailBody,
      metadata: { reason: normalizedReason },
    });

    return { id, status: "rejected", reason: normalizedReason, emailBody: normalizedEmailBody };
  });
};

export const offer = async ({ user, applicationId, subject, content }) => {
  assertRole(user, "recruiter", "Only recruiter accounts can extend offers");
  const id = parsePositiveId(applicationId, "application id");
  const normalizedSubject = typeof subject === "string" ? subject.trim() : "";
  const emailBody = typeof content === "string" ? content.trim() : "";

  if (!normalizedSubject || !emailBody) {
    throw createHttpError(400, "subject and content are required");
  }

  return applicationRepository.withTransaction(async (client) => {
    const ownedApplication = await findOwnedApplicationOrThrow(client, {
      applicationId: id,
      recruiterId: user.id,
      action: "update it",
    });
    assertValidTransition(ownedApplication.status, "accepted");

    const result = await applicationRepository.offer(client, {
      applicationId: id,
      recruiterId: user.id,
      subject: normalizedSubject,
      emailBody,
    });

    if (!result) {
      throw createHttpError(404, "Application not found or you don't have permission to update it");
    }

    await applicationRepository.createApplicationEvent(client, {
      applicationId: id,
      actorUserId: user.id,
      eventType: "offer_sent",
      title: "Offer sent",
      description: normalizedSubject,
      metadata: { messageId: result.message?.id },
    });

    return {
      id,
      status: "accepted",
      messageId: result.message?.id,
      createdAt: result.message?.created_at,
    };
  });
};
