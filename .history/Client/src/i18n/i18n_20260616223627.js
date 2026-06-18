import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import the raw dictionary profiles
import enTranslation from './locales/en.json';
import siTranslation from './locales/si.json';
import taTranslation from './locales/ta.json';

i18n
  .use(LanguageDetector) 
  .use(initReactI18next)   
  .init({
    resources: {
      en: {
        translation: enTranslation.translation || enTranslation 
      },
      si: {
        translation: siTranslation.translation || siTranslation
      },
      ta: {
        translation: taTranslation.translation || taTranslation
      }
    },
    // Cache management configuration rules to listen to changes everywhere
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    fallbackLng: 'en', 
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;