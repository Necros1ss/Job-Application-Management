import { pool } from "../config/db.js";

export const interviewRepository = {
  findForRecruiter: async (recruiterId, upcomingOnly = false) => {
    const result = await pool.query(
      `SELECT i.*, c.id AS candidate_id, c.name AS candidate_name, c.email AS candidate_email, c.phone AS candidate_phone,
              jp.id AS job_post_id, jp.title AS job_title, r.company_name
       FROM interviews i
       INNER JOIN applications a ON a.id = i.application_id
       INNER JOIN candidates c ON c.id = a.candidate_id
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       INNER JOIN recruiters r ON r.id = jp.recruiter_id
       WHERE i.recruiter_id = $1 AND ($2::boolean = false OR i.interview_datetime >= NOW())
       ORDER BY i.interview_datetime ASC`,
      [recruiterId, upcomingOnly]
    );
    return result.rows;
  },

  findForCandidate: async (candidateId) => {
    const result = await pool.query(
      `SELECT i.*, jp.id AS job_post_id, jp.title AS job_title, r.company_name
       FROM interviews i
       INNER JOIN applications a ON a.id = i.application_id
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       INNER JOIN recruiters r ON r.id = jp.recruiter_id
       WHERE a.candidate_id = $1 AND i.interview_datetime >= NOW()
       ORDER BY i.interview_datetime ASC`,
      [candidateId]
    );
    return result.rows;
  },

  findForInterviewer: async (interviewerId, upcomingOnly = false) => {
    const result = await pool.query(
      `SELECT i.*, c.id AS candidate_id, c.name AS candidate_name, c.email AS candidate_email, c.phone AS candidate_phone,
              jp.id AS job_post_id, jp.title AS job_title, r.company_name,
              COALESCE(ev.rating, 0)::int AS evaluation_rating, ev.recommendation AS evaluation_recommendation
       FROM interviews i
       INNER JOIN applications a ON a.id = i.application_id
       INNER JOIN candidates c ON c.id = a.candidate_id
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       INNER JOIN recruiters r ON r.id = jp.recruiter_id
       LEFT JOIN interviewers current_interviewer ON current_interviewer.id = $1
       LEFT JOIN interview_evaluations ev ON ev.interview_id = i.id AND ev.interviewer_id = $1
       WHERE (i.interviewer_id = $1 OR (i.interviewer_id IS NULL AND (LOWER(i.interviewer_name) = LOWER(current_interviewer.name) OR LOWER(i.interviewer_name) = LOWER(current_interviewer.email))))
         AND ($2::boolean = false OR i.interview_datetime >= NOW())
       ORDER BY i.interview_datetime ASC`,
      [interviewerId, upcomingOnly]
    );
    return result.rows;
  },

  findById: async (id, recruiterId) => {
    const result = await pool.query(
      `SELECT i.*, a.id AS application_id, a.candidate_id, c.name AS candidate_name, c.email AS candidate_email,
              jp.id AS job_post_id, jp.title AS job_title
       FROM interviews i
       INNER JOIN applications a ON a.id = i.application_id
       INNER JOIN candidates c ON c.id = a.candidate_id
       INNER JOIN job_posts jp ON jp.id = a.job_post_id
       WHERE i.id = $1 ${recruiterId ? 'AND i.recruiter_id = $2' : ''}`,
      recruiterId ? [id, recruiterId] : [id]
    );
    return result.rows[0] || null;
  },

  create: async (client, data) => {
    const { application_id, recruiter_id, interviewer_name, interviewer_id, interview_datetime, mode, meet_link, location, notes } = data;
    const result = await client.query(
      `INSERT INTO interviews (application_id, recruiter_id, interviewer_name, interviewer_id, interview_datetime, mode, meet_link, location, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [application_id, recruiter_id, interviewer_name, interviewer_id, interview_datetime, mode, meet_link, location, notes]
    );
    return result.rows[0];
  },

  update: async (id, recruiterId, data) => {
    const { interviewer_name, interviewer_id, interview_datetime, mode, meet_link, location, notes } = data;
    const result = await pool.query(
      `UPDATE interviews SET interviewer_name = $1, interviewer_id = $2, interview_datetime = $3, mode = $4, meet_link = $5, location = $6, notes = $7
       WHERE id = $8 AND recruiter_id = $9 RETURNING *`,
      [interviewer_name, interviewer_id, interview_datetime, mode, meet_link, location, notes, id, recruiterId]
    );
    return result.rows[0] || null;
  },

  delete: async (id, recruiterId) => {
    const result = await pool.query("DELETE FROM interviews WHERE id = $1 AND recruiter_id = $2 RETURNING *", [id, recruiterId]);
    return result.rows[0] || null;
  },

  countInterviewsByApplication: async (applicationId) => {
    const result = await pool.query("SELECT COUNT(*)::int AS count FROM interviews WHERE application_id = $1", [applicationId]);
    return result.rows[0]?.count || 0;
  },

  findAllInterviewers: async () => {
    const result = await pool.query(
      `SELECT iv.id, iv.name, iv.email, iv.specialization, iv.phone, u.login_name
       FROM interviewers iv INNER JOIN users u ON u.id = iv.id ORDER BY iv.name ASC`
    );
    return result.rows;
  },

  upsertEvaluation: async (client, data) => {
    const { interview_id, interviewer_id, rating, strengths, weaknesses, notes, recommendation } = data;
    const result = await client.query(
      `INSERT INTO interview_evaluations (interview_id, interviewer_id, rating, strengths, weaknesses, notes, recommendation)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (interview_id, interviewer_id)
       DO UPDATE SET rating = EXCLUDED.rating, strengths = EXCLUDED.strengths, weaknesses = EXCLUDED.weaknesses, notes = EXCLUDED.notes, recommendation = EXCLUDED.recommendation, updated_at = now()
       RETURNING *`,
      [interview_id, interviewer_id, rating, strengths, weaknesses, notes, recommendation]
    );
    return result.rows[0];
  },

  findEvaluationsByInterviewId: async (interviewId) => {
    const result = await pool.query(
      `SELECT ev.*, iv.name AS interviewer_name FROM interview_evaluations ev
       INNER JOIN interviewers iv ON iv.id = ev.interviewer_id WHERE ev.interview_id = $1`,
      [interviewId]
    );
    return result.rows;
  },

  checkInterviewerExists: async (id) => {
    const result = await pool.query("SELECT name FROM interviewers WHERE id = $1", [id]);
    return result.rows[0] || null;
  },

  checkAccess: async (interviewId, role, userId) => {
    const query = `
      SELECT i.id FROM interviews i
      INNER JOIN applications a ON a.id = i.application_id
      INNER JOIN job_posts jp ON jp.id = a.job_post_id
      WHERE i.id = $1 AND (
        ($2 = 'interviewer' AND i.interviewer_id = $3)
        OR ($2 = 'recruiter' AND jp.recruiter_id = $3)
        OR ($2 IN ('hr_manager', 'admin'))
      )
    `;
    const result = await pool.query(query, [interviewId, role, userId]);
    return result.rows.length > 0;
  }
};
