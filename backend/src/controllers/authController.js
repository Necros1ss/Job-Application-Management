import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { sendEmail } from "../utils/mailer.js";

const ALLOWED_ROLES = new Set(["candidate", "recruiter"]);
const normalizeEmail = (email) => email?.trim().toLowerCase();
const PASSWORD_RESET_MESSAGE = "If that email is registered, a reset link has been sent.";
const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "30d";
const REFRESH_COOKIE_NAME = "refresh_token";

const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const createAccessToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );

const createRefreshToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role },
    getRefreshSecret(),
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth",
  maxAge: 30 * 24 * 60 * 60 * 1000,
});

const setRefreshCookie = (res, user) => {
  res.cookie(REFRESH_COOKIE_NAME, createRefreshToken(user), refreshCookieOptions());
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { ...refreshCookieOptions(), maxAge: undefined });
};

const parseCookies = (cookieHeader = "") =>
  cookieHeader.split(";").reduce((accumulator, cookiePart) => {
    const [rawKey, ...rawValue] = cookiePart.trim().split("=");
    if (!rawKey) return accumulator;
    accumulator[rawKey] = decodeURIComponent(rawValue.join("="));
    return accumulator;
  }, {});

const getCookie = (req, name) => parseCookies(req.headers.cookie || "")[name];

const getUserProfileById = async (userId) => {
  const result = await pool.query(
    `SELECT u.id, u.role, u.login_name, c.name AS candidate_name, c.email AS candidate_email, r.company_name AS recruiter_name, r.email AS recruiter_email
     FROM users u
     LEFT JOIN candidates c ON c.id = u.id
     LEFT JOIN recruiters r ON r.id = u.id
     WHERE u.id = $1
     LIMIT 1`,
    [userId]
  );

  return result.rows[0] || null;
};

const mapUser = (row) => ({
  id: row.id,
  role: row.role,
  name: row.role === "recruiter" ? row.recruiter_name || row.login_name : row.candidate_name || row.login_name,
  email: row.role === "recruiter" ? row.recruiter_email || row.login_name : row.candidate_email || row.login_name,
});

export const signup = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required" });
  if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });

  const selectedRole = ALLOWED_ROLES.has(role) ? role : "candidate";
  const normalizedEmail = normalizeEmail(email);
  const displayName = name.trim();

  if (!normalizedEmail) return res.status(400).json({ message: "Please enter a valid email" });

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
      `INSERT INTO users (login_name, password_hash, role) VALUES ($1, $2, $3) RETURNING id, role`,
      [normalizedEmail, passwordHash, selectedRole]
    );
    const userId = userInsert.rows[0].id;

    if (selectedRole === "candidate") {
      await client.query(`INSERT INTO candidates (id, name, email) VALUES ($1, $2, $3)`, [userId, displayName, normalizedEmail]);
    } else {
      await client.query(`INSERT INTO recruiters (id, company_name, email) VALUES ($1, $2, $3)`, [userId, displayName, normalizedEmail]);
    }

    await client.query("COMMIT");
    const user = { id: userId, role: selectedRole, name: displayName, email: normalizedEmail };
    setRefreshCookie(res, user);
    const token = createAccessToken(user);
    return res.status(201).json({ token, accessToken: token, user });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") return res.status(409).json({ message: "Email is already in use" });
    return res.status(500).json({ message: "Failed to create account", detail: error.message });
  } finally {
    client.release();
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

  const loginName = normalizeEmail(email);
  try {
    const result = await pool.query(
      `SELECT u.id, u.role, u.login_name, u.password_hash, c.name AS candidate_name, c.email AS candidate_email, r.company_name AS recruiter_name, r.email AS recruiter_email FROM users u LEFT JOIN candidates c ON c.id = u.id LEFT JOIN recruiters r ON r.id = u.id WHERE u.login_name = $1 LIMIT 1`,
      [loginName]
    );

    if (result.rows.length === 0) return res.status(401).json({ message: "Invalid email or password" });

    const row = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, row.password_hash);
    if (!isValidPassword) return res.status(401).json({ message: "Invalid email or password" });

    const user = {
      id: row.id,
      role: row.role,
      name: row.role === "recruiter" ? row.recruiter_name || row.login_name : row.candidate_name || row.login_name,
      email: row.role === "recruiter" ? row.recruiter_email || row.login_name : row.candidate_email || row.login_name,
    };
    setRefreshCookie(res, user);
    const token = createAccessToken(user);
    return res.json({ token, accessToken: token, user });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", detail: error.message });
  }
};

export const refresh = async (req, res) => {
  const refreshToken = getCookie(req, REFRESH_COOKIE_NAME);

  if (!refreshToken) {
    return res.status(401).json({ message: "Session expired" });
  }

  try {
    const payload = jwt.verify(refreshToken, getRefreshSecret());
    const profile = await getUserProfileById(payload.id);

    if (!profile) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: "Session expired" });
    }

    const user = mapUser(profile);
    setRefreshCookie(res, user);
    const token = createAccessToken(user);
    return res.json({ token, accessToken: token, user });
  } catch {
    clearRefreshCookie(res);
    return res.status(401).json({ message: "Session expired" });
  }
};

export const logout = async (_req, res) => {
  clearRefreshCookie(res);
  return res.status(200).json({ message: "Logged out" });
};

export const forgotPassword = async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body.email);

  try {
    if (normalizedEmail) {
      const userResult = await pool.query(
        `SELECT u.id,
                COALESCE(c.email, r.email) AS email
         FROM users u
         LEFT JOIN candidates c ON c.id = u.id
         LEFT JOIN recruiters r ON r.id = u.id
         WHERE u.login_name = $1
         LIMIT 1`,
        [normalizedEmail]
      );

      const user = userResult.rows[0];
      if (user) {
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await pool.query(
          `INSERT INTO password_reset_tokens (user_id, token, expires_at)
           VALUES ($1, $2, $3)`,
          [user.id, token, expiresAt]
        );

        const clientUrl = process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || "http://localhost:5173";
        const resetLink = `${clientUrl.replace(/\/$/, "")}/reset-password?token=${token}`;

        await sendEmail(
          user.email,
          "Reset your password",
          `
            <p>You requested a password reset for your Job Application Management account.</p>
            <p>Click the link below to set a new password. This link expires in 1 hour.</p>
            <p><a href="${resetLink}">${resetLink}</a></p>
            <p>If you did not request this, you can safely ignore this email.</p>
          `
        );
      }
    }
  } catch (error) {
    console.error("Forgot password failed:", error.message);
  }

  return res.status(200).json({ message: PASSWORD_RESET_MESSAGE });
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token and new password are required" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const tokenResult = await client.query(
      `SELECT id, user_id
       FROM password_reset_tokens
       WHERE token = $1
         AND used = false
         AND expires_at > now()
       LIMIT 1
       FOR UPDATE`,
      [token]
    );

    const resetToken = tokenResult.rows[0];
    if (!resetToken) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, resetToken.user_id]);
    await client.query("UPDATE password_reset_tokens SET used = true WHERE id = $1", [resetToken.id]);

    await client.query("COMMIT");
    return res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to reset password", detail: error.message });
  } finally {
    client.release();
  }
};
