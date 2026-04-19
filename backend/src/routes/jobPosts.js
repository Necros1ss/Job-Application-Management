import express from "express";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const mapRow = (row) => ({
  id: row.id,
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
  address: row.address || "",
  industry: row.industry || "",
});

router.get("/", requireAuth, async (req, res) => {
  const search = (req.query.search || "").toString().trim();
  const searchLike = `%${search}%`;

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
          r.industry
       FROM job_posts jp
       LEFT JOIN recruiters r ON r.id = jp.recruiter_id
       WHERE ($1 = ''
         OR jp.title ILIKE $2
         OR COALESCE(r.company_name, '') ILIKE $2
         OR COALESCE(jp.location, '') ILIKE $2)
       ORDER BY jp.created_at DESC, jp.id DESC`,
      [search, searchLike]
    );

    return res.json(result.rows.map(mapRow));
  } catch (error) {
    return res.status(500).json({ message: "Failed to load job posts", detail: error.message });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
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
          r.industry
       FROM job_posts jp
       LEFT JOIN recruiters r ON r.id = jp.recruiter_id
       WHERE jp.id = $1`,
       [req.params.id]    
    );
    return res.json(mapRow(result.rows[0]));
  }
  catch (error) {
    return res.status(500).json({ message: "Failed to load job post", detail: error.message });
  }
});

export default router;
