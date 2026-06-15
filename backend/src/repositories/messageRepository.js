import { pool } from "../config/db.js";

export const messageRepository = {
  findInboxByCandidateId: async (candidateId, limit, offset) => {
    const result = await pool.query(
      `SELECT m.*, COALESCE(r.company_name, 'Unknown recruiter') AS sender_name, jp.title AS job_title
       FROM messages m
       LEFT JOIN recruiters r ON r.id = m.sender_recruiter_id
       LEFT JOIN job_posts jp ON jp.id = m.job_post_id
       WHERE m.receiver_candidate_id = $1
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT $2 OFFSET $3`,
      [candidateId, limit, offset]
    );
    return result.rows;
  },

  countUnreadByCandidateId: async (candidateId) => {
    const result = await pool.query(
      "SELECT COUNT(*)::int AS unread_count FROM messages WHERE receiver_candidate_id = $1 AND is_read = false",
      [candidateId]
    );
    return result.rows[0]?.unread_count || 0;
  },

  markAsRead: async (messageId, candidateId) => {
    const result = await pool.query(
      `UPDATE messages SET is_read = true, read_at = COALESCE(read_at, now())
       WHERE id = $1 AND receiver_candidate_id = $2 RETURNING *`,
      [messageId, candidateId]
    );
    return result.rows[0] || null;
  },

  create: async (client, data) => {
    const { sender_id, receiver_id, subject, content, job_post_id, application_id } = data;
    const result = await client.query(
      `INSERT INTO messages (sender_recruiter_id, receiver_candidate_id, subject, content, job_post_id, application_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [sender_id, receiver_id, subject.trim(), content.trim(), job_post_id, application_id]
    );
    return result.rows[0];
  },

  checkCandidateExists: async (id) => {
    const result = await pool.query("SELECT id FROM candidates WHERE id = $1", [id]);
    return result.rows.length > 0;
  },

  checkJobPermission: async (jobId, recruiterId) => {
    const result = await pool.query("SELECT id FROM job_posts WHERE id = $1 AND recruiter_id = $2", [jobId, recruiterId]);
    return result.rows.length > 0;
  },

  checkApplicationPermission: async (applicationId, candidateId, recruiterId) => {
    const result = await pool.query(
      `SELECT a.id FROM applications a
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       WHERE a.id = $1 AND a.candidate_id = $2 AND jp.recruiter_id = $3`,
      [applicationId, candidateId, recruiterId]
    );
    return result.rows.length > 0;
  },
};
