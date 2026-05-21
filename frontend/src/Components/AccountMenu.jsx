import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaChevronDown, FaCog, FaUserCircle } from "react-icons/fa";

const AccountMenu = ({ userName, userEmail, avatarUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();
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
        className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <div className="text-right hidden sm:block leading-tight">
          <p className="text-sm font-semibold text-gray-900 leading-none">{userName || "User Name"}</p>
          <p className="text-xs text-gray-500 mt-1">{userEmail || "email@example.com"}</p>
        </div>

        <div className="w-10 h-10 rounded-full overflow-hidden border border-emerald-200 bg-emerald-100">
          {avatarUrl ? (
            <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full text-emerald-700 flex items-center justify-center font-bold text-sm">
              {initials}
            </div>
          )}
        </div>

        <FaChevronDown size={12} className="hidden sm:block text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 rounded-xl border border-gray-100 bg-white shadow-xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-900">{userName || "User Name"}</p>
            <p className="text-xs text-gray-500 truncate mt-0.5">{userEmail || "email@example.com"}</p>
          </div>

          <Link
            to={`${basePath}/profile`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <FaUserCircle className="text-emerald-600" />
            Profile
          </Link>

          <Link
            to={`${basePath}/settings`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <FaCog className="text-emerald-600" />
            Settings
          </Link>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
