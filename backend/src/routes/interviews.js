import express from "express";
import { pool } from "../config/db.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { broadcast } from "../utils/notificationBroadcast.js";
import { createInterviewSchema } from "../validators/interviewValidators.js";
import { routeErrorResponse } from "../utils/apiResponse.js";

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
  const interviewerId = Number(body.interviewerId ?? body.interviewer_id) || null;
  const mode = typeof body.mode === "string" ? body.mode.trim().toLowerCase() : "online";
  const meetLink =
    typeof (body.meetLink ?? body.meet_link) === "string" ? (body.meetLink ?? body.meet_link).trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";

  return { applicationId, interviewDateTime, interviewerName, interviewerId, mode, meetLink, location, notes };
};

const selectInterviewById = async (client, interviewId, recruiterId) =>
  client.query(
    `SELECT i.id,
            i.application_id,
            i.recruiter_id,
            i.interviewer_name,
            i.interviewer_id,
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
              i.interviewer_id,
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
    return res.status(500).json(routeErrorResponse("Failed to load recruiter interviews", error));
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
    return res.status(500).json(routeErrorResponse("Failed to load interviews", error));
  }
});

router.post("/", requireAuth, validate(createInterviewSchema), async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can schedule interviews" });
  }

  const {
    applicationId,
    interviewDateTime,
    interviewerName,
    interviewerId,
    mode,
    meetLink,
    location,
    notes,
  } = normalizeInterviewPayload(req.body);

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({ message: "Invalid application id" });
  }

  if (!interviewDateTime || (!interviewerName && !interviewerId)) {
    return res.status(400).json({ message: "interviewDateTime and interviewerId or interviewerName are required" });
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

    // Validate interviewer exists if interviewerId is provided
    let selectedInterviewerName = interviewerName;
    if (interviewerId) {
      const interviewerResult = await client.query(
        "SELECT id, name, email FROM interviewers WHERE id = $1 LIMIT 1",
        [interviewerId]
      );

      if (interviewerResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Selected interviewer does not exist" });
      }

      selectedInterviewerName = interviewerResult.rows[0].name || interviewerName;
    }

    const interviewResult = await client.query(
      `INSERT INTO interviews (
         application_id,
         recruiter_id,
         interviewer_name,
         interviewer_id,
         interview_datetime,
         mode,
         meet_link,
         location,
         notes
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, application_id, recruiter_id, interviewer_name, interviewer_id, interview_datetime, mode, meet_link, location, notes, created_at`,
      [
        applicationId,
        req.user.id,
        selectedInterviewerName,
        interviewerId,
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

    broadcast(application.candidate_id, "interview_scheduled", {
      id: `interview-${interviewResult.rows[0]?.id || applicationId}`,
      title: "Interview scheduled",
      message: `Interview scheduled for ${application.job_title}.`,
      applicationId,
      interviewId: interviewResult.rows[0]?.id,
      jobPostId: application.job_post_id,
      jobTitle: application.job_title,
      interviewDateTime,
      mode,
      url: "/candidate/applications",
    });

    return res.status(201).json({
      interview: interviewResult.rows[0],
      application: { id: applicationId, status: "scheduled_interview" },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json(routeErrorResponse("Failed to schedule interview", error));
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

  const { interviewDateTime, interviewerName, interviewerId, mode, meetLink, location, notes } = normalizeInterviewPayload(req.body);

  if (!interviewDateTime || (!interviewerName && !interviewerId)) {
    return res.status(400).json({ message: "interviewDateTime and interviewerId or interviewerName are required" });
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

    // Validate interviewer exists if interviewerId is provided
    let selectedInterviewerName = interviewerName;
    if (interviewerId) {
      const interviewerResult = await client.query(
        "SELECT id, name, email FROM interviewers WHERE id = $1 LIMIT 1",
        [interviewerId]
      );

      if (interviewerResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Selected interviewer does not exist" });
      }

      selectedInterviewerName = interviewerResult.rows[0].name || interviewerName;
    }

    await client.query(
      `UPDATE interviews
       SET interviewer_name = $1,
           interviewer_id = $2,
           interview_datetime = $3,
           mode = $4,
           meet_link = $5,
           location = $6,
           notes = $7
       WHERE id = $8 AND recruiter_id = $9`,
      [selectedInterviewerName, interviewerId, interviewDateTime, mode, meetLink, location, notes, interviewId, req.user.id]
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
    return res.status(500).json(routeErrorResponse("Failed to update interview", error));
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
    return res.status(500).json(routeErrorResponse("Failed to delete interview", error));
  } finally {
    client.release();
  }
});

// GET /api/interviews/interviewers - list all interviewer accounts (for recruiter to assign)
router.get("/interviewers", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can view interviewers" });
  }

  try {
    const result = await pool.query(
      `SELECT iv.id, iv.name, iv.email, iv.specialization, iv.phone, u.login_name
       FROM interviewers iv
       INNER JOIN users u ON u.id = iv.id
       ORDER BY iv.name ASC`
    );

    return res.json(result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      specialization: row.specialization,
      phone: row.phone,
      loginName: row.login_name,
    })));
  } catch (error) {
    return res.status(500).json(routeErrorResponse("Failed to load interviewers", error));
  }
});

// GET /api/interviews/interviewer - interviews assigned to this interviewer
router.get("/interviewer", requireAuth, async (req, res) => {
  if (req.user.role !== "interviewer") {
    return res.status(403).json({ message: "Only interviewer accounts can view their interviews" });
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
              i.interviewer_id,
              c.id AS candidate_id,
              c.name AS candidate_name,
              c.email AS candidate_email,
              c.phone AS candidate_phone,
              jp.id AS job_post_id,
              jp.title AS job_title,
              r.company_name,
              COALESCE(ev.rating, 0)::int AS evaluation_rating,
              ev.recommendation AS evaluation_recommendation
       FROM interviews i
       INNER JOIN applications a ON a.id = i.application_id
       INNER JOIN candidates c ON c.id = a.candidate_id
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       INNER JOIN recruiters r ON r.id = jp.recruiter_id
       LEFT JOIN interviewers current_interviewer ON current_interviewer.id = $1
       LEFT JOIN interview_evaluations ev ON ev.interview_id = i.id AND ev.interviewer_id = (
         SELECT id FROM interviewers WHERE id = $1
       )
       WHERE (
           i.interviewer_id = $1
           OR (
             i.interviewer_id IS NULL
             AND current_interviewer.id IS NOT NULL
             AND (
               LOWER(i.interviewer_name) = LOWER(current_interviewer.name)
               OR LOWER(i.interviewer_name) = LOWER(current_interviewer.email)
             )
           )
         )
         AND ($2::boolean = false OR i.interview_datetime >= NOW())
       ORDER BY i.interview_datetime ASC`,
      [req.user.id, upcomingOnly]
    );

    return res.json(result.rows.map((row) => ({
      id: row.id,
      applicationId: row.application_id,
      interviewDateTime: row.interview_datetime,
      mode: row.mode,
      meetLink: row.meet_link,
      location: row.location,
      notes: row.notes,
      interviewerName: row.interviewer_name,
      interviewerId: row.interviewer_id,
      candidateId: row.candidate_id,
      candidateName: row.candidate_name,
      candidateEmail: row.candidate_email,
      candidatePhone: row.candidate_phone,
      jobPostId: row.job_post_id,
      jobTitle: row.job_title,
      companyName: row.company_name,
      evaluationRating: row.evaluation_rating,
      evaluationRecommendation: row.evaluation_recommendation,
    })));
  } catch (error) {
    return res.status(500).json(routeErrorResponse("Failed to load interviewer interviews", error));
  }
});

// POST /api/interviews/:id/evaluation - submit interview evaluation (interviewer only)
router.post("/:id/evaluation", requireAuth, async (req, res) => {
  if (req.user.role !== "interviewer") {
    return res.status(403).json({ message: "Only interviewers can submit evaluations" });
  }

  const interviewId = Number(req.params.id);
  if (!Number.isInteger(interviewId) || interviewId <= 0) {
    return res.status(400).json({ message: "Invalid interview id" });
  }

  const { rating, strengths, weaknesses, notes, recommendation } = req.body;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be an integer between 1 and 5" });
  }

  const validRecommendations = ["strong_hire", "hire", "no_hire", "strong_no_hire"];
  if (recommendation && !validRecommendations.includes(recommendation)) {
    return res.status(400).json({ message: "Invalid recommendation value" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Verify the interview exists and belongs to this interviewer
    const interviewResult = await client.query(
      `SELECT i.id, i.interviewer_id, i.application_id
       FROM interviews i
       WHERE i.id = $1 AND i.interviewer_id = $2
       LIMIT 1`,
      [interviewId, req.user.id]
    );

    if (interviewResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Interview not found or you are not assigned as interviewer" });
    }

    const applicationId = interviewResult.rows[0].application_id;

    // Upsert the evaluation
    const evalResult = await client.query(
      `INSERT INTO interview_evaluations (
         interview_id, interviewer_id, rating, strengths, weaknesses, notes, recommendation
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (interview_id, interviewer_id)
       DO UPDATE SET
         rating = EXCLUDED.rating,
         strengths = EXCLUDED.strengths,
         weaknesses = EXCLUDED.weaknesses,
         notes = EXCLUDED.notes,
         recommendation = EXCLUDED.recommendation,
         updated_at = now()
       RETURNING id, interview_id, interviewer_id, rating, strengths, weaknesses, notes, recommendation, created_at, updated_at`,
      [interviewId, req.user.id, rating, strengths || "", weaknesses || "", notes || "", recommendation || null]
    );

    await client.query(
      `INSERT INTO application_events (
         application_id, actor_user_id, event_type, title, description, metadata
       ) VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        applicationId,
        req.user.id,
        "evaluation_submitted",
        "Interview evaluation submitted",
        `Rating: ${rating}/5${recommendation ? `, Recommendation: ${recommendation}` : ""}`,
        JSON.stringify({ interviewId, rating, recommendation }),
      ]
    );

    await client.query("COMMIT");
    return res.status(201).json(evalResult.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json(routeErrorResponse("Failed to submit evaluation", error));
  } finally {
    client.release();
  }
});

// GET /api/interviews/:id/evaluation - get evaluation for an interview
router.get("/:id/evaluation", requireAuth, async (req, res) => {
  const interviewId = Number(req.params.id);
  if (!Number.isInteger(interviewId) || interviewId <= 0) {
    return res.status(400).json({ message: "Invalid interview id" });
  }

  try {
    // Restrict access by role/ownership
    const accessResult = await pool.query(
      `SELECT i.id
       FROM interviews i
       INNER JOIN applications a ON a.id = i.application_id
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       WHERE i.id = $1
         AND (
           ($2 = 'interviewer' AND i.interviewer_id = $3)
           OR ($2 = 'recruiter' AND jp.recruiter_id = $3)
           OR ($2 IN ('hr_manager', 'admin'))
         )
       LIMIT 1`,
      [interviewId, req.user.role, req.user.id]
    );

    if (accessResult.rows.length === 0) {
      return res.status(404).json({ message: "Evaluation not found or you do not have permission to view it" });
    }

    const result = await pool.query(
      `SELECT ev.id,
              ev.interview_id,
              ev.interviewer_id,
              ev.rating,
              ev.strengths,
              ev.weaknesses,
              ev.notes,
              ev.recommendation,
              ev.created_at,
              ev.updated_at,
              iv.name AS interviewer_name
       FROM interview_evaluations ev
       INNER JOIN interviewers iv ON iv.id = ev.interviewer_id
       WHERE ev.interview_id = $1`,
      [interviewId]
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json(routeErrorResponse("Failed to load evaluation", error));
  }
});

export default router;
