import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// --- Import i18n translation hook ---
import { useTranslation } from 'react-i18next';

const Home = () => {
  // --- Extract translation utilities ---
  const { t, i18n } = useTranslation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync mobile state window dimensions dynamically on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const changeLanguage = (lngCode) => {
    i18n.changeLanguage(lngCode);
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }} className="min-h-screen flex flex-col font-sans relative overflow-x-hidden">
      
      {/* 1. Header/Navbar */}
      <nav style={{ backgroundColor: 'var(--bg-topbar)' }} className="flex justify-between items-center py-3 px-4 md:px-8 shadow-sm sticky top-0 z-50">
        
        {/* Mobile Hamburger Trigger Menu Icon */}
        {isMobile && (
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="bg-none border-none cursor-pointer p-1 flex-shrink-0 mr-2">
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#3d2a00" strokeWidth={2.5}>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        {/* Logo and Name aligned side-by-side */}
        <div className="font-bold text-2xl flex items-center gap-3 flex-1 md:flex-initial">
          <img src="/logo2.png" alt="Logo" className="h-10 md:h-14 w-auto" />
        </div>
        
        {/* Desktop Links View Navigation Panel */}
        {!isMobile && (
          <div className="space-x-8 font-semibold text-sm md:text-base">
            <Link to="/" className="hover:text-[#6A2301] transition-colors">Home</Link>
            <a href="#" className="hover:text-[#6A2301] transition-colors">About</a>
            <a href="#" className="hover:text-[#6A2301] transition-colors">News &amp; Notices</a>
            <a href="#" className="hover:text-[#6A2301] transition-colors">Contact</a>
          </div>
        )}

        {/* Language Switcher Section with Balanced Sizing for Sinhala and Tamil */}
        <div className="text-xs md:text-sm flex items-center gap-1 md:gap-2 font-bold ml-auto md:ml-0">
          <button 
            onClick={() => changeLanguage('si')} 
            style={{ background: 'none', border: 'none' }}
            className={`cursor-pointer px-1 transition-all text-[13px] md:text-[15px] ${i18n.language === 'si' ? 'text-[#6A2301] font-extrabold scale-105' : 'text-inherit opacity-70 font-semibold'}`}
          >
            සිං
          </button> 
          <span className="opacity-30 text-xs">|</span>
          <button 
            onClick={() => changeLanguage('ta')} 
            style={{ background: 'none', border: 'none' }}
            className={`cursor-pointer px-1 transition-all text-[10px] md:text-xs tracking-tight ${i18n.language === 'ta' ? 'text-[#6A2301] font-extrabold scale-105' : 'text-inherit opacity-70 font-semibold'}`}
          >
            தமிழ்
          </button> 
          <span className="opacity-30 text-xs">|</span>
          <button 
            onClick={() => changeLanguage('en')} 
            style={{ background: 'none', border: 'none' }}
            className={`cursor-pointer px-1 transition-all text-xs md:text-sm ${i18n.language === 'en' ? 'text-[#6A2301] font-extrabold scale-105' : 'text-inherit opacity-70 font-semibold'}`}
          >
            EN
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Navigation Sidebar Overlay Panels */}
      {isMobile && mobileMenuOpen && (
        <>
          <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/40 z-50 transition-opacity" />
          <div className="fixed top-0 left-0 w-[260px] h-screen bg-[#F5C400] z-50 shadow-2xl flex flex-col py-6 px-4 animate-slide-right">
            <div className="flex justify-between items-center pb-4 border-b border-black/10 mb-6">
              <img src="/logo2.png" alt="Logo" className="h-10 w-auto" />
              <button onClick={() => setMobileMenuOpen(false)} className="bg-none border-none text-xl font-bold cursor-pointer text-[#3d2a00]">✕</button>
            </div>
            <div className="flex flex-col gap-4 font-bold text-base text-[#3d2a00]">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-white/30 transition-colors">Home</Link>
              <a href="#" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-white/30 transition-colors">About</a>
              <a href="#" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-white/30 transition-colors">News &amp; Notices</a>
              <a href="#" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-white/30 transition-colors">Contact</a>
            </div>
          </div>
        </>
      )}

      {/* 2. Hero Section - Balanced Typography Across Languages */}
      <main 
        className="flex-grow flex items-center px-6 md:px-16" 
        style={{ 
          backgroundImage: "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('/background.jpg')", 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }}
      >
        <div className="max-w-2xl text-white py-12 md:py-24">
          <h1 className={`font-black mb-4 md:mb-6 leading-tight whitespace-pre-line tracking-tight ${
            i18n.language === 'ta' 
              ? 'text-2xl md:text-4xl' 
              : i18n.language === 'si' 
                ? 'text-3xl md:text-[44px]' 
                : 'text-3xl md:text-5xl'
          }`}>
            {t('hero_title')}
          </h1>
          <p className={`mb-6 md:mb-8 font-medium text-gray-100 opacity-90 max-w-xl ${
            i18n.language === 'ta' 
              ? 'text-xs md:text-base' 
              : i18n.language === 'si' 
                ? 'text-[13px] md:text-[17px] leading-relaxed' 
                : 'text-sm md:text-lg'
          }`}>
            {t('hero_desc')}
          </p>
          {/* CLEANED UP: Single link structure */}
          <Link to="/login" className="bg-[#FFCB05] text-black px-10 py-3 rounded-full font-bold hover:bg-yellow-500 transition inline-block">
            {t('btn_get_started')}
          </Link>
        </div>
      </main>

      {/* 3. Footer */}
      <footer style={{ backgroundColor: '#6A2301' }} className="text-white text-center py-3.5 px-4 text-xs md:text-sm font-semibold tracking-wide flex-shrink-0 border-t border-black/10">
        © 2026 Smart Grama Sewa. All rights reserved.
      </footer>

      {/* Responsive Drawer Keyframe Style Injection */}
      <style>{`
        @keyframes slideRight {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-right { animation: slideRight 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Home;