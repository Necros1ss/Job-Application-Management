import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { USER_ROLES } from "../constants/roles.js";
import { pool } from "../config/db.js";
import {
  createCandidateProfile,
  createPasswordResetToken,
  createRecruiterProfile,
  createUser,
  findPasswordResetAccount,
  findUserByLoginName,
  findUserProfileById,
} from "../repositories/authRepository.js";
import { sendEmail } from "../utils/mailer.js";

const PASSWORD_RESET_MESSAGE = "If that email is registered, a reset link has been sent.";

const createToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

const mapUserProfile = (row) => ({
  id: row.id,
  role: row.role,
  name: row.role === USER_ROLES.RECRUITER ? row.recruiter_name || row.login_name : row.candidate_name || row.login_name,
  email: row.role === USER_ROLES.RECRUITER ? row.recruiter_email || row.login_name : row.candidate_email || row.login_name,
});

export const signup = async ({ name, email, password, role }) => {
  const loginName = email.trim().toLowerCase();
  const displayName = name.trim();
  const selectedRole = role === USER_ROLES.RECRUITER ? USER_ROLES.RECRUITER : USER_ROLES.CANDIDATE;

  const existing = await findUserByLoginName(loginName);
  if (existing) {
    const error = new Error("Email is already in use");
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser({ loginName, passwordHash, role: selectedRole });

  if (selectedRole === USER_ROLES.RECRUITER) {
    await createRecruiterProfile({ id: user.id, companyName: displayName, email: loginName });
  } else {
    await createCandidateProfile({ id: user.id, name: displayName, email: loginName });
  }

  const payload = { id: user.id, role: selectedRole, name: displayName, email: loginName };
  return { token: createToken(payload), user: payload };
};

export const login = async ({ email, password }) => {
  const loginName = email.trim().toLowerCase();
  const user = await findUserByLoginName(loginName);

  if (!user) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  if (user.is_locked) {
    const error = new Error("Account is locked");
    error.status = 403;
    throw error;
  }

  if (user.is_deleted) {
    const error = new Error("Account has been removed");
    error.status = 403;
    throw error;
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }

  const profile = await findUserProfileById(user.id);
  const mappedUser = mapUserProfile(profile || user);
  return { token: createToken(mappedUser), user: mappedUser };
};

export const forgotPassword = async ({ email }) => {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return { message: PASSWORD_RESET_MESSAGE };
  }

  try {
    const account = await findPasswordResetAccount(normalizedEmail);
    if (account) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await createPasswordResetToken({ userId: account.id, token, expiresAt });

      const clientUrl = process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || "http://localhost:5173";
      const resetLink = `${clientUrl.replace(/\/$/, "")}/reset-password?token=${token}`;

      await sendEmail(
        normalizedEmail,
        "Reset your password",
        `
          <p>You requested a password reset for your Job Application Management account.</p>
          <p>Click the link below to set a new password. This link expires in 1 hour.</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>If you did not request this, you can safely ignore this email.</p>
        `
      );
    }
  } catch (error) {
    console.error("Forgot password failed:", error.message);
  }

  return { message: PASSWORD_RESET_MESSAGE };
};

export const resetPassword = async ({ token, newPassword }) => {
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
      const error = new Error("Invalid or expired reset token");
      error.status = 400;
      throw error;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, resetToken.user_id]);
    await client.query("UPDATE password_reset_tokens SET used = true WHERE id = $1", [resetToken.id]);

    await client.query("COMMIT");
    return { message: "Password has been reset successfully" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
