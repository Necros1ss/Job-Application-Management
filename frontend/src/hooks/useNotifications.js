import { useCallback, useEffect, useRef, useState } from "react";
import { initializeSession, tokenStorage } from "../lib/api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const MAX_NOTIFICATIONS = 50;
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];
const NOTIFICATION_EVENTS = [
  "application_status_changed",
  "interview_scheduled",
  "new_message",
  "account_locked",
  "account_unlocked",
];

const getStreamUrl = () => {
  const token = tokenStorage.getToken();
  const url = new URL(`${API_BASE_URL.replace(/\/$/, "")}/notifications/stream`);

  if (token) {
    url.searchParams.set("token", token);
  }

  return url.toString();
};

const fallbackTitle = (eventType) => {
  switch (eventType) {
    case "application_status_changed":
      return "Application status updated";
    case "interview_scheduled":
      return "Interview scheduled";
    case "new_message":
      return "New message";
    case "account_locked":
      return "Account locked";
    case "account_unlocked":
      return "Account unlocked";
    default:
      return "Notification";
  }
};

const normalizeNotification = (eventType, payload = {}) => ({
  id: payload.id || `${eventType}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  type: payload.eventType || eventType,
  title: payload.title || fallbackTitle(eventType),
  message: payload.message || payload.description || "",
  createdAt: payload.createdAt || new Date().toISOString(),
  read: false,
  url: payload.url || null,
  payload,
});

export const useNotifications = ({ enabled = true } = {}) => {
  const eventSourceRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const mountedRef = useRef(false);
  const [notifications, setNotifications] = useState([]);
  const [connectionState, setConnectionState] = useState("idle");

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const closeStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const addNotification = useCallback((eventType, payload) => {
    const notification = normalizeNotification(eventType, payload);
    setNotifications((current) => {
      const withoutDuplicate = current.filter((item) => item.id !== notification.id);
      return [notification, ...withoutDuplicate].slice(0, MAX_NOTIFICATIONS);
    });
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled || typeof window === "undefined" || typeof EventSource === "undefined") {
      setConnectionState("idle");
      return () => {
        mountedRef.current = false;
      };
    }

    const scheduleReconnect = () => {
      if (!mountedRef.current) {
        return;
      }

      clearReconnectTimer();
      closeStream();

      const delay = RECONNECT_DELAYS[Math.min(reconnectAttemptRef.current, RECONNECT_DELAYS.length - 1)];
      reconnectAttemptRef.current += 1;
      setConnectionState("reconnecting");

      reconnectTimerRef.current = window.setTimeout(connect, delay);
    };

    const connect = async () => {
      try {
        await initializeSession();

        if (!tokenStorage.getToken() || !mountedRef.current) {
          setConnectionState("idle");
          return;
        }

        clearReconnectTimer();
        closeStream();
        setConnectionState("connecting");

        const source = new EventSource(getStreamUrl(), { withCredentials: true });
        eventSourceRef.current = source;

        source.onopen = () => {
          reconnectAttemptRef.current = 0;
          if (mountedRef.current) {
            setConnectionState("connected");
          }
        };

        source.onerror = () => {
          if (mountedRef.current) {
            scheduleReconnect();
          }
        };

        NOTIFICATION_EVENTS.forEach((eventType) => {
          source.addEventListener(eventType, (event) => {
            try {
              addNotification(eventType, JSON.parse(event.data));
            } catch {
              addNotification(eventType, {});
            }
          });
        });
      } catch {
        scheduleReconnect();
      }
    };

    connect();

    return () => {
      mountedRef.current = false;
      clearReconnectTimer();
      closeStream();
    };
  }, [addNotification, clearReconnectTimer, closeStream, enabled]);

  const markAsRead = useCallback((id) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  }, []);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return {
    notifications,
    unreadCount,
    connectionState,
    markAsRead,
    markAllAsRead,
  };
};

export default useNotifications;
