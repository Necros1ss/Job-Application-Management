import { pool } from "../config/db.js";

export const applicationRepository = {
  findAll: async () => {
    const result = await pool.query(
      `SELECT a.*, j.title as job_title, r.company_name
       FROM applications a
       JOIN job_posts j ON a.job_post_id = j.id
       JOIN recruiters r ON j.recruiter_id = r.id
       ORDER BY a.applied_at DESC`
    );
    return result.rows;
  },

  findByCandidateId: async (candidateId) => {
    const result = await pool.query(
      `SELECT a.*, j.title as job_title, r.company_name
       FROM applications a
       JOIN job_posts j ON a.job_post_id = j.id
       JOIN recruiters r ON j.recruiter_id = r.id
       WHERE a.candidate_id = $1
       ORDER BY a.applied_at DESC`,
      [candidateId]
    );
    return result.rows;
  },

  findForRecruiter: async (recruiterId, { page = 1, limit = 10, jobPostId } = {}) => {
    const offset = (page - 1) * limit;
    let query = `
      SELECT a.*, c.name as candidate_name, c.email as candidate_email, j.title as job_title
      FROM applications a
      JOIN candidates c ON a.candidate_id = c.id
      JOIN job_posts j ON a.job_post_id = j.id
      WHERE j.recruiter_id = $1
    `;
    const params = [recruiterId];

    if (jobPostId) {
      query += ` AND a.job_post_id = $${params.length + 1}`;
      params.push(jobPostId);
    }

    query += ` ORDER BY a.applied_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  },

  countForRecruiter: async (recruiterId, jobPostId) => {
    let query = `
      SELECT COUNT(*) 
      FROM applications a
      JOIN job_posts j ON a.job_post_id = j.id
      WHERE j.recruiter_id = $1
    `;
    const params = [recruiterId];

    if (jobPostId) {
      query += ` AND a.job_post_id = $2`;
      params.push(jobPostId);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  },

  findById: async (id) => {
    const result = await pool.query(
      `SELECT a.*, c.name as candidate_name, c.email as candidate_email, j.title as job_title
       FROM applications a
       JOIN candidates c ON a.candidate_id = c.id
       JOIN job_posts j ON a.job_post_id = j.id
       WHERE a.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  create: async (candidateId, jobPostId, cvData, coverLetter) => {
    const result = await pool.query(
      `INSERT INTO applications (
        candidate_id, job_post_id, cover_letter,
        cv_file_path, cv_file_name, cv_mime_type, cv_file_size_bytes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        candidateId, jobPostId, coverLetter,
        cvData.path, cvData.name, cvData.mimetype, cvData.size
      ]
    );
    return result.rows[0];
  },

  updateStatus: async (id, status) => {
    const result = await pool.query(
      "UPDATE applications SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    return result.rows[0];
  },

  updateRating: async (id, rating) => {
    const result = await pool.query(
      "UPDATE applications SET rating = $1 WHERE id = $2 RETURNING *",
      [rating, id]
    );
    return result.rows[0];
  },

  addEvent: async (applicationId, actorId, type, title, description, metadata = {}) => {
    await pool.query(
      `INSERT INTO application_events (application_id, actor_user_id, event_type, title, description, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [applicationId, actorId, type, title, description, metadata]
    );
  },

  getNotes: async (applicationId) => {
    const result = await pool.query(
      "SELECT * FROM application_notes WHERE application_id = $1 ORDER BY created_at DESC",
      [applicationId]
    );
    return result.rows;
  },

  addNote: async (applicationId, recruiterId, note) => {
    const result = await pool.query(
      "INSERT INTO application_notes (application_id, recruiter_id, note) VALUES ($1, $2, $3) RETURNING *",
      [applicationId, recruiterId, note]
    );
    return result.rows[0];
  },

  updateNote: async (noteId, note) => {
    const result = await pool.query(
      "UPDATE application_notes SET note = $1, updated_at = now() WHERE id = $2 RETURNING *",
      [note, noteId]
    );
    return result.rows[0];
  },

  deleteNote: async (noteId) => {
    await pool.query("DELETE FROM application_notes WHERE id = $1", [noteId]);
  },
};
