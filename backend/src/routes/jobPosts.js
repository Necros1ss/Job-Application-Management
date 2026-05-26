import express from "express";
import { pool } from "../config/db.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { createJobSchema, updateJobSchema } from "../validators/jobPostValidators.js";

const router = express.Router();

const getPagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 50);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

const EMPLOYMENT_TYPES = new Set(["full-time", "part-time", "contract", "internship"]);
const EXPERIENCE_LEVELS = new Set(["0-1 years", "1-3 years", "3-5 years", "5+ years"]);
const SORT_SQL = {
  newest: "jp.created_at DESC, jp.id DESC",
  oldest: "jp.created_at ASC, jp.id ASC",
  deadline: "jp.deadline ASC NULLS LAST, jp.created_at DESC, jp.id DESC",
};

const parseOptionalNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const getJobPostFilters = (query) => {
  const search = (query.search || "").toString().trim();
  const location = (query.location || "").toString().trim();
  const employmentType = (query.employment_type || "").toString().trim().toLowerCase();
  const experience = (query.experience || "").toString().trim();
  const salaryMin = parseOptionalNumber(query.salary_min);
  const salaryMax = parseOptionalNumber(query.salary_max);
  const sort = SORT_SQL[query.sort] ? query.sort : "newest";

  return {
    search,
    location,
    employmentType: EMPLOYMENT_TYPES.has(employmentType) ? employmentType : "",
    experience: EXPERIENCE_LEVELS.has(experience) ? experience : "",
    salaryMin,
    salaryMax,
    sort,
  };
};

const buildJobPostWhere = ({ search, location, employmentType, experience, salaryMin, salaryMax }) => {
  const clauses = ["COALESCE(jp.status::text, 'active') = 'active'"];
  const params = [];
  const salaryNumberSql = "COALESCE(NULLIF(replace(substring(COALESCE(jp.salary, '') from '[0-9][0-9,]*'), ',', ''), '')::numeric, 0)";

  if (search) {
    params.push(search);
    const index = params.length;
    clauses.push(
      `(to_tsvector('english', COALESCE(jp.title, '') || ' ' || COALESCE(jp.description, '')) @@ plainto_tsquery('english', $${index})
        OR COALESCE(r.company_name, '') ILIKE '%' || $${index} || '%')`
    );
  }

  if (location) {
    params.push(location);
    clauses.push(`COALESCE(jp.location, '') ILIKE '%' || $${params.length} || '%'`);
  }

  if (employmentType) {
    params.push(employmentType);
    clauses.push(`LOWER(COALESCE(jp.employment_type, '')) = $${params.length}`);
  }

  if (experience) {
    params.push(experience);
    clauses.push(`COALESCE(jp.experience, '') = $${params.length}`);
  }

  if (salaryMin !== null) {
    params.push(salaryMin);
    clauses.push(`${salaryNumberSql} >= $${params.length}`);
  }

  if (salaryMax !== null) {
    params.push(salaryMax);
    clauses.push(`${salaryNumberSql} <= $${params.length}`);
  }

  return {
    whereSql: `WHERE ${clauses.join(" AND ")}`,
    params,
  };
};

const mapRow = (row) => ({
  id: row.id,
  recruiterId: row.recruiter_id,
  title: row.title,
  description: row.description || "",
  location: row.location || "",
  salary: row.salary || "",
  deadline: row.deadline,
  createdAt: row.created_at,
  experience: row.experience,
  employment_type: row.employment_type,
  responsibilities: row.responsibilities,
  requirements: row.requirements,
  companyName: row.company_name || "Unknown Company",
  phone: row.phone || "",
  website: row.website || "",
  email: row.email || "",
  address: row.address || "",
  industry: row.industry || "",
  applicantCount: Number(row.applicant_count || 0),
});

router.get("/", async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const filters = getJobPostFilters(req.query);
  const { whereSql, params } = buildJobPostWhere(filters);

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM job_posts jp
       LEFT JOIN recruiters r ON r.id = jp.recruiter_id
       ${whereSql}`,
      params
    );

    const total = Number(countResult.rows[0]?.total || 0);
    const totalPages = Math.ceil(total / limit);

    const result = await pool.query(
      `SELECT
          jp.id,
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
          r.company_name,
          r.phone,
          r.website,
          r.address,
          r.industry,
          r.email
       FROM job_posts jp
       LEFT JOIN recruiters r ON r.id = jp.recruiter_id
       ${whereSql}
       ORDER BY ${SORT_SQL[filters.sort]}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return res.json({
      data: result.rows.map(mapRow),
      total,
      page,
      totalPages,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load job posts", detail: error.message });
  }
});

router.get("/mine", requireAuth, async (req, res) => {
  if (req.user?.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiters can access this resource" });
  }

  try {
    const result = await pool.query(
      `SELECT
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
          r.company_name,
          r.phone,
          r.website,
          r.address,
          r.industry,
          r.email,
          COALESCE(COUNT(a.id), 0) AS applicant_count
       FROM job_posts jp
       LEFT JOIN recruiters r ON r.id = jp.recruiter_id
       LEFT JOIN applications a ON a.job_post_id = jp.id
       WHERE jp.recruiter_id = $1
       GROUP BY
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
          r.company_name,
          r.phone,
          r.website,
          r.address,
          r.industry,
          r.email
       ORDER BY jp.created_at DESC, jp.id DESC`,
      [req.user.id]
    );

    return res.json(result.rows.map(mapRow));
  } catch (error) {
    return res.status(500).json({ message: "Failed to load recruiter job posts", detail: error.message });
  }
});

router.get('/:id', async (req, res) => {
  const postId = Number(req.params.id);
  if (!Number.isInteger(postId) || postId <= 0) {
    return res.status(400).json({ message: "Invalid job post id" });
  }

  try {
    const result = await pool.query(
      `SELECT
          jp.id,
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
          r.company_name,
          r.phone,
          r.website,
          r.address,
          r.industry,
          r.email
       FROM job_posts jp
       LEFT JOIN recruiters r ON r.id = jp.recruiter_id
       WHERE jp.id = $1`,
       [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Job post not found" });
    }

    return res.json(mapRow(result.rows[0]));
  }
  catch (error) {
    return res.status(500).json({ message: "Failed to load job post", detail: error.message });
  }
});

router.post("/", requireAuth, validate(createJobSchema), async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can create job posts" });
  }

  const {
    title, description, location, salary, experience,
    employment_type, deadline, responsibilities, requirements
  } = req.validated.body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return res.status(400).json({ message: "Job title is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO job_posts (recruiter_id, title, description, location, salary,
        experience, employment_type, deadline, responsibilities, requirements)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        req.user.id,
        title.trim(),
        description?.trim() || "",
        location?.trim() || "",
        salary?.trim() || "",
        experience?.trim() || "",
        employment_type?.trim() || "",
        deadline || null,
        responsibilities?.trim() || "",
        requirements?.trim() || "",
      ]
    );

    return res.status(201).json({ id: result.rows[0].id, ...req.validated.body });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create job post", detail: error.message });
  }
});

router.put("/:id", requireAuth, validate(updateJobSchema), async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can update job posts" });
  }

  const postId = Number(req.validated.params.id);
  if (!Number.isInteger(postId) || postId <= 0) {
    return res.status(400).json({ message: "Invalid job post id" });
  }

  const {
    title, description, location, salary, experience,
    employment_type, deadline, responsibilities, requirements
  } = req.validated.body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return res.status(400).json({ message: "Job title is required" });
  }

  try {
    const existing = await pool.query(
      `SELECT id FROM job_posts WHERE id = $1 AND recruiter_id = $2`,
      [postId, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Job post not found or you don't have permission to edit it" });
    }

    await pool.query(
      `UPDATE job_posts
       SET title = $1, description = $2, location = $3, salary = $4,
           experience = $5, employment_type = $6, deadline = $7,
           responsibilities = $8, requirements = $9
       WHERE id = $10 AND recruiter_id = $11`,
      [
        title.trim(),
        description?.trim() || "",
        location?.trim() || "",
        salary?.trim() || "",
        experience?.trim() || "",
        employment_type?.trim() || "",
        deadline || null,
        responsibilities?.trim() || "",
        requirements?.trim() || "",
        postId,
        req.user.id,
      ]
    );

    return res.json({ id: postId, ...req.validated.body });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update job post", detail: error.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can delete job posts" });
  }

  const postId = Number(req.params.id);
  if (!Number.isInteger(postId) || postId <= 0) {
    return res.status(400).json({ message: "Invalid job post id" });
  }

  try {
    const result = await pool.query(
      `DELETE FROM job_posts WHERE id = $1 AND recruiter_id = $2 RETURNING id`,
      [postId, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Job post not found or you don't have permission to delete it" });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete job post", detail: error.message });
  }
});

export default router;
