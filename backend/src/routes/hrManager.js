import express from "express";
import { requireAuth, requireHrManager } from "../middlewares/auth.js";
import { getDashboard, getJobs, approveJob, getRecruiters, getSummaryReport } from "../controllers/hrManagerController.js";

const router = express.Router();

router.use(requireAuth, requireHrManager);

router.get("/dashboard", getDashboard);
router.get("/jobs", getJobs);
router.patch("/jobs/:id/approve", approveJob);
router.get("/recruiters", getRecruiters);
router.get("/reports/summary", getSummaryReport);

export default router;
