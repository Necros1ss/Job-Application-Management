import express from "express";
import rateLimit from "express-rate-limit";
import {
  addNote,
  analyzeAiScreening,
  apply,
  deleteNote,
  downloadCv,
  getActivity,
  getAnalytics,
  getAiScreening,
  getForRecruiter,
  listForCandidate,
  listForRecruiter,
  offer,
  reject,
  remove,
  update,
  updateNote,
  updateRating,
  updateStatus,
  acceptOffer,
  declineOffer,
} from "../controllers/applicationController.js";
import { authorize, requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { uploadCv } from "../services/applicationService.js";
import {
  addNoteSchema,
  createApplicationSchema,
  rejectApplicationSchema,
  updateStatusSchema,
} from "../validators/applicationValidators.js";

const router = express.Router();

const aiScreeningLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `ai-screen:${req.user.id}`,
  message: { message: "AI screening limit reached. Please try again later." },
});

// RECRUITER ROUTES (Must be before /:id to avoid conflicts)
router.get("/recruiter", requireAuth, authorize("recruiter"), listForRecruiter);
router.get("/recruiter/activity", requireAuth, authorize("recruiter"), getActivity);
router.get("/recruiter/analytics", requireAuth, authorize("recruiter"), getAnalytics);
router.get("/recruiter/:id/ai-screen", requireAuth, authorize("recruiter"), getAiScreening);
router.post("/recruiter/:id/ai-screen", requireAuth, authorize("recruiter"), aiScreeningLimiter, analyzeAiScreening);
router.get("/recruiter/:id", requireAuth, authorize("recruiter"), getForRecruiter);
router.get("/recruiter/:id/cv", requireAuth, authorize("recruiter"), downloadCv);

// CANDIDATE ROUTES
router.get("/", requireAuth, authorize("candidate"), listForCandidate);
router.get("/my", requireAuth, authorize("candidate"), listForCandidate);
router.post("/apply", requireAuth, authorize("candidate"), uploadCv.single("cvFile"), validate(createApplicationSchema), apply);
router.post("/:id/accept", requireAuth, authorize("candidate"), acceptOffer);
router.post("/:id/decline", requireAuth, authorize("candidate"), declineOffer);
router.post("/:id/accept-offer", requireAuth, authorize("candidate"), acceptOffer);
router.post("/:id/decline-offer", requireAuth, authorize("candidate"), declineOffer);

// SHARED/ACTION ROUTES
router.patch("/:id/status", requireAuth, authorize("recruiter"), validate(updateStatusSchema), updateStatus);
router.patch("/:id/rating", requireAuth, authorize("recruiter"), updateRating);

router.post("/:id/notes", requireAuth, authorize("recruiter"), validate(addNoteSchema), addNote);
router.patch("/:id/notes/:noteId", requireAuth, authorize("recruiter"), updateNote);
router.put("/:id/notes/:noteId", requireAuth, authorize("recruiter"), updateNote);
router.delete("/:id/notes/:noteId", requireAuth, authorize("recruiter"), deleteNote);

router.post("/:id/reject", requireAuth, authorize("recruiter"), validate(rejectApplicationSchema), reject);
router.post("/:id/offer", requireAuth, authorize("recruiter"), offer);

router.put("/:id", requireAuth, authorize("candidate", "admin"), update);
router.delete("/:id", requireAuth, authorize("candidate", "admin"), remove);

export default router;