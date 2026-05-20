import express from "express";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  if (req.user.role !== "candidate") {
    return res.json([]);
  }

  const upcomingOnly = String(req.query.upcoming || "").toLowerCase() === "true";

  try {
    const result = await pool.query(
      `SELECT i.id,
              i.application_id,
              i.interview_datetime,
              i.mode,
              i.meet_link,
              i.location,
              i.notes,
              i.interviewer_name,
              jp.id AS job_post_id,
              jp.title AS job_title,
              r.company_name
       FROM interviews i
       INNER JOIN applications a ON a.id = i.application_id
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       LEFT JOIN recruiters r ON r.id = jp.recruiter_id
       WHERE a.candidate_id = $1
         AND ($2::boolean = false OR i.interview_datetime >= NOW())
       ORDER BY i.interview_datetime ASC`,
      [req.user.id, upcomingOnly]
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load interviews", detail: error.message });
  }
});

router.get("/recruiter", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can view recruiter interviews" });
  }

  const upcomingOnly = String(req.query.upcoming || "").toLowerCase() === "true";

  try {
    const result = await pool.query(
      `SELECT i.id,
              i.application_id,
              i.interview_datetime,
              i.mode,
              i.meet_link,
              i.location,
              i.notes,
              i.interviewer_name,
              c.id AS candidate_id,
              c.name AS candidate_name,
              c.email AS candidate_email,
              c.phone AS candidate_phone,
              jp.id AS job_post_id,
              jp.title AS job_title,
              r.company_name
       FROM interviews i
       INNER JOIN applications a ON a.id = i.application_id
       INNER JOIN candidates c ON c.id = a.candidate_id
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       INNER JOIN recruiters r ON r.id = jp.recruiter_id
       WHERE i.recruiter_id = $1
         AND ($2::boolean = false OR i.interview_datetime >= NOW())
       ORDER BY i.interview_datetime ASC`,
      [req.user.id, upcomingOnly]
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load recruiter interviews", detail: error.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can schedule interviews" });
  }

  const applicationId = Number(req.body.applicationId);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({ message: "Invalid application id" });
  }

  const interviewDateTime = typeof req.body.interviewDateTime === "string" ? req.body.interviewDateTime.trim() : "";
  const interviewerName = typeof req.body.interviewerName === "string" ? req.body.interviewerName.trim() : "";
  const mode = typeof req.body.mode === "string" ? req.body.mode.trim().toLowerCase() : "online";
  const meetLink = typeof req.body.meetLink === "string" ? req.body.meetLink.trim() : "";
  const location = typeof req.body.location === "string" ? req.body.location.trim() : "";
  const notes = typeof req.body.notes === "string" ? req.body.notes.trim() : "";

  if (!interviewDateTime || !interviewerName) {
    return res.status(400).json({ message: "interviewDateTime and interviewerName are required" });
  }

  if (!notes) {
    return res.status(400).json({ message: "notes are required" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const applicationResult = await client.query(
      `SELECT a.id, a.job_post_id
            , a.candidate_id
            , c.name AS candidate_name
            , jp.title AS job_title
       FROM applications a
       INNER JOIN candidates c ON c.id = a.candidate_id
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       WHERE a.id = $1 AND jp.recruiter_id = $2
       LIMIT 1`,
      [applicationId, req.user.id]
    );

    if (applicationResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Application not found or you don't have permission to update it" });
    }

    const application = applicationResult.rows[0];

    const interviewResult = await client.query(
      `INSERT INTO interviews (
         application_id,
         recruiter_id,
         interviewer_name,
         interview_datetime,
         mode,
         meet_link,
         location,
         notes
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, application_id, recruiter_id, interviewer_name, interview_datetime, mode, meet_link, location, notes, created_at`,
      [
        applicationId,
        req.user.id,
        interviewerName,
        interviewDateTime,
        mode,
        meetLink,
        location,
        notes,
      ]
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
        `Interview scheduled - ${application.job_title}`,
        notes,
        application.job_post_id,
        applicationId,
      ]
    );

    await client.query(
      `UPDATE applications
       SET status = 'scheduled_interview'
       WHERE id = $1`,
      [applicationId]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      interview: interviewResult.rows[0],
      application: { id: applicationId, status: "scheduled_interview" },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to schedule interview", detail: error.message });
  } finally {
    client.release();
  }
});

export default router;
