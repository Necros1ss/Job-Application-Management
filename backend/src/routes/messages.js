import express from "express";
import { requireAuth, authorize } from "../middlewares/auth.js";
import { getInbox, getUnreadCount, markRead, sendMessage } from "../controllers/messageController.js";

const router = express.Router();
const anyAuthenticatedRole = authorize("admin", "hr_manager", "recruiter", "interviewer", "candidate");

router.get("/inbox", requireAuth, anyAuthenticatedRole, getInbox);
router.get("/unread-count", requireAuth, anyAuthenticatedRole, getUnreadCount);
router.patch("/:id/read", requireAuth, anyAuthenticatedRole, markRead);
router.post("/", requireAuth, anyAuthenticatedRole, sendMessage);

export default router;