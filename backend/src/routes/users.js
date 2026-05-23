import express from "express";
import fs from "fs";
import { promises as fsPromises } from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../config/db.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROFILE_UPLOAD_DIR = path.resolve(__dirname, "../../uploads/profile");
const ALLOWED_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

fs.mkdirSync(PROFILE_UPLOAD_DIR, { recursive: true });

const sanitizeProfileFilename = (originalName = "profile-image") => {
  const extension = path.extname(originalName).toLowerCase();
  const safeExtension = ALLOWED_IMAGE_EXTENSIONS.has(extension) ? extension : "";
  const baseName =
    path
      .basename(originalName, extension)
      .replace(/[\u0000-\u001f\u007f-\u009f]/g, "")
      .normalize("NFC")
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 100) || "profile-image";

  return `${baseName}${safeExtension}`;
};

const resolveProfileMediaPath = (fileName) => {
  if (!fileName || path.basename(fileName) !== fileName) {
    return null;
  }

  const resolvedPath = path.resolve(PROFILE_UPLOAD_DIR, fileName);
  const uploadRoot = `${PROFILE_UPLOAD_DIR}${path.sep}`;

  return resolvedPath.startsWith(uploadRoot) ? resolvedPath : null;
};

const cleanupFile = async (filePath) => {
  if (!filePath) return;

  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

const profileMediaUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, PROFILE_UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      const safeOriginalName = sanitizeProfileFilename(file.originalname);
      cb(null, `${req.user.id}_${req.user.role}_${Date.now()}_${safeOriginalName}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();

    if (ALLOWED_IMAGE_EXTENSIONS.has(extension) && ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error("Only JPG, PNG, WEBP and GIF images are allowed"));
  },
});

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
  avatar_file_name: row.role === "recruiter" ? "" : row.avatar_file_name || "",
  avatarFileName: row.role === "recruiter" ? "" : row.avatar_file_name || "",
  avatar_mime_type: row.role === "recruiter" ? "" : row.avatar_mime_type || "",
  logo_file_name: row.role === "recruiter" ? row.logo_file_name || "" : "",
  logoFileName: row.role === "recruiter" ? row.logo_file_name || "" : "",
  logo_mime_type: row.role === "recruiter" ? row.logo_mime_type || "" : "",
  dob: row.role === "recruiter" ? "" : row.candidate_dob || "", 
  experience: row.role === "recruiter" ? "" : row.experience || "",
  job_type: row.role === "recruiter" ? "" : row.job_type || "",
  skills: row.role === "recruiter" ? [] : row.skills || [],
  notificationPreferences: row.notification_preferences || {},
  role: row.role,
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
          u.id,
          u.role,
          u.login_name,
          u.notification_preferences,
          c.name AS candidate_name,
          c.email AS candidate_email,
          c.phone AS candidate_phone,
          c.address,
          c.dob AS candidate_dob,
          c.skills,
          c.experience,
          c.job_type,
          c.avatar_file_name,
          c.avatar_mime_type,
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
            r.description AS recruiter_description,
            r.logo_file_name,
            r.logo_mime_type
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

router.get("/me/avatar", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
          u.role,
          c.avatar_file_name,
          c.avatar_mime_type,
          r.logo_file_name,
          r.logo_mime_type
       FROM users u
       LEFT JOIN candidates c ON c.id = u.id
       LEFT JOIN recruiters r ON r.id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const row = result.rows[0];
    const fileName = row.role === "recruiter" ? row.logo_file_name : row.avatar_file_name;
    const mimeType = row.role === "recruiter" ? row.logo_mime_type : row.avatar_mime_type;
    const filePath = resolveProfileMediaPath(fileName);

    if (!filePath) {
      return res.status(404).json({ message: "Profile image not found" });
    }

    await fsPromises.access(filePath);
    res.setHeader("Content-Type", mimeType || "application/octet-stream");
    res.setHeader("Cache-Control", "private, max-age=300");
    return res.sendFile(filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(404).json({ message: "Profile image not found" });
    }

    return res.status(500).json({ message: "Failed to load profile image", detail: error.message });
  }
});

router.patch("/me/avatar", requireAuth, profileMediaUpload.single("avatar"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "avatar image is required" });
  }

  try {
    const roleResult = await pool.query("SELECT role, login_name FROM users WHERE id = $1", [req.user.id]);

    if (roleResult.rows.length === 0) {
      await cleanupFile(req.file.path);
      return res.status(404).json({ message: "User not found" });
    }

    const { role, login_name: loginName } = roleResult.rows[0];
    let previousFileName = "";
    let updatedProfile;

    if (role === "recruiter") {
      const current = await pool.query(
        `SELECT logo_file_name
         FROM recruiters
         WHERE id = $1`,
        [req.user.id]
      );

      previousFileName = current.rows[0]?.logo_file_name || "";

      const result = await pool.query(
        `UPDATE recruiters
         SET logo_file_name = $1,
             logo_mime_type = $2,
             logo_file_size_bytes = $3
         WHERE id = $4
         RETURNING id, company_name, email, phone, address, website, linkedin, industry, company_size, tax_code, description, logo_file_name, logo_mime_type`,
        [req.file.filename, req.file.mimetype, req.file.size, req.user.id]
      );

      if (result.rows.length === 0) {
        await cleanupFile(req.file.path);
        return res.status(404).json({ message: "User profile not found" });
      }

      updatedProfile = mapProfile({
        id: result.rows[0].id,
        role,
        login_name: loginName,
        company_name: result.rows[0].company_name,
        recruiter_name: result.rows[0].company_name,
        recruiter_email: result.rows[0].email,
        recruiter_phone: result.rows[0].phone,
        recruiter_address: result.rows[0].address,
        recruiter_website: result.rows[0].website,
        recruiter_linkedin: result.rows[0].linkedin,
        recruiter_industry: result.rows[0].industry,
        recruiter_company_size: result.rows[0].company_size,
        recruiter_tax_code: result.rows[0].tax_code,
        recruiter_description: result.rows[0].description,
        logo_file_name: result.rows[0].logo_file_name,
        logo_mime_type: result.rows[0].logo_mime_type,
      });
    } else {
      const current = await pool.query(
        `SELECT avatar_file_name
         FROM candidates
         WHERE id = $1`,
        [req.user.id]
      );

      previousFileName = current.rows[0]?.avatar_file_name || "";

      const result = await pool.query(
        `UPDATE candidates
         SET avatar_file_name = $1,
             avatar_mime_type = $2,
             avatar_file_size_bytes = $3
         WHERE id = $4
         RETURNING id, name, email, phone, address, dob, skills, experience, job_type, avatar_file_name, avatar_mime_type`,
        [req.file.filename, req.file.mimetype, req.file.size, req.user.id]
      );

      if (result.rows.length === 0) {
        await cleanupFile(req.file.path);
        return res.status(404).json({ message: "User profile not found" });
      }

      updatedProfile = mapProfile({
        id: result.rows[0].id,
        role,
        login_name: loginName,
        candidate_name: result.rows[0].name,
        candidate_email: result.rows[0].email,
        candidate_phone: result.rows[0].phone,
        address: result.rows[0].address,
        candidate_dob: result.rows[0].dob,
        skills: result.rows[0].skills,
        experience: result.rows[0].experience,
        job_type: result.rows[0].job_type,
        avatar_file_name: result.rows[0].avatar_file_name,
        avatar_mime_type: result.rows[0].avatar_mime_type,
      });
    }

    if (previousFileName && previousFileName !== req.file.filename) {
      await cleanupFile(resolveProfileMediaPath(previousFileName));
    }

    return res.json(updatedProfile);
  } catch (error) {
    await cleanupFile(req.file.path);
    return res.status(500).json({ message: "Failed to upload profile image", detail: error.message });
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
         RETURNING id, company_name, email, phone, address, website, linkedin, industry, company_size, tax_code, description, logo_file_name, logo_mime_type`,
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
          logo_file_name: recruiterUpdate.rows[0].logo_file_name,
          logo_mime_type: recruiterUpdate.rows[0].logo_mime_type,
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
       RETURNING id, name, email, phone, address, dob, skills, experience, job_type, avatar_file_name, avatar_mime_type`,
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
        avatar_file_name: candidateUpdate.rows[0].avatar_file_name,
        avatar_mime_type: candidateUpdate.rows[0].avatar_mime_type,
      })
    );
  } catch (error) {
    return res.status(500).json({ message: "Failed to update profile", detail: error.message });
  }
});

router.patch("/notification-preferences", requireAuth, async (req, res) => {
  const preferences =
    req.body?.preferences && typeof req.body.preferences === "object" && !Array.isArray(req.body.preferences)
      ? req.body.preferences
      : null;

  if (!preferences) {
    return res.status(400).json({ message: "preferences object is required" });
  }

  const allowedKeys = new Set(["newApplication", "interviewReminder", "statusChanged", "newMessage"]);
  const normalizedPreferences = {};

  for (const [key, value] of Object.entries(preferences)) {
    if (allowedKeys.has(key) && typeof value === "boolean") {
      normalizedPreferences[key] = value;
    }
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET notification_preferences = COALESCE(notification_preferences, '{}'::jsonb) || $1::jsonb
       WHERE id = $2
       RETURNING notification_preferences`,
      [JSON.stringify(normalizedPreferences), req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ notificationPreferences: result.rows[0].notification_preferences || {} });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update notification preferences", detail: error.message });
  }
});

router.delete("/me", requireAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query(
      `DELETE FROM users
       WHERE id = $1
       RETURNING id`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }

    await client.query("COMMIT");
    return res.status(204).send();
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to delete account", detail: error.message });
  } finally {
    client.release();
  }
});

export default router;
