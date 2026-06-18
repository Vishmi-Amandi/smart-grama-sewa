import i18n from 'i18next';
import { initReactI18next } from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector';

// Import your local translation JSON files explicitly
import enTranslation from './locales/en.json';
import siTranslation from './locales/si.json';
import taTranslation from './locales/ta.json';

i18n
  .use(LanguageDetector) // caches language selection in local storage
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      si: {
        translation: siTranslation
      },
      ta: {
        translation: taTranslation
      }
    },
    fallbackLng: 'en', // default language
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;