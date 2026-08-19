import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { onAuthStateChanged, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { 
  getAuth, 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  PhoneAuthProvider,
  linkWithCredential,
} from 'firebase/auth';
import LanguageSwitcher from '../components/languageSwitcher';
import NotificationBell from '../components/NotificationBell';

// Icons
const Icon = ({ d, size = 20, color = 'currentColor', sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const IC = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  announce:  'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  appts:     'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2',
  forms:     'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  ai:        'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  profile:   'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  settings:  'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
  logout:    'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
  search:    'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  bell:      'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  menu:      'M3 6h18M3 12h18M3 18h18',
  close:     'M6 18L18 6M6 6l12 12',
  globe:     'M12 2a10 10 0 100 20 10 10 0 000-20z M12 2c2 2 3 4.5 3 10s-1 8-3 10 M12 2c-2 2-3 4.5-3 10s1 8 3 10 M22 12h-4 M2 12H6',  
  palette:   'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z',
  shield:    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  sun:       'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41M12 6a6 6 0 100 12 6 6 0 000-12z',
  moon:      'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
  check:     'M20 6L9 17l-5-5',
  chevLeft:  'M15 18l-6-6 6-6',
  chevRight: 'M9 18l6-6-6-6',
  phone:     'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  mail:      'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
  trash:     'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
  alertTriangle: 'M12 9v4M12 17h.01M12 2a10 10 0 100 20 10 10 0 000-20z',
  lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z',
  eyeOff: 'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22',
  mobile: 'M20 2H4a2 2 0 00-2 2v16a2 2 0 002 2h16a2 2 0 002-2V4a2 2 0 00-2-2z M8 18h8',
  send: 'M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  x: 'M18 6L6 18M6 6l12 12',
};

// ---------- Page Actions (translated) ----------
const PAGE_ACTIONS_KEYS = [
  { key: 'dashboard', path: '/dashboard', icon: IC.dashboard },
  { key: 'announcements', path: '/announcements', icon: IC.announce },
  { key: 'appointments', path: '/appointments', icon: IC.appts },
  { key: 'forms', path: '/forms', icon: IC.forms },
  { key: 'ai_assistant', path: null, icon: IC.ai },
  { key: 'profile', path: '/profile', icon: IC.profile },
  { key: 'settings', path: '/settings', icon: IC.settings },
];

// ---------- Search Results Dropdown (translated) ----------
const SearchResultsDropdown = ({ searchQuery, showResults, setShowResults, navigate, t }) => {
  const [filteredPages, setFilteredPages] = useState([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPages([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const allPages = PAGE_ACTIONS_KEYS.map(p => ({
      ...p,
      name: p.key === 'ai_assistant' ? t('lbl_ai_assistant') : t(`lbl_${p.key}`)
    }));
    setFilteredPages(allPages.filter(p => p.name.toLowerCase().includes(query)));
  }, [searchQuery, t]);

  if (!showResults || filteredPages.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-user-border z-[1000] overflow-hidden">
      {filteredPages.map((page, idx) => (
        <button
          key={page.path}
          onClick={() => {
            if (page.path === null) { window.openChatbot?.(); setShowResults(false); return; }
            navigate(page.path);
            setShowResults(false);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-user-background ${idx !== filteredPages.length - 1 ? 'border-b border-user-border-light' : ''}`}
        >
          <Icon d={page.icon} size={18} color="#B46A02" />
          <div>
            <div className="text-sm font-bold text-user-text">{page.name}</div>
            <div className="text-[11px] text-user-text-lighter">{t('lbl_click_to_go_to', { page: page.name })}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

// ---------- NavItem ----------
const NavItem = ({ iconPath, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-none cursor-pointer transition-all duration-150 text-left mb-0.5 ${
    active 
      ? 'bg-yellow-100 text-user-primary font-extrabold shadow-md' 
      : 'bg-transparent text-gray-700 font-semibold hover:bg-yellow-50'
  }`}
    style={{ color: active ? '#B46A02' : '#5a3a00' }}
  >
    <Icon d={iconPath} size={18} color={active ? '#B46A02' : '#5a3a00'} />
    {label}
  </button>
);

// ---------- Desktop Sidebar (translated) ----------
const DesktopSidebar = ({ activePage, navigate, onLogout, t }) => {
  const navItems = [
    { key: 'dashboard', icon: IC.dashboard },
    { key: 'announcements', icon: IC.announce },
    { key: 'appointments', icon: IC.appts },
    { key: 'forms', icon: IC.forms },
    { key: 'ai_assistant', icon: IC.ai },
  ];
  const bottomNav = [
    { key: 'profile', icon: IC.profile },
    { key: 'settings', icon: IC.settings },
    { key: 'logout', icon: IC.logout },
  ];

  return (
    <div className="desktop-sidebar w-[220px] flex-shrink-0 bg-user-primary flex flex-col sticky top-0 h-screen overflow-y-auto">
      <div className="p-5 pb-4 border-b border-black/10">
        <img src="/logo2.png" alt="Smart Grama Sewa" className="h-20 w-auto" />
      </div>
      <div className="flex-1 p-3">
        {navItems.map((item) => {
          const label = item.key === 'ai_assistant' ? t('lbl_ai_assistant') : t(`lbl_${item.key}`);
          const activeKey = item.key === 'ai_assistant' ? 'ai' : item.key;
          return (
            <NavItem key={item.key} iconPath={item.icon} label={label}
              active={activePage === activeKey}
              onClick={() => item.key === 'ai_assistant' ? window.openChatbot?.() : navigate(`/${item.key}`)} />
          );
        })}
      </div>
      <div className="p-3 pt-2 border-t border-black/10">
        {bottomNav.map((item) => (
          <NavItem key={item.key} iconPath={item.icon} 
            label={item.key === 'logout' ? t('lbl_sign_out') : t(`lbl_${item.key}`)}
            active={activePage === item.key}
            onClick={() => item.key === 'logout' ? onLogout() : navigate(`/${item.key}`)} />
        ))}
      </div>
    </div>
  );
};

// ---------- Desktop Topbar (email removed) ----------
const DesktopTopbar = ({ chipName, searchQuery, setSearchQuery, showResults, setShowResults, navigate, currentLanguage, onLanguageChange, showProfileMenu, setShowProfileMenu, handleLogout, userData, currentUser, t }) => (
  <div className="desktop-topbar h-16 bg-white border-b border-user-border-light flex items-center px-7 gap-3.5 sticky top-0 z-40 shadow-sm">
    <div className="flex-1 max-w-[400px] relative">
      <div className="flex items-center gap-2.5 bg-user-secondary-light border border-user-border rounded-round px-4 py-2 transition-colors hover:border-user-primary">
        <Icon d={IC.search} size={16} color="#aaa" />
        <input
          type="text"
          placeholder={t('lbl_search_page_function')}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          className="flex-1 border-none outline-none text-sm font-medium text-user-text bg-transparent"
        />
        {searchQuery && (
          <button onClick={() => { setSearchQuery(''); setShowResults(false); }} className="bg-none border-none cursor-pointer p-1">
            <Icon d={IC.close} size={14} color="#aaa" />
          </button>
        )}
      </div>
      <SearchResultsDropdown 
        searchQuery={searchQuery}
        showResults={showResults}
        setShowResults={setShowResults}
        navigate={navigate}
        t={t}
      />
    </div>
    <div className="flex-1" />
    
    <LanguageSwitcher 
      currentLanguage={currentLanguage} 
      onLanguageChange={onLanguageChange}
    />
    
    <NotificationBell />
    
    <div className="relative">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setShowProfileMenu(!showProfileMenu);
        }}
        className="flex items-center gap-2 py-1 pl-1.5 pr-3.5 bg-user-secondary-light border border-user-border rounded-round cursor-pointer transition-all hover:border-user-primary"
      >
        <span className="text-sm font-bold text-user-text max-w-[100px] truncate">{chipName}</span>
        <div className="w-7 h-7 rounded-full bg-user-primary flex items-center justify-center flex-shrink-0">
          <Icon d={IC.profile} size={16} color="#3d2a00" />
        </div>
      </button>
      
      {showProfileMenu && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-user-border z-50 overflow-hidden animate-fade-in">
          <div className="p-3 border-b border-user-border-light">
            <p className="text-sm font-bold text-user-text">{userData?.fullName || currentUser?.displayName || 'User'}</p>
            {/* EMAIL LINE REMOVED */}
          </div>
          <button onClick={() => { navigate('/profile'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-user-text hover:bg-user-background transition-colors">
            <Icon d={IC.profile} size={16} color="#B46A02" /> {t('lbl_my_profile')}
          </button>
          <button onClick={() => { navigate('/settings'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-user-text hover:bg-user-background transition-colors">
            <Icon d={IC.settings} size={16} color="#B46A02" /> {t('lbl_settings')}
          </button>
          <div className="border-t border-user-border-light my-1"></div>
          <button onClick={() => { handleLogout(); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors">
            <Icon d={IC.logout} size={16} color="#ef4444" /> {t('lbl_sign_out')}
          </button>
        </div>
      )}
    </div>
  </div>
);

// ---------- Mobile Topbar ----------
const MobileTopbar = ({ chipName, onMenuClick, navigate, currentLanguage, onLanguageChange, t }) => (
  <div className="mobile-topbar hidden h-16 bg-user-primary items-center px-4 gap-3 sticky top-0 z-40 shadow-md">
    <button onClick={onMenuClick} className="bg-none border-none cursor-pointer p-1.5 flex-shrink-0">
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#3d2a00" strokeWidth={2.2}>
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
    <div className="flex-1 flex items-center justify-start">
      <img src="/logo2.png" alt="Smart Grama Sewa" className="h-10 w-auto" />
    </div>
    <LanguageSwitcher currentLanguage={currentLanguage} onLanguageChange={onLanguageChange} />
    <NotificationBell />
    <div className="w-9 h-9 rounded-full bg-white/85 flex items-center justify-center cursor-pointer" onClick={() => navigate('/profile')}>
      <Icon d={IC.profile} size={20} color="#3d2a00" />
    </div>
  </div>
);

// ---------- Mobile Sidebar (translated) ----------
const MobileSidebar = ({ isOpen, onClose, activePage, navigate, onLogout, t }) => {
  const navItems = [
    { key: 'dashboard', icon: IC.dashboard },
    { key: 'announcements', icon: IC.announce },
    { key: 'appointments', icon: IC.appts },
    { key: 'forms', icon: IC.forms },
    { key: 'ai_assistant', icon: IC.ai },
  ];
  const bottomNav = [
    { key: 'profile', icon: IC.profile },
    { key: 'settings', icon: IC.settings },
    { key: 'logout', icon: IC.logout },
  ];

  if (!isOpen) return null;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/50 z-[1000]" />
      <div className="fixed top-0 left-0 w-[250px] h-screen bg-user-primary z-[1001] overflow-y-auto py-5">
        <div className="px-5 pb-5 text-right">
          <button onClick={onClose} className="bg-none border-none text-2xl cursor-pointer text-white">✕</button>
        </div>
        <div className="px-5 pb-5 border-b border-white/20 mb-2 flex justify-center">
          <img src="/logo2.png" alt="Smart Grama Sewa" className="h-12 w-auto" />
        </div>
        {navItems.map((item) => {
          const label = item.key === 'ai_assistant' ? t('lbl_ai_assistant') : t(`lbl_${item.key}`);
          const activeKey = item.key === 'ai_assistant' ? 'ai' : item.key;
          return (
            <NavItem key={item.key} iconPath={item.icon} label={label}
              active={activePage === activeKey}
              onClick={() => { if (item.key === 'ai_assistant') { window.openChatbot?.(); onClose(); return; } navigate(`/${item.key}`); onClose(); }} />
          );
        })}
        <div className="border-t border-white/20 my-3 pt-3">
          {bottomNav.map((item) => (
            <NavItem key={item.key} iconPath={item.icon} 
              label={item.key === 'logout' ? t('lbl_sign_out') : t(`lbl_${item.key}`)}
              active={activePage === item.key}
              onClick={() => { if (item.key === 'logout') onLogout(); else navigate(`/${item.key}`); onClose(); }} />
          ))}
        </div>
      </div>
    </>
  );
};

// ---------- Apply settings (unchanged) ----------
const applySettings = (s) => {
  if (s.theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
  }

  if (s.textSize === 'small') {
    document.documentElement.style.fontSize = '14px';
  } else if (s.textSize === 'large') {
    document.documentElement.style.fontSize = '18px';
  } else {
    document.documentElement.style.fontSize = '16px';
  }
  
  document.documentElement.setAttribute('data-theme', s.theme || 'light');
  document.documentElement.setAttribute('data-textsize', s.textSize || 'normal');
  localStorage.setItem('userSettings', JSON.stringify(s));
};

// ---------- Radio option ----------
const RadioOption = ({ selected, onClick, label, sub }) => (
  <div 
    onClick={onClick} 
    className={`flex items-center gap-4 p-4 bg-white rounded-xl mb-2.5 cursor-pointer transition-all border-2 ${
      selected ? 'border-user-primary shadow-sm' : 'border-transparent hover:border-user-primary'
    }`}
  >
    <div className={`w-5.5 h-5.5 rounded-full flex-shrink-0 transition-all ${
      selected ? 'border-[5px] border-user-text' : 'border-2 border-gray-300'
    } bg-white`} />
    <div>
      <div className="text-sm font-bold text-user-text">{label}</div>
      <div className="text-xs font-semibold text-user-text-lighter mt-0.5">{sub}</div>
    </div>
  </div>
);

// ---------- Horizontal tab ----------
const HTab = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-2 py-3 px-5 border-none bg-transparent text-sm font-semibold cursor-pointer transition-all whitespace-nowrap flex-shrink-0 ${
      active ? 'text-user-text font-extrabold border-b-2.5 border-user-primary' : 'text-gray-400 hover:text-user-text'
    }`}
    style={{ borderBottom: active ? '2.5px solid #F5C400' : '2.5px solid transparent', marginBottom: '-2px' }}
  >
    {icon}
    {label}
  </button>
);

// ---------- Toast ----------
const Toast = ({ show, t }) => (
  <div className={`fixed bottom-7 right-7 z-[999] bg-green-600 text-white py-3 px-5 rounded-xl text-sm font-bold shadow-xl transition-all duration-300 pointer-events-none ${
    show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
  }`}>
    {t('lbl_toast_settings_saved')}
  </div>
);

// ---------- Content Card ----------
const ContentCard = ({ children }) => (
  <div className="bg-user-primary-light border border-user-warning rounded-xl p-6 md:p-7">
    {children}
  </div>
);

// ---------- SECURITY TAB ----------
const SecurityTab = ({ currentUser, userData, db, t }) => {
  // Password states
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwStrength, setPwStrength] = useState({ label: '', color: '', width: '0%' });
  const [pwTouched, setPwTouched] = useState({ current: false, new: false, confirm: false });

  // Mobile states
  const [newMobile, setNewMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [mobLoading, setMobLoading] = useState(false);
  const [mobError, setMobError] = useState('');
  const [mobSuccess, setMobSuccess] = useState(false);
  const [timer, setTimer] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingMobile, setPendingMobile] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  const otpInputRefs = useRef([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Auto-focus OTP input when OTP is sent
  useEffect(() => {
    if (otpSent && otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, [otpSent]);

  // Password strength checker
  const checkPasswordStrength = (password) => {
    if (!password) return { label: '', color: '', width: '0%' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    const strengthMap = {
      0: { label: t('lbl_pw_very_weak'), color: '#ef4444', width: '25%' },
      1: { label: t('lbl_pw_weak'), color: '#f59e0b', width: '50%' },
      2: { label: t('lbl_pw_fair'), color: '#f59e0b', width: '75%' },
      3: { label: t('lbl_pw_good'), color: '#10b981', width: '100%' },
      4: { label: t('lbl_pw_strong'), color: '#10b981', width: '100%' },
    };
    return strengthMap[strength] || strengthMap[0];
  };

  // Password validation
  const getPasswordErrors = () => {
    const errors = [];
    if (newPw && newPw.length < 8) errors.push(t('lbl_pw_err_len'));
    if (newPw && !/[A-Z]/.test(newPw)) errors.push(t('lbl_pw_err_upper'));
    if (newPw && !/[0-9]/.test(newPw)) errors.push(t('lbl_pw_err_number'));
    if (newPw && !/[^A-Za-z0-9]/.test(newPw)) errors.push(t('lbl_pw_err_special'));
    if (newPw && newPw === currentPw) errors.push(t('lbl_pw_err_same'));
    return errors;
  };

  const isPasswordValid = () => {
    return newPw.length >= 8 && 
           /[A-Z]/.test(newPw) && 
           /[0-9]/.test(newPw) && 
           /[^A-Za-z0-9]/.test(newPw) &&
           newPw !== currentPw &&
           newPw === confirmPw &&
           currentPw.length > 0;
  };

  const handleNewPwChange = (value) => {
    setNewPw(value);
    setPwStrength(checkPasswordStrength(value));
    if (pwError) setPwError('');
  };

  const handleChangePassword = async () => {
    if (!isPasswordValid()) return;
    
    setPwLoading(true);
    setPwError('');
    
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPw);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPw);
      setPwSuccess(true);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setPwTouched({ current: false, new: false, confirm: false });
      setPwStrength({ label: '', color: '', width: '0%' });
      
      setTimeout(() => {
        alert(t('lbl_pw_changed_alert'));
        const authInstance = getAuth();
        signOut(authInstance);
      }, 2000);
      
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (e) {
      if (e.code === 'auth/wrong-password') {
        setPwError(t('lbl_pw_err_wrong_current'));
      } else {
        setPwError(t('lbl_pw_err_general'));
      }
    } finally {
      setPwLoading(false);
    }
  };

  // Mobile validation
  const isValidMobile = (mobile) => {
    return /^(\+94|0)?[0-9]{9,10}$/.test(mobile.replace(/\s/g, ''));
  };

  const handleSendOtp = async () => {
    setMobError('');
    if (!newMobile.trim()) {
      setMobError(t('lbl_mob_err_empty'));
      return;
    }
    if (!isValidMobile(newMobile)) {
      setMobError(t('lbl_mob_err_invalid'));
      return;
    }
    if (otpAttempts >= 3) {
      setMobError(t('lbl_mob_err_attempts'));
      return;
    }
        
    let raw = newMobile.trim().replace(/\s/g, '');
    
    // Remove leading 0 if present
    if (raw.startsWith('0')) {
      raw = raw.slice(1);
    }
    
    // Add +94 for real SMS (no spaces)
    const formattedPhone = '+94' + raw;
        
    setMobLoading(true);
    setMobError('');
    
    try {
      const authInstance = getAuth();
      
      // Ensure container exists
      let container = document.getElementById('recaptcha-container-security');
      if (!container) {
        container = document.createElement('div');
        container.id = 'recaptcha-container-security';
        container.style.display = 'none';
        document.body.appendChild(container);
      }
      
      // Clear existing verifier
      if (window.recaptchaVerifier) {
        try {
          await window.recaptchaVerifier.clear();
        } catch (e) {
        }
        window.recaptchaVerifier = null;
      }
      
      // Create new verifier
      window.recaptchaVerifier = new RecaptchaVerifier(
        authInstance,
        'recaptcha-container-security',
        {
          size: 'invisible',
          callback: () => {},
          'expired-callback': () => {
            window.recaptchaVerifier = null;
          }
        }
      );
      
      await window.recaptchaVerifier.render();
            
      const confirmationResult = await signInWithPhoneNumber(
        authInstance,
        formattedPhone,
        window.recaptchaVerifier
      );
      
      window.confirmationResultSecurity = confirmationResult;
      setOtpSent(true);
      setTimer(60);
      setOtpAttempts(prev => prev + 1);
      setMobLoading(false);
            
    } catch (error) {
      setMobLoading(false);
      
      if (window.recaptchaVerifier) {
        try {
          await window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = null;
      }
      
      if (error.code === 'auth/too-many-requests') {
        setMobError(t('lbl_mob_err_too_many'));
      } else if (error.code === 'auth/invalid-phone-number') {
        setMobError(t('lbl_mob_err_invalid_format'));
      } else if (error.code === 'auth/network-request-failed') {
        setMobError(t('lbl_mob_err_network'));
      } else if (error.code === 'auth/captcha-check-failed') {
        setMobError(t('lbl_mob_err_captcha'));
      } else if (error.code === 'auth/quota-exceeded') {
        setMobError(t('lbl_mob_err_quota'));
      } else if (error.code === 'auth/operation-not-allowed') {
        setMobError(t('lbl_mob_err_region'));
      } else {
        setMobError(t('lbl_mob_err_general', { message: error.message }));
      }
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
    setMobError('');
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setMobError(t('lbl_mob_err_otp_incomplete'));
      return;
    }
    
    if (!window.confirmationResultSecurity) {
      setMobError(t('lbl_mob_err_otp_resend'));
      return;
    }
    
    setMobLoading(true);
    setMobError('');
    
    try {
      const credential = PhoneAuthProvider.credential(
        window.confirmationResultSecurity.verificationId,
        otpValue
      );
      
      await linkWithCredential(currentUser, credential);
      
      const formattedPhone = newMobile.startsWith('+94') ? newMobile : '+94' + newMobile.replace(/^0/, '');
      await updateDoc(doc(db, 'users', currentUser.uid), { 
        mobile: formattedPhone,
        phoneNumber: formattedPhone
      });
      
      // Clear OTP state
      setOtp(['', '', '', '', '', '']);
      setOtpSent(false);
      setTimer(0);
      setMobSuccess(true);
      setNewMobile('');
      setMobLoading(false);
      
      // Clear confirmation result
      window.confirmationResultSecurity = null;
      
      setTimeout(() => setMobSuccess(false), 5000);
      
    } catch (error) {
      setMobLoading(false);
      
      if (error.code === 'auth/invalid-verification-code') {
        setMobError(t('lbl_mob_err_otp_invalid'));
        setOtpAttempts(prev => prev + 1);
      } else if (error.code === 'auth/too-many-requests') {
        setMobError(t('lbl_mob_err_too_many'));
      } else if (error.code === 'auth/provider-already-linked') {
        setMobError(t('lbl_mob_err_already_linked'));
      } else if (error.code === 'auth/credential-already-in-use') {
        setMobError(t('lbl_mob_err_in_use'));
      } else {
        setMobError(t('lbl_mob_err_verify_general', { message: error.message }));
      }
    }
  };

  const confirmMobileUpdate = async () => {
    setShowConfirmModal(false);
  }; 

  const handleResendOtp = () => {
    if (timer > 0) return;
    if (otpAttempts >= 3) {
      setMobError(t('lbl_mob_err_attempts'));
      return;
    }
    handleSendOtp();
  };

  const passwordErrors = getPasswordErrors();
  const passwordsMatch = confirmPw && newPw === confirmPw;
  const currentMobile = userData?.mobile || t('lbl_not_set');

  useEffect(() => {
    const initRecaptcha = async () => {
      try {
        const authInstance = getAuth();
        
        let container = document.getElementById('recaptcha-container-security');
        if (!container) {
          container = document.createElement('div');
          container.id = 'recaptcha-container-security';
          container.style.display = 'none';
          document.body.appendChild(container);
        }
      } catch (error) {
      }
    };
    
    initRecaptcha();
    
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (e) {
          console.warn();
        }
      }
    };
  }, []);

  return (
    <div className="bg-user-primary-light border border-user-warning rounded-xl p-5 md:p-6">
      <div className="text-sm font-extrabold text-user-secondary mb-5">{t('lbl_privacy_security')}</div>
      
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4`}>
        
        {/* Change Password Section */}
        <div className="flex-1 bg-white rounded-xl p-5 md:p-5 shadow-sm">
          <div className="text-sm md:text-sm font-extrabold text-user-text mb-4 flex items-center gap-2">
            <Icon d={IC.lock} size={16} />
            {t('lbl_change_password')}
          </div>
          
          {pwSuccess && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-400 rounded-lg p-3 mb-3.5 text-sm font-bold text-green-700">
              <Icon d={IC.check} size={14} color="#1a5c1a" /> {t('lbl_pw_changed_success')}
            </div>
          )}
          
          {pwError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-400 rounded-lg p-3 mb-3.5 text-sm font-bold text-red-700">
              <Icon d={IC.alertTriangle} size={14} color="#8b1a1a" /> {pwError}
            </div>
          )}
          
          {/* Current Password */}
          <div className="relative mb-2.5">
            <input 
              type={showCurrentPw ? 'text' : 'password'} 
              value={currentPw} 
              onChange={e => { setCurrentPw(e.target.value); setPwError(''); setPwTouched(p => ({ ...p, current: true })); }} 
              placeholder={t('lbl_current_password')} 
              className={`w-full py-3 px-4 text-sm font-semibold bg-user-secondary-light border rounded-lg outline-none transition-colors focus:border-user-primary pr-12 ${
                pwTouched.current && currentPw && !pwError ? 'border-green-500' : ''
              } ${pwError ? 'border-red-500' : 'border-user-border'}`}
            />
            <button 
              type="button" 
              onClick={() => setShowCurrentPw(!showCurrentPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              <Icon d={showCurrentPw ? IC.eye : IC.eyeOff} size={18} />
            </button>
          </div>
          
          {/* New Password */}
          <div className="relative mb-2.5">
            <input 
              type={showNewPw ? 'text' : 'password'} 
              value={newPw} 
              onChange={e => { handleNewPwChange(e.target.value); setPwTouched(p => ({ ...p, new: true })); }} 
              placeholder={t('lbl_new_password')} 
              className={`w-full py-3 px-4 text-sm font-semibold bg-user-secondary-light border rounded-lg outline-none transition-colors focus:border-user-primary pr-12 ${
                pwTouched.new && newPw && isPasswordValid() ? 'border-green-500' : ''
              } ${pwTouched.new && passwordErrors.length > 0 ? 'border-red-500' : 'border-user-border'}`}
            />
            <button 
              type="button" 
              onClick={() => setShowNewPw(!showNewPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              <Icon d={showNewPw ? IC.eye : IC.eyeOff} size={18} />
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {pwTouched.new && newPw && (
            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                {newPw && isPasswordValid() && <Icon d={IC.check} size={12} color="#10b981" />}
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: pwStrength.width, backgroundColor: pwStrength.color }} />
              </div>
            </div>
          )}
          
          {/* Password Requirements Checklist */}
          {pwTouched.new && newPw && passwordErrors.length > 0 && (
            <div className="mb-2.5 p-2 bg-gray-50 rounded-lg">
              <div className="text-[10px] font-semibold text-gray-500 mb-1">{t('lbl_pw_requires')}</div>
              <div className="flex flex-wrap gap-2">
                {passwordErrors.map(err => (
                  <span key={err} className="text-[10px] text-red-500 flex items-center gap-1">
                    <Icon d={IC.x} size={10} /> {err}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Confirm Password */}
          <div className="relative mb-4">
            <input 
              type={showConfirmPw ? 'text' : 'password'} 
              value={confirmPw} 
              onChange={e => { setConfirmPw(e.target.value); setPwError(''); setPwTouched(p => ({ ...p, confirm: true })); }} 
              placeholder={t('lbl_confirm_new_password')} 
              className={`w-full py-3 px-4 text-sm font-semibold bg-user-secondary-light border rounded-lg outline-none transition-colors focus:border-user-primary pr-12 ${
                pwTouched.confirm && confirmPw && passwordsMatch ? 'border-green-500' : ''
              } ${pwTouched.confirm && confirmPw && !passwordsMatch ? 'border-red-500' : 'border-user-border'}`}
            />
            <button 
              type="button" 
              onClick={() => setShowConfirmPw(!showConfirmPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              <Icon d={showConfirmPw ? IC.eye : IC.eyeOff} size={18} />
            </button>
          </div>
          
          {/* Real-time password match message */}
          {pwTouched.confirm && confirmPw && (
            <div className={`text-xs font-semibold mb-3 flex items-center gap-1 ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
              {passwordsMatch ? <Icon d={IC.check} size={12} /> : <Icon d={IC.x} size={12} />}
              {passwordsMatch ? t('lbl_pw_match_ok') : t('lbl_pw_match_fail')}
            </div>
          )}
          
          {/* Session Warning */}
          <div className="bg-red-400 dark:bg-orange-400 border border-red-200 rounded-lg p-2.5 mb-4">
            <div className="text-[11px] font-semibold text-white dark:text-black flex items-center gap-1.5">
              <Icon d={IC.alertTriangle} size={12} color="currentColor" />
              {t('lbl_pw_logout_warning')}
            </div>
          </div>
          
          <button 
            onClick={handleChangePassword} 
            disabled={pwLoading || !isPasswordValid()} 
            className="w-full py-3 rounded-lg bg-user-text dark:bg-amber-900 text-white text-sm font-extrabold flex items-center justify-center gap-2 transition-all hover:bg-user-secondary-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pwLoading ? (
              <><div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> {t('lbl_updating')}</>
            ) : t('lbl_update_password')}
          </button>
        </div>

        {/* Update Mobile Section */}
        <div className="flex-1 bg-white rounded-xl p-5 md:p-5 shadow-sm">
          <div className="text-sm md:text-sm font-extrabold text-user-text mb-4 flex items-center gap-2">
            <Icon d={IC.mobile} size={16} />
            {t('lbl_update_mobile')}
          </div>
          
          {/* Current Mobile Number Display */}
          <div className="bg-gray-50 dark:bg-transparent border border-gray-600 rounded-lg p-3 mb-4">
            <div className="text-xs font-semibold text-gray-500 mb-0.5">{t('lbl_current_mobile')}</div>
            <div className="text-sm font-bold text-user-text">{currentMobile}</div>
          </div>
          
          {mobSuccess && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-400 rounded-lg p-3 mb-3.5 text-sm font-bold text-green-700">
              <Icon d={IC.check} size={14} color="#1a5c1a" /> {t('lbl_mob_updated_success')}
            </div>
          )}
          
          {mobError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-400 rounded-lg p-3 mb-3.5 text-sm font-bold text-red-700">
              <Icon d={IC.alertTriangle} size={14} color="#8b1a1a" /> {mobError}
            </div>
          )}
          
          {/* New Mobile Input */}
          <input 
            type="tel" 
            value={newMobile} 
            onChange={e => { 
              setNewMobile(e.target.value); 
              setMobError(''); 
              setOtpSent(false); 
              setOtp(['', '', '', '', '', '']);
              setTimer(0);
            }} 
            placeholder={t('lbl_new_mobile_placeholder')} 
            className={`w-full py-3 px-4 text-sm font-semibold bg-user-secondary-light border rounded-lg outline-none transition-colors focus:border-user-primary mb-2.5 ${
              newMobile && isValidMobile(newMobile) ? 'border-green-500' : ''
            } ${newMobile && !isValidMobile(newMobile) ? 'border-red-500' : 'border-user-border'}`}
          />
          
          {/* SMS Preview */}
          {newMobile && isValidMobile(newMobile) && !otpSent && (
            <div className="text-xs font-semibold text-gray-500 mb-2.5 flex items-center gap-1">
              <Icon d={IC.send} size={12} />
              {t('lbl_sms_preview', { mobile: newMobile })}
            </div>
          )}
          
          {/* Send OTP Button */}
          <button 
            onClick={handleSendOtp} 
            disabled={mobLoading || otpSent || !isValidMobile(newMobile)} 
            className="w-full py-3 rounded-lg bg-user-primary text-user-text text-sm font-extrabold flex items-center justify-center gap-2 transition-all hover:bg-user-primary-dark disabled:opacity-50 disabled:cursor-not-allowed mb-3"
          >
            {mobLoading && !otpSent ? (
              <><div className="w-3.5 h-3.5 rounded-full border-2 border-user-text border-t-transparent animate-spin" /> {t('lbl_sending_otp')}</>
            ) : otpSent ? (
              <><Icon d={IC.check} size={12} /> {t('lbl_otp_sent', { timer: timer > 0 ? `(${timer}s)` : '' })}</>
            ) : t('lbl_send_otp')}
          </button>
          
          {/* OTP Input Boxes */}
          {otpSent && (
            <>
              <div className="flex justify-center gap-2 mb-3">
                {otp.map((digit, idx) => (
                  <input 
                    key={idx}
                    ref={el => otpInputRefs.current[idx] = el}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    className="w-12 h-12 text-center text-xl font-extrabold bg-user-secondary-light border border-user-border rounded-lg outline-none focus:border-user-primary"
                    style={{ caretColor: '#B46A02' }}
                  />
                ))}
              </div>
              
              {/* Resend OTP link */}
              <div className="text-center mb-3">
                {timer > 0 ? (
                  <span className="text-xs text-gray-400 flex items-center justify-center gap-1">
                    <Icon d={IC.refresh} size={12} /> {t('lbl_resend_otp_timer', { seconds: timer })}
                  </span>
                ) : (
                  <button 
                    onClick={handleResendOtp}
                    disabled={otpAttempts >= 3}
                    className="text-xs font-semibold text-user-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 mx-auto"
                  >
                    <Icon d={IC.refresh} size={12} /> {t('lbl_resend_otp')} {otpAttempts >= 3 && `(${t('lbl_limit_reached')})`}
                  </button>
                )}
              </div>
              
              {/* Verify Button */}
              <button 
                onClick={handleVerifyOtp} 
                disabled={mobLoading || otp.some(d => !d)} 
                className="w-full py-3 rounded-lg bg-user-text text-white text-sm font-extrabold flex items-center justify-center gap-2 transition-all hover:bg-user-secondary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mobLoading ? (<><div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> {t('lbl_verifying')}</>) : t('lbl_verify_update')}
              </button>
            </>
          )}
          
          {/* Warning about consequences */}
          <div className="bg-red-400 dark:bg-orange-400 border border-red-200 rounded-lg p-2.5 mt-3">
            <div className="text-[11px] font-semibold text-white dark:text-black flex items-center gap-1.5">
              <Icon d={IC.alertTriangle} size={14} color="currentColor" />
              {t('lbl_mob_warning')}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[1000]" onClick={() => setShowConfirmModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1001] w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-user-secondary-dark p-5">
              <h3 className="text-lg font-black text-white">{t('lbl_confirm_mobile_title')}</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">{t('lbl_confirm_mobile_desc')}</p>
              <p className="text-center font-bold text-gray-800 mb-2">
                {currentMobile} → {pendingMobile}
              </p>
              <p className="text-xs text-gray-500 mb-6">{t('lbl_confirm_mobile_note')}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-bold flex items-center justify-center gap-1"
                >
                  <Icon d={IC.x} size={14} /> {t('lbl_cancel')}
                </button>
                <button 
                  onClick={confirmMobileUpdate}
                  className="flex-1 py-2.5 rounded-lg bg-user-text text-white font-bold flex items-center justify-center gap-1"
                >
                  <Icon d={IC.check} size={14} /> {t('lbl_confirm')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ---------- ACCOUNT TAB ----------
const AccountTab = ({ currentUser, userData, navigate, t }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const createdAt = currentUser?.metadata?.creationTime
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : 'N/A';

  const gnDivLabel = userData?.gnDiv && userData?.dsDiv
    ? `${userData.dsDiv} - ${userData.gnDiv}`
    : userData?.gnDiv || userData?.dsDiv || t('lbl_gn_not_set');

  const handleSignOutEverywhere = async () => {
    setSignOutLoading(true);
    try {
      await signOut(auth);
      navigate('/login');
    } catch (e) {
    } finally {
      setSignOutLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (deleteInput !== 'DELETE') return;
    setDeleting(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        deletionRequested: true,
        deletionRequestedAt: new Date().toISOString(),
      });
      await signOut(auth);
      navigate('/login');
    } catch (e) {
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-user-primary-light border border-user-warning rounded-xl p-5 md:p-6">
      <div className="text-sm md:text-sm font-extrabold text-user-secondary mb-5">{t('lbl_account')}</div>

      <div className="bg-white rounded-xl p-5 md:p-6 mb-4 shadow-sm">
        <div className={`flex items-center justify-between mb-5 ${isMobile ? 'flex-col gap-3' : 'flex-row'}`}>
          <div className="text-sm md:text-sm font-extrabold text-user-text">{t('lbl_account_summary')}</div>
          <button onClick={() => navigate('/profile')} className="py-2.5 px-5 bg-user-text dark:bg-gray-700 rounded-round text-xs font-extrabold text-white cursor-pointer transition-all hover:bg-user-secondary-dark flex items-center justify-center gap-1.5 w-full md:w-auto">
            {t('lbl_edit_profile')} →
          </button>
        </div>
        <div className="pb-3.5 mb-3.5 border-b border-user-border-light">
          <div className="text-xs font-extrabold text-user-warning mb-1">{t('lbl_role')}</div>
          <div className="text-sm font-bold text-user-text">{userData?.role || t('lbl_citizen')}</div>
        </div>
        <div className="pb-3.5 mb-3.5 border-b border-user-border-light">
          <div className="text-xs font-extrabold text-user-warning mb-1">{t('lbl_member_since')}</div>
          <div className="text-sm font-bold text-user-text">{createdAt}</div>
        </div>
        <div>
          <div className="text-xs font-extrabold text-user-warning mb-1">{t('lbl_gn_division')}</div>
          <div className="text-sm font-bold text-user-text">{gnDivLabel}</div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border-2 border-user-error">
        <div className="flex items-center gap-2 mb-1.5">
          <Icon d={IC.alertTriangle} size={18} color="#c0392b" />
          <span className="text-sm md:text-sm font-black text-user-error">{t('lbl_danger_zone')}</span>
        </div>
        <p className="text-xs md:text-xs font-semibold text-user-error mb-5">{t('lbl_danger_zone_desc')}</p>

        <div className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-row'} justify-between items-start pb-5 mb-5 border-b border-user-border-light`}>
          <div>
            <div className="text-sm md:text-sm font-extrabold text-user-text mb-1">{t('lbl_sign_out_all')}</div>
            <div className="text-xs md:text-xs font-semibold text-user-text-lighter">{t('lbl_sign_out_all_desc')}</div>
          </div>
          <button onClick={handleSignOutEverywhere} disabled={signOutLoading} className="py-2.5 px-5 bg-user-error-light border border-user-error rounded-round text-xs font-extrabold text-user-error cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:bg-user-error/20 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto">
            {signOutLoading ? t('lbl_signing_out') : <><Icon d={IC.logout} size={14} color="#c0392b" /> {t('lbl_sign_out_everywhere')}</>}
          </button>
        </div>

        <div className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-row'} justify-between items-start`}>
          <div>
            <div className="text-sm md:text-sm font-extrabold text-user-text mb-1">{t('lbl_delete_account')}</div>
            <div className="text-xs md:text-xs font-semibold text-user-text-lighter">{t('lbl_delete_account_desc')}</div>
          </div>
          <button onClick={() => setShowDeleteConfirm(true)} className="py-2.5 px-5 bg-user-error-light border border-user-error rounded-round text-xs font-extrabold text-user-error cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:bg-user-error/20 w-full md:w-auto">
            <Icon d={IC.trash} size={14} color="#c0392b" /> {t('lbl_request_deletion')}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }} className="fixed inset-0 bg-black/50 z-[100]" />
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[calc(100%-32px)] max-w-md bg-white rounded-2xl p-6 md:p-7 shadow-2xl border-2 border-user-error`}>
            <div className="text-center mb-2.5">
              <Icon d={IC.alertTriangle} size={isMobile ? 48 : 44} color="#c0392b" />
            </div>
            <h2 className="text-lg md:text-lg font-black text-user-text text-center mb-2">{t('lbl_delete_confirm_title')}</h2>
            <p className="text-sm md:text-sm text-user-text-lighter font-semibold text-center leading-relaxed mb-5">
              {t('lbl_delete_confirm_desc')}
            </p>
            <p className="text-xs md:text-xs font-bold text-gray-500 mb-2">{t('lbl_delete_confirm_type')}</p>
            <input 
              type="text" value={deleteInput} onChange={e => setDeleteInput(e.target.value)} 
              placeholder={t('lbl_delete_confirm_placeholder')} 
              className="w-full py-3.5 px-4 rounded-lg border border-user-border text-sm font-bold text-user-text text-center bg-user-secondary-light outline-none focus:border-user-primary mb-5"
              style={{ letterSpacing: deleteInput === 'DELETE' ? '2px' : '0' }}
            />
            <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-row'}`}>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }} className="flex-1 py-3 rounded-round border border-user-border bg-white text-sm font-extrabold text-gray-500 cursor-pointer">{t('lbl_cancel')}</button>
              <button onClick={handleRequestDeletion} disabled={deleteInput !== 'DELETE' || deleting} className={`flex-1 py-3 rounded-round border-none text-sm font-extrabold text-white cursor-pointer transition-all ${
                deleteInput === 'DELETE' ? 'bg-user-error hover:bg-red-700' : 'bg-user-error/50 cursor-not-allowed'
              }`}>
                {deleting ? t('lbl_submitting') : t('lbl_request_deletion')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ---------- MAIN SETTINGS COMPONENT ----------
const Settings = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768); 

  // SEARCH STATE
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // LANGUAGE STATE
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');
  
  // PROFILE DROPDOWN STATE
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('language');
  const [settings, setSettings] = useState({
    language: i18n.language || 'en',
    theme: 'light',
    textSize: 'normal',
    notifReminders: true,
    notifUpdates: false,
    notifAnnouncements: true,
    deliveryEmail: true,
    deliveryBrowser: true,
    deliverySMS: false,
  });
  const [showToast, setShowToast] = useState(false);

  // 🔥 SYNC LANGUAGE: Keep settings.language in sync with i18n.language
  useEffect(() => {
    setCurrentLanguage(i18n.language);
    setSettings(prev => ({ ...prev, language: i18n.language }));
  }, [i18n.language]);

  // Handle language change from dropdown
  const handleLanguageChange = (langCode) => {
    setCurrentLanguage(langCode);
    i18n.changeLanguage(langCode);
    // The useEffect above will update settings.language automatically
  };

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) setUserData(snap.data());
        } catch (e) {}
      } else {
        navigate('/login');
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Click outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSearchResults(false);
      setShowProfileMenu(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  
  // Load saved settings on mount, but override language with i18n
  useEffect(() => {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.language = i18n.language || parsed.language || 'en';
        setSettings(parsed);
        applySettings(parsed);
      } catch (e) { }
    } else {
      setSettings(prev => ({ ...prev, language: i18n.language || 'en' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔥 UPDATE SETTING: Now also changes i18n for language
  const updateSetting = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    applySettings(next);
    if (key === 'language') {
      i18n.changeLanguage(value);
      setCurrentLanguage(value);
    }
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleLogout = async () => { await signOut(auth); navigate('/login'); };
  const chipName = userData?.username || userData?.fullName || currentUser?.email?.split('@')[0] || 'User';

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-user-background">
      <div className="w-11 h-11 rounded-full border-4 border-user-primary border-t-transparent animate-spin" />
    </div>
  );

  const TABS = [
    { id: 'language', icon: <Icon d={IC.globe} size={16} color="#B46A02" />, label: t('lbl_tab_language') },
    { id: 'appearance', icon: <Icon d={IC.palette} size={16} color="#B46A02" />, label: t('lbl_tab_appearance') },
    { id: 'notif', icon: <Icon d={IC.bell} size={16} color="#B46A02" />, label: t('lbl_tab_notifications') },
    { id: 'security', icon: <Icon d={IC.shield} size={16} color="#B46A02" />, label: t('lbl_tab_security') },
    { id: 'account', icon: <Icon d={IC.profile} size={16} color="#B46A02" />, label: t('lbl_tab_account') },
  ];

  return (
    <div key={i18n.language} className="user-module min-h-screen flex flex-col font-sans bg-user-background">
      <div className="flex-1 flex">
        <DesktopSidebar activePage="settings" navigate={navigate} onLogout={handleLogout} t={t} />
        <MobileSidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          activePage="settings"
          navigate={navigate}
          onLogout={handleLogout}
          t={t}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <DesktopTopbar 
            chipName={chipName}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showResults={showSearchResults}
            setShowResults={setShowSearchResults}
            navigate={navigate}
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
            showProfileMenu={showProfileMenu}
            setShowProfileMenu={setShowProfileMenu}
            handleLogout={handleLogout}
            userData={userData}
            currentUser={currentUser}
            t={t}
          />

          <MobileTopbar 
            chipName={chipName}
            onMenuClick={() => setMobileMenuOpen(true)}
            navigate={navigate}
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
            t={t}
          />

          {/* Mobile Search Bar */}
          <div className="md:hidden pt-3 px-3.5 relative">
            <div className="flex items-center gap-2.5 bg-white border border-user-border rounded-3xl px-4 py-2.5">
              <Icon d={IC.search} size={16} color="#aaa" />
              <input
                type="text"
                placeholder={t('lbl_search_page')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                className="flex-1 border-none outline-none text-sm font-medium text-user-text bg-transparent"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setShowSearchResults(false); }} className="bg-none border-none cursor-pointer p-1">
                  <Icon d={IC.close} size={14} color="#aaa" />
                </button>
              )}
            </div>
            <SearchResultsDropdown 
              searchQuery={searchQuery}
              showResults={showSearchResults}
              setShowResults={setShowSearchResults}
              navigate={navigate}
              t={t}
            />
          </div>

          {/* Content Area */}
          <div className="p-6 md:p-7 flex-1">
            <h1 className="text-2xl md:text-3xl font-black text-user-text tracking-tight mb-1">{t('lbl_settings')}</h1>
            <p className="text-sm font-semibold text-user-text-lighter mb-6">{t('lbl_settings_desc')}</p>

            {/* Horizontal tabs */}
            <div className="flex border-b-2 border-user-border-light mb-7 overflow-x-auto scrollbar-hide">
              {TABS.map(tab => (
                <HTab key={tab.id} icon={tab.icon} label={tab.label} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
              ))}
            </div>

            {/* LANGUAGE */}
            {activeTab === 'language' && (
              <ContentCard>
                <div className="text-sm font-extrabold text-user-secondary mb-4">{t('lbl_portal_language')}</div>
                <RadioOption 
                  selected={settings.language === 'si'} 
                  onClick={() => updateSetting('language', 'si')} 
                  label={t('lbl_lang_si')} 
                  sub={t('lbl_lang_si_sub')} 
                />
                <RadioOption 
                  selected={settings.language === 'ta'} 
                  onClick={() => updateSetting('language', 'ta')} 
                  label={t('lbl_lang_ta')} 
                  sub={t('lbl_lang_ta_sub')} 
                />
                <RadioOption 
                  selected={settings.language === 'en'} 
                  onClick={() => updateSetting('language', 'en')} 
                  label={t('lbl_lang_en')} 
                  sub={t('lbl_lang_en_sub')} 
                />
              </ContentCard>
            )}

            {/* APPEARANCE */}
            {activeTab === 'appearance' && (
              <div className="flex flex-col gap-6">
                <ContentCard>
                  <div className="text-sm font-extrabold text-user-secondary mb-4">{t('lbl_theme')}</div>
                  <RadioOption selected={settings.theme === 'light'} onClick={() => updateSetting('theme', 'light')} label={<><Icon d={IC.sun} size={16} color="#f59e0b" /> {t('lbl_theme_light')}</>} sub={t('lbl_theme_light_sub')} />
                  <RadioOption selected={settings.theme === 'dark'} onClick={() => updateSetting('theme', 'dark')} label={<><Icon d={IC.moon} size={16} color="#8b5cf6" /> {t('lbl_theme_dark')}</>} sub={t('lbl_theme_dark_sub')} />
                </ContentCard>

                <ContentCard>
                  <div className="text-sm font-extrabold text-user-secondary mb-4">{t('lbl_text_size')}</div>
                  <RadioOption selected={settings.textSize === 'small'} onClick={() => updateSetting('textSize', 'small')} label={t('lbl_text_small')} sub={t('lbl_text_small_sub')} />
                  <RadioOption selected={settings.textSize === 'normal'} onClick={() => updateSetting('textSize', 'normal')} label={t('lbl_text_normal')} sub={t('lbl_text_normal_sub')} />
                  <RadioOption selected={settings.textSize === 'large'} onClick={() => updateSetting('textSize', 'large')} label={t('lbl_text_large')} sub={t('lbl_text_large_sub')} />
                </ContentCard>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === 'notif' && (
              <ContentCard>
                <div className="text-sm font-extrabold text-user-secondary mb-5">{t('lbl_notifications')}</div>
                <div className="bg-white rounded-xl p-5 mb-4 shadow-sm">
                  <div className="text-sm font-extrabold text-user-text mb-4">{t('lbl_updates_announcements')}</div>
                  {[
                    { key: 'notifReminders', label: t('lbl_notif_reminders'), sub: t('lbl_notif_reminders_sub') },
                    { key: 'notifUpdates', label: t('lbl_notif_updates'), sub: t('lbl_notif_updates_sub') },
                    { key: 'notifAnnouncements', label: t('lbl_notif_announcements'), sub: t('lbl_notif_announcements_sub') },
                  ].map((item, i, arr) => (
                    <div key={item.key} className={`flex items-center justify-between ${i < arr.length - 1 ? 'pb-4 mb-4 border-b border-user-border-light' : ''}`}>
                      <div>
                        <div className="text-sm font-bold text-user-text mb-0.5">{item.label}</div>
                        <div className="text-xs font-semibold text-user-warning">{item.sub}</div>
                      </div>
                      <div onClick={() => updateSetting(item.key, !settings[item.key])} className="w-12 h-6.5 rounded-full bg-user-text relative cursor-pointer transition-colors flex-shrink-0">
                        <div className={`absolute top-1.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all duration-200 ${settings[item.key] ? 'left-7' : 'left-1.5'}`} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm">
                  <div className="text-sm font-extrabold text-user-text mb-4">{t('lbl_delivery_methods')}</div>
                  <div className="flex flex-wrap gap-6">
                    {[
                      { key: 'deliveryEmail', label: t('lbl_delivery_email') },
                      { key: 'deliveryBrowser', label: t('lbl_delivery_browser') },
                      { key: 'deliverySMS', label: t('lbl_delivery_sms') },
                    ].map(item => (
                      <div key={item.key} onClick={() => updateSetting(item.key, !settings[item.key])} className="flex items-center gap-2 cursor-pointer select-none">
                        <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center transition-all ${settings[item.key] ? 'bg-user-primary border-2 border-user-primary-dark' : 'bg-white border-2 border-gray-300'}`}>
                          {settings[item.key] && <div className="w-2 h-2 rounded-full bg-user-text" />}
                        </div>
                        <span className="text-sm font-bold text-user-text">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ContentCard>
            )}

            {/* SECURITY */}
            {activeTab === 'security' && <SecurityTab currentUser={currentUser} userData={userData} db={db} t={t} />}

            {/* ACCOUNT */}
            {activeTab === 'account' && <AccountTab currentUser={currentUser} userData={userData} navigate={navigate} t={t} />}

          </div>
        </div>
      </div>

      <footer className="bg-[#6A2301] text-white text-center py-3 px-4 text-sm font-semibold">
        © 2026 Smart Grama Sewa. All rights reserved.
      </footer>

      <Toast show={showToast} t={t} />
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .rounded-round { border-radius: 999px; }

        * {
          transition: background-color 0.2s ease, 
                      color 0.2s ease, 
                      border-color 0.2s ease,
                      box-shadow 0.2s ease;
        }

        @media (min-width: 769px) {
          .desktop-sidebar { display: flex !important; }
          .desktop-topbar { display: flex !important; }
          .mobile-topbar { display: none !important; }
        }

        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .desktop-topbar { display: none !important; }
          .mobile-topbar { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

export default Settings;