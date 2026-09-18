import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en.json';
import es from '../locales/es.json';
import pt from '../locales/pt.json';
import de from '../locales/de.json';
import fr from '../locales/fr.json';
import tr from '../locales/tr.json';
import hi from '../locales/hi.json';
import id from '../locales/id.json';
import it from '../locales/it.json';
import ja from '../locales/ja.json';
import ru from '../locales/ru.json';
import th from '../locales/th.json';
import nl from '../locales/nl.json';
import ar from '../locales/ar.json';
import vi from '../locales/vi.json';
import ko from '../locales/ko.json';
import pl from '../locales/pl.json';
import fil from '../locales/fil.json';
import ms from '../locales/ms.json';
import zh from '../locales/zh.json';
import bn from '../locales/bn.json';
import el from '../locales/el.json';
import cs from '../locales/cs.json';
import ro from '../locales/ro.json';
import uk from '../locales/uk.json';

const translations = {
  en, es, pt, de, fr, tr, hi, id, it, ja, ru, th, nl, ar, vi, ko, pl, fil, ms, zh, bn, el, cs, ro, uk
};

const languagesMap = {
  en: "English", es: "Español", pt: "Português", de: "Deutsch", fr: "Français",
  tr: "Türkçe", hi: "हिन्दी", id: "Bahasa Indonesia", it: "Italiano", ja: "日本語",
  ru: "Русский", th: "ไทย", nl: "Nederlands", ar: "العربية", vi: "Tiếng Việt",
  ko: "한국어", pl: "Polski", fil: "Filipino", ms: "Bahasa Melayu", zh: "中文",
  bn: "বাংলা", el: "Ελληνικά", cs: "Čeština", ro: "Română", uk: "Українська"
};

export const LANGUAGES = Object.entries(languagesMap).map(([code, label]) => ({
  code,
  label,
  short: code.toUpperCase(),
}));

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [currentLang, setCurrentLang] = useState(() => {
    try {
      const saved = localStorage.getItem('app_language');
      if (saved && translations[saved]) {
        return saved;
      }
    } catch {}
    return 'en';
  });

  useEffect(() => {
    try {
      localStorage.setItem('app_language', currentLang);
    } catch {}
  }, [currentLang]);

  const t = (key, fallback = '') => {
    return translations[currentLang]?.[key] || translations.en?.[key] || fallback || key;
  };

  const changeLanguage = (langCode) => {
    if (translations[langCode]) {
      setCurrentLang(langCode);
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLang, changeLanguage, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
