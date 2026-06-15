import { messageService } from "../services/messageService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getInbox = asyncHandler(async (req, res) => {
  if (req.user.role !== "candidate") {
    const error = new Error("Only candidate accounts can access inbox");
    error.status = 403;
    throw error;
  }

  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const offset = Number(req.query.offset) || 0;

  const messages = await messageService.getInbox(req.user.id, limit, offset);
  return res.json(messages);
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  if (req.user.role !== "candidate") {
    const error = new Error("Only candidate accounts can access unread count");
    error.status = 403;
    throw error;
  }

  const count = await messageService.getUnreadCount(req.user.id);
  return res.json({ count, unreadCount: count });
});

export const markRead = asyncHandler(async (req, res) => {
  if (req.user.role !== "candidate") {
    const error = new Error("Only candidate accounts can mark messages as read");
    error.status = 403;
    throw error;
  }

  const result = await messageService.markRead(Number(req.params.id), req.user.id).catch(error => {
    if (error.message === "Message not found") error.status = 404;
    throw error;
  });
  return res.json(result);
});

export const sendMessage = asyncHandler(async (req, res) => {
  if (req.user.role !== "recruiter") {
    const error = new Error("Only recruiter accounts can send messages");
    error.status = 403;
    throw error;
  }

  const message = await messageService.sendMessage(req.user.id, req.body).catch(error => {
    error.status = error.message.includes("not found") ? 404 : 
                   error.message.includes("permission") ? 403 : 400;
    throw error;
  });
  return res.status(201).json(message);
});
