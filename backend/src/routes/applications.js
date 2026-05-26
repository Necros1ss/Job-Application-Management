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
import { requireAuth } from "../middlewares/auth.js";
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

router.get("/", requireAuth, listForCandidate);
router.get("/recruiter", requireAuth, listForRecruiter);
router.get("/recruiter/activity", requireAuth, getActivity);
router.get("/recruiter/analytics", requireAuth, getAnalytics);
router.get("/recruiter/:id/ai-screen", requireAuth, getAiScreening);
router.post("/recruiter/:id/ai-screen", requireAuth, aiScreeningLimiter, analyzeAiScreening);
router.get("/recruiter/:id", requireAuth, getForRecruiter);
router.get("/recruiter/:id/cv", requireAuth, downloadCv);

router.put("/:id", requireAuth, update);
router.delete("/:id", requireAuth, remove);
router.post("/apply", requireAuth, uploadCv.single("cvFile"), validate(createApplicationSchema), apply);

router.patch("/:id/status", requireAuth, validate(updateStatusSchema), updateStatus);
router.patch("/:id/rating", requireAuth, updateRating);

router.post("/:id/notes", requireAuth, validate(addNoteSchema), addNote);
router.put("/:id/notes/:noteId", requireAuth, updateNote);
router.delete("/:id/notes/:noteId", requireAuth, deleteNote);

router.post("/:id/reject", requireAuth, validate(rejectApplicationSchema), reject);
router.post("/:id/offer", requireAuth, offer);
router.post("/:id/accept-offer", requireAuth, acceptOffer);
router.post("/:id/decline-offer", requireAuth, declineOffer);

export default router;
