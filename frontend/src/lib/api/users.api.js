import { request, requestBlob } from "./client";

export const usersApi = {
  me: () => request("/users/me"),
  updateMe: (payload) =>
    request("/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);

    return request("/users/me/avatar", {
      method: "PATCH",
      body: formData,
    });
  },
  getAvatarFile: () => requestBlob(`/users/me/avatar?t=${Date.now()}`),
  updateNotificationPreferences: (preferences) =>
    request("/users/notification-preferences", {
      method: "PATCH",
      body: JSON.stringify({ preferences }),
    }),
};
