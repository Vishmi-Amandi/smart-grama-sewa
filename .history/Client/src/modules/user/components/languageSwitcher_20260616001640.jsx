import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lngCode) => {
    // 1. Change language for the currently visible component reactively
    i18n.changeLanguage(lngCode);
    
    // 2. Save choice globally so every other module reads it immediately on load
    localStorage.setItem('i18nextLng', lngCode);
  };

  return (
    <div className="flex items-center gap-2 font-bold text-xs md:text-sm">
      <button 
        onClick={() => changeLanguage('si')} 
        className={`cursor-pointer px-1 transition-all text-[13px] md:text-[15px] ${i18n.language === 'si' ? 'text-[#6A2301] font-extrabold scale-105' : 'opacity-70'}`}
      >
        සිං
      </button> 
      <span className="opacity-30">|</span>
      <button 
        onClick={() => changeLanguage('ta')} 
        className={`cursor-pointer px-1 transition-all text-[10px] md:text-xs ${i18n.language === 'ta' ? 'text-[#6A2301] font-extrabold scale-105' : 'opacity-70'}`}
      >
        தமிழ்
      </button> 
      <span className="opacity-30">|</span>
      <button 
        onClick={() => changeLanguage('en')} 
        className={`cursor-pointer px-1 transition-all text-xs md:text-sm ${i18n.language === 'en' ? 'text-[#6A2301] font-extrabold scale-105' : 'opacity-70'}`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;