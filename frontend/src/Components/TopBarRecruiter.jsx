/* eslint-disable react/prop-types */
import { FaSearch, FaEnvelope } from "react-icons/fa";
import AccountMenu from './AccountMenu';
import LanguageSwitcher from './LanguageSwitcher';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

const TopBarRecruiter = ({
  userName,
  userEmail,
  avatarUrl,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
}) => {
  const isSearchControlled = typeof onSearchChange === "function";

  return (
    <header className="w-full border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
      <div className={`px-6 lg:px-10 h-20 flex items-center gap-6 ${isSearchControlled ? "justify-between" : "justify-end"}`}>
        {isSearchControlled && (
          <div className="flex-1 min-w-0 max-w-3xl">
            <label className="flex h-10 items-center rounded-[10px] border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3">
              <FaSearch className="mr-3 text-[var(--text-secondary)]" size={16} />
              <input
                type="text"
                placeholder={searchPlaceholder || "Search candidates, jobs, or applications..."}
                onChange={isSearchControlled ? (e) => onSearchChange(e.target.value) : undefined}
                {...(typeof searchValue === "string" ? { value: searchValue } : {})}
                className="w-full border-none bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:ring-0"
              />
            </label>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-5 text-[var(--text-secondary)]">
          <LanguageSwitcher compact />
          <ThemeToggle />

          <button
            type="button"
            className="relative p-1.5 transition-colors hover:text-[var(--text-primary)]"
            aria-label="Messages"
          >
            <FaEnvelope size={18} />
          </button>

          <NotificationBell />

          <div className="h-8 w-px bg-[var(--border-primary)]" />

          <AccountMenu userName={userName || "Recruiter"} userEmail={userEmail} avatarUrl={avatarUrl} />
        </div>
      </div>
    </header>
  );
};

export default TopBarRecruiter;
