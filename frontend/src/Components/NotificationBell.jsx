/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBell,
  FaCalendarCheck,
  FaCheckCircle,
  FaEnvelope,
  FaLock,
  FaUnlock,
} from "react-icons/fa";
import useNotifications from "../hooks/useNotifications";

const iconByType = {
  application_status_changed: FaCheckCircle,
  interview_scheduled: FaCalendarCheck,
  new_message: FaEnvelope,
  account_locked: FaLock,
  account_unlocked: FaUnlock,
};

const iconStyleByType = {
  application_status_changed: "bg-blue-50 text-blue-600",
  interview_scheduled: "bg-purple-50 text-purple-600",
  new_message: "bg-emerald-50 text-emerald-600",
  account_locked: "bg-red-50 text-red-600",
  account_unlocked: "bg-emerald-50 text-emerald-600",
};

const formatTimeAgo = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const seconds = Math.max(Math.floor((Date.now() - date.getTime()) / 1000), 0);
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
};

const getFallbackUrl = (notification) => {
  switch (notification.type) {
    case "new_message":
      return "/candidate/messages";
    case "application_status_changed":
    case "interview_scheduled":
      return "/candidate/applications";
    case "account_locked":
      return "/login";
    case "account_unlocked":
      return notification.payload?.role === "recruiter" ? "/recruiter" : "/candidate";
    default:
      return null;
  }
};

const NotificationBell = ({ enabled = true }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications({ enabled });
  const recentNotifications = notifications.slice(0, 10);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setIsOpen(false);

    const targetUrl = notification.url || getFallbackUrl(notification);
    if (targetUrl) {
      navigate(targetUrl);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative p-1.5 transition-colors hover:text-black"
        aria-label="Notifications"
      >
        <FaBell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-1.5 h-[18px] min-w-[18px] rounded-full bg-[#c22b10] px-1 text-center text-[10px] font-semibold leading-[18px] text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-[14px] border border-[#e5e5e5] bg-white shadow-[0_0_0_1px_rgba(10,10,10,0.1)]">
          <div className="flex items-center justify-between gap-3 border-b border-[#e5e5e5] bg-[#f2f2f2] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[#0a0a0a]">Notifications</p>
              <p className="text-xs text-[#737373]">{unreadCount} unread</p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-semibold text-[#0a0a0a] hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-auto">
            {recentNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[#737373]">
                No notifications yet.
              </div>
            ) : (
              recentNotifications.map((notification) => {
                const Icon = iconByType[notification.type] || FaBell;
                const iconStyle = iconStyleByType[notification.type] || "bg-[#f2f2f2] text-[#0a0a0a]";

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex w-full gap-3 border-b border-[#e5e5e5] px-4 py-3 text-left transition-colors hover:bg-[#f2f2f2] ${
                      notification.read ? "bg-white" : "bg-[#f8f8f8]"
                    }`}
                  >
                    <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconStyle}`}>
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className={`text-sm ${notification.read ? "font-medium text-[#737373]" : "font-semibold text-[#0a0a0a]"}`}>
                          {notification.title}
                        </span>
                        {!notification.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-black" />}
                      </span>
                      {notification.message && (
                        <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[#737373]">
                          {notification.message}
                        </span>
                      )}
                      <span className="mt-2 block text-[11px] text-[#737373]">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
