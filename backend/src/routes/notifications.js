import express from "express";
import { authorize, requireAuth } from "../middlewares/auth.js";
import {
  addNotificationClient,
  removeNotificationClient,
} from "../utils/notificationBroadcast.js";

const router = express.Router();
const anyAuthenticatedRole = authorize("admin", "hr_manager", "recruiter", "interviewer", "candidate");

const hydrateAuthorizationFromQuery = (req, _res, next) => {
  const token = typeof req.query.token === "string" ? req.query.token.trim() : "";

  if (token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${token}`;
  }

  next();
};

router.get("/stream", hydrateAuthorizationFromQuery, requireAuth, anyAuthenticatedRole, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
  req.socket?.setTimeout?.(0);

  addNotificationClient(req.user.id, res);

  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ userId: req.user.id, connectedAt: new Date().toISOString() })}\n\n`);

  const heartbeatId = setInterval(() => {
    res.write(`: heartbeat ${Date.now()}\n\n`);
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeatId);
    removeNotificationClient(req.user.id, res);
    res.end();
  });
});

export default router;
