import { LANGUAGES } from '../i18n';
import { useLanguage } from '../context/LanguageContext';

export function LanguageSelector() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="language-selector" role="group" aria-label="Language">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          className={`language-btn ${lang === code ? 'active' : ''}`}
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
