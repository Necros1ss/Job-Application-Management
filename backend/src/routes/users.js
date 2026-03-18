import express from "express";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const mapProfile = (row) => ({
  id: row.id,
  name: row.role === "recruiter" ? row.company_name || "" : row.candidate_name || "",
  email:
    row.role === "recruiter"
      ? row.recruiter_email || row.login_name
      : row.candidate_email || row.login_name,
  phone: row.role === "recruiter" ? row.recruiter_phone || "" : row.candidate_phone || "",
  location: row.role === "recruiter" ? "" : row.address || "",
  experience: "",
  job_type: "",
  skills: [],
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
          r.company_name,
          r.email AS recruiter_email,
          r.phone AS recruiter_phone
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
  const { name, phone, location } = req.body;

  try {
    const roleResult = await pool.query("SELECT role, login_name FROM users WHERE id = $1", [
      req.user.id,
    ]);

    if (roleResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const { role, login_name: loginName } = roleResult.rows[0];

    if (role === "recruiter") {
      const recruiterUpdate = await pool.query(
        `UPDATE recruiters
         SET company_name = COALESCE($1, company_name),
             phone = COALESCE($2, phone)
         WHERE id = $3
         RETURNING id, company_name, email, phone`,
        [name, phone, req.user.id]
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
          recruiter_email: recruiterUpdate.rows[0].email,
          recruiter_phone: recruiterUpdate.rows[0].phone,
        })
      );
    }

    const candidateUpdate = await pool.query(
      `UPDATE candidates
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           address = COALESCE($3, address)
       WHERE id = $4
       RETURNING id, name, email, phone, address`,
      [name, phone, location, req.user.id]
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
      })
    );
  } catch (error) {
    return res.status(500).json({ message: "Failed to update profile", detail: error.message });
  }
});

export default router;
