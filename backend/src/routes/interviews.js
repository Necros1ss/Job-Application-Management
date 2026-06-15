import express from "express";
import { authorize, requireAuth } from "../middlewares/auth.js";
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

router.get("/recruiter", requireAuth, authorize("recruiter"), getRecruiterInterviews);
router.get("/candidate", requireAuth, authorize("candidate"), getCandidateInterviews);
router.post("/", requireAuth, authorize("recruiter"), validate(createInterviewSchema), scheduleInterview);
router.put("/:id", requireAuth, authorize("recruiter"), updateInterview);
router.delete("/:id", requireAuth, authorize("recruiter"), deleteInterview);
router.get("/interviewers", requireAuth, authorize("recruiter"), listInterviewers);
router.get("/interviewer", requireAuth, authorize("interviewer"), getInterviewerInterviews);
router.post("/:id/evaluation", requireAuth, authorize("interviewer"), submitEvaluation);
router.get("/:id/evaluation", requireAuth, authorize("recruiter", "interviewer"), getEvaluation);

export default router;
