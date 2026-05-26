import express from "express";
import { pool } from "../config/db.js";
import { requireAuth, requireHrManager } from "../middlewares/auth.js";
import { routeErrorResponse } from "../utils/apiResponse.js";

const router = express.Router();

router.use(requireAuth, requireHrManager);

// GET /api/hr-manager/dashboard - aggregate stats across all recruiters
router.get("/dashboard", async (req, res) => {
  try {
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

    const stats = {
      totalJobs: totalJobsResult.rows[0]?.total || 0,
      pendingApproval: pendingApprovalResult.rows[0]?.pending || 0,
      activeJobs: activeJobsResult.rows[0]?.active || 0,
      totalApplications: totalApplicationsResult.rows[0]?.total || 0,
      totalRecruiters: totalRecruitersResult.rows[0]?.total || 0,
    };

    const recentApplications = recentApplicationsResult.rows.map((row) => ({
      id: row.id,
      appliedAt: row.applied_at,
      status: row.status,
      candidateName: row.candidate_name,
      jobTitle: row.job_title,
      recruiterName: row.recruiter_name,
      jobPostId: row.job_post_id,
    }));

    return res.json({ stats, recentApplications });
  } catch (error) {
    return res.status(500).json(routeErrorResponse("Failed to load HR Manager dashboard", error));
  }
});

// GET /api/hr-manager/jobs - all job posts across recruiters with stats
router.get("/jobs", async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 50);
  const offset = (page - 1) * limit;
  const search = (req.query.search || "").toString().trim();
  const status = (req.query.status || "").toString().trim();

  const allowedStatuses = new Set(["", "active", "hidden", "deleted"]);
  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ message: "Invalid job status filter" });
  }

  try {
    const whereClauses = [];
    const params = [];
    let paramIndex = 1;

    if (search) {
      whereClauses.push(`(jp.title ILIKE $${paramIndex} OR r.company_name ILIKE $${paramIndex} OR jp.location ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex += 1;
    }

    if (status) {
      whereClauses.push(`jp.status = $${paramIndex}`);
      params.push(status);
      paramIndex += 1;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const [countResult, jobsResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM job_posts jp
         INNER JOIN recruiters r ON r.id = jp.recruiter_id
         ${whereSql}`,
        params
      ),
      pool.query(
        `SELECT jp.id,
                jp.recruiter_id,
                jp.title,
                jp.description,
                jp.location,
                jp.salary,
                jp.deadline,
                jp.created_at,
                jp.experience,
                jp.employment_type,
                jp.status,
                jp.moderated_by,
                jp.moderated_at,
                r.company_name,
                r.email AS recruiter_email,
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
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      ),
    ]);

    const total = Number(countResult.rows[0]?.total || 0);
    const jobs = jobsResult.rows.map((row) => ({
      id: row.id,
      recruiterId: row.recruiter_id,
      title: row.title,
      description: row.description || "",
      location: row.location || "",
      salary: row.salary || "",
      deadline: row.deadline,
      createdAt: row.created_at,
      experience: row.experience,
      employmentType: row.employment_type,
      status: row.status,
      companyName: row.company_name || "Unknown",
      recruiterEmail: row.recruiter_email || "",
      applicantCount: row.applicant_count,
      moderatedBy: row.moderated_by,
      moderatedAt: row.moderated_at,
    }));

    return res.json({
      data: jobs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json(routeErrorResponse("Failed to load job posts", error));
  }
});

// PATCH /api/hr-manager/jobs/:id/approve - approve or reject job post
router.patch("/jobs/:id/approve", async (req, res) => {
  const jobId = Number(req.params.id);
  const { approved } = req.body;

  if (!Number.isInteger(jobId) || jobId <= 0) {
    return res.status(400).json({ message: "Invalid job post id" });
  }

  // approved=true → active, approved=false → hidden
  const newStatus = approved === false ? "hidden" : "active";

  try {
    const result = await pool.query(
      `UPDATE job_posts
       SET status = $1,
           moderated_by = $2,
           moderated_at = now()
       WHERE id = $3
       RETURNING id, status, moderated_by, moderated_at`,
      [newStatus, req.user.id, jobId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Job post not found" });
    }

    return res.json({
      id: result.rows[0].id,
      status: result.rows[0].status,
      moderatedBy: result.rows[0].moderated_by,
      moderatedAt: result.rows[0].moderated_at,
    });
  } catch (error) {
    return res.status(500).json(routeErrorResponse("Failed to update job post status", error));
  }
});

// GET /api/hr-manager/recruiters - recruiter performance metrics
router.get("/recruiters", async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 50);
  const offset = (page - 1) * limit;

  try {
    const [countResult, recruitersResult] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM users WHERE role = 'recruiter' AND is_deleted = false`),
      pool.query(
        `SELECT r.id,
                r.company_name,
                r.email,
                u.created_at,
                COALESCE(jp_stats.total_jobs, 0)::int AS total_jobs,
                COALESCE(jp_stats.active_jobs, 0)::int AS active_jobs,
                COALESCE(app_stats.total_apps, 0)::int AS total_applications,
                COALESCE(app_stats.hired, 0)::int AS hired
         FROM recruiters r
         INNER JOIN users u ON u.id = r.id
         LEFT JOIN (
           SELECT recruiter_id,
                  COUNT(*)::int AS total_jobs,
                  COUNT(*) FILTER (WHERE status = 'active')::int AS active_jobs
           FROM job_posts
           GROUP BY recruiter_id
         ) jp_stats ON jp_stats.recruiter_id = r.id
         LEFT JOIN (
           SELECT jp.recruiter_id,
                  COUNT(a.id)::int AS total_apps,
                  COUNT(a.id) FILTER (WHERE a.status = 'accepted')::int AS hired
           FROM applications a
           INNER JOIN job_posts jp ON jp.id = a.job_post_id
           GROUP BY jp.recruiter_id
         ) app_stats ON app_stats.recruiter_id = r.id
         WHERE r.id IN (SELECT id FROM users WHERE role = 'recruiter' AND is_deleted = false)
         ORDER BY total_applications DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
    ]);

    const total = Number(countResult.rows[0]?.total || 0);
    const recruiters = recruitersResult.rows.map((row) => ({
      id: row.id,
      companyName: row.company_name || "Unknown",
      email: row.email || "",
      joinedAt: row.created_at,
      totalJobs: row.total_jobs,
      activeJobs: row.active_jobs,
      totalApplications: row.total_applications,
      hired: row.hired,
    }));

    return res.json({
      data: recruiters,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json(routeErrorResponse("Failed to load recruiter performance", error));
  }
});

// GET /api/hr-manager/reports/summary - summary report
router.get("/reports/summary", async (req, res) => {
  try {
    const [
      jobsByStatusResult,
      applicationsByStatusResult,
      applicationsOverTimeResult,
      topRecruitersResult,
    ] = await Promise.all([
      pool.query(
        `SELECT status, COUNT(*)::int AS count
         FROM job_posts
         GROUP BY status
         ORDER BY count DESC`
      ),
      pool.query(
        `SELECT a.status, COUNT(*)::int AS count
         FROM applications a
         GROUP BY a.status
         ORDER BY count DESC`
      ),
      pool.query(
        `SELECT DATE_TRUNC('month', applied_at) AS month, COUNT(*)::int AS count
         FROM applications
         WHERE applied_at >= NOW() - INTERVAL '12 months'
         GROUP BY DATE_TRUNC('month', applied_at)
         ORDER BY month ASC`
      ),
      pool.query(
        `SELECT r.id, r.company_name,
                COUNT(a.id)::int AS total_applications,
                COUNT(a.id) FILTER (WHERE a.status = 'accepted')::int AS hired
         FROM recruiters r
         INNER JOIN job_posts jp ON jp.recruiter_id = r.id
         INNER JOIN applications a ON a.job_post_id = jp.id
         GROUP BY r.id, r.company_name
         ORDER BY total_applications DESC
         LIMIT 10`
      ),
    ]);

    return res.json({
      jobsByStatus: jobsByStatusResult.rows.map((r) => ({ status: r.status, count: r.count })),
      applicationsByStatus: applicationsByStatusResult.rows.map((r) => ({ status: r.status, count: r.count })),
      applicationsOverTime: applicationsOverTimeResult.rows.map((r) => ({ month: r.month, count: r.count })),
      topRecruiters: topRecruitersResult.rows.map((r) => ({
        id: r.id,
        companyName: r.company_name,
        totalApplications: r.total_applications,
        hired: r.hired,
      })),
    });
  } catch (error) {
    return res.status(500).json(routeErrorResponse("Failed to load summary report", error));
  }
});

export default router;
