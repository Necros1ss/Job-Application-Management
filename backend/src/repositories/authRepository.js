import { pool } from "../config/db.js";

export const authRepository = {
  findUserByLoginName: async (loginName) => {
    const result = await pool.query(
      `SELECT u.id, u.role, u.login_name, u.password_hash, u.is_locked, u.is_deleted,
              c.name AS candidate_name, c.email AS candidate_email,
              r.company_name AS recruiter_name, r.email AS recruiter_email,
              hm.name AS hr_manager_name, hm.email AS hr_manager_email,
              i.name AS interviewer_name, i.email AS interviewer_email
       FROM users u
       LEFT JOIN candidates c ON c.id = u.id
       LEFT JOIN recruiters r ON r.id = u.id
       LEFT JOIN hr_managers hm ON hm.id = u.id
       LEFT JOIN interviewers i ON i.id = u.id
       WHERE u.login_name = $1
       LIMIT 1`,
      [loginName]
    );
    return result.rows[0] || null;
  },

  findUserById: async (id) => {
    const result = await pool.query(
      `SELECT u.id, u.role, u.login_name, u.password_hash, u.is_locked, u.is_deleted,
              c.name AS candidate_name, c.email AS candidate_email,
              r.company_name AS recruiter_name, r.email AS recruiter_email,
              hm.name AS hr_manager_name, hm.email AS hr_manager_email,
              i.name AS interviewer_name, i.email AS interviewer_email
       FROM users u
       LEFT JOIN candidates c ON c.id = u.id
       LEFT JOIN recruiters r ON r.id = u.id
       LEFT JOIN hr_managers hm ON hm.id = u.id
       LEFT JOIN interviewers i ON i.id = u.id
       WHERE u.id = $1
       LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  },

  createUser: async (client, loginName, passwordHash, role) => {
    const result = await client.query(
      `INSERT INTO users (login_name, password_hash, role) VALUES ($1, $2, $3) RETURNING id, role`,
      [loginName, passwordHash, role]
    );
    return result.rows[0];
  },

  createCandidateProfile: async (client, id, name, email) => {
    await client.query(`INSERT INTO candidates (id, name, email) VALUES ($1, $2, $3)`, [id, name, email]);
  },

  createRecruiterProfile: async (client, id, companyName, email) => {
    await client.query(`INSERT INTO recruiters (id, company_name, email) VALUES ($1, $2, $3)`, [id, companyName, email]);
  },

  createHrManagerProfile: async (client, id, name, email) => {
    await client.query(`INSERT INTO hr_managers (id, name, email) VALUES ($1, $2, $3)`, [id, name, email]);
  },

  createInterviewerProfile: async (client, id, name, email) => {
    await client.query(`INSERT INTO interviewers (id, name, email) VALUES ($1, $2, $3)`, [id, name, email]);
  },

  updatePassword: async (userId, passwordHash) => {
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, userId]);
  },

  createPasswordResetToken: async (userId, token, expiresAt) => {
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );
  },

  findValidResetToken: async (token) => {
    const result = await pool.query(
      `SELECT id, user_id
       FROM password_reset_tokens
       WHERE token = $1
         AND used = false
         AND expires_at > now()
       LIMIT 1`,
      [token]
    );
    return result.rows[0] || null;
  },

  markTokenAsUsed: async (tokenId, client = pool) => {
    await client.query("UPDATE password_reset_tokens SET used = true WHERE id = $1", [tokenId]);
  },
};
