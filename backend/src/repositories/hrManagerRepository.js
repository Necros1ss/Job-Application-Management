import { pool } from "../config/db.js";

export const hrManagerRepository = {
  getDashboardStats: async () => {
    const [
      totalJobsResult,
      pendingApprovalResult,
      activeJobsResult,
      totalApplicationsResult,
      totalRecruitersResult,
      recentApplicationsResult,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM job_posts`),
      pool.query(`SELECT COUNT(*)::int AS pending FROM job_posts WHERE status = 'hidden'`),
      pool.query(`SELECT COUNT(*)::int AS active FROM job_posts WHERE status = 'active'`),
      pool.query(`SELECT COUNT(*)::int AS total FROM applications`),
      pool.query(`SELECT COUNT(*)::int AS total FROM users WHERE role = 'recruiter' AND is_deleted = false`),
      pool.query(
        `SELECT a.id, a.applied_at, a.status,
                c.name AS candidate_name,
                jp.title AS job_title,
                r.company_name AS recruiter_name,
                jp.id AS job_post_id
         FROM applications a
         INNER JOIN candidates c ON c.id = a.candidate_id
         INNER JOIN job_posts jp ON jp.id = a.job_post_id
         INNER JOIN recruiters r ON r.id = jp.recruiter_id
         ORDER BY a.applied_at DESC
         LIMIT 10`
      ),
    ]);

    return {
      stats: {
        totalJobs: totalJobsResult.rows[0]?.total || 0,
        pendingApproval: pendingApprovalResult.rows[0]?.pending || 0,
        activeJobs: activeJobsResult.rows[0]?.active || 0,
        totalApplications: totalApplicationsResult.rows[0]?.total || 0,
        totalRecruiters: totalRecruitersResult.rows[0]?.total || 0,
      },
      recentApplications: recentApplicationsResult.rows
    };
  },

  findAllJobs: async ({ whereSql, params, limit, offset }) => {
    const query = `
      SELECT jp.*,
             r.company_name, r.email AS recruiter_email,
             COALESCE(app_count.cnt, 0)::int AS applicant_count
      FROM job_posts jp
      INNER JOIN recruiters r ON r.id = jp.recruiter_id
      LEFT JOIN (
        SELECT job_post_id, COUNT(*)::int AS cnt
        FROM applications
        GROUP BY job_post_id
      ) app_count ON app_count.job_post_id = jp.id
      ${whereSql}
      ORDER BY jp.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const result = await pool.query(query, [...params, limit, offset]);
    return result.rows;
  },

  countAllJobs: async ({ whereSql, params }) => {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM job_posts jp
       INNER JOIN recruiters r ON r.id = jp.recruiter_id
       ${whereSql}`,
      params
    );
    return result.rows[0]?.total || 0;
  },

  updateJobStatus: async (jobId, status, moderatorId) => {
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
  },

  findRecruitersPerformance: async ({ limit, offset }) => {
    const query = `
      SELECT r.id, r.company_name, r.email, u.created_at,
             COALESCE(jp_stats.total_jobs, 0)::int AS total_jobs,
             COALESCE(jp_stats.active_jobs, 0)::int AS active_jobs,
             COALESCE(app_stats.total_apps, 0)::int AS total_applications,
             COALESCE(app_stats.hired, 0)::int AS hired
      FROM recruiters r
      INNER JOIN users u ON u.id = r.id
      LEFT JOIN (
        SELECT recruiter_id, COUNT(*)::int AS total_jobs,
               COUNT(*) FILTER (WHERE status = 'active')::int AS active_jobs
        FROM job_posts GROUP BY recruiter_id
      ) jp_stats ON jp_stats.recruiter_id = r.id
      LEFT JOIN (
        SELECT jp.recruiter_id, COUNT(a.id)::int AS total_apps,
               COUNT(a.id) FILTER (WHERE a.status = 'accepted')::int AS hired
        FROM applications a INNER JOIN job_posts jp ON jp.id = a.job_post_id
        GROUP BY jp.recruiter_id
      ) app_stats ON app_stats.recruiter_id = r.id
      WHERE r.id IN (SELECT id FROM users WHERE role = 'recruiter' AND is_deleted = false)
      ORDER BY total_applications DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  },

  countRecruiters: async () => {
    const result = await pool.query(`SELECT COUNT(*)::int AS total FROM users WHERE role = 'recruiter' AND is_deleted = false`);
    return result.rows[0]?.total || 0;
  },

  getReportStats: async () => {
    const [
      jobsByStatus,
      appsByStatus,
      appsOverTime,
      topRecruiters,
    ] = await Promise.all([
      pool.query(`SELECT status, COUNT(*)::int AS count FROM job_posts GROUP BY status ORDER BY count DESC`),
      pool.query(`SELECT status, COUNT(*)::int AS count FROM applications GROUP BY status ORDER BY count DESC`),
      pool.query(
        `SELECT DATE_TRUNC('month', applied_at) AS month, COUNT(*)::int AS count
         FROM applications WHERE applied_at >= NOW() - INTERVAL '12 months'
         GROUP BY DATE_TRUNC('month', applied_at) ORDER BY month ASC`
      ),
      pool.query(
        `SELECT r.id, r.company_name, COUNT(a.id)::int AS total_applications,
                COUNT(a.id) FILTER (WHERE a.status = 'accepted')::int AS hired
         FROM recruiters r
         INNER JOIN job_posts jp ON jp.recruiter_id = r.id
         INNER JOIN applications a ON a.job_post_id = jp.id
         GROUP BY r.id, r.company_name ORDER BY total_applications DESC LIMIT 10`
      ),
    ]);

    return {
      jobsByStatus: jobsByStatus.rows,
      applicationsByStatus: appsByStatus.rows,
      applicationsOverTime: appsOverTime.rows,
      topRecruiters: topRecruiters.rows,
    };
  },
};
