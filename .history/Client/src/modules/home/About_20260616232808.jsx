import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const About = () => {
  const { t, i18n } = useTranslation();

  return (
    <div style={{ backgroundColor: 'var(--bg-page, #FFF9F0)', color: 'var(--text-main, #1c1917)' }} className="min-h-screen flex flex-col font-sans">
      
      {/* Navbar Minimal Header */}
      <nav style={{ backgroundColor: '#FFF9F0' }} className="flex justify-between items-center py-4 px-6 md:px-16 shadow-sm border-b border-[#DDD0BC]">
        <div className="flex items-center gap-3">
          <img src="/logo2.png" alt="Logo" className="h-10 md:h-12 w-auto" />
        </div>
        <div className="space-x-6 font-semibold text-sm md:text-base">
          <Link to="/" className="text-[#5a3a00] hover:text-[#6A2301] transition-colors">{t('nav_home', 'Home')}</Link>
          <Link to="/about" className="text-[#6A2301] font-extrabold border-b-2 border-[#6A2301] pb-1">{t('nav_about', 'About')}</Link>
        </div>
      </nav>

      {/* Main Content Layout Container */}
      <main className="flex-grow max-w-4xl mx-auto px-6 py-12 md:py-16">
        
        {/* Title */}
        <h1 className={`font-black text-[#6A2301] mb-6 tracking-tight ${
          i18n.language === 'si' ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'
        }`}>
          {t('about_title', 'About Smart Grama Sewa')}
        </h1>

        {/* Project Context Summary */}
        <div className="bg-white border border-[#DDD0BC] p-6 rounded-2xl shadow-sm mb-8">
          <h2 className="text-lg font-bold text-[#92400e] mb-3">{t('about_mission_title', 'Our Mission')}</h2>
          <p className="text-sm md:text-base leading-relaxed text-gray-700 font-medium">
            {t('about_mission_desc', 'To modernize and digitize traditional local administrative workflows across Sri Lanka. By connecting citizens directly with their local Grama Niladhari division, we reduce long queues, optimize document tracking pipelines, and bring transparency right to your fingertips.')}
          </p>
        </div>

        {/* Ecosystem Breakdown Grid */}
        <h2 className="text-xl font-extrabold text-[#6A2301] mb-4">{t('about_features_title', 'Core Ecosystem Features')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          
          {/* Box 1: For Citizens */}
          <div className="bg-[#FFF8EE] border border-[#e8d5b7] p-5 rounded-xl">
            <div className="text-2xl mb-2">👥</div>
            <h3 className="font-bold text-[#92400e] text-base mb-1">{t('about_citizen_lbl', 'For Citizens')}</h3>
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-semibold">
              Fill request forms online, manage secure appointment calendars, download pre-filled verified certificate records, and view real-time digital announcement loops.
            </p>
          </div>

          {/* Box 2: For GN Officers */}
          <div className="bg-[#FFF8EE] border border-[#e8d5b7] p-5 rounded-xl">
            <div className="text-2xl mb-2">🏛️</div>
            <h3 className="font-bold text-[#92400e] text-base mb-1">{t('about_gn_lbl', 'For GN Officers')}</h3>
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-semibold">
              Review citizen requests, process dynamic administrative certificates, manage system availability flags, and keep community spaces safe and updated instantly.
            </p>
          </div>

        </div>

        {/* CTA Return Button */}
        <div className="text-center mt-12">
          <Link to="/login" className="bg-[#FFCB05] text-black px-8 py-3 rounded-full font-bold text-sm shadow-md hover:bg-yellow-500 hover:scale-[1.01] transition-all inline-block">
            {t('btn_get_started', 'Get Started')}
          </Link>
        </div>

      </main>

      {/* Footer Element */}
      <footer style={{ backgroundColor: '#6A2301' }} className="text-white text-center py-4 text-xs md:text-sm font-semibold mt-auto">
        © 2026 Smart Grama Sewa. All rights reserved.
      </footer>
    </div>
  );
};

export default About;