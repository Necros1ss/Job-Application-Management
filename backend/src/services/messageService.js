import { pool } from "../config/db.js";
import { messageRepository } from "../repositories/messageRepository.js";
import { applicationRepository } from "../repositories/applicationRepository.js";
import { broadcast } from "../utils/notificationBroadcast.js";

const mapInboxRow = (row) => ({
  id: row.id,
  subject: row.subject,
  content: row.content,
  isRead: row.is_read,
  createdAt: row.created_at,
  readAt: row.read_at,
  senderName: row.sender_name,
  jobPostId: row.job_post_id,
  jobTitle: row.job_title,
  applicationId: row.application_id,
});

export const messageService = {
  getInbox: async (candidateId, limit, offset) => {
    const rows = await messageRepository.findInboxByCandidateId(candidateId, limit, offset);
    return rows.map(mapInboxRow);
  },

  getUnreadCount: async (candidateId) => {
    return await messageRepository.countUnreadByCandidateId(candidateId);
  },

  markRead: async (messageId, candidateId) => {
    const result = await messageRepository.markAsRead(messageId, candidateId);
    if (!result) throw new Error("Message not found");
    return {
      id: result.id,
      isRead: result.is_read,
      readAt: result.read_at,
    };
  },

  sendMessage: async (recruiterId, data) => {
    const { receiverCandidateId, subject, content, jobPostId, applicationId } = data;
    const candidateId = Number(receiverCandidateId);
    
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      const exists = await messageRepository.checkCandidateExists(candidateId);
      if (!exists) throw new Error("Candidate not found");

      if (jobPostId) {
        const allowed = await messageRepository.checkJobPermission(jobPostId, recruiterId);
        if (!allowed) throw new Error("You don't have permission to send messages about this job");
      }

      if (applicationId) {
        const allowed = await messageRepository.checkApplicationPermission(applicationId, candidateId, recruiterId);
        if (!allowed) throw new Error("You don't have permission to send messages about this application");
      }

      const result = await messageRepository.create(client, {
        sender_id: recruiterId,
        receiver_id: candidateId,
        subject,
        content,
        job_post_id: jobPostId,
        application_id: applicationId
      });

      if (applicationId) {
        await applicationRepository.addEvent(
          applicationId,
          recruiterId,
          "message_sent",
          "Message sent",
          subject.trim(),
          { messageId: result.id }
        );
      }

      await client.query("COMMIT");

      broadcast(candidateId, "new_message", {
        id: `message-${result.id}`,
        title: "New message",
        message: subject.trim(),
        messageId: result.id,
        applicationId,
        jobPostId,
        url: "/candidate/messages",
      });

      return {
        id: result.id,
        subject: result.subject,
        content: result.content,
        isRead: result.is_read,
        createdAt: result.created_at,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};
