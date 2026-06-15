import { hrManagerRepository } from "../repositories/hrManagerRepository.js";

export const hrManagerService = {
  getDashboard: async () => {
    const { stats, recentApplications } = await hrManagerRepository.getDashboardStats();
    return {
      stats,
      recentApplications: recentApplications.map((row) => ({
        id: row.id,
        appliedAt: row.applied_at,
        status: row.status,
        candidateName: row.candidate_name,
        jobTitle: row.job_title,
        recruiterName: row.recruiter_name,
        jobPostId: row.job_post_id,
      }))
    };
  },

  getJobs: async ({ page = 1, limit = 10, search = "", status = "" }) => {
    const offset = (page - 1) * limit;
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
    const total = await hrManagerRepository.countAllJobs({ whereSql, params });
    const rows = await hrManagerRepository.findAllJobs({ whereSql, params, limit, offset });

    return {
      data: rows.map((row) => ({
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
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  approveJob: async (jobId, approved, moderatorId) => {
    const newStatus = approved === false ? "hidden" : "active";
    const result = await hrManagerRepository.updateJobStatus(jobId, newStatus, moderatorId);
    if (!result) throw new Error("Job post not found");
    return {
      id: result.id,
      status: result.status,
      moderatedBy: result.moderated_by,
      moderatedAt: result.moderated_at,
    };
  },

  getRecruiters: async ({ page = 1, limit = 10 }) => {
    const offset = (page - 1) * limit;
    const total = await hrManagerRepository.countRecruiters();
    const rows = await hrManagerRepository.findRecruitersPerformance({ limit, offset });

    return {
      data: rows.map((row) => ({
        id: row.id,
        companyName: row.company_name || "Unknown",
        email: row.email || "",
        joinedAt: row.created_at,
        totalJobs: row.total_jobs,
        activeJobs: row.active_jobs,
        totalApplications: row.total_applications,
        hired: row.hired,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  getSummaryReport: async () => {
    const stats = await hrManagerRepository.getReportStats();
    return {
      jobsByStatus: stats.jobsByStatus.map((r) => ({ status: r.status, count: r.count })),
      applicationsByStatus: stats.applicationsByStatus.map((r) => ({ status: r.status, count: r.count })),
      applicationsOverTime: stats.applicationsOverTime.map((r) => ({ month: r.month, count: r.count })),
      topRecruiters: stats.topRecruiters.map((r) => ({
        id: r.id,
        companyName: r.company_name,
        totalApplications: r.total_applications,
        hired: r.hired,
      })),
    };
  },
};
