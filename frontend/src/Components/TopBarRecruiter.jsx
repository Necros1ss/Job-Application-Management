/* eslint-disable react/prop-types */
import { FaSearch, FaEnvelope } from "react-icons/fa";
import AccountMenu from './AccountMenu';
import LanguageSwitcher from './LanguageSwitcher';
import NotificationBell from './NotificationBell';

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
    <header className="w-full border-b border-[#e5e5e5] bg-white">
      <div className={`px-6 lg:px-10 h-20 flex items-center gap-6 ${isSearchControlled ? "justify-between" : "justify-end"}`}>
        {isSearchControlled && (
          <div className="flex-1 min-w-0 max-w-3xl">
            <label className="flex h-10 items-center rounded-[10px] border border-[#e5e5e5] bg-white px-3">
              <FaSearch className="mr-3 text-[#737373]" size={16} />
              <input
                type="text"
                placeholder={searchPlaceholder || "Search candidates, jobs, or applications..."}
                onChange={isSearchControlled ? (e) => onSearchChange(e.target.value) : undefined}
                {...(typeof searchValue === "string" ? { value: searchValue } : {})}
                className="w-full border-none bg-transparent text-sm text-[#0a0a0a] outline-none placeholder:text-[#737373] focus:ring-0"
              />
            </label>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-5 text-[#737373]">
          <LanguageSwitcher compact />

          <button
            type="button"
            className="relative p-1.5 transition-colors hover:text-black"
            aria-label="Messages"
          >
            <FaEnvelope size={18} />
          </button>

          <NotificationBell />

          <div className="h-8 w-px bg-[#e5e5e5]" />

          <AccountMenu userName={userName || "Recruiter"} userEmail={userEmail} avatarUrl={avatarUrl} />
        </div>
      </div>
    </header>
  );
};

export default TopBarRecruiter;
