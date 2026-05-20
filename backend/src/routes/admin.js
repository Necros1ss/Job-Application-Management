import express from "express";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  deleteJob,
  deleteUser,
  hideJob,
  listJobs,
  listUsers,
  lockUser,
  platformStats,
  unhideJob,
  unlockUser,
} from "../controllers/adminController.js";
import { jobActionSchema, listJobsSchema, listUsersSchema, userActionSchema } from "../validators/adminValidators.js";

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/stats", platformStats);
router.get("/users", validate(listUsersSchema), listUsers);
router.get("/jobs", validate(listJobsSchema), listJobs);
router.patch("/users/:id/lock", validate(userActionSchema), lockUser);
router.patch("/users/:id/unlock", validate(userActionSchema), unlockUser);
router.delete("/users/:id", validate(userActionSchema), deleteUser);
router.patch("/jobs/:id/hide", validate(jobActionSchema), hideJob);
router.patch("/jobs/:id/unhide", validate(jobActionSchema), unhideJob);
router.delete("/jobs/:id", validate(jobActionSchema), deleteJob);

export default router;
