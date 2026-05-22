import { languages, useI18n } from "../lib/i18n";

const LanguageSwitcher = ({ compact = false }) => {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="flex items-center gap-2">
      {!compact && (
        <span className="hidden text-xs font-medium uppercase text-[#737373] sm:inline">
          {t("language.label")}
        </span>
      )}
      <div className="flex rounded-full border border-[#e5e5e5] bg-white p-1">
        {languages.map((item) => {
          const active = language === item.code;

          return (
            <button
              key={item.code}
              type="button"
              onClick={() => setLanguage(item.code)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                active ? "bg-black text-white" : "text-[#737373] hover:bg-[#f2f2f2] hover:text-black"
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
