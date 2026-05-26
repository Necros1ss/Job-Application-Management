import express from "express";
import { pool } from "../config/db.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

const VALID_STATUSES = new Set(["pending", "in_progress", "completed"]);

const mapTaskRow = (row) => ({
  id: row.id,
  applicationId: row.application_id,
  recruiterId: row.recruiter_id,
  title: row.title,
  description: row.description || "",
  dueDate: row.due_date,
  status: row.status,
  completedAt: row.completed_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  candidateName: row.candidate_name,
  candidateEmail: row.candidate_email,
  jobTitle: row.job_title,
  companyName: row.company_name,
});

const selectTaskById = async (client, taskId) => {
  const result = await client.query(
    `SELECT ot.id,
            ot.application_id,
            ot.recruiter_id,
            ot.title,
            ot.description,
            ot.due_date,
            ot.status,
            ot.completed_at,
            ot.created_at,
            ot.updated_at,
            c.name AS candidate_name,
            c.email AS candidate_email,
            jp.title AS job_title,
            r.company_name
     FROM onboarding_tasks ot
     INNER JOIN applications a ON a.id = ot.application_id
     INNER JOIN candidates c ON c.id = a.candidate_id
     INNER JOIN job_posts jp ON jp.id = a.job_post_id
     INNER JOIN recruiters r ON r.id = ot.recruiter_id
     WHERE ot.id = $1
     LIMIT 1`,
    [taskId]
  );
  return result.rows[0] || null;
};

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

router.get("/recruiter", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can access onboarding tasks" });
  }

  try {
    const result = await pool.query(
      `SELECT ot.id,
              ot.application_id,
              ot.recruiter_id,
              ot.title,
              ot.description,
              ot.due_date,
              ot.status,
              ot.completed_at,
              ot.created_at,
              ot.updated_at,
              c.name AS candidate_name,
              c.email AS candidate_email,
              jp.title AS job_title,
              r.company_name
       FROM onboarding_tasks ot
       INNER JOIN applications a ON a.id = ot.application_id
       INNER JOIN candidates c ON c.id = a.candidate_id
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       INNER JOIN recruiters r ON r.id = ot.recruiter_id
       WHERE ot.recruiter_id = $1
       ORDER BY
         CASE ot.status WHEN 'pending' THEN 1 WHEN 'in_progress' THEN 2 ELSE 3 END,
         ot.due_date NULLS LAST,
         ot.created_at DESC`,
      [req.user.id]
    );

    return res.json(result.rows.map(mapTaskRow));
  } catch (error) {
    return res.status(500).json({ message: "Failed to load onboarding tasks", detail: error.message });
  }
});

router.get("/candidate", requireAuth, async (req, res) => {
  if (req.user.role !== "candidate") {
    return res.status(403).json({ message: "Only candidate accounts can access onboarding tasks" });
  }

  try {
    const result = await pool.query(
      `SELECT ot.id,
              ot.application_id,
              ot.recruiter_id,
              ot.title,
              ot.description,
              ot.due_date,
              ot.status,
              ot.completed_at,
              ot.created_at,
              ot.updated_at,
              c.name AS candidate_name,
              c.email AS candidate_email,
              jp.title AS job_title,
              r.company_name
       FROM onboarding_tasks ot
       INNER JOIN applications a ON a.id = ot.application_id
       INNER JOIN candidates c ON c.id = a.candidate_id
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       INNER JOIN recruiters r ON r.id = ot.recruiter_id
       WHERE a.candidate_id = $1
         AND a.status = 'accepted'
       ORDER BY
         CASE ot.status WHEN 'pending' THEN 1 WHEN 'in_progress' THEN 2 ELSE 3 END,
         ot.due_date NULLS LAST,
         ot.created_at DESC`,
      [req.user.id]
    );

    return res.json(result.rows.map(mapTaskRow));
  } catch (error) {
    return res.status(500).json({ message: "Failed to load onboarding tasks", detail: error.message });
  }
});

router.get("/accepted-applications", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can access accepted applications" });
  }

  try {
    const result = await pool.query(
      `SELECT a.id,
              c.name AS candidate_name,
              c.email AS candidate_email,
              jp.title AS job_title,
              r.company_name,
              COUNT(ot.id)::int AS onboarding_task_count
       FROM applications a
       INNER JOIN candidates c ON c.id = a.candidate_id
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       INNER JOIN recruiters r ON r.id = jp.recruiter_id
       LEFT JOIN onboarding_tasks ot ON ot.application_id = a.id
       WHERE jp.recruiter_id = $1
         AND a.status = 'accepted'
       GROUP BY a.id, c.name, c.email, jp.title, r.company_name
       ORDER BY a.applied_at DESC, a.id DESC`,
      [req.user.id]
    );

    return res.json(result.rows.map((row) => ({
      id: row.id,
      candidateName: row.candidate_name,
      candidateEmail: row.candidate_email,
      jobTitle: row.job_title,
      companyName: row.company_name,
      onboardingTaskCount: Number(row.onboarding_task_count || 0),
    })));
  } catch (error) {
    return res.status(500).json({ message: "Failed to load accepted applications", detail: error.message });
  }
});

router.post("/tasks", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can create onboarding tasks" });
  }

  const applicationId = Number(req.body.applicationId);
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
  const dueDate = req.body.dueDate || null;

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({ message: "Invalid application id" });
  }

  if (!title) {
    return res.status(400).json({ message: "Task title is required" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const ownership = await client.query(
      `SELECT a.id
       FROM applications a
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       WHERE a.id = $1
         AND jp.recruiter_id = $2
         AND a.status = 'accepted'
       LIMIT 1`,
      [applicationId, req.user.id]
    );

    if (ownership.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Accepted application not found or you don't have permission to onboard it" });
    }

    const result = await client.query(
      `INSERT INTO onboarding_tasks (
         application_id,
         recruiter_id,
         title,
         description,
         due_date
       ) VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [applicationId, req.user.id, title, description, dueDate]
    );

    await createApplicationEvent(client, {
      applicationId,
      actorUserId: req.user.id,
      eventType: "onboarding_task_created",
      title: "Onboarding task created",
      description: title,
      metadata: { taskId: result.rows[0].id, dueDate },
    });

    const fullTask = await selectTaskById(client, result.rows[0].id);

    await client.query("COMMIT");

    return res.status(201).json(mapTaskRow(fullTask));
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to create onboarding task", detail: error.message });
  } finally {
    client.release();
  }
});

router.patch("/tasks/:id/status", requireAuth, async (req, res) => {
  if (!["recruiter", "candidate"].includes(req.user.role)) {
    return res.status(403).json({ message: "Only candidate or recruiter accounts can update onboarding tasks" });
  }

  const taskId = Number(req.params.id);
  const status = typeof req.body.status === "string" ? req.body.status.trim() : "";

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return res.status(400).json({ message: "Invalid onboarding task id" });
  }

  if (!VALID_STATUSES.has(status)) {
    return res.status(400).json({ message: "Invalid status. Must be pending, in_progress, or completed" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE onboarding_tasks ot
       SET status = $1,
           completed_at = CASE WHEN $1 = 'completed' THEN now() ELSE NULL END,
           updated_at = now()
       FROM applications a
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       WHERE ot.id = $2
         AND ot.application_id = a.id
         AND (
           ($3 = 'recruiter' AND jp.recruiter_id = $4)
           OR ($3 = 'candidate' AND a.candidate_id = $4 AND a.status = 'accepted')
         )
       RETURNING ot.id, ot.application_id, ot.title`,
      [status, taskId, req.user.role, req.user.id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Onboarding task not found or you don't have permission to update it" });
    }

    await createApplicationEvent(client, {
      applicationId: result.rows[0].application_id,
      actorUserId: req.user.id,
      eventType: "onboarding_task_status_changed",
      title: `Onboarding task marked ${status.replace("_", " ")}`,
      description: result.rows[0].title,
      metadata: { taskId, status },
    });

    const fullTask = await selectTaskById(client, taskId);

    await client.query("COMMIT");

    return res.json(mapTaskRow(fullTask));
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to update onboarding task", detail: error.message });
  } finally {
    client.release();
  }
});

router.delete("/tasks/:id", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can delete onboarding tasks" });
  }

  const taskId = Number(req.params.id);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return res.status(400).json({ message: "Invalid onboarding task id" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `DELETE FROM onboarding_tasks ot
       USING applications a
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       WHERE ot.id = $1
         AND ot.application_id = a.id
         AND jp.recruiter_id = $2
       RETURNING ot.id, ot.application_id, ot.title`,
      [taskId, req.user.id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Onboarding task not found or you don't have permission to delete it" });
    }

    await createApplicationEvent(client, {
      applicationId: result.rows[0].application_id,
      actorUserId: req.user.id,
      eventType: "onboarding_task_deleted",
      title: "Onboarding task deleted",
      description: result.rows[0].title,
      metadata: { taskId },
    });

    await client.query("COMMIT");

    return res.status(204).send();
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to delete onboarding task", detail: error.message });
  } finally {
    client.release();
  }
});

export default router;
