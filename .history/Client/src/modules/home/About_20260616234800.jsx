import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const About = () => {
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

  // Get current active short code
  const getActiveLangCode = () => {
    const lng = i18n.language?.split('-')[0];
    if (lng === 'si') return 'SI';
    if (lng === 'ta') return 'TA';
    return 'EN';
  };

  // Structured languages layout matching image_de0685.png
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
            <Link to="/" className="text-[#5a3a00] hover:text-[#6A2301] transition-colors">{t('nav_home', 'Home')}</Link>
            <Link to="/about" className="text-[#6A2301] font-extrabold border-b-2 border-[#6A2301] pb-1">{t('nav_about', 'About')}</Link>
          </div>

          {/* Exact Dropdown Container from image_de0685.png */}
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

            {/* Custom Styled Dropdown List Window */}
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
                        {/* Short code column */}
                        <span className={`text-base font-black tracking-wide w-6 ${isSelected ? 'text-[#6A2301]' : 'text-gray-700'}`}>
                          {lang.code}
                        </span>
                        {/* Native label column */}
                        <span className={`text-[15px] ${isSelected ? 'font-bold text-[#5c4018]' : 'font-medium text-gray-600'}`}>
                          {lang.nativeName}
                        </span>
                      </div>

                      {/* Checkmark indicator column */}
                      {isSelected && (
                        <span className="text-[#3a2c18] font-bold text-sm">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Content Main Body */}
      <main className="flex-grow max-w-4xl mx-auto px-6 py-12 md:py-16">
        <h1 className={`font-black text-[#6A2301] mb-6 tracking-tight ${
          i18n.language === 'si' ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'
        }`}>
          {t('about_title', 'About Smart Grama Sewa')}
        </h1>

        <div className="bg-white border border-[#DDD0BC] p-6 rounded-2xl shadow-sm mb-8">
          <h2 className="text-lg font-bold text-[#92400e] mb-3">{t('about_mission_title', 'Our Mission')}</h2>
          <p className="text-sm md:text-base leading-relaxed text-gray-700 font-medium">
            {t('about_mission_desc', 'To modernize and digitize traditional local administrative workflows across Sri Lanka. By connecting citizens directly with their local Grama Niladhari division, we reduce long queues, optimize document tracking pipelines, and bring transparency right to your fingertips.')}
          </p>
        </div>

       <h2 className="text-xl font-extrabold text-[#6A2301] mb-4">
  {t('about_features_title', 'Core Ecosystem Features')}
</h2>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
  {/* Card 1: For Citizens */}
  <div className="bg-[#FFF8EE] border border-[#e8d5b7] p-5 rounded-xl">
    <div className="text-2xl mb-2">👥</div>
    <h3 className="font-bold text-[#92400e] text-base mb-1">
      {t('about_citizen_lbl', 'For Citizens')}
    </h3>
    <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-semibold">
      {t('about_citizen_desc', 'Fill request forms online, manage secure appointment calendars, download pre-filled verified certificate records, and view real-time digital announcement loops.')}
    </p>
  </div>

  {/* Card 2: For GN Officers */}
  <div className="bg-[#FFF8EE] border border-[#e8d5b7] p-5 rounded-xl">
    <div className="text-2xl mb-2">🏛️</div>
    <h3 className="font-bold text-[#92400e] text-base mb-1">
      {t('about_gn_lbl', 'For GN Officers')}
    </h3>
    <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-semibold">
      {t('about_gn_desc', 'Review citizen requests, process dynamic administrative certificates, manage system availability flags, and keep community spaces safe and updated instantly.')}
    </p>
  </div>
</div>

        <div className="text-center mt-12">
          <Link to="/login" className="bg-[#FFCB05] text-black px-8 py-3 rounded-full font-bold text-sm shadow-md hover:bg-yellow-500 hover:scale-[1.01] transition-all inline-block">
            {t('btn_get_started', 'Get Started')}
          </Link>
        </div>
      </main>

      <footer style={{ backgroundColor: '#6A2301' }} className="text-white text-center py-4 text-xs md:text-sm font-semibold mt-auto">
        © 2026 Smart Grama Sewa. All rights reserved.
      </footer>
    </div>
  );
};

export default About;