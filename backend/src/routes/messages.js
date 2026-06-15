import express from "express";
import { requireAuth } from "../middlewares/auth.js";
import { getInbox, getUnreadCount, markRead, sendMessage } from "../controllers/messageController.js";

const router = express.Router();

router.get("/inbox", requireAuth, getInbox);
router.get("/unread-count", requireAuth, getUnreadCount);
router.patch("/:id/read", requireAuth, markRead);
router.post("/", requireAuth, sendMessage);

export default router;
