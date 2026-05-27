import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import {
  ensureAdminUserColumns,
  ensureApplicationRejectionColumns,
  ensureApplicationStatusEnum,
  ensureHrManagerInterviewerSchema,
  ensureJobModerationColumns,
  ensurePhaseSchema,
  ensureUserRoleEnum,
  testDbConnection,
} from "./config/db.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import hrManagerRoutes from "./routes/hrManager.js";
import userRoutes from "./routes/users.js";
import applicationRoutes from "./routes/applications.js";
import jobPostRoutes from "./routes/jobPosts.js";
import savedJobsRoutes from "./routes/savedJobs.js";
import messageRoutes from "./routes/messages.js";
import interviewRoutes from "./routes/interviews.js";
import onboardingRoutes from "./routes/onboarding.js";
import employeeRoutes from "./routes/employees.js";
import notificationRoutes from "./routes/notifications.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const port = process.env.PORT || 5000;
const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const rateLimitMax = Number(process.env.RATE_LIMIT_MAX) || 100;

const generalLimiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests, please try again later",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 10 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many authentication attempts, please try again later",
  },
  skip: () => process.env.NODE_ENV !== "production",
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 5 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many upload attempts, please try again later",
  },
  skip: () => process.env.NODE_ENV !== "production",
});

const configuredOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set(configuredOrigins);
const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

app.use(helmet());
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin) || localhostPattern.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));
// Apply general API rate limiter only in production to avoid blocking local development
if (process.env.NODE_ENV === "production") {
  app.use("/api", generalLimiter);
} else {
  console.log("[Server] Rate limiter disabled for non-production environment");
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/admin", adminRoutes);
app.use("/api/hr-manager", hrManagerRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/applications/apply", uploadLimiter);
app.use("/api/applications", applicationRoutes);
app.use("/api/job-posts", jobPostRoutes);
app.use("/api/saved-jobs", savedJobsRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/employees", employeeRoutes);

app.use((err, _req, res, _next) => {
  if (process.env.NODE_ENV !== "test") {
    console.error("[Server Error]", err?.message || err, err?.stack || "");
  }

  if (err?.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, message: "Uploaded file is too large", detail: "Maximum allowed size depends on the upload type" });
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ success: false, message: "Invalid upload field", detail: "Check the expected multipart field name" });
    }

    return res.status(400).json({ success: false, message: "Invalid upload", detail: err.message });
  }

  if (typeof err?.message === "string" && err.message.includes("Only PDF, DOC and DOCX")) {
    return res.status(400).json({ success: false, message: err.message });
  }

  if (typeof err?.message === "string" && err.message.includes("Only JPG, PNG, WEBP and GIF")) {
    return res.status(400).json({ success: false, message: err.message });
  }

  const detail = process.env.NODE_ENV === "production" ? "An unexpected error occurred" : err?.message || "Unknown error";
  return res.status(500).json({ success: false, message: "Internal server error", detail });
});

const startServer = async () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set in environment variables");
  }

  await testDbConnection();
  await ensureUserRoleEnum();
  await ensureAdminUserColumns();
  await ensureJobModerationColumns();
  await ensureApplicationStatusEnum();
  await ensureApplicationRejectionColumns();
  await ensurePhaseSchema();
  await ensureHrManagerInterviewerSchema();
  app.listen(port, () => {
    console.log(`API server running on http://localhost:${port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start API server:", error.message);
  process.exit(1);
});
