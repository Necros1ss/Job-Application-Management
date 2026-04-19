import express from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

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

router.post("/", requireAuth, async (req, res) => {
  if (req.user.role !== "candidate") {
    return res.status(403).json({ message: "Only candidate accounts can create applications" });
  }

  const { jobTitle, companyName, applicationDate, status } = req.body;
  const dbStatus = toDbStatus(status);

  if (!jobTitle || !companyName || !applicationDate || !status || !dbStatus) {
    return res.status(400).json({ message: "jobTitle, companyName, applicationDate and status are required" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const recruiterId = await ensureRecruiterForCompany(client, companyName);

    const jobPostInsert = await client.query(
      `INSERT INTO job_posts (recruiter_id, title)
       VALUES ($1, $2)
       RETURNING id`,
      [recruiterId, jobTitle]
    );

    const jobPostId = jobPostInsert.rows[0].id;

    const appInsert = await client.query(
      `INSERT INTO applications (candidate_id, job_post_id, applied_at, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, applied_at::date AS application_date, status`,
      [req.user.id, jobPostId, applicationDate, dbStatus]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      id: appInsert.rows[0].id,
      jobTitle,
      companyName,
      applicationDate: appInsert.rows[0].application_date,
      status: toClientStatus(appInsert.rows[0].status),
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to create application", detail: error.message });
  } finally {
    client.release();
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
    return res.status(403).json({message: "Access Denied"});
  }

  const jobId = Number(req.body?.jobId);
  const coverLetter = typeof req.body?.coverLetter === "string" ? req.body.coverLetter.trim() : "";

  if (!jobId || isNaN(jobId)) {
    return res.status(400).json({ message: "Invalid Job ID provided." });
  }

  if (!req.file) {
    return res.status(400).json({ message: "CV file is required." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const checkExist = await client.query(
      'SELECT 1 FROM applications WHERE candidate_id = $1 AND job_post_id = $2',
      [req.user.id, jobId]
    );

    if (checkExist.rows.length > 0 )
    {
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
    return res.status(500).json({ message: "Failed to submit applications", detail: error.message });
  } finally {
    client.release();
  }
});

export default router;
