import { useI18n } from '../lib/i18n';
import PropTypes from "prop-types";

const LanguageSwitcher = ({ compact = false }) => {
  const { language, setLanguage } = useI18n();
  const languages = [
    { code: 'en', label: 'English', shortLabel: 'EN' },
    { code: 'vi', label: 'Tiếng Việt', shortLabel: 'VI' },
  ];

  return (
    <div className="flex items-center gap-2">
      {!compact && (
        <span className="hidden text-xs font-medium uppercase text-[var(--text-secondary)] sm:inline">
          Language
        </span>
      )}
      <div className="flex rounded-full border border-[var(--border-primary)] bg-[var(--bg-elevated)] p-1">
        {languages.map((item) => {
          const active = language === item.code;

          return (
            <button
              key={item.code}
              type="button"
              onClick={() => setLanguage(item.code)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                active
                  ? "bg-[var(--text-primary)] text-[var(--bg-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              }`}
              aria-pressed={active}
            >
              {item.shortLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LanguageSwitcher;

LanguageSwitcher.propTypes = {
  compact: PropTypes.bool,
};
