import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const { t, i18n } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setDropdownOpen(false);
  };

  const getActiveLangCode = () => {
    const lng = i18n.language?.split('-')[0]?.toLowerCase() || 'en';
    if (lng === 'si') return 'SI';
    if (lng === 'ta') return 'TA';
    return 'EN';
  };

  const languages = [
    { code: 'EN', nativeName: 'English', id: 'en' },
    { code: 'SI', nativeName: 'සිංහල', id: 'si' },
    { code: 'TA', nativeName: 'தமிழ்', id: 'ta' }
  ];

  const currentLangCode = getActiveLangCode();

  return (
    <div style={{ backgroundColor: '#FFF9F0', color: '#1c1917' }} className="min-h-screen flex flex-col font-sans">
      
      {/* Navbar Header */}
      <nav style={{ backgroundColor: '#FFF9F0' }} className="flex justify-between items-center py-4 px-6 md:px-16 shadow-sm border-b border-[#DDD0BC]">
        <div className="flex items-center gap-3">
          <img src="/logo2.png" alt="Logo" className="h-10 md:h-12 w-auto" />
        </div>
        
        {/* Right Nav Options */}
        <div className="flex items-center gap-8 font-semibold text-sm md:text-base">
          <div className="space-x-6">
            <Link to="/" className="text-[#6A2301] font-extrabold border-b-2 border-[#6A2301] pb-1">{t('nav_home', 'Home')}</Link>
            <Link to="/about" className="text-[#5a3a00] hover:text-[#6A2301] transition-colors">{t('nav_about', 'About')}</Link>
          </div>

          {/* Language Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 text-[#1c1917] font-black hover:text-[#6A2301] transition-colors uppercase tracking-wider text-base cursor-pointer focus:outline-none"
            >
              {currentLangCode}
              <svg 
                className={`w-3.5 h-3.5 transition-transform duration-200 text-[#1c1917] ${dropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#DDD0BC] rounded-2xl shadow-xl overflow-hidden z-50">
                {languages.map((lang) => {
                  const isSelected = currentLangCode === lang.code;
                  return (
                    <button
                      key={lang.id}
                      onClick={() => changeLanguage(lang.id)}
                      className={`w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors cursor-pointer border-none focus:outline-none ${
                        isSelected 
                          ? 'bg-[#FFF5E6] text-[#5c4018]' 
                          : 'text-[#2b2520] hover:bg-[#FFFBF5]'
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        <span className={`text-base font-black tracking-wide w-6 ${isSelected ? 'text-[#6A2301]' : 'text-gray-700'}`}>
                          {lang.code}
                        </span>
                        <span className={`text-[15px] ${isSelected ? 'font-bold text-[#5c4018]' : 'font-medium text-gray-600'}`}>
                          {lang.nativeName}
                        </span>
                      </div>
                      {isSelected && <span className="text-[#3a2c18] font-bold text-sm">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero / Landing Content */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-6 py-12 max-w-4xl mx-auto">
        <h1 className={`font-black text-[#6A2301] mb-6 tracking-tight ${
          i18n.language === 'ta' ? 'text-2xl md:text-4xl' : i18n.language === 'si' ? 'text-3xl md:text-[44px]' : 'text-4xl md:text-6xl'
        }`}>
          {t('hero_title', 'Smart Grama Sewa: Your Village, Digitally Connected.')}
        </h1>
        
        <p className="text-base md:text-xl text-gray-700 mb-8 max-w-2xl font-medium leading-relaxed">
          {t('hero_desc', 'Access essential Grama Niladhari services from the comfort of your home. We\'re bringing the community closer.')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/login" className="bg-[#FFCB05] text-black px-8 py-3 rounded-full font-bold text-sm shadow-md hover:bg-yellow-500 hover:scale-[1.01] transition-all text-center">
            {t('btn_get_started', 'Get Started')}
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#6A2301' }} className="text-white text-center py-4 text-xs md:text-sm font-semibold mt-auto">
        © 2026 Smart Grama Sewa. All rights reserved.
      </footer>
    </div>
  );
};

export default Home;