import express from "express";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const createApplicationEvent = async (
  client,
  { applicationId, actorUserId, eventType, title, description = "", metadata = {} }
) => {
  await client.query(
    `INSERT INTO application_events (
       application_id,
       actor_user_id,
       event_type,
       title,
       description,
       metadata
     ) VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [
      applicationId,
      actorUserId,
      eventType,
      title,
      description,
      JSON.stringify(metadata),
    ]
  );
};

const normalizeInterviewPayload = (body = {}) => {
  const applicationId = Number(body.applicationId ?? body.application_id);
  const interviewDateTime =
    typeof (body.interviewDateTime ?? body.interview_datetime) === "string"
      ? (body.interviewDateTime ?? body.interview_datetime).trim()
      : "";
  const interviewerName =
    typeof (body.interviewerName ?? body.interviewer_name) === "string"
      ? (body.interviewerName ?? body.interviewer_name).trim()
      : "";
  const mode = typeof body.mode === "string" ? body.mode.trim().toLowerCase() : "online";
  const meetLink =
    typeof (body.meetLink ?? body.meet_link) === "string" ? (body.meetLink ?? body.meet_link).trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";

  return { applicationId, interviewDateTime, interviewerName, mode, meetLink, location, notes };
};

const selectInterviewById = async (client, interviewId, recruiterId) =>
  client.query(
    `SELECT i.id,
            i.application_id,
            i.recruiter_id,
            i.interviewer_name,
            i.interview_datetime,
            i.mode,
            i.meet_link,
            i.location,
            i.notes,
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
     WHERE i.id = $1 AND i.recruiter_id = $2
     LIMIT 1`,
    [interviewId, recruiterId]
  );

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

router.get("/candidate", requireAuth, async (req, res) => {
  if (req.user.role !== "candidate") {
    return res.status(403).json({ message: "Only candidate accounts can view their interviews" });
  }

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
       INNER JOIN recruiters r ON r.id = jp.recruiter_id
       WHERE a.candidate_id = $1
         AND i.interview_datetime >= NOW()
       ORDER BY i.interview_datetime ASC`,
      [req.user.id]
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load interviews", detail: error.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can schedule interviews" });
  }

  const {
    applicationId,
    interviewDateTime,
    interviewerName,
    mode,
    meetLink,
    location,
    notes,
  } = normalizeInterviewPayload(req.body);

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({ message: "Invalid application id" });
  }

  if (!interviewDateTime || !interviewerName) {
    return res.status(400).json({ message: "interviewDateTime and interviewerName are required" });
  }

  if (!["online", "offline"].includes(mode)) {
    return res.status(400).json({ message: "mode must be online or offline" });
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

    await createApplicationEvent(client, {
      applicationId,
      actorUserId: req.user.id,
      eventType: "interview_scheduled",
      title: "Interview scheduled",
      description: notes,
      metadata: {
        interviewId: interviewResult.rows[0]?.id,
        interviewDateTime,
        mode,
      },
    });

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

router.put("/:id", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can update interviews" });
  }

  const interviewId = Number(req.params.id);
  if (!Number.isInteger(interviewId) || interviewId <= 0) {
    return res.status(400).json({ message: "Invalid interview id" });
  }

  const { interviewDateTime, interviewerName, mode, meetLink, location, notes } = normalizeInterviewPayload(req.body);

  if (!interviewDateTime || !interviewerName) {
    return res.status(400).json({ message: "interviewDateTime and interviewerName are required" });
  }

  if (!["online", "offline"].includes(mode)) {
    return res.status(400).json({ message: "mode must be online or offline" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingResult = await selectInterviewById(client, interviewId, req.user.id);
    if (existingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Interview not found or you don't have permission to update it" });
    }

    await client.query(
      `UPDATE interviews
       SET interviewer_name = $1,
           interview_datetime = $2,
           mode = $3,
           meet_link = $4,
           location = $5,
           notes = $6
       WHERE id = $7 AND recruiter_id = $8`,
      [interviewerName, interviewDateTime, mode, meetLink, location, notes, interviewId, req.user.id]
    );

    await createApplicationEvent(client, {
      applicationId: existingResult.rows[0].application_id,
      actorUserId: req.user.id,
      eventType: "interview_updated",
      title: "Interview updated",
      description: notes,
      metadata: {
        interviewId,
        interviewDateTime,
        mode,
      },
    });

    const updatedResult = await selectInterviewById(client, interviewId, req.user.id);

    await client.query("COMMIT");
    return res.json(updatedResult.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to update interview", detail: error.message });
  } finally {
    client.release();
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can delete interviews" });
  }

  const interviewId = Number(req.params.id);
  if (!Number.isInteger(interviewId) || interviewId <= 0) {
    return res.status(400).json({ message: "Invalid interview id" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingResult = await selectInterviewById(client, interviewId, req.user.id);
    if (existingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Interview not found or you don't have permission to delete it" });
    }

    const interview = existingResult.rows[0];

    await client.query(
      "DELETE FROM interviews WHERE id = $1 AND recruiter_id = $2",
      [interviewId, req.user.id]
    );

    await createApplicationEvent(client, {
      applicationId: interview.application_id,
      actorUserId: req.user.id,
      eventType: "interview_cancelled",
      title: "Interview cancelled",
      description: interview.notes || "",
      metadata: {
        interviewId,
        interviewDateTime: interview.interview_datetime,
        mode: interview.mode,
      },
    });

    const remainingResult = await client.query(
      "SELECT COUNT(*)::int AS count FROM interviews WHERE application_id = $1",
      [interview.application_id]
    );

    if ((remainingResult.rows[0]?.count || 0) === 0) {
      await client.query(
        `UPDATE applications
         SET status = 'reviewed'
         WHERE id = $1 AND status = 'scheduled_interview'`,
        [interview.application_id]
      );
    }

    await client.query("COMMIT");
    return res.json({ id: interviewId, deleted: true });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to delete interview", detail: error.message });
  } finally {
    client.release();
  }
});

export default router;
