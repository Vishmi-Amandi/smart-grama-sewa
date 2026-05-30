import i18n from 'i18n';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en.json';
import siTranslation from './locales/si.json';
import taTranslation from './locales/ta.json';

i18n
  .use(LanguageDetector) 
  .use(initReactI18next)   
  .init({
    resources: {
      en: { translation: enTranslation.translation },
      si: { translation: siTranslation.translation },
      ta: { translation: taTranslation.translation }
    },
    fallbackLng: 'en', 
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;