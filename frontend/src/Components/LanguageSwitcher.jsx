import { useEffect, useState } from 'react';

const LanguageSwitcher = ({ compact = false }) => {
  const languages = [
    { code: 'en', label: 'English', shortLabel: 'EN' },
    { code: 'vi', label: 'Tiếng Việt', shortLabel: 'VI' },
  ];

  const [language, setLanguage] = useState(localStorage.getItem('appLanguage') || 'en');

  const setLanguageAndStore = (code) => {
    try {
      localStorage.setItem('appLanguage', code);
    } catch (e) {
      // ignore localStorage errors (e.g., disabled)
    }
    setLanguage(code);
    // notify other parts of the app that language changed
    try {
      window.dispatchEvent(new CustomEvent('app-language-changed', { detail: { code } }));
    } catch (e) {
      /* ignore */
    }
  };

  // keep in sync if other tab updates language or storage events occur
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'appLanguage') {
        setLanguage(e.newValue || 'en');
      }
    };

    const onCustom = (e) => {
      if (e?.detail?.code) setLanguage(e.detail.code);
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('app-language-changed', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('app-language-changed', onCustom);
    };
  }, []);

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
              onClick={() => setLanguageAndStore(item.code)}
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
