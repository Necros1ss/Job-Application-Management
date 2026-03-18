import express from "express";
import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

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

  try {
    const result = await pool.query(
      `SELECT
          a.id,
          jp.title AS job_title,
          COALESCE(r.company_name, 'Unknown Company') AS company_name,
          a.applied_at::date AS application_date,
          a.status
       FROM applications a
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       LEFT JOIN recruiters r ON r.id = jp.recruiter_id
       WHERE a.candidate_id = $1
       ORDER BY a.applied_at DESC, a.id DESC`,
      [req.user.id]
    );

    return res.json(result.rows.map(mapRow));
  } catch (error) {
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

    const jobPostId = existing.rows[0].job_post_id;

    await client.query(
      "DELETE FROM applications WHERE id = $1 AND candidate_id = $2",
      [id, req.user.id]
    );

    await client.query(
      `DELETE FROM job_posts
       WHERE id = $1
         AND NOT EXISTS (
           SELECT 1 FROM applications WHERE job_post_id = $1
         )`,
      [jobPostId]
    );

    await client.query("COMMIT");

    return res.status(204).send();
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to delete application", detail: error.message });
  } finally {
    client.release();
  }
});

export default router;
