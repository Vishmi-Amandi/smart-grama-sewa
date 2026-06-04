import React from 'react';
import { Link } from 'react-router-dom';
// --- 1. Import i18n translation hook ---
import { useTranslation } from 'react-i18next';

const Home = () => {
  // --- 2. Extract translation utilities ---
  const { t, i18n } = useTranslation();

  const changeLanguage = (lngCode) => {
    i18n.changeLanguage(lngCode);
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }} className="min-h-screen flex flex-col">
      
      {/* 1. Header/Navbar - Using team variables */}
      <nav style={{ backgroundColor: 'var(--bg-topbar)' }} className="flex justify-between items-center py-2 px-3 shadow-sm">
        {/* Logo and Name aligned side-by-side */}
        <div className="font-bold text-2xl flex items-center gap-3">
          <img src="/logo2.png" alt="Logo" className="h-15 w-auto" />
        </div>
        
        <div className="space-x-8 font-semibold">
          <Link to="/">Home</Link>
          <a href="#">About</a>
          <a href="#">News &amp; Notices</a>
          <a href="#">Contact</a>
        </div>

        {/* 3. FIXED: Linked language switcher buttons to replace static hashtag lines */}
        <div className="text-sm flex items-center gap-2 font-bold">
          <button 
            onClick={() => changeLanguage('si')} 
            style={{ background: 'none', border: 'none' }}
            className={`cursor-pointer px-1 transition-all ${i18n.language === 'si' ? 'text-[#6A2301] font-extrabold' : 'text-inherit font-semibold'}`}
          >
            සිංහල
          </button> 
          <span className="opacity-40">||</span>
          <button 
            onClick={() => changeLanguage('ta')} 
            style={{ background: 'none', border: 'none' }}
            className={`cursor-pointer px-1 transition-all ${i18n.language === 'ta' ? 'text-[#6A2301] font-extrabold' : 'text-inherit font-semibold'}`}
          >
            தமிழ்
          </button> 
          <span className="opacity-40">||</span>
          <button 
            onClick={() => changeLanguage('en')} 
            style={{ background: 'none', border: 'none' }}
            className={`cursor-pointer px-1 transition-all ${i18n.language === 'en' ? 'text-[#6A2301] font-extrabold' : 'text-inherit font-semibold'}`}
          >
            English
          </button>
        </div>
      </nav>

      {/* 2. Hero Section - Using the overlay image style with reactive key hooks */}
      <main 
        className="flex-grow flex items-center px-12" 
        style={{ 
          backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('/background.jpg')", 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }}
      >
        <div className="max-w-2xl text-white py-20">
          <h1 className="text-5xl font-extrabold mb-6 leading-tight whitespace-pre-line">
            {t('hero_title')}
          </h1>
          <p className="text-lg mb-8">
            {t('hero_desc')}
          </p>
          {/* CLEANED UP: Single link structure */}
          <Link to="/login" className="bg-[#FFCB05] text-black px-10 py-3 rounded-full font-bold hover:bg-yellow-500 transition inline-block">
            {t('btn_get_started')}
          </Link>
        </div>
      </main>

      {/* 3. Footer */}
      <footer style={{   
        backgroundColor: '#6A2301',
        color: '#fff',
        textAlign: 'center',
        padding: '13px 16px',
        fontSize: '13px',
        fontWeight: 600,
      }}>
        ©2026 Smart Grama Sewa
      </footer>

    </div>
  );
};

export default Home;