import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

const router = express.Router();

const ALLOWED_ROLES = new Set(["candidate", "recruiter"]);

const normalizeEmail = (email) => email?.trim().toLowerCase();

const createToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

router.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }

  if (password.length < 5) {
    return res.status(400).json({ message: "Password must be at least 5 characters" });
  }

  const selectedRole = ALLOWED_ROLES.has(role) ? role : "candidate";
  const normalizedEmail = normalizeEmail(email);
  const displayName = name.trim();

  if (!normalizedEmail) {
    return res.status(400).json({ message: "Please enter a valid email" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await client.query("SELECT id FROM users WHERE login_name = $1", [normalizedEmail]);

    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Email is already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userInsert = await client.query(
      `INSERT INTO users (login_name, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, role`,
      [normalizedEmail, passwordHash, selectedRole]
    );

    const userId = userInsert.rows[0].id;

    if (selectedRole === "candidate") {
      await client.query(
        `INSERT INTO candidates (id, name, email)
         VALUES ($1, $2, $3)`,
        [userId, displayName, normalizedEmail]
      );
    } else {
      await client.query(
        `INSERT INTO recruiters (id, company_name, email)
         VALUES ($1, $2, $3)`,
        [userId, displayName, normalizedEmail]
      );
    }

    await client.query("COMMIT");

    const user = {
      id: userId,
      role: selectedRole,
      name: displayName,
      email: normalizedEmail,
    };

    const token = createToken(user);
    return res.status(201).json({ token, user });
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      return res.status(409).json({ message: "Email is already in use" });
    }

    return res.status(500).json({ message: "Failed to create account", detail: error.message });
  } finally {
    client.release();
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const loginName = normalizeEmail(email);

  try {
    const result = await pool.query(
      `SELECT
          u.id,
          u.role,
          u.login_name,
          u.password_hash,
          c.name AS candidate_name,
          c.email AS candidate_email,
          r.company_name AS recruiter_name,
          r.email AS recruiter_email
       FROM users u
       LEFT JOIN candidates c ON c.id = u.id
       LEFT JOIN recruiters r ON r.id = u.id
       WHERE u.login_name = $1
       LIMIT 1`,
      [loginName]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const row = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, row.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = {
      id: row.id,
      role: row.role,
      name: row.role === "recruiter" ? row.recruiter_name || row.login_name : row.candidate_name || row.login_name,
      email:
        row.role === "recruiter"
          ? row.recruiter_email || row.login_name
          : row.candidate_email || row.login_name,
    };

    const token = createToken(user);
    return res.json({ token, user });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", detail: error.message });
  }
});

export default router;
