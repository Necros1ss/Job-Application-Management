import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { USER_ROLES } from "../constants/roles.js";
import { errorResponse } from "../utils/apiResponse.js";

const getUserById = async (id) => {
  const result = await pool.query(
    `SELECT id, role, login_name, is_locked, is_deleted
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return result.rows[0] || null;
};

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json(errorResponse("Unauthorized"));
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getUserById(payload.id);

    if (!user) {
      return res.status(401).json(errorResponse("Invalid or expired token"));
    }

    if (user.is_deleted) {
      return res.status(403).json(errorResponse("Account has been removed"));
    }

    if (user.is_locked) {
      return res.status(403).json(errorResponse("Account is locked"));
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: payload.email,
      name: payload.name,
      loginName: user.login_name,
    };

    return next();
  } catch {
    return res.status(401).json(errorResponse("Invalid or expired token"));
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json(errorResponse("Unauthorized"));
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json(errorResponse("Forbidden"));
  }

  return next();
};

export const requireAdmin = requireRole(USER_ROLES.ADMIN);
export const requireRecruiter = requireRole(USER_ROLES.RECRUITER);
export const requireCandidate = requireRole(USER_ROLES.CANDIDATE);
export const requireHrManager = requireRole(USER_ROLES.HR_MANAGER);
export const requireInterviewer = requireRole(USER_ROLES.INTERVIEWER);

export const requireJobPostOwnerOrHrManager = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json(errorResponse("Unauthorized"));
  }

  if (req.user.role === USER_ROLES.HR_MANAGER) {
    return next();
  }

  if (req.user.role === USER_ROLES.RECRUITER) {
    const jobId = req.params.id || req.body.jobPostId || req.body.job_post_id;
    if (jobId) {
      try {
        const result = await pool.query(
          `SELECT recruiter_id FROM job_posts WHERE id = $1 LIMIT 1`,
          [Number(jobId)]
        );
        if (result.rows.length > 0 && Number(result.rows[0].recruiter_id) === req.user.id) {
          return next();
        }
      } catch {
        return res.status(500).json({ message: "Failed to verify job ownership" });
      }
    }
  }

  return res.status(403).json(errorResponse("Forbidden"));
};
