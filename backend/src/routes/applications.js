import express from "express";
import {
  addNote,
  apply,
  deleteNote,
  downloadCv,
  getActivity,
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
} from "../controllers/applicationController.js";
import { requireAuth } from "../middlewares/auth.js";
import { uploadCv } from "../services/applicationService.js";

const router = express.Router();

router.get("/", requireAuth, listForCandidate);
router.get("/recruiter", requireAuth, listForRecruiter);
router.get("/recruiter/activity", requireAuth, getActivity);
router.get("/recruiter/:id", requireAuth, getForRecruiter);
router.get("/recruiter/:id/cv", requireAuth, downloadCv);

router.put("/:id", requireAuth, update);
router.delete("/:id", requireAuth, remove);
router.post("/apply", requireAuth, uploadCv.single("cvFile"), apply);

router.patch("/:id/status", requireAuth, updateStatus);
router.patch("/:id/rating", requireAuth, updateRating);

router.post("/:id/notes", requireAuth, addNote);
router.put("/:id/notes/:noteId", requireAuth, updateNote);
router.delete("/:id/notes/:noteId", requireAuth, deleteNote);

router.post("/:id/reject", requireAuth, reject);
router.post("/:id/offer", requireAuth, offer);

export default router;
