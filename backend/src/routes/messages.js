import express from "express";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const mapInboxRow = (row) => ({
  id: row.id,
  subject: row.subject,
  content: row.content,
  isRead: row.is_read,
  createdAt: row.created_at,
  readAt: row.read_at,
  senderName: row.sender_name,
  jobPostId: row.job_post_id,
  applicationId: row.application_id,
});

router.get("/inbox", requireAuth, async (req, res) => {
  if (req.user.role !== "candidate") {
    return res.status(403).json({ message: "Only candidate accounts can access inbox" });
  }

  const rawLimit = Number(req.query.limit);
  const rawOffset = Number(req.query.offset);
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : 10;
  const offset = Number.isInteger(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

  try {
    const result = await pool.query(
      `SELECT
          m.id,
          m.subject,
          m.content,
          m.is_read,
          m.created_at,
          m.read_at,
          m.job_post_id,
          m.application_id,
          COALESCE(r.company_name, 'Unknown recruiter') AS sender_name
       FROM messages m
       LEFT JOIN recruiters r ON r.id = m.sender_recruiter_id
       WHERE m.receiver_candidate_id = $1
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    return res.json(result.rows.map(mapInboxRow));
  } catch (error) {
    return res.status(500).json({ message: "Failed to load inbox", detail: error.message });
  }
});

router.get("/unread-count", requireAuth, async (req, res) => {
  if (req.user.role !== "candidate") {
    return res.status(403).json({ message: "Only candidate accounts can access unread count" });
  }

  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS unread_count
       FROM messages
       WHERE receiver_candidate_id = $1 AND is_read = false`,
      [req.user.id]
    );

    return res.json({ unreadCount: result.rows[0]?.unread_count || 0 });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load unread count", detail: error.message });
  }
});

router.patch("/:id/read", requireAuth, async (req, res) => {
  if (req.user.role !== "candidate") {
    return res.status(403).json({ message: "Only candidate accounts can mark messages as read" });
  }

  const messageId = Number(req.params.id);

  if (!Number.isInteger(messageId) || messageId <= 0) {
    return res.status(400).json({ message: "Invalid message id" });
  }

  try {
    const result = await pool.query(
      `UPDATE messages
       SET is_read = true,
           read_at = COALESCE(read_at, now())
       WHERE id = $1 AND receiver_candidate_id = $2
       RETURNING id, is_read, read_at`,
      [messageId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Message not found" });
    }

    return res.json({
      id: result.rows[0].id,
      isRead: result.rows[0].is_read,
      readAt: result.rows[0].read_at,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to mark message as read", detail: error.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter can use" });
  }

  const { receiverCandidateId, subject, content, jobPostId, applicationId } = req.body;
  const candidateId = Number(receiverCandidateId);

  if (!Number.isInteger(candidateId) || candidateId <= 0 || !subject?.trim() || !content?.trim()) {
    return res.status(400).json({ message: "receiverCandidateId, subject, content are required" });
  }

  const normalizedJobPostId = Number.isInteger(Number(jobPostId)) ? Number(jobPostId) : null;
  const normalizedApplicationId = Number.isInteger(Number(applicationId)) ? Number(applicationId) : null;

  try {
    const result = await pool.query(
      `INSERT INTO messages (
          sender_recruiter_id,
          receiver_candidate_id,
          subject,
          content,
          job_post_id,
          application_id
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, subject, content, is_read, created_at`,
      [
        req.user.id,
        candidateId,
        subject.trim(),
        content.trim(),
        normalizedJobPostId,
        normalizedApplicationId,
      ]
    );

    return res.status(201).json({
      id: result.rows[0].id,
      subject: result.rows[0].subject,
      content: result.rows[0].content,
      isRead: result.rows[0].is_read,
      createdAt: result.rows[0].created_at,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to send message", detail: error.message });
  }
});

export default router;
