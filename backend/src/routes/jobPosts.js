import express from "express";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const getPagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 50);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
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

router.get("/", requireAuth, async (req, res) => {
  const search = (req.query.search || "").toString().trim();
  const searchLike = `%${search}%`;
  const { page, limit, offset } = getPagination(req.query);

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM job_posts jp
       LEFT JOIN recruiters r ON r.id = jp.recruiter_id
       WHERE ($1 = ''
         OR jp.title ILIKE $2
         OR COALESCE(r.company_name, '') ILIKE $2
         OR COALESCE(jp.location, '') ILIKE $2)`,
      [search, searchLike]
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
       WHERE ($1 = ''
         OR jp.title ILIKE $2
         OR COALESCE(r.company_name, '') ILIKE $2
         OR COALESCE(jp.location, '') ILIKE $2)
       ORDER BY jp.created_at DESC, jp.id DESC
       LIMIT $3 OFFSET $4`,
      [search, searchLike, limit, offset]
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

router.get('/:id', requireAuth, async (req, res) => {
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

router.post("/", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can create job posts" });
  }

  const {
    title, description, location, salary, experience,
    employment_type, deadline, responsibilities, requirements
  } = req.body;

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

    return res.status(201).json({ id: result.rows[0].id, ...req.body });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create job post", detail: error.message });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ message: "Only recruiter accounts can update job posts" });
  }

  const postId = Number(req.params.id);
  if (!Number.isInteger(postId) || postId <= 0) {
    return res.status(400).json({ message: "Invalid job post id" });
  }

  const {
    title, description, location, salary, experience,
    employment_type, deadline, responsibilities, requirements
  } = req.body;

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

    return res.json({ id: postId, ...req.body });
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
