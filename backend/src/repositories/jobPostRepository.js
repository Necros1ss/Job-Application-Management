import { pool } from "../config/db.js";

const SORT_SQL = {
  newest: "jp.created_at DESC, jp.id DESC",
  oldest: "jp.created_at ASC, jp.id ASC",
  deadline: "jp.deadline ASC NULLS LAST, jp.created_at DESC, jp.id DESC",
};

export const jobPostRepository = {
  findAll: async ({ whereSql, params, limit, offset, sort }) => {
    const query = `
      SELECT
          jp.*,
          r.company_name, r.phone, r.website, r.address, r.industry, r.email
       FROM job_posts jp
       LEFT JOIN recruiters r ON r.id = jp.recruiter_id
       ${whereSql}
       ORDER BY ${SORT_SQL[sort] || SORT_SQL.newest}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const result = await pool.query(query, [...params, limit, offset]);
    return result.rows;
  },

  countAll: async ({ whereSql, params }) => {
    const query = `
      SELECT COUNT(*)::int AS total
      FROM job_posts jp
      LEFT JOIN recruiters r ON r.id = jp.recruiter_id
      ${whereSql}
    `;
    const result = await pool.query(query, params);
    return result.rows[0]?.total || 0;
  },

  findMine: async (recruiterId) => {
    const result = await pool.query(
      `SELECT
          jp.*,
          r.company_name, r.phone, r.website, r.address, r.industry, r.email,
          COALESCE(COUNT(a.id), 0) AS applicant_count
       FROM job_posts jp
       LEFT JOIN recruiters r ON r.id = jp.recruiter_id
       LEFT JOIN applications a ON a.job_post_id = jp.id
       WHERE jp.recruiter_id = $1
       GROUP BY
          jp.id, r.id
       ORDER BY jp.created_at DESC, jp.id DESC`,
      [recruiterId]
    );
    return result.rows;
  },

  findById: async (id) => {
    const result = await pool.query(
      `SELECT
          jp.*,
          r.company_name, r.phone, r.website, r.address, r.industry, r.email
       FROM job_posts jp
       LEFT JOIN recruiters r ON r.id = jp.recruiter_id
       WHERE jp.id = $1`,
       [id]
    );
    return result.rows[0] || null;
  },

  create: async (data) => {
    const { 
      recruiter_id, title, description, location, salary, 
      experience, employment_type, deadline, responsibilities, requirements 
    } = data;
    
    const result = await pool.query(
      `INSERT INTO job_posts (
        recruiter_id, title, description, location, salary,
        experience, employment_type, deadline, responsibilities, requirements
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        recruiter_id, title, description, location, salary,
        experience, employment_type, deadline, responsibilities, requirements
      ]
    );
    return result.rows[0];
  },

  update: async (id, recruiterId, data) => {
    const { 
      title, description, location, salary, 
      experience, employment_type, deadline, responsibilities, requirements 
    } = data;

    const result = await pool.query(
      `UPDATE job_posts
       SET title = $1, description = $2, location = $3, salary = $4,
           experience = $5, employment_type = $6, deadline = $7,
           responsibilities = $8, requirements = $9
       WHERE id = $10 AND recruiter_id = $11
       RETURNING id`,
      [
        title, description, location, salary,
        experience, employment_type, deadline, responsibilities, requirements,
        id, recruiterId
      ]
    );
    return result.rowCount > 0;
  },

  delete: async (id, recruiterId) => {
    const result = await pool.query(
      `DELETE FROM job_posts WHERE id = $1 AND recruiter_id = $2 RETURNING id`,
      [id, recruiterId]
    );
    return result.rowCount > 0;
  },
};
