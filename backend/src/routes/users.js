import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { requireAuth } from "../middlewares/auth.js";
import { getMe, getAvatar, updateAvatar, updateMe, updateNotificationPreferences, deleteMe } from "../controllers/userController.js";

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
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .slice(0, 100) || "profile-image";

  return `${baseName}${safeExtension}`;
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

router.get("/me", requireAuth, getMe);
router.get("/me/avatar", requireAuth, getAvatar);
router.patch("/me/avatar", requireAuth, profileMediaUpload.single("avatar"), updateAvatar);
router.patch("/me", requireAuth, updateMe);
router.patch("/notification-preferences", requireAuth, updateNotificationPreferences);
router.delete("/me", requireAuth, deleteMe);

export default router;
