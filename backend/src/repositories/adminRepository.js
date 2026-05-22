import { pool } from "../config/db.js";

const buildUserFilters = ({ search, role, locked, deleted }) => {
  const where = [];
  const params = [];
  let index = 1;

  if (search) {
    where.push(`(u.login_name ILIKE $${index} OR COALESCE(c.name, '') ILIKE $${index} OR COALESCE(r.company_name, '') ILIKE $${index})`);
    params.push(`%${search}%`);
    index += 1;
  }

  if (role) {
    where.push(`u.role = $${index}`);
    params.push(role);
    index += 1;
  }

  if (locked !== undefined) {
    where.push(`u.is_locked = $${index}`);
    params.push(locked);
    index += 1;
  }

  if (deleted !== undefined) {
    where.push(`u.is_deleted = $${index}`);
    params.push(deleted);
    index += 1;
  }

  return { where, params };
};

export const listUsers = async ({ page, limit, search, role, locked, deleted }) => {
  const { where, params } = buildUserFilters({ search, role, locked, deleted });
  const offset = (page - 1) * limit;
  const excludeAdminClause = role === "admin" ? "" : "u.role <> 'admin'";
  let finalWhere = "";
  if (where.length > 0) {
    finalWhere = `WHERE ${excludeAdminClause ? excludeAdminClause + " AND " : ""}${where.join(" AND ")}`;
  } else if (excludeAdminClause) {
    finalWhere = `WHERE ${excludeAdminClause}`;
  }

  const query = `
    SELECT
      u.id,
      u.login_name,
      u.role,
      u.is_locked,
      u.is_deleted,
      u.deleted_at,
      u.created_at,
      c.name AS candidate_name,
      c.email AS candidate_email,
      r.company_name AS recruiter_name,
      r.email AS recruiter_email
    FROM users u
    LEFT JOIN candidates c ON c.id = u.id
    LEFT JOIN recruiters r ON r.id = u.id
    ${finalWhere}
    ORDER BY u.created_at DESC, u.id DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

  const result = await pool.query(query, [...params, limit, offset]);

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM users u
     LEFT JOIN candidates c ON c.id = u.id
     LEFT JOIN recruiters r ON r.id = u.id
     ${finalWhere}`,
    params
  );

  return {
    items: result.rows,
    total: countResult.rows[0]?.total || 0,
  };
};

export const setUserLockState = async ({ userId, isLocked }) => {
  const result = await pool.query(
    `UPDATE users
     SET is_locked = $1
     WHERE id = $2 AND is_deleted = false
     RETURNING id, login_name, role, is_locked, is_deleted, deleted_at`,
    [isLocked, userId]
  );

  return result.rows[0] || null;
};

export const softDeleteUser = async ({ userId }) => {
  const result = await pool.query(
    `UPDATE users
     SET is_deleted = true,
         is_locked = true,
         deleted_at = now()
     WHERE id = $1 AND is_deleted = false
     RETURNING id, login_name, role, is_locked, is_deleted, deleted_at`,
    [userId]
  );

  return result.rows[0] || null;
};

export const listJobs = async ({ page, limit, search, status, recruiterId }) => {
  const where = [];
  const params = [];
  let index = 1;

  if (search) {
    where.push(`(jp.title ILIKE $${index} OR COALESCE(r.company_name, '') ILIKE $${index} OR COALESCE(jp.location, '') ILIKE $${index})`);
    params.push(`%${search}%`);
    index += 1;
  }

  if (status) {
    where.push(`jp.status = $${index}`);
    params.push(status);
    index += 1;
  }

  if (recruiterId) {
    where.push(`jp.recruiter_id = $${index}`);
    params.push(recruiterId);
    index += 1;
  }

  const offset = (page - 1) * limit;

  const query = `
    SELECT
      jp.id,
      jp.recruiter_id,
      jp.title,
      jp.description,
      jp.location,
      jp.salary,
      jp.deadline,
      jp.created_at,
      jp.experience,
      jp.employment_type,
      jp.responsibilities,
      jp.requirements,
      jp.status,
      jp.moderated_by,
      jp.moderated_at,
      r.company_name,
      r.email,
      moderator.login_name AS moderated_by_login_name
    FROM job_posts jp
    LEFT JOIN recruiters r ON r.id = jp.recruiter_id
    LEFT JOIN users moderator ON moderator.id = jp.moderated_by
    ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY jp.created_at DESC, jp.id DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

  const result = await pool.query(query, [...params, limit, offset]);
  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM job_posts jp
     LEFT JOIN recruiters r ON r.id = jp.recruiter_id
     ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}`,
    params
  );

  return {
    items: result.rows,
    total: countResult.rows[0]?.total || 0,
  };
};

export const moderateJob = async ({ jobId, status, moderatorId }) => {
  const result = await pool.query(
    `UPDATE job_posts
     SET status = $1,
         moderated_by = $2,
         moderated_at = now()
     WHERE id = $3
     RETURNING id, status, moderated_by, moderated_at`,
    [status, moderatorId, jobId]
  );

  return result.rows[0] || null;
};

export const getStats = async () => {
  const userStats = await pool.query(
    `SELECT
       COUNT(*)::int AS total_users,
       COUNT(*) FILTER (WHERE role = 'candidate')::int AS candidates,
       COUNT(*) FILTER (WHERE role = 'recruiter')::int AS recruiters,
       COUNT(*) FILTER (WHERE role = 'admin')::int AS admins,
       COUNT(*) FILTER (WHERE is_locked = true)::int AS locked_users,
       COUNT(*) FILTER (WHERE is_deleted = true)::int AS deleted_users
     FROM users`
  );

  const jobStats = await pool.query(
    `SELECT
       COUNT(*)::int AS total_jobs,
       COUNT(*) FILTER (WHERE status = 'active')::int AS active_jobs,
       COUNT(*) FILTER (WHERE status = 'hidden')::int AS hidden_jobs,
       COUNT(*) FILTER (WHERE status = 'deleted')::int AS deleted_jobs
     FROM job_posts`
  );

  const applicationStats = await pool.query(
    `SELECT COUNT(*)::int AS total_applications FROM applications`
  );

  return {
    users: userStats.rows[0] || {},
    jobs: jobStats.rows[0] || {},
    applications: applicationStats.rows[0] || {},
  };
};
