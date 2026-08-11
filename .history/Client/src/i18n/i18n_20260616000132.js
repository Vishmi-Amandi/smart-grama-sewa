import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en.json';
import siTranslation from './locales/si.json';
import taTranslation from './locales/ta.json';

i18n
  .use(LanguageDetector) // 👈 Tells i18n to automatically detect choices saved in localStorage
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation.translation || enTranslation },
      si: { translation: siTranslation.translation || siTranslation },
      ta: { translation: taTranslation.translation || taTranslation }
    },
    // Look for localStorage first, fallback to English if empty
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;