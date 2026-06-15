import { pool } from "../config/db.js";

export const userRepository = {
  findFullProfileById: async (id) => {
    const result = await pool.query(
      `SELECT
          u.id, u.role, u.login_name, u.notification_preferences,
          c.name AS candidate_name, c.email AS candidate_email, c.phone AS candidate_phone,
          c.address, c.dob AS candidate_dob, c.skills, c.experience, c.job_type,
          c.avatar_file_name, c.avatar_mime_type,
          r.company_name, r.company_name AS recruiter_name, r.email AS recruiter_email,
          r.phone AS recruiter_phone, r.address AS recruiter_address, r.website AS recruiter_website,
          r.linkedin AS recruiter_linkedin, r.industry AS recruiter_industry,
          r.company_size AS recruiter_company_size, r.tax_code AS recruiter_tax_code,
          r.description AS recruiter_description, r.logo_file_name, r.logo_mime_type
       FROM users u
       LEFT JOIN candidates c ON c.id = u.id
       LEFT JOIN recruiters r ON r.id = u.id
       WHERE u.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  updateCandidate: async (id, data) => {
    const { name, phone, address, dob, skills, experience, job_type } = data;
    const result = await pool.query(
      `UPDATE candidates
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           address = COALESCE($3, address),
           dob = COALESCE($4, dob),
           skills = COALESCE($5, skills),
           experience = COALESCE($6, experience),
           job_type = COALESCE($7, job_type)
       WHERE id = $8
       RETURNING *`,
      [name, phone, address, dob, skills, experience, job_type, id]
    );
    return result.rows[0] || null;
  },

  updateRecruiter: async (id, data) => {
    const { company_name, phone, address, website, linkedin, industry, company_size, tax_code, description } = data;
    const result = await pool.query(
      `UPDATE recruiters
       SET company_name = COALESCE($1, company_name),
           phone = COALESCE($2, phone),
           address = COALESCE($3, address),
           website = COALESCE($4, website),
           linkedin = COALESCE($5, linkedin),
           industry = COALESCE($6, industry),
           company_size = COALESCE($7, company_size),
           tax_code = COALESCE($8, tax_code),
           description = COALESCE($9, description)
       WHERE id = $10
       RETURNING *`,
      [company_name, phone, address, website, linkedin, industry, company_size, tax_code, description, id]
    );
    return result.rows[0] || null;
  },

  updateAvatar: async (id, role, fileData) => {
    if (role === "recruiter") {
      const result = await pool.query(
        `UPDATE recruiters SET logo_file_name = $1, logo_mime_type = $2, logo_file_size_bytes = $3
         WHERE id = $4 RETURNING *`,
        [fileData.filename, fileData.mimetype, fileData.size, id]
      );
      return result.rows[0];
    } else {
      const result = await pool.query(
        `UPDATE candidates SET avatar_file_name = $1, avatar_mime_type = $2, avatar_file_size_bytes = $3
         WHERE id = $4 RETURNING *`,
        [fileData.filename, fileData.mimetype, fileData.size, id]
      );
      return result.rows[0];
    }
  },

  updateNotificationPreferences: async (id, preferences) => {
    const result = await pool.query(
      `UPDATE users
       SET notification_preferences = COALESCE(notification_preferences, '{}'::jsonb) || $1::jsonb
       WHERE id = $2
       RETURNING notification_preferences`,
      [JSON.stringify(preferences), id]
    );
    return result.rows[0]?.notification_preferences || {};
  },

  deleteUser: async (id) => {
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id", [id]);
    return result.rowCount > 0;
  },
};
