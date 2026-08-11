import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import {
  FileText,
  CalendarDays,
  Bell,
  Handshake,
  AlertTriangle,
  HelpCircle,
  UserCircle,
  Megaphone,
  ChevronUp,
  ChevronDown,
  Globe,
  MapPin,
} from 'lucide-react';

const Home = () => {
  const { t, i18n } = useTranslation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const q = query(
          collection(db, 'announcements'),
          where('isPublic', '==', true),
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        const snapshot = await getDocs(q);
        setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error('Failed to fetch announcements:', err);
        setAnnouncements([]);
      } finally {
        setAnnouncementsLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const changeLanguage = (lngCode) => i18n.changeLanguage(lngCode);

  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const badgeStyle = (type) => {
    const map = {
      urgent:  { bg: '#FEE2E2', text: '#B91C1C', label: 'Urgent' },
      general: { bg: '#FEF9C3', text: '#92400E', label: 'General' },
      event:   { bg: '#DBEAFE', text: '#1D4ED8', label: 'Event' },
    };
    return map[type] || map['general'];
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const IconBox = ({ icon: Icon }) => (
    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#F5C400]/20 flex items-center justify-center">
      <Icon size={18} strokeWidth={2} color="#6A2301" />
    </div>
  );

  return (
    <div
      style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }}
      className="min-h-screen flex flex-col font-sans relative overflow-x-hidden"
    >

      {/* ─── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav
        style={{ backgroundColor: 'var(--bg-topbar)' }}
        className="flex justify-between items-center py-3 px-4 md:px-8 shadow-sm sticky top-0 z-50"
      >
        {isMobile && (
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="bg-none border-none cursor-pointer p-1 flex-shrink-0 mr-2">
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#3d2a00" strokeWidth={2.5}>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        <div className="font-bold text-2xl flex items-center gap-3 flex-1 md:flex-initial">
          <img src="/logo2.png" alt="Logo" className="h-10 md:h-14 w-auto" />
        </div>

        {!isMobile && (
          <div className="space-x-8 font-semibold text-sm md:text-base">
            <Link to="/" className="hover:text-[#6A2301] transition-colors">{t('nav_home')}</Link>
            <button onClick={() => scrollTo('about')} className="bg-transparent border-none cursor-pointer font-semibold text-sm md:text-base hover:text-[#6A2301] transition-colors" style={{ color: 'inherit' }}>{t('nav_about')}</button>
            <button onClick={() => scrollTo('news')} className="bg-transparent border-none cursor-pointer font-semibold text-sm md:text-base hover:text-[#6A2301] transition-colors" style={{ color: 'inherit' }}>{t('nav_news')}</button>
            <button onClick={() => scrollTo('contact')} className="bg-transparent border-none cursor-pointer font-semibold text-sm md:text-base hover:text-[#6A2301] transition-colors" style={{ color: 'inherit' }}>{t('nav_contact')}</button>
          </div>
        )}

        <div className="text-xs md:text-sm flex items-center gap-1 md:gap-2 font-bold ml-auto md:ml-0">
          <button onClick={() => changeLanguage('si')} style={{ background: 'none', border: 'none' }}
            className={`cursor-pointer px-1 transition-all text-[13px] md:text-[15px] ${i18n.language === 'si' ? 'text-[#6A2301] font-extrabold scale-105' : 'text-inherit opacity-70 font-semibold'}`}>
            සිං
          </button>
          <span className="opacity-30 text-xs">|</span>
          <button onClick={() => changeLanguage('ta')} style={{ background: 'none', border: 'none' }}
            className={`cursor-pointer px-1 transition-all text-[10px] md:text-xs tracking-tight ${i18n.language === 'ta' ? 'text-[#6A2301] font-extrabold scale-105' : 'text-inherit opacity-70 font-semibold'}`}>
            தமிழ்
          </button>
          <span className="opacity-30 text-xs">|</span>
          <button onClick={() => changeLanguage('en')} style={{ background: 'none', border: 'none' }}
            className={`cursor-pointer px-1 transition-all text-xs md:text-sm ${i18n.language === 'en' ? 'text-[#6A2301] font-extrabold scale-105' : 'text-inherit opacity-70 font-semibold'}`}>
            EN
          </button>
        </div>
      </nav>

      {/* ─── MOBILE DRAWER ───────────────────────────────────────────────────── */}
      {isMobile && mobileMenuOpen && (
        <>
          <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/40 z-50 transition-opacity" />
          <div className="fixed top-0 left-0 w-[260px] h-screen bg-[#F5C400] z-50 shadow-2xl flex flex-col py-6 px-4 animate-slide-right">
            <div className="flex justify-between items-center pb-4 border-b border-black/10 mb-6">
              <img src="/logo2.png" alt="Logo" className="h-10 w-auto" />
              <button onClick={() => setMobileMenuOpen(false)} className="bg-none border-none text-xl font-bold cursor-pointer text-[#3d2a00]">✕</button>
            </div>
            <div className="flex flex-col gap-2 font-bold text-base text-[#3d2a00]">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-white/30 transition-colors">{t('nav_home')}</Link>
              <button onClick={() => scrollTo('about')} className="text-left px-3 py-2 rounded-lg hover:bg-white/30 transition-colors bg-transparent border-none cursor-pointer font-bold text-base text-[#3d2a00]">{t('nav_about')}</button>
              <button onClick={() => scrollTo('news')} className="text-left px-3 py-2 rounded-lg hover:bg-white/30 transition-colors bg-transparent border-none cursor-pointer font-bold text-base text-[#3d2a00]">{t('nav_news')}</button>
              <button onClick={() => scrollTo('contact')} className="text-left px-3 py-2 rounded-lg hover:bg-white/30 transition-colors bg-transparent border-none cursor-pointer font-bold text-base text-[#3d2a00]">{t('nav_contact')}</button>
            </div>
          </div>
        </>
      )}

      {/* ─── HERO ────────────────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="flex-grow flex items-center px-6 md:px-16 min-h-[88vh]"
        style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('/background.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-2xl text-white py-12 md:py-24">
          <h1 className="font-black mb-4 md:mb-6 leading-tight whitespace-pre-line tracking-tight text-3xl md:text-5xl">
            {t('hero_title')}
          </h1>
          <p className="mb-6 md:mb-8 font-medium text-gray-100 opacity-90 max-w-xl text-sm md:text-lg leading-relaxed">
            {t('hero_desc')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/login" className="bg-[#FFCB05] text-black px-8 md:px-10 py-3 rounded-full font-bold text-sm md:text-base shadow-lg hover:bg-yellow-500 hover:scale-[1.02] active:scale-[0.98] transition-all inline-block text-center">
              {t('btn_get_started')}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── ABOUT ───────────────────────────────────────────────────────────── */}
      <section id="about" className="py-16 md:py-24 px-6 md:px-16" style={{ backgroundColor: '#FFFBF0' }}>
        <div className="max-w-5xl mx-auto">

          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-[3px] rounded-full bg-[#F5C400] inline-block" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#6A2301]">{t('about_subtitle')}</span>
          </div>

          <h2 className="text-2xl md:text-4xl font-black text-[#3d2a00] mb-6 leading-tight whitespace-pre-line">
            {t('about_title')}
          </h2>

          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            <div>
              <p className="text-sm md:text-base text-[#5a3e00] leading-relaxed mb-4">
                {t('about_desc_1')}
              </p>
              <p className="text-sm md:text-base text-[#5a3e00] leading-relaxed mb-4">
                {t('about_desc_2')}
              </p>
              <p className="text-sm md:text-base text-[#5a3e00] leading-relaxed">
                {t('about_desc_3')}
              </p>
            </div>

            {/* Feature highlight cards */}
            <div className="grid grid-cols-1 gap-4">
              {[
                { Icon: FileText,     title: t('feat_cert_title'),  desc: t('feat_cert_desc') },
                { Icon: CalendarDays, title: t('feat_book_title'),  desc: t('feat_book_desc') },
                { Icon: Bell,         title: t('feat_news_title'),  desc: t('feat_news_desc') },
                { Icon: Handshake,    title: t('feat_comm_title'),  desc: t('feat_comm_desc') },
              ].map(({ Icon, title, desc }) => (
                <div key={title} className="flex gap-4 items-start p-4 rounded-xl bg-white border border-[#F5C400]/40 shadow-sm">
                  <IconBox icon={Icon} />
                  <div>
                    <p className="font-bold text-[#3d2a00] text-sm mb-0.5">{title}</p>
                    <p className="text-xs text-[#7a5c00]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '14,000+', label: t('stat_divisions') },
              { value: '3',       label: t('stat_languages') },
              { value: '24/7',    label: t('stat_availability') },
              { value: '100%',    label: t('stat_free') },
            ].map((s) => (
              <div key={s.label} className="text-center py-5 px-3 rounded-2xl bg-[#F5C400]/15 border border-[#F5C400]/30">
                <p className="text-2xl md:text-3xl font-black text-[#6A2301]">{s.value}</p>
                <p className="text-[11px] md:text-xs text-[#5a3e00] font-semibold mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NEWS & NOTICES ──────────────────────────────────────────────────── */}
      <section id="news" className="py-16 md:py-24 px-6 md:px-16" style={{ backgroundColor: '#fff' }}>
        <div className="max-w-5xl mx-auto">

          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-[3px] rounded-full bg-[#F5C400] inline-block" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#6A2301]">{t('news_subtitle')}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-10">
            <h2 className="text-2xl md:text-4xl font-black text-[#3d2a00] leading-tight">
              {t('news_title')}
            </h2>
            <p className="text-xs text-[#7a5c00] md:text-right max-w-xs">
              {t('news_info')}
            </p>
          </div>

          {announcementsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map(n => (
                <div key={n} className="rounded-2xl border border-gray-100 p-5 animate-pulse">
                  <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
                  <div className="h-4 bg-gray-100 rounded w-4/5 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-20 text-[#9a7c40]">
              <Megaphone size={40} strokeWidth={1.5} className="mx-auto mb-3 opacity-40" color="#9a7c40" />
              <p className="font-semibold text-base">{t('news_empty')}</p>
              <p className="text-sm mt-1">{t('news_empty_sub')}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {announcements.map((ann) => {
                const badge = badgeStyle(ann.type);
                const isExpanded = expandedId === ann.id;
                return (
                  <div
                    key={ann.id}
                    className="rounded-2xl border border-[#f0e8d0] bg-[#FFFBF0] p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide"
                        style={{ backgroundColor: badge.bg, color: badge.text }}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[11px] text-[#9a7c40]">{formatDate(ann.createdAt)}</span>
                    </div>

                    <p className="font-bold text-[#3d2a00] text-sm leading-snug">{ann.title}</p>

                    <p className={`text-xs text-[#5a3e00] leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}>
                      {ann.content || ann.description || ann.message || ''}
                    </p>

                    <div className="flex justify-between items-center mt-auto pt-2 border-t border-[#f0e8d0]">
                      {ann.gnDivision && (
                        <span className="flex items-center gap-1 text-[10px] text-[#7a5c00] font-medium bg-[#F5C400]/20 px-2 py-0.5 rounded-full">
                          <MapPin size={10} strokeWidth={2.5} />
                          {ann.gnDivision}
                        </span>
                      )}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : ann.id)}
                        className="flex items-center gap-1 text-[11px] font-bold text-[#6A2301] ml-auto bg-transparent border-none cursor-pointer"
                      >
                        {isExpanded ? (
                          <><ChevronUp size={13} strokeWidth={2.5} /> Show less</>
                        ) : (
                          <><ChevronDown size={13} strokeWidth={2.5} /> Read more</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Login CTA */}
          <div className="mt-12 rounded-2xl bg-[#6A2301] text-white flex flex-col md:flex-row items-center justify-between gap-5 px-8 py-7">
            <div>
              <p className="font-black text-base md:text-lg">{t('news_cta_title')}</p>
              <p className="text-sm text-white/80 mt-1">{t('news_cta_desc')}</p>
            </div>
            <Link to="/login" className="bg-[#FFCB05] text-black px-7 py-2.5 rounded-full font-bold text-sm whitespace-nowrap hover:bg-yellow-400 transition-colors flex-shrink-0">
              {t('btn_login_cta')}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CONTACT ─────────────────────────────────────────────────────────── */}
      <section id="contact" className="py-16 md:py-24 px-6 md:px-16" style={{ backgroundColor: '#FFFBF0' }}>
        <div className="max-w-5xl mx-auto">

          <div className="flex items-center gap-3 mb-3">
            <span className="w-8 h-[3px] rounded-full bg-[#F5C400] inline-block" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#6A2301]">{t('contact_subtitle')}</span>
          </div>

          <h2 className="text-2xl md:text-4xl font-black text-[#3d2a00] mb-10 leading-tight">
            {t('contact_title')}
          </h2>

          <div className="grid md:grid-cols-2 gap-6">

            {/* ─── LEFT COLUMN ────────────────────────────────────────────── */}
            <div className="flex flex-col gap-5">

              {/* Emergency contacts */}
              <div className="rounded-2xl bg-[#6A2301] text-white p-6 shadow-sm">
                <p className="font-black text-sm mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} strokeWidth={2} color="#FFCB05" />
                  {t('contact_emergency')}
                </p>
                <div className="flex flex-col gap-3 text-xs">
                  {[
                    { name: 'Police Emergency',      num: '119' },
                    { name: 'Ambulance / Fire',      num: '110' },
                    { name: 'Disaster Management',   num: '117' },
                    { name: 'Suwa Seriya Ambulance', num: '1990' },
                  ].map(e => (
                    <div key={e.name} className="flex justify-between items-center border-b border-white/10 pb-2 last:border-b-0">
                      <span className="text-white/80">{e.name}</span>
                      <a href={`tel:${e.num}`} className="font-black text-[#FFCB05] hover:underline">{e.num}</a>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-white/40 mt-3 text-center">
                  {t('contact_emergency_sub')}
                </p>
              </div>

              {/* External links strip */}
              <div className="rounded-2xl bg-white border border-[#f0e8d0] p-5 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#5a3e00]">
                  <Globe size={14} strokeWidth={2} color="#9a7c40" />
                  <span>
                    <span className="font-bold text-[#3d2a00]">{t('contact_follow')} </span>
                    {t('contact_follow_sub')}
                  </span>
                </div>
                <div className="flex gap-3">
                  <a href="https://www.gov.lk" target="_blank" rel="noopener noreferrer"
                    className="text-[11px] font-bold text-[#6A2301] border border-[#6A2301]/30 px-3 py-1.5 rounded-full hover:bg-[#6A2301]/5 transition-colors">
                    gov.lk
                  </a>
                  <a href="https://www.icta.lk" target="_blank" rel="noopener noreferrer"
                    className="text-[11px] font-bold text-[#6A2301] border border-[#6A2301]/30 px-3 py-1.5 rounded-full hover:bg-[#6A2301]/5 transition-colors">
                    ICTA
                  </a>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="flex flex-col gap-5">

              {/* Help & Resources */}
              <div className="rounded-2xl bg-white border border-[#f0e8d0] p-6 shadow-sm">
                <p className="font-black text-[#3d2a00] text-sm mb-4 flex items-center gap-2">
                  <HelpCircle size={16} strokeWidth={2} color="#6A2301" />
                  {t('contact_resources')}
                </p>
                <Link
                  to="/faq"
                  className="flex items-center justify-between p-4 rounded-xl border border-[#F5C400]/30 hover:bg-[#FFF8E1] hover:border-[#F5C400] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#F5C400]/15 flex items-center justify-center group-hover:bg-[#F5C400]/30 transition-colors">
                      <HelpCircle size={18} strokeWidth={2} color="#6A2301" />
                    </div>
                    <div>
                      <p className="font-bold text-[#3d2a00] text-sm group-hover:text-[#6A2301] transition-colors">{t('contact_faq_title')}</p>
                      <p className="text-[11px] text-[#7a5c00]">{t('contact_faq_desc')}</p>
                    </div>
                  </div>
                  <span className="text-[#6A2301]">→</span>
                </Link>
              </div>

              {/* GN Officer login prompt */}
              <div className="rounded-2xl border-2 border-[#F5C400] bg-white p-6 flex flex-col md:flex-row gap-5 items-start md:items-center shadow-sm">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#F5C400]/20 flex items-center justify-center">
                  <UserCircle size={28} strokeWidth={1.5} color="#6A2301" />
                </div>
                <div className="flex-1">
                  <p className="font-black text-[#3d2a00] text-base mb-1">{t('contact_gn_title')}</p>
                  <p className="text-xs text-[#5a3e00] leading-relaxed">
                    {t('contact_gn_desc')}
                  </p>
                </div>
                <Link
                  to="/login"
                  className="flex-shrink-0 bg-[#6A2301] text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-[#8B2F00] transition-colors whitespace-nowrap shadow-md"
                >
                  {t('btn_contact_gn')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: '#6A2301' }} className="text-white py-8 px-6 md:px-16 border-t border-black/10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div>
            <img src="/logo2.png" alt="Logo" className="h-10 w-auto mb-2 brightness-0 invert opacity-90" />
            <p className="text-xs text-white/60">{t('footer_sub')}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs font-semibold text-white/80">
            <button onClick={() => scrollTo('about')} className="hover:text-white transition-colors bg-transparent border-none cursor-pointer text-xs font-semibold text-white/80">{t('nav_about')}</button>
            <button onClick={() => scrollTo('news')} className="hover:text-white transition-colors bg-transparent border-none cursor-pointer text-xs font-semibold text-white/80">{t('nav_news')}</button>
            <button onClick={() => scrollTo('contact')} className="hover:text-white transition-colors bg-transparent border-none cursor-pointer text-xs font-semibold text-white/80">{t('nav_contact')}</button>
            <Link to="/login" className="hover:text-white transition-colors">{t('btn_login_cta').split(" ")[0]}</Link>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-6 pt-4 border-t border-white/10 text-center text-xs text-white/40">
          © 2026 Smart Grama Sewa. All rights reserved.
        </div>
      </footer>

      <style>{`
        @keyframes slideRight {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        .animate-slide-right { animation: slideRight 0.2s ease-out forwards; }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Home;