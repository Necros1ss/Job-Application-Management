import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaChevronDown, FaCog, FaUserCircle } from "react-icons/fa";
import { useI18n } from "../lib/i18n";

const AccountMenu = ({ userName, userEmail, avatarUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();
  const { t } = useI18n();
  const role = location.pathname.split("/").filter(Boolean)[0] || "candidate";
  const basePath = role === "recruiter" ? "/recruiter" : "/candidate";

  const initials = typeof userName === "string" && userName.trim().length > 0
    ? userName
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex items-center gap-3 rounded-[10px] px-2 py-1.5 transition-colors hover:bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <div className="text-right hidden sm:block leading-tight">
          <p className="text-sm font-medium leading-none text-[var(--text-primary)]">{userName || "User Name"}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{userEmail || "email@example.com"}</p>
        </div>

        <div className="h-10 w-10 overflow-hidden rounded-full border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          {avatarUrl ? (
            <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-[var(--text-primary)]">
              {initials}
            </div>
          )}
        </div>

        <FaChevronDown size={12} className="hidden text-[var(--text-secondary)] sm:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-56 overflow-hidden rounded-[14px] border border-[var(--border-primary)] bg-[var(--bg-elevated)] shadow-[0_0_0_1px_rgba(10,10,10,0.1)]">
          <div className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-3">
            <p className="text-sm font-medium text-[var(--text-primary)]">{userName || "User Name"}</p>
            <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">{userEmail || "email@example.com"}</p>
          </div>

          <Link
            to={`${basePath}/profile`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
          >
            <FaUserCircle className="text-[var(--text-primary)]" />
            {t("menu.profile")}
          </Link>

          <Link
            to={`${basePath}/settings`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
          >
            <FaCog className="text-[var(--text-primary)]" />
            {t("menu.settings")}
          </Link>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
