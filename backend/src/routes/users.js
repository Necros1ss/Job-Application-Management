import express from "express";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const mapProfile = (row) => ({
  id: row.id,
  name: row.role === "recruiter" ? row.company_name || "" : row.candidate_name || "",
  full_name:
    row.role === "recruiter"
      ? row.recruiter_name || row.company_name || ""
      : row.candidate_name || "",
  job_title: row.role === "recruiter" ? "" : "",
  company_name: row.role === "recruiter" ? row.company_name || "" : "",
  email:
    row.role === "recruiter"
      ? row.recruiter_email || row.login_name
      : row.candidate_email || row.login_name,
  phone: row.role === "recruiter" ? row.recruiter_phone || "" : row.candidate_phone || "",
  location: row.role === "recruiter" ? row.recruiter_address || "" : row.address || "",
  address: row.role === "recruiter" ? row.recruiter_address || "" : row.address || "",
  website: row.role === "recruiter" ? row.recruiter_website || "" : "",
  linkedin: row.role === "recruiter" ? row.recruiter_linkedin || "" : "",
  industry: row.role === "recruiter" ? row.recruiter_industry || "" : "",
  company_size: row.role === "recruiter" ? row.recruiter_company_size || "" : "",
  tax_code: row.role === "recruiter" ? row.recruiter_tax_code || "" : "",
  description: row.role === "recruiter" ? row.recruiter_description || "" : "",
  dob: row.role === "recruiter" ? "" : row.candidate_dob || "", 
  experience: row.role === "recruiter" ? "" : row.experience || "",
  job_type: row.role === "recruiter" ? "" : row.job_type || "",
  skills: row.role === "recruiter" ? [] : row.skills || [],
  role: row.role,
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
          u.id,
          u.role,
          u.login_name,
          c.name AS candidate_name,
          c.email AS candidate_email,
          c.phone AS candidate_phone,
          c.address,
          c.dob AS candidate_dob,
          c.skills,
          c.experience,
          c.job_type,
          r.company_name,
          r.company_name AS recruiter_name,
          r.email AS recruiter_email,
            r.phone AS recruiter_phone,
            r.address AS recruiter_address,
            r.website AS recruiter_website,
            r.linkedin AS recruiter_linkedin,
            r.industry AS recruiter_industry,
            r.company_size AS recruiter_company_size,
            r.tax_code AS recruiter_tax_code,
            r.description AS recruiter_description
       FROM users u
       LEFT JOIN candidates c ON c.id = u.id
       LEFT JOIN recruiters r ON r.id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(mapProfile(result.rows[0]));
  } catch (error) {
    return res.status(500).json({ message: "Failed to get profile", detail: error.message });
  }
});

router.patch("/me", requireAuth, async (req, res) => {
  const {
    name,
    full_name: fullName,
    job_title: jobTitle,
    phone,
    location,
    address,
    dob,
    website,
    linkedin,
    industry,
    company_size: companySize,
    tax_code: taxCode,
    description,
    company_name: companyName,
    skills,
    experience,
    job_type: jobType,
    jobType: camelJobType,
  } = req.body;

  try {
    const roleResult = await pool.query("SELECT role, login_name FROM users WHERE id = $1", [
      req.user.id,
    ]);

    if (roleResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const { role, login_name: loginName } = roleResult.rows[0];

    if (role === "recruiter") {
      const normalizedAddress = address ?? location;
      const normalizedCompanyName = companyName ?? name;

      const recruiterUpdate = await pool.query(
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
         RETURNING id, company_name, email, phone, address, website, linkedin, industry, company_size, tax_code, description`,
        [
          normalizedCompanyName,
          phone,
          normalizedAddress,
          website,
          linkedin,
          industry,
          companySize,
          taxCode,
          description,
          req.user.id,
        ]
      );

      if (recruiterUpdate.rows.length === 0) {
        return res.status(404).json({ message: "User profile not found" });
      }

      return res.json(
        mapProfile({
          id: recruiterUpdate.rows[0].id,
          role,
          login_name: loginName,
          company_name: recruiterUpdate.rows[0].company_name,
          recruiter_name: recruiterUpdate.rows[0].company_name,
          recruiter_email: recruiterUpdate.rows[0].email,
          recruiter_phone: recruiterUpdate.rows[0].phone,
          recruiter_address: recruiterUpdate.rows[0].address,
          recruiter_website: recruiterUpdate.rows[0].website,
          recruiter_linkedin: recruiterUpdate.rows[0].linkedin,
          recruiter_industry: recruiterUpdate.rows[0].industry,
          recruiter_company_size: recruiterUpdate.rows[0].company_size,
          recruiter_tax_code: recruiterUpdate.rows[0].tax_code,
          recruiter_description: recruiterUpdate.rows[0].description,
        })
      );
    }

    const candidateUpdate = await pool.query(
      `UPDATE candidates
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           address = COALESCE($3, address),
           dob = COALESCE($4, dob),
           skills = COALESCE($5, skills),
           experience = COALESCE($6, experience),
           job_type = COALESCE($7, job_type)
       WHERE id = $8
       RETURNING id, name, email, phone, address, dob, skills, experience, job_type`,
      [
        name,
        phone,
        location,
        dob,
        Array.isArray(skills) ? skills : null,
        experience,
        jobType ?? camelJobType,
        req.user.id,
      ]
    );

    if (candidateUpdate.rows.length === 0) {
      return res.status(404).json({ message: "User profile not found" });
    }

    return res.json(
      mapProfile({
        id: candidateUpdate.rows[0].id,
        role,
        login_name: loginName,
        candidate_name: candidateUpdate.rows[0].name,
        candidate_email: candidateUpdate.rows[0].email,
        candidate_phone: candidateUpdate.rows[0].phone,
        address: candidateUpdate.rows[0].address,
        candidate_dob: candidateUpdate.rows[0].dob, 
        skills: candidateUpdate.rows[0].skills,
        experience: candidateUpdate.rows[0].experience,
        job_type: candidateUpdate.rows[0].job_type,
      })
    );
  } catch (error) {
    return res.status(500).json({ message: "Failed to update profile", detail: error.message });
  }
});

export default router;
