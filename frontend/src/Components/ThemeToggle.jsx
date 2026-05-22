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
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#e5e5e5] bg-white text-[#737373] transition-all duration-200 hover:border-black hover:text-black dark:border-[#2a2a2a] dark:bg-[#121212] dark:text-[#a3a3a3] dark:hover:border-[#f5f5f5] dark:hover:text-white"
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
