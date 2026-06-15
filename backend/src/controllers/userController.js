import { userService } from "../services/userService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { promises as fsPromises } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROFILE_UPLOAD_DIR = path.resolve(__dirname, "../../uploads/profile");

const cleanupFile = async (filePath) => {
  if (!filePath) return;
  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
};

const resolveProfileMediaPath = (fileName) => {
  if (!fileName || path.basename(fileName) !== fileName) return null;
  const resolvedPath = path.resolve(PROFILE_UPLOAD_DIR, fileName);
  const uploadRoot = `${PROFILE_UPLOAD_DIR}${path.sep}`;
  return resolvedPath.startsWith(uploadRoot) ? resolvedPath : null;
};

export const getMe = asyncHandler(async (req, res) => {
  const profile = await userService.getProfile(req.user.id).catch(error => {
    if (error.message === "User not found") error.status = 404;
    throw error;
  });
  return res.json(profile);
});

export const getAvatar = asyncHandler(async (req, res) => {
  const profile = await userService.getProfile(req.user.id);
  const fileName = profile.role === "recruiter" ? profile.logoFileName : profile.avatarFileName;
  const filePath = resolveProfileMediaPath(fileName);

  if (!filePath) {
    const error = new Error("Profile image not found");
    error.status = 404;
    throw error;
  }

  await fsPromises.access(filePath).catch(() => {
    const error = new Error("Profile image not found");
    error.status = 404;
    throw error;
  });
  return res.sendFile(filePath);
});

export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    const error = new Error("Avatar image is required");
    error.status = 400;
    throw error;
  }

  try {
    const profile = await userService.uploadAvatar(req.user.id, req.user.role, req.file);
    return res.json(profile);
  } catch (error) {
    await cleanupFile(req.file.path);
    throw error;
  }
});

export const updateMe = asyncHandler(async (req, res) => {
  const profile = await userService.updateProfile(req.user.id, req.body).catch(error => {
    if (error.message === "User not found") error.status = 404;
    throw error;
  });
  return res.json(profile);
});

export const updateNotificationPreferences = asyncHandler(async (req, res) => {
  if (!req.body.preferences) {
    const error = new Error("preferences object is required");
    error.status = 400;
    throw error;
  }
  const preferences = await userService.updateNotificationPreferences(req.user.id, req.body.preferences);
  return res.json({ notificationPreferences: preferences });
});

export const deleteMe = asyncHandler(async (req, res) => {
  await userService.deleteAccount(req.user.id);
  return res.status(204).send();
});
