import { request } from "./client";

export const messagesApi = {
  inbox: ({ limit = 10, offset = 0 } = {}) =>
    request(`/messages/inbox?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`),
  unreadCount: () => request("/messages/unread-count"),
  markRead: (id) =>
    request(`/messages/${id}/read`, {
      method: "PATCH",
    }),
  send: (payload) =>
    request("/messages", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
