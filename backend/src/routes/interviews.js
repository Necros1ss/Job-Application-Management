import express from "express";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { createInterviewSchema } from "../validators/interviewValidators.js";
import {
  getRecruiterInterviews,
  getCandidateInterviews,
  scheduleInterview,
  updateInterview,
  deleteInterview,
  listInterviewers,
  getInterviewerInterviews,
  submitEvaluation,
  getEvaluation
} from "../controllers/interviewController.js";

const router = express.Router();

router.get("/recruiter", requireAuth, getRecruiterInterviews);
router.get("/candidate", requireAuth, getCandidateInterviews);
router.post("/", requireAuth, validate(createInterviewSchema), scheduleInterview);
router.put("/:id", requireAuth, updateInterview);
router.delete("/:id", requireAuth, deleteInterview);
router.get("/interviewers", requireAuth, listInterviewers);
router.get("/interviewer", requireAuth, getInterviewerInterviews);
router.post("/:id/evaluation", requireAuth, submitEvaluation);
router.get("/:id/evaluation", requireAuth, getEvaluation);

export default router;
