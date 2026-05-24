import { FaMoon, FaSun } from "react-icons/fa";
import { useDarkMode } from "../hooks/useDarkMode";

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useDarkMode();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[var(--border-primary)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
    >
      <FaSun
        size={16}
        className={`absolute transition-all duration-200 ${
          isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        }`}
      />
      <FaMoon
        size={15}
        className={`absolute transition-all duration-200 ${
          isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
        }`}
      />
    </button>
  );
};

export default ThemeToggle;
