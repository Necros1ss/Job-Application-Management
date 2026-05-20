import express from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const getPagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 50);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

const normalizeUploadedFilename = (originalName) => {
  if (typeof originalName !== "string" || originalName.length === 0) {
    return "cv-upload";
  }

  // Multipart filename headers are often latin1-decoded by default; repair common mojibake.
  const hasMojibakeSignals = /[ÃÂÌ]/.test(originalName) || /[\u0080-\u009f]/.test(originalName);
  const candidate = hasMojibakeSignals
    ? Buffer.from(originalName, "latin1").toString("utf8")
    : originalName;

  // Remove control characters that can break display/query tools.
  return candidate.replace(/[\u0000-\u001f\u007f-\u009f]/g, "").normalize("NFC").trim() || "cv-upload";
};

const uploadCv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMime = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/octet-stream",
      "",
    ];

    const allowedExtensions = new Set([".pdf", ".doc", ".docx"]);
    const extension = path.extname(file.originalname || "").toLowerCase();
    const isAllowedExtension = allowedExtensions.has(extension);

    if (isAllowedExtension || allowedMime.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error("Only PDF, DOC and DOCX files are allowed"));
  },
});

const toDbStatus = (status) => {
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
  jobPostId: row.job_post_id
});

const mapRecruiterRow = (row) => ({
  id: row.id,
  candidateId: row.candidate_id,
  jobPostId: row.job_post_id,
  applicationDate: row.application_date,
  status: row.status,
  candidateName: row.candidate_name,
  candidateEmail: row.candidate_email,
  candidatePhone: row.candidate_phone,
  jobTitle: row.job_title,
  companyName: row.company_name,
  cvFileName: row.cv_file_name,
});

const ensureRecruiterForCompany = async (client, companyName) => {
  const normalizedCompanyName = companyName.trim();

  const existing = await client.query(
    `SELECT id
     FROM recruiters
     WHERE lower(company_name) = lower($1)
     LIMIT 1`,
    [normalizedCompanyName]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const loginName = `recruiter_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const passwordHash = await bcrypt.hash(loginName, 10);

  const userInsert = await client.query(
    `INSERT INTO users (login_name, password_hash, role)
     VALUES ($1, $2, 'recruiter')
     RETURNING id`,
    [loginName, passwordHash]
  );

  const recruiterId = userInsert.rows[0].id;

  await client.query(
    `INSERT INTO recruiters (id, company_name, email)
     VALUES ($1, $2, $3)`,
    [recruiterId, normalizedCompanyName, `${loginName}@local.invalid`]
  );

  return recruiterId;
};

router.get("/", requireAuth, async (req, res) => {
  if (req.user.role !== "candidate") {
    return res.json([]);
  }

  const rawStatus = typeof req.query.status === "string" ? req.query.status.trim().toLowerCase() : ""
  
  const status = toDbStatus(rawStatus);

  try {
    let query = `
      SELECT
          a.id,
          jp.title AS job_title,
          COALESCE(r.company_name, 'Unknown Company') AS company_name,
          a.applied_at::date AS application_date,
          a.status,
          a.job_post_id
       FROM applications a
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       LEFT JOIN recruiters r ON r.id = jp.recruiter_id
       WHERE a.candidate_id = $1`;

    const queryParams = [req.user.id];

    if (status) {
      query += ` AND a.status = $2`;
      queryParams.push(status);
    }

    query += ` ORDER BY a.applied_at DESC, a.id DESC`;

    const result = await pool.query(query, queryParams);

    return res.json(result.rows.map(mapRow));
  } 
  catch (error) {
    return res.status(500).json({ message: "Failed to load applications", detail: error.message });
  }
});

router.get("/recruiter", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can access this resource" });
  }

  const { page, limit, offset } = getPagination(req.query);
  const jobPostId = Number(req.query.jobPostId);
  const hasJobPostFilter = Number.isInteger(jobPostId) && jobPostId > 0;

  try {
    const baseParams = [req.user.id];
    let filterSql = "WHERE jp.recruiter_id = $1";

    if (hasJobPostFilter) {
      baseParams.push(jobPostId);
      filterSql += " AND jp.id = $2";
    }

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM applications a
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       ${filterSql}`,
      baseParams
    );

    const total = Number(countResult.rows[0]?.total || 0);
    const totalPages = Math.ceil(total / limit);

    const result = await pool.query(
      `SELECT
          a.id,
          a.candidate_id,
          a.job_post_id,
          a.applied_at::date AS application_date,
          a.status,
          c.name AS candidate_name,
          c.email AS candidate_email,
          c.phone AS candidate_phone,
          jp.title AS job_title,
           COALESCE(r.company_name, 'Unknown Company') AS company_name,
           af.file_name AS cv_file_name
       FROM applications a
       INNER JOIN candidates c ON c.id = a.candidate_id
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       LEFT JOIN recruiters r ON r.id = jp.recruiter_id
         LEFT JOIN application_files af ON af.application_id = a.id AND af.file_type = 'cv'
       ${filterSql}
       ORDER BY a.applied_at DESC, a.id DESC
       LIMIT $${baseParams.length + 1} OFFSET $${baseParams.length + 2}`,
      [...baseParams, limit, offset]
    );

    return res.json({
      data: result.rows.map(mapRecruiterRow),
      total,
      page,
      totalPages,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load recruiter applications", detail: error.message });
  }
});

router.get("/recruiter/:id", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can access this resource" });
  }

  const applicationId = Number(req.params.id);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({ message: "Invalid application id" });
  }

  try {
    const result = await pool.query(
      `SELECT
          a.id,
          a.candidate_id,
          a.job_post_id,
          a.applied_at::date AS application_date,
          a.status,
          c.name AS candidate_name,
          c.email AS candidate_email,
          c.phone AS candidate_phone,
          jp.title AS job_title,
           COALESCE(r.company_name, 'Unknown Company') AS company_name,
           af.file_name AS cv_file_name
       FROM applications a
       INNER JOIN candidates c ON c.id = a.candidate_id
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       LEFT JOIN recruiters r ON r.id = jp.recruiter_id
         LEFT JOIN application_files af ON af.application_id = a.id AND af.file_type = 'cv'
       WHERE jp.recruiter_id = $1 AND a.id = $2
       LIMIT 1`,
      [req.user.id, applicationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    return res.json(mapRecruiterRow(result.rows[0]));
  } catch (error) {
    return res.status(500).json({ message: "Failed to load recruiter application detail", detail: error.message });
  }
});

router.get("/recruiter/:id/cv", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can access this resource" });
  }

  const applicationId = Number(req.params.id);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({ message: "Invalid application id" });
  }

  try {
    const result = await pool.query(
      `SELECT
          af.file_name,
          af.mime_type,
          af.file_data
       FROM applications a
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       INNER JOIN application_files af ON af.application_id = a.id AND af.file_type = 'cv'
       WHERE jp.recruiter_id = $1 AND a.id = $2
       LIMIT 1`,
      [req.user.id, applicationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "CV file not found" });
    }

    const file = result.rows[0];
    res.setHeader("Content-Type", file.mime_type || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${file.file_name || `cv-${applicationId}`}"`);
    return res.send(file.file_data);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load CV file", detail: error.message });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  if (req.user.role !== "candidate") {
    return res.status(403).json({ message: "Only candidate accounts can update applications" });
  }

  const { id } = req.params;
  const { jobTitle, companyName, applicationDate, status } = req.body;
  const dbStatus = toDbStatus(status);

  if (!jobTitle || !companyName || !applicationDate || !status || !dbStatus) {
    return res.status(400).json({ message: "jobTitle, companyName, applicationDate and status are required" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT id, job_post_id
       FROM applications
       WHERE id = $1 AND candidate_id = $2`,
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Application not found" });
    }

    const recruiterId = await ensureRecruiterForCompany(client, companyName);

    await client.query(
      `UPDATE job_posts
       SET title = $1,
           recruiter_id = $2
       WHERE id = $3`,
      [jobTitle, recruiterId, existing.rows[0].job_post_id]
    );

    const update = await client.query(
      `UPDATE applications
       SET applied_at = $1,
           status = $2
       WHERE id = $3 AND candidate_id = $4
       RETURNING id, applied_at::date AS application_date, status`,
      [applicationDate, dbStatus, id, req.user.id]
    );

    await client.query("COMMIT");

    return res.json({
      id: update.rows[0].id,
      jobTitle,
      companyName,
      applicationDate: update.rows[0].application_date,
      status: toClientStatus(update.rows[0].status),
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to update application", detail: error.message });
  } finally {
    client.release();
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  if (req.user.role !== "candidate") {
    return res.status(403).json({ message: "Only candidate accounts can delete applications" });
  }

  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      "DELETE FROM applications WHERE id = $1 AND candidate_id = $2",
      [id, req.user.id]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Application not found" });
    }

    await client.query("COMMIT");

    return res.status(204).send();
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to delete application", detail: error.message });
  } finally {
    client.release();
  }
});



router.post("/apply", requireAuth, uploadCv.single("cvFile"), async (req, res) => {
  if (req.user.role !== "candidate") {
    return res.status(403).json({ message: "Access Denied" });
  }

  const jobId = Number(req.body?.jobId);

  if (!jobId || isNaN(jobId)) {
    return res.status(400).json({ message: "Invalid Job ID provided." });
  }

  if (!req.file) {
    return res.status(400).json({ message: "CV file is required." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const jobCheck = await client.query(
      "SELECT id, deadline FROM job_posts WHERE id = $1",
      [jobId]
    );

    if (jobCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Job post not found." });
    }

    if (jobCheck.rows[0].deadline) {
      const deadlineDate = new Date(jobCheck.rows[0].deadline);
      deadlineDate.setHours(23, 59, 59, 999);
      if (deadlineDate < new Date()) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "This job posting has closed and is no longer accepting applications." });
      }
    }

    const checkExist = await client.query(
      "SELECT 1 FROM applications WHERE candidate_id = $1 AND job_post_id = $2",
      [req.user.id, jobId]
    );

    if (checkExist.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "You have already applied for this job." });
    }

    const application = await client.query(
      `INSERT INTO applications (candidate_id, job_post_id, applied_at, status)
       VALUES ($1, $2, NOW(), 'applied')
       RETURNING *`,
      [req.user.id, jobId]
    );

    const normalizedFileName = normalizeUploadedFilename(req.file.originalname);

    await client.query(
      `INSERT INTO application_files (
          application_id,
          file_type,
          file_name,
          mime_type,
          file_size_bytes,
          file_data
       ) VALUES ($1, 'cv', $2, $3, $4, $5)`,
      [
        application.rows[0].id,
        normalizedFileName,
        req.file.mimetype,
        req.file.size,
        req.file.buffer,
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json([application.rows[0]]);
  }
  catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23503") {
      return res.status(400).json({ message: "Invalid job post reference." });
    }

    return res.status(500).json({ message: "Failed to submit applications", detail: error.message });
  } finally {
    client.release();
  }
});

router.patch("/:id/status", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can update application status" });
  }

  const applicationId = Number(req.params.id);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({ message: "Invalid application id" });
  }

  const { status } = req.body;
  const validStatuses = new Set(["applied", "reviewed", "scheduled_interview", "accepted", "rejected"]);
  if (!status || !validStatuses.has(status)) {
    return res.status(400).json({ message: "Invalid status. Must be one of: applied, reviewed, scheduled_interview, accepted, rejected" });
  }

  try {
    const result = await pool.query(
      `UPDATE applications a
       SET status = $1
       FROM job_posts jp
       WHERE a.id = $2
         AND a.job_post_id = jp.id
         AND jp.recruiter_id = $3
       RETURNING a.id`,
      [status, applicationId, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Application not found or you don't have permission to update it" });
    }

    return res.json({ id: applicationId, status });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update application status", detail: error.message });
  }
});

router.post("/:id/reject", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can reject applications" });
  }

  const applicationId = Number(req.params.id);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({ message: "Invalid application id" });
  }

  const reason = typeof req.body.reason === "string" ? req.body.reason.trim() : "";
  const emailBody = typeof req.body.emailBody === "string" ? req.body.emailBody.trim() : "";

  if (!emailBody) {
    return res.status(400).json({ message: "emailBody is required" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const applicationResult = await client.query(
      `SELECT a.id, a.candidate_id, a.job_post_id, jp.title AS job_title
       FROM applications a
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       WHERE a.id = $1
         AND jp.recruiter_id = $2
       LIMIT 1`,
      [applicationId, req.user.id]
    );

    if (applicationResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Application not found or you don't have permission to update it" });
    }

    const application = applicationResult.rows[0];

    await client.query(
      `UPDATE applications
       SET status = 'rejected',
           rejection_reason = $1,
           rejection_email_body = $2
       WHERE id = $3`,
      [reason, emailBody, applicationId]
    );

    await client.query(
      `INSERT INTO messages (
         sender_recruiter_id,
         receiver_candidate_id,
         subject,
         content,
         job_post_id,
         application_id
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user.id,
        application.candidate_id,
        `Application update - ${application.job_title}`,
        emailBody,
        application.job_post_id,
        applicationId,
      ]
    );

    await client.query("COMMIT");

    return res.json({ id: applicationId, status: "rejected", reason, emailBody });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to reject application", detail: error.message });
  } finally {
    client.release();
  }
});

router.post("/:id/offer", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can extend offers" });
  }

  const applicationId = Number(req.params.id);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({ message: "Invalid application id" });
  }

  const subject = typeof req.body.subject === "string" ? req.body.subject.trim() : "";
  const emailBody = typeof req.body.content === "string" ? req.body.content.trim() : "";

  if (!subject || !emailBody) {
    return res.status(400).json({ message: "subject and content are required" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const applicationResult = await client.query(
      `SELECT a.id, a.candidate_id, a.job_post_id, jp.title AS job_title
       FROM applications a
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       WHERE a.id = $1
         AND jp.recruiter_id = $2
       LIMIT 1`,
      [applicationId, req.user.id]
    );

    if (applicationResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Application not found or you don't have permission to update it" });
    }

    const application = applicationResult.rows[0];

    await client.query(
      `UPDATE applications
       SET status = 'accepted'
       WHERE id = $1`,
      [applicationId]
    );

    const messageResult = await client.query(
      `INSERT INTO messages (
         sender_recruiter_id,
         receiver_candidate_id,
         subject,
         content,
         job_post_id,
         application_id
       ) VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [
        req.user.id,
        application.candidate_id,
        subject,
        emailBody,
        application.job_post_id,
        applicationId,
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      id: applicationId,
      status: "accepted",
      messageId: messageResult.rows[0]?.id,
      createdAt: messageResult.rows[0]?.created_at,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to send offer", detail: error.message });
  } finally {
    client.release();
  }
});

export default router;
