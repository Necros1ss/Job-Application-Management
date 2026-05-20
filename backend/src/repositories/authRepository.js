import { pool } from "../config/db.js";

export const findUserByLoginName = async (loginName) => {
  const result = await pool.query(
    `SELECT id, login_name, password_hash, role, is_locked, is_deleted
     FROM users
     WHERE login_name = $1
     LIMIT 1`,
    [loginName]
  );

  return result.rows[0] || null;
};

export const findUserProfileById = async (userId) => {
  const result = await pool.query(
    `SELECT
       u.id,
       u.login_name,
       u.role,
       u.is_locked,
       u.is_deleted,
       c.name AS candidate_name,
       c.email AS candidate_email,
       r.company_name AS recruiter_name,
       r.email AS recruiter_email
     FROM users u
     LEFT JOIN candidates c ON c.id = u.id
     LEFT JOIN recruiters r ON r.id = u.id
     WHERE u.id = $1
     LIMIT 1`,
    [userId]
  );

  return result.rows[0] || null;
};

export const createUser = async ({ loginName, passwordHash, role }) => {
  const result = await pool.query(
    `INSERT INTO users (login_name, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING id, login_name, role`,
    [loginName, passwordHash, role]
  );

  return result.rows[0];
};

export const createCandidateProfile = async ({ id, name, email }) => {
  await pool.query(
    `INSERT INTO candidates (id, name, email)
     VALUES ($1, $2, $3)`,
    [id, name, email]
  );
};

export const createRecruiterProfile = async ({ id, companyName, email }) => {
  await pool.query(
    `INSERT INTO recruiters (id, company_name, email)
     VALUES ($1, $2, $3)`,
    [id, companyName, email]
  );
};

export const findPasswordResetAccount = async (loginName) => {
  const result = await pool.query(
    `SELECT id, login_name, role
     FROM users
     WHERE login_name = $1 AND is_deleted = false
     LIMIT 1`,
    [loginName]
  );

  return result.rows[0] || null;
};

export const createPasswordResetToken = async ({ userId, token, expiresAt }) => {
  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
  );
};

export const findValidResetToken = async (token) => {
  const result = await pool.query(
    `SELECT id, user_id
     FROM password_reset_tokens
     WHERE token = $1
       AND used = false
       AND expires_at > now()
     LIMIT 1
     FOR UPDATE`,
    [token]
  );

  return result.rows[0] || null;
};

export const markResetTokenUsed = async (tokenId) => {
  await pool.query(
    `UPDATE password_reset_tokens
     SET used = true
     WHERE id = $1`,
    [tokenId]
  );
};

export const updateUserPassword = async ({ userId, passwordHash }) => {
  await pool.query(
    `UPDATE users
     SET password_hash = $1
     WHERE id = $2`,
    [passwordHash, userId]
  );
};

export const listUserStats = async () => {
  const result = await pool.query(
    `SELECT
       COUNT(*)::int AS total_users,
       COUNT(*) FILTER (WHERE role = 'candidate')::int AS total_candidates,
       COUNT(*) FILTER (WHERE role = 'recruiter')::int AS total_recruiters,
       COUNT(*) FILTER (WHERE role = 'admin')::int AS total_admins,
       COUNT(*) FILTER (WHERE is_locked = true)::int AS locked_users,
       COUNT(*) FILTER (WHERE is_deleted = true)::int AS deleted_users
     FROM users`
  );

  return result.rows[0] || {};
};
