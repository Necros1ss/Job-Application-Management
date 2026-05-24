/* eslint-disable react/prop-types */
import { FaSearch } from "react-icons/fa";
import AccountMenu from './AccountMenu';
import LanguageSwitcher from './LanguageSwitcher';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

const TopBarDashboard = ({
  userName,
  userEmail,
  avatarUrl,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  showSearch = true,
}) => {
  const isSearchControlled = typeof onSearchChange === "function";

  return (
    <header className="w-full border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
      <div className={`px-6 lg:px-10 h-20 flex items-center gap-6 ${showSearch ? "justify-between" : "justify-end"}`}>
        {/* KHU VỰC TÌM KIẾM */}
        {showSearch && (
          <div className="flex w-full max-w-md items-center rounded-[10px] border border-[var(--border-primary)] bg-[var(--bg-elevated)] px-3 py-2">
            <FaSearch className="mr-2 text-[var(--text-secondary)]" size={18} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              onChange={isSearchControlled ? (e) => onSearchChange(e.target.value) : undefined}
              {...(typeof searchValue === "string" ? { value: searchValue } : {})}
              className="w-full border-none bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:ring-0"
            />
          </div>
        )}

        {/* TÀI KHOẢN & THÔNG BÁO */}
        <div className="flex items-center gap-5 text-[var(--text-secondary)]">
          <LanguageSwitcher compact />
          <ThemeToggle />
          <NotificationBell />

          <AccountMenu userName={userName} userEmail={userEmail} avatarUrl={avatarUrl} />
        </div>
      </div>
    </header>
  );
};

export default TopBarDashboard;
