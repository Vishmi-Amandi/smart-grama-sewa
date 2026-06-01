import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import LanguageSwitcher from '../components/languageSwitcher';

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
  user:      'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  sun:       'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41M12 6a6 6 0 100 12 6 6 0 000-12z',
  moon:      'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
  check:     'M20 6L9 17l-5-5',
  chevLeft:  'M15 18l-6-6 6-6',
  chevRight: 'M9 18l6-6-6-6',
  phone:     'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  mail:      'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
  trash:     'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
  alertTriangle: 'M12 9v4M12 17h.01M12 2a10 10 0 100 20 10 10 0 000-20z',
};

// List of all pages/functions for search
const PAGE_ACTIONS = [
  { name: 'Dashboard', path: '/dashboard', icon: IC.dashboard },
  { name: 'Announcements', path: '/announcements', icon: IC.announce },
  { name: 'Appointments', path: '/appointments', icon: IC.appts },
  { name: 'Forms', path: '/forms', icon: IC.forms },
  { name: 'AI Assistant', path: '/ai', icon: IC.ai },
  { name: 'Profile', path: '/profile', icon: IC.profile },
  { name: 'Settings', path: '/settings', icon: IC.settings },
];

// Search Results Dropdown Component
const SearchResultsDropdown = ({ searchQuery, showResults, setShowResults, navigate }) => {
  const [filteredPages, setFilteredPages] = useState([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPages([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = PAGE_ACTIONS.filter(page =>
      page.name.toLowerCase().includes(query)
    );
    setFilteredPages(filtered);
  }, [searchQuery]);

  if (!showResults || filteredPages.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-user-border z-[1000] overflow-hidden">
      {filteredPages.map((page, idx) => (
        <button
          key={page.path}
          onClick={() => {
            navigate(page.path);
            setShowResults(false);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-user-background ${idx !== filteredPages.length - 1 ? 'border-b border-user-border-light' : ''}`}
        >
          <Icon d={page.icon} size={18} color="#B46A02" />
          <div>
            <div className="text-sm font-bold text-user-text">{page.name}</div>
            <div className="text-[11px] text-user-text-lighter">Click to go to {page.name}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

// NavItem for sidebar
const NavItem = ({ iconPath, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-none cursor-pointer transition-all duration-150 text-left mb-0.5 ${
    active 
      ? 'bg-white/90 dark:bg-user-primary text-user-text font-extrabold shadow-md' 
      : 'bg-transparent text-user-text font-semibold hover:bg-white/40 dark:hover:bg-white/10'
  }`}
    style={{ color: active ? '#B46A02' : '#5a3a00' }}
  >
    <Icon d={iconPath} size={18} color={active ? '#B46A02' : '#5a3a00'} />
    {label}
  </button>
);

// Desktop Sidebar
const DesktopSidebar = ({ activePage, navigate, onLogout }) => {
  const navItems = [
    { key: 'dashboard', icon: IC.dashboard, label: 'Dashboard' },
    { key: 'announcements', icon: IC.announce, label: 'Announcements' },
    { key: 'appointments', icon: IC.appts, label: 'Appointments' },
    { key: 'forms', icon: IC.forms, label: 'Forms' },
    { key: 'ai', icon: IC.ai, label: 'AI assistant' },
  ];
  const bottomNav = [
    { key: 'profile', icon: IC.profile, label: 'Profile' },
    { key: 'settings', icon: IC.settings, label: 'Settings' },
    { key: 'logout', icon: IC.logout, label: 'Sign out' },
  ];

  return (
    <div className="desktop-sidebar w-[220px] flex-shrink-0 bg-user-primary flex flex-col sticky top-0 h-screen overflow-y-auto">
      <div className="p-5 pb-4 border-b border-black/10">
        <img src="/logo2.png" alt="Smart Grama Sewa" className="h-20 w-auto" />
      </div>
      <div className="flex-1 p-3">
        {navItems.map((item) => (
          <NavItem key={item.key} iconPath={item.icon} label={item.label}
            active={activePage === item.key}
            onClick={() => navigate(`/${item.key}`)} />
        ))}
      </div>
      <div className="p-3 pt-2 border-t border-black/10">
        {bottomNav.map((item) => (
          <NavItem key={item.key} iconPath={item.icon} label={item.label}
            active={activePage === item.key}
            onClick={() => item.key === 'logout' ? onLogout() : navigate(`/${item.key}`)} />
        ))}
      </div>
    </div>
  );
};

// Desktop Topbar
const DesktopTopbar = ({ chipName, searchQuery, setSearchQuery, showResults, setShowResults, navigate, currentLanguage, onLanguageChange, showProfileMenu, setShowProfileMenu, handleLogout, userData, currentUser }) => (
  <div className="desktop-topbar h-16 bg-white border-b border-user-border-light flex items-center px-7 gap-3.5 sticky top-0 z-40 shadow-sm">
    <div className="flex-1 max-w-[400px] relative">
      <div className="flex items-center gap-2.5 bg-user-secondary-light border border-user-border rounded-3xl px-4 py-2 transition-colors hover:border-user-primary">
        <Icon d={IC.search} size={16} color="#aaa" />
        <input
          type="text"
          placeholder="Search for a page or function..."
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
      />
    </div>
    <div className="flex-1" />
    
    <LanguageSwitcher 
      currentLanguage={currentLanguage} 
      onLanguageChange={onLanguageChange}
    />
    
    <div className="w-9 h-9 rounded-full bg-user-secondary-light border border-user-border flex items-center justify-center cursor-pointer relative transition-colors hover:border-user-primary">
      <Icon d={IC.bell} size={18} color="#5a3a00" />
      <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white" />
    </div>
    
    {/* Profile Dropdown */}
    <div className="relative">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setShowProfileMenu(!showProfileMenu);
        }}
        className="flex items-center gap-2 py-1 pl-1.5 pr-3.5 bg-user-secondary-light border border-user-border rounded-lg cursor-pointer transition-colors hover:border-user-primary"
      >
        <span className="text-sm font-bold text-user-text max-w-[100px] truncate">{chipName}</span>
        <div className="w-7 h-7 rounded-full bg-user-primary flex items-center justify-center flex-shrink-0">
          <Icon d={IC.profile} size={16} color="#3d2a00" />
        </div>
      </button>
      {showProfileMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-user-border z-50 overflow-hidden">
          <button onClick={() => { navigate('/profile'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
            <Icon d={IC.profile} size={14} /> My Profile
          </button>
          <button onClick={() => { navigate('/settings'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
            <Icon d={IC.settings} size={14} /> Settings
          </button>
          <hr className="my-1" />
          <button onClick={() => { handleLogout(); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center gap-2">
            <Icon d={IC.logout} size={14} /> Logout
          </button>
        </div>
      )}
    </div>
  </div>
);

// Mobile Topbar
const MobileTopbar = ({ chipName, onMenuClick, navigate, currentLanguage, onLanguageChange }) => (
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
    <div className="w-9 h-9 flex items-center justify-center relative">
      <Icon d={IC.bell} size={22} color="#1e1200" />
      <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500 border border-user-primary" />
    </div>
    <div className="w-9 h-9 rounded-full bg-white/85 flex items-center justify-center cursor-pointer" onClick={() => navigate('/profile')}>
      <Icon d={IC.profile} size={20} color="#3d2a00" />
    </div>
  </div>
);

// Mobile Sidebar Overlay
const MobileSidebar = ({ isOpen, onClose, activePage, navigate, onLogout }) => {
  const navItems = [
    { key: 'dashboard', icon: IC.dashboard, label: 'Dashboard' },
    { key: 'announcements', icon: IC.announce, label: 'Announcements' },
    { key: 'appointments', icon: IC.appts, label: 'Appointments' },
    { key: 'forms', icon: IC.forms, label: 'Forms' },
    { key: 'ai', icon: IC.ai, label: 'AI assistant' },
  ];
  const bottomNav = [
    { key: 'profile', icon: IC.profile, label: 'Profile' },
    { key: 'settings', icon: IC.settings, label: 'Settings' },
    { key: 'logout', icon: IC.logout, label: 'Sign out' },
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
        {navItems.map((item) => (
          <NavItem key={item.key} iconPath={item.icon} label={item.label}
            active={activePage === item.key}
            onClick={() => { navigate(`/${item.key}`); onClose(); }} />
        ))}
        <div className="border-t border-white/20 my-3 pt-3">
          {bottomNav.map((item) => (
            <NavItem key={item.key} iconPath={item.icon} label={item.label}
              active={activePage === item.key}
              onClick={() => { if (item.key === 'logout') onLogout(); else navigate(`/${item.key}`); onClose(); }} />
          ))}
        </div>
      </div>
    </>
  );
};

// Apply settings to the whole application
const applySettings = (s) => {
  // Apply Theme (Light/Dark)
  if (s.theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
  }

  // Apply Text Size - affects the entire page (html element)
  if (s.textSize === 'small') {
    document.documentElement.style.fontSize = '14px';
  } else if (s.textSize === 'large') {
    document.documentElement.style.fontSize = '18px';
  } else {
    document.documentElement.style.fontSize = '16px';
  }
  
  // Set data attributes for CSS targeting
  document.documentElement.setAttribute('data-theme', s.theme || 'light');
  document.documentElement.setAttribute('data-textsize', s.textSize || 'normal');
  
  // Store in localStorage
  localStorage.setItem('userSettings', JSON.stringify(s));
};

// Radio option row
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

// Horizontal tab
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

// Toast
const Toast = ({ show }) => (
  <div className={`fixed bottom-7 right-7 z-[999] bg-green-600 text-white py-3 px-5 rounded-xl text-sm font-bold shadow-xl transition-all duration-300 pointer-events-none ${
    show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
  }`}>
    ✓ Settings saved
  </div>
);

// Content Card
const ContentCard = ({ children }) => (
  <div className="bg-user-primary-light border border-user-warning rounded-xl p-6 md:p-7">
    {children}
  </div>
);

// SECURITY TAB COMPONENT
const SecurityTab = ({ currentUser, userData, db }) => {
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
      0: { label: 'Very Weak', color: '#ef4444', width: '25%' },
      1: { label: 'Weak', color: '#f59e0b', width: '50%' },
      2: { label: 'Fair', color: '#f59e0b', width: '75%' },
      3: { label: 'Good', color: '#10b981', width: '100%' },
      4: { label: 'Strong', color: '#10b981', width: '100%' },
    };
    return strengthMap[strength] || strengthMap[0];
  };

  // Password validation
  const getPasswordErrors = () => {
    const errors = [];
    if (newPw && newPw.length < 8) errors.push('At least 8 characters');
    if (newPw && !/[A-Z]/.test(newPw)) errors.push('One uppercase letter');
    if (newPw && !/[0-9]/.test(newPw)) errors.push('One number');
    if (newPw && !/[^A-Za-z0-9]/.test(newPw)) errors.push('One special character');
    if (newPw && newPw === currentPw) errors.push('Must be different from current password');
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
        alert('Password changed successfully! You will be logged out. Please log in again with your new password.');
        signOut(auth);
      }, 2000);
      
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (e) {
      if (e.code === 'auth/wrong-password') {
        setPwError('Current password is incorrect.');
      } else {
        setPwError('Failed to change password. Please try again.');
      }
    } finally {
      setPwLoading(false);
    }
  };

  // Mobile validation
  const isValidMobile = (mobile) => {
    return /^(\+94|0)?[0-9]{9,10}$/.test(mobile.replace(/\s/g, ''));
  };

  const handleSendOtp = () => {
    setMobError('');
    if (!newMobile.trim()) {
      setMobError('Please enter a new mobile number.');
      return;
    }
    if (!isValidMobile(newMobile)) {
      setMobError('Please enter a valid Sri Lanka mobile number (e.g., 0712345678 or +94712345678).');
      return;
    }
    if (otpAttempts >= 3) {
      setMobError('Too many OTP attempts. Please try again later.');
      return;
    }
    
    setMobLoading(true);
    setTimeout(() => {
      setMobLoading(false);
      setOtpSent(true);
      setTimer(60);
      setOtpAttempts(prev => prev + 1);
      setMobError('');
    }, 1000);
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

  const handleVerifyOtp = () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setMobError('Please enter the complete 6-digit OTP.');
      return;
    }
    if (otpValue !== '123456') {
      setMobError('Incorrect OTP. Please try again.');
      return;
    }
    
    setPendingMobile(newMobile);
    setShowConfirmModal(true);
  };

  const confirmMobileUpdate = async () => {
    setMobLoading(true);
    try {
      if (currentUser) {
        await updateDoc(doc(db, 'users', currentUser.uid), { mobile: pendingMobile });
      }
      setMobSuccess(true);
      setNewMobile('');
      setOtp(['', '', '', '', '', '']);
      setOtpSent(false);
      setTimer(0);
      setShowConfirmModal(false);
      
      setTimeout(() => setMobSuccess(false), 5000);
    } catch (e) {
      setMobError('Failed to update mobile. Please try again.');
    } finally {
      setMobLoading(false);
    }
  };

  const handleResendOtp = () => {
    if (timer > 0) return;
    if (otpAttempts >= 3) {
      setMobError('Maximum OTP attempts reached. Please try again later.');
      return;
    }
    handleSendOtp();
  };

  const passwordErrors = getPasswordErrors();
  const passwordsMatch = confirmPw && newPw === confirmPw;
  const currentMobile = userData?.mobile || 'Not set';

  return (
    <div className="bg-user-primary-light border border-user-warning rounded-xl p-5 md:p-6">
      <div className="text-sm font-extrabold text-user-secondary mb-5">Privacy & Security</div>
      
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4`}>
        
        {/* Change Password Section */}
        <div className="flex-1 bg-white rounded-xl p-5 md:p-5 shadow-sm">
          <div className="text-sm md:text-sm font-extrabold text-user-text mb-4 flex items-center gap-2">
            <Icon d={IC.lock} size={16} />
            Change password
          </div>
          
          {pwSuccess && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-400 rounded-lg p-3 mb-3.5 text-sm font-bold text-green-700">
              <Icon d={IC.check} size={14} color="#1a5c1a" /> Password changed successfully! You will be logged out shortly.
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
              placeholder="Current Password" 
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
              placeholder="New Password (min. 8 characters)" 
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
              <div className="text-[10px] font-semibold text-gray-500 mb-1">Password requires:</div>
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
              placeholder="Confirm New Password" 
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
              {passwordsMatch ? 'Passwords match!' : 'Passwords do not match'}
            </div>
          )}
          
          {/* Session Warning */}
          <div className="bg-red-400 dark:bg-orange-400 border border-red-200 rounded-lg p-2.5 mb-4">
            <div className="text-[11px] font-semibold text-white dark:text-black flex items-center gap-1.5">
              <Icon d={IC.alertTriangle} size={12} color="currentColor" />
              You will be logged out after changing your password. Please log in again with your new password.
            </div>
          </div>
          
          <button 
            onClick={handleChangePassword} 
            disabled={pwLoading || !isPasswordValid()} 
            className="w-full py-3 rounded-lg bg-user-text dark:bg-amber-900 text-white text-sm font-extrabold flex items-center justify-center gap-2 transition-all hover:bg-user-secondary-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pwLoading ? (
              <><div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> Updating…</>
            ) : 'Update Password'}
          </button>
        </div>

        {/* Update Mobile Section */}
        <div className="flex-1 bg-white rounded-xl p-5 md:p-5 shadow-sm">
          <div className="text-sm md:text-sm font-extrabold text-user-text mb-4 flex items-center gap-2">
            <Icon d={IC.mobile} size={16} />
            Update Mobile Number
          </div>
          
          {/* Current Mobile Number Display */}
          <div className="bg-gray-50 dark:bg-transparent border border-gray-600 rounded-lg p-3 mb-4">
            <div className="text-xs font-semibold text-gray-500 mb-0.5">Current Mobile Number</div>
            <div className="text-sm font-bold text-user-text">{currentMobile}</div>
          </div>
          
          {mobSuccess && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-400 rounded-lg p-3 mb-3.5 text-sm font-bold text-green-700">
              <Icon d={IC.check} size={14} color="#1a5c1a" /> Mobile number updated successfully! SMS sent to your new number.
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
            placeholder="New Mobile Number (e.g., 0712345678)" 
            className={`w-full py-3 px-4 text-sm font-semibold bg-user-secondary-light border rounded-lg outline-none transition-colors focus:border-user-primary mb-2.5 ${
              newMobile && isValidMobile(newMobile) ? 'border-green-500' : ''
            } ${newMobile && !isValidMobile(newMobile) ? 'border-red-500' : 'border-user-border'}`}
          />
          
          {/* SMS Preview */}
          {newMobile && isValidMobile(newMobile) && !otpSent && (
            <div className="text-xs font-semibold text-gray-500 mb-2.5 flex items-center gap-1">
              <Icon d={IC.send} size={12} />
              We will send a 6-digit code to {newMobile}. Standard SMS rates may apply.
            </div>
          )}
          
          {/* Send OTP Button */}
          <button 
            onClick={handleSendOtp} 
            disabled={mobLoading || otpSent || !isValidMobile(newMobile)} 
            className="w-full py-3 rounded-lg bg-user-primary text-user-text text-sm font-extrabold flex items-center justify-center gap-2 transition-all hover:bg-user-primary-dark disabled:opacity-50 disabled:cursor-not-allowed mb-3"
          >
            {mobLoading && !otpSent ? (
              <><div className="w-3.5 h-3.5 rounded-full border-2 border-user-text border-t-transparent animate-spin" /> Sending OTP…</>
            ) : otpSent ? (
              <><Icon d={IC.check} size={12} /> OTP Sent {timer > 0 && `(${timer}s)`}</>
            ) : 'Send OTP'}
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
                    <Icon d={IC.refresh} size={12} /> Resend OTP in {timer} seconds
                  </span>
                ) : (
                  <button 
                    onClick={handleResendOtp}
                    disabled={otpAttempts >= 3}
                    className="text-xs font-semibold text-user-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 mx-auto"
                  >
                    <Icon d={IC.refresh} size={12} /> Resend OTP {otpAttempts >= 3 && '(Limit reached)'}
                  </button>
                )}
              </div>
              
              {/* Verify Button */}
              <button 
                onClick={handleVerifyOtp} 
                disabled={mobLoading || otp.some(d => !d)} 
                className="w-full py-3 rounded-lg bg-user-text text-white text-sm font-extrabold flex items-center justify-center gap-2 transition-all hover:bg-user-secondary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mobLoading ? (<><div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> Verifying…</>) : 'Verify & Update'}
              </button>
            </>
          )}
          
          {/* Warning about consequences */}
          <div className="bg-red-400 dark:bg-orange-400 border border-red-200 rounded-lg p-2.5 mt-3">
            <div className="text-[11px] font-semibold text-white dark:text-black flex items-center gap-1.5">
              <Icon d={IC.alertTriangle} size={14} color="currentColor" />
              Updating your mobile number will be used for all future communications including appointment reminders and OTP verification.
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
              <h3 className="text-lg font-black text-white">Confirm Mobile Number Change</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to change your mobile number from
              </p>
              <p className="text-center font-bold text-gray-800 mb-2">
                {currentMobile} → {pendingMobile}
              </p>
              <p className="text-xs text-gray-500 mb-6">
                This change will take effect immediately and will be used for all future communications.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-bold flex items-center justify-center gap-1"
                >
                  <Icon d={IC.x} size={14} /> Cancel
                </button>
                <button 
                  onClick={confirmMobileUpdate}
                  className="flex-1 py-2.5 rounded-lg bg-user-text text-white font-bold flex items-center justify-center gap-1"
                >
                  <Icon d={IC.check} size={14} /> Confirm
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ACCOUNT TAB COMPONENT
const AccountTab = ({ currentUser, userData, navigate }) => {
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
    : userData?.gnDiv || userData?.dsDiv || '[GN Division not set]';

  const handleSignOutEverywhere = async () => {
    setSignOutLoading(true);
    try {
      await signOut(auth);
      navigate('/login');
    } catch (e) {
      console.error(e.message);
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
      console.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-user-primary-light border border-user-warning rounded-xl p-5 md:p-6">
      <div className="text-sm md:text-sm font-extrabold text-user-secondary mb-5">Account</div>

      <div className="bg-white rounded-xl p-5 md:p-6 mb-4 shadow-sm">
        <div className={`flex items-center justify-between mb-5 ${isMobile ? 'flex-col gap-3' : 'flex-row'}`}>
          <div className="text-sm md:text-sm font-extrabold text-user-text">Account Summary</div>
          <button onClick={() => navigate('/profile')} className="py-2.5 px-5 bg-user-text dark:bg-gray-700 rounded-round text-xs font-extrabold text-white cursor-pointer transition-all hover:bg-user-secondary-dark flex items-center justify-center gap-1.5 w-full md:w-auto">
            Edit profile →
          </button>
        </div>
        <div className="pb-3.5 mb-3.5 border-b border-user-border-light">
          <div className="text-xs font-extrabold text-user-warning mb-1">Citizen</div>
          <div className="text-sm font-bold text-user-text">{userData?.fullName || currentUser?.displayName || 'N/A'}</div>
        </div>
        <div className="pb-3.5 mb-3.5 border-b border-user-border-light">
          <div className="text-xs font-extrabold text-user-warning mb-1">Member since</div>
          <div className="text-sm font-bold text-user-text">{createdAt}</div>
        </div>
        <div>
          <div className="text-xs font-extrabold text-user-warning mb-1">GN division</div>
          <div className="text-sm font-bold text-user-text">{gnDivLabel}</div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border-2 border-user-error">
        <div className="flex items-center gap-2 mb-1.5">
          <Icon d={IC.alertTriangle} size={18} color="#c0392b" />
          <span className="text-sm md:text-sm font-black text-user-error">Danger Zone</span>
        </div>
        <p className="text-xs md:text-xs font-semibold text-user-error mb-5">These actions are permanent and cannot be undone</p>

        <div className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-row'} justify-between items-start pb-5 mb-5 border-b border-user-border-light`}>
          <div>
            <div className="text-sm md:text-sm font-extrabold text-user-text mb-1">Sign Out of All Devices</div>
            <div className="text-xs md:text-xs font-semibold text-user-text-lighter">Immediately ends all active sessions across every device.</div>
          </div>
          <button onClick={handleSignOutEverywhere} disabled={signOutLoading} className="py-2.5 px-5 bg-user-error-light border border-user-error rounded-round text-xs font-extrabold text-user-error cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:bg-user-error/20 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto">
            {signOutLoading ? 'Signing out…' : <><Icon d={IC.logout} size={14} color="#c0392b" /> Sign Out everywhere</>}
          </button>
        </div>

        <div className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-row'} justify-between items-start`}>
          <div>
            <div className="text-sm md:text-sm font-extrabold text-user-text mb-1">Delete My Account</div>
            <div className="text-xs md:text-xs font-semibold text-user-text-lighter">Permanently deletes your account and all data. This requires GN Officer approval and cannot be reversed.</div>
          </div>
          <button onClick={() => setShowDeleteConfirm(true)} className="py-2.5 px-5 bg-user-error-light border border-user-error rounded-round text-xs font-extrabold text-user-error cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:bg-user-error/20 w-full md:w-auto">
            <Icon d={IC.trash} size={14} color="#c0392b" /> Request Deletion
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
            <h2 className="text-lg md:text-lg font-black text-user-text text-center mb-2">Request Account Deletion?</h2>
            <p className="text-sm md:text-sm text-user-text-lighter font-semibold text-center leading-relaxed mb-5">
              This will submit a deletion request to your GN Officer.<br />Your account will remain active until approved.<br />
              <strong className="text-user-error">This cannot be undone.</strong>
            </p>
            <p className="text-xs md:text-xs font-bold text-gray-500 mb-2">Type <strong className="text-user-error">DELETE</strong> to confirm:</p>
            <input 
              type="text" value={deleteInput} onChange={e => setDeleteInput(e.target.value)} 
              placeholder="Type DELETE here" 
              className="w-full py-3.5 px-4 rounded-lg border border-user-border text-sm font-bold text-user-text text-center bg-user-secondary-light outline-none focus:border-user-primary mb-5"
              style={{ letterSpacing: deleteInput === 'DELETE' ? '2px' : '0' }}
            />
            <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-row'}`}>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }} className="flex-1 py-3 rounded-round border border-user-border bg-white text-sm font-extrabold text-gray-500 cursor-pointer">Cancel</button>
              <button onClick={handleRequestDeletion} disabled={deleteInput !== 'DELETE' || deleting} className={`flex-1 py-3 rounded-round border-none text-sm font-extrabold text-white cursor-pointer transition-all ${
                deleteInput === 'DELETE' ? 'bg-user-error hover:bg-red-700' : 'bg-user-error/50 cursor-not-allowed'
              }`}>
                {deleting ? 'Submitting…' : 'Request Deletion'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// MAIN SETTINGS COMPONENT
const Settings = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768); 

  // SEARCH STATE
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // LANGUAGE STATE
  const [currentLanguage, setCurrentLanguage] = useState('en');
  
  // PROFILE DROPDOWN STATE
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('language');
  const [settings, setSettings] = useState({
    language: 'en', theme: 'light', textSize: 'normal',
    notifReminders: true, notifUpdates: false, notifAnnouncements: true,
    deliveryEmail: true, deliveryBrowser: true, deliverySMS: false,
  });
  const [showToast, setShowToast] = useState(false);

  // Handle language change
  const handleLanguageChange = (langCode) => {
    setCurrentLanguage(langCode);
    console.log('Language changed to:', langCode);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) setUserData(snap.data());
        } catch (e) { console.warn(e.message); }
      } else {
        navigate('/login');
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Click outside to close search results and profile menu
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSearchResults(false);
      setShowProfileMenu(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  
  // Load saved settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        applySettings(parsed);
      } catch (e) { }
    }
  }, []);

  // Update setting function
  const updateSetting = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    applySettings(next);
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
    { id: 'language', icon: <Icon d={IC.globe} size={16} color="#B46A02" />, label: 'Language' },
    { id: 'appearance', icon: <Icon d={IC.palette} size={16} color="#B46A02" />, label: 'Appearance' },
    { id: 'notif', icon: <Icon d={IC.bell} size={16} color="#B46A02" />, label: 'Notifications' },
    { id: 'security', icon: <Icon d={IC.shield} size={16} color="#B46A02" />, label: 'Privacy & Security' },
    { id: 'account', icon: <Icon d={IC.profile} size={16} color="#B46A02" />, label: 'Account' },
  ];

  return (
    <div className="user-module min-h-screen flex flex-col font-sans bg-user-background">
      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <DesktopSidebar activePage="settings" navigate={navigate} onLogout={handleLogout} />

        {/* Mobile Sidebar Overlay */}
        <MobileSidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          activePage="settings"
          navigate={navigate}
          onLogout={handleLogout}
        />

        {/* Main Column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Desktop Topbar */}
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
          />

          {/* Mobile Topbar */}
          <MobileTopbar 
            chipName={chipName}
            onMenuClick={() => setMobileMenuOpen(true)}
            navigate={navigate}
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
          />

          {/* Mobile Search Bar - NOT STICKY */}
          <div className="md:hidden pt-3 px-3.5 relative">
            <div className="flex items-center gap-2.5 bg-white border border-user-border rounded-3xl px-4 py-2.5">
              <Icon d={IC.search} size={16} color="#aaa" />
              <input
                type="text"
                placeholder="Search for a page..."
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
            />
          </div>

          {/* Content Area */}
          <div className="p-6 md:p-7 flex-1">
            <h1 className="text-2xl md:text-3xl font-black text-user-text tracking-tight mb-1">Settings</h1>
            <p className="text-sm font-semibold text-user-text-lighter mb-6">Manage your account preferences and accessibility options</p>

            {/* Horizontal tabs */}
            <div className="flex border-b-2 border-user-border-light mb-7 overflow-x-auto scrollbar-hide">
              {TABS.map(t => (
                <HTab key={t.id} icon={t.icon} label={t.label} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />
              ))}
            </div>

            {/* LANGUAGE */}
            {activeTab === 'language' && (
              <ContentCard>
                <div className="text-sm font-extrabold text-user-secondary mb-4">Portal Language</div>
                <RadioOption selected={settings.language === 'si'} onClick={() => updateSetting('language', 'si')} label="Sinhala" sub="Use the system in Sinhala" />
                <RadioOption selected={settings.language === 'ta'} onClick={() => updateSetting('language', 'ta')} label="Tamil" sub="Use the system in Tamil" />
                <RadioOption selected={settings.language === 'en'} onClick={() => updateSetting('language', 'en')} label="English" sub="Use the system in English" />
              </ContentCard>
            )}

            {/* APPEARANCE */}
            {activeTab === 'appearance' && (
              <div className="flex flex-col gap-6">
                <ContentCard>
                  <div className="text-sm font-extrabold text-user-secondary mb-4">Theme</div>
                  <RadioOption selected={settings.theme === 'light'} onClick={() => updateSetting('theme', 'light')} label={<><Icon d={IC.sun} size={16} color="#f59e0b" /> Light Mode</>} sub="Bright and clean interface — default" />
                  <RadioOption selected={settings.theme === 'dark'} onClick={() => updateSetting('theme', 'dark')} label={<><Icon d={IC.moon} size={16} color="#8b5cf6" /> Dark Mode</>} sub="Dark background, easy on the eyes at night" />
                </ContentCard>

                <ContentCard>
                  <div className="text-sm font-extrabold text-user-secondary mb-4">Text Size</div>
                  <RadioOption selected={settings.textSize === 'small'} onClick={() => updateSetting('textSize', 'small')} label="Small" sub="Compact text — 14px" />
                  <RadioOption selected={settings.textSize === 'normal'} onClick={() => updateSetting('textSize', 'normal')} label="Normal" sub="Default text size — 16px" />
                  <RadioOption selected={settings.textSize === 'large'} onClick={() => updateSetting('textSize', 'large')} label="Large" sub="Larger text for better readability — 18px" />
                </ContentCard>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === 'notif' && (
              <ContentCard>
                <div className="text-sm font-extrabold text-user-secondary mb-5">Notifications</div>
                <div className="bg-white rounded-xl p-5 mb-4 shadow-sm">
                  <div className="text-sm font-extrabold text-user-text mb-4">Updates and Announcements</div>
                  {[
                    { key: 'notifReminders', label: 'Appointment reminders', sub: 'Get notified 24 hours before your GN meeting' },
                    { key: 'notifUpdates', label: 'Appointment updates', sub: 'Instant alerts when your appointments are processed' },
                    { key: 'notifAnnouncements', label: 'New announcements', sub: 'Important notices and events' },
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
                  <div className="text-sm font-extrabold text-user-text mb-4">Delivery Methods</div>
                  <div className="flex flex-wrap gap-6">
                    {[
                      { key: 'deliveryEmail', label: 'Email notifications' },
                      { key: 'deliveryBrowser', label: 'Browser Push notifications' },
                      { key: 'deliverySMS', label: 'SMS notifications (message rates may apply)' },
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
            {activeTab === 'security' && <SecurityTab currentUser={currentUser} userData={userData} db={db} />}

            {/* ACCOUNT */}
            {activeTab === 'account' && <AccountTab currentUser={currentUser} userData={userData} navigate={navigate} />}

          </div>
        </div>
      </div>

      <footer className="bg-[#6A2301] text-white text-center py-3 px-4 text-sm font-semibold">
        © 2026 Smart Grama Sewa. All rights reserved.
      </footer>

      <Toast show={showToast} />
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .rounded-round { border-radius: 999px; }

        /* Dark Mode Styles - Applied to entire page */
        .dark {
          --bg-page: #121826;
          --bg-card: #1e293b;
          --bg-sidebar: #1a2332;
          --bg-topbar: #1a2332;
          --bg-surface: #2d3a4f;
          --text-main: #f1f5f9;
          --text-sub: #94a3b8;
          --border: #334155;
        }

        /* Apply dark mode to entire page */
        .dark body,
        .dark .user-module,
        .dark .bg-user-background {
          background-color: #121826 !important;
        }

        .dark .bg-white,
        .dark .bg-user-surface {
          background-color: #1e293b !important;
        }

        .dark .text-user-text,
        .dark .text-user-text-light,
        .dark .text-user-text-lighter,
        .dark h1, .dark h2, .dark h3, .dark p, .dark span, .dark div:not([class*="bg-"]) {
          color: #f1f5f9 !important;
        }

        .dark .border-user-border,
        .dark .border-user-border-light {
          border-color: #334155 !important;
        }

        .dark .bg-user-secondary-light,
        .dark .bg-user-secondary-light input {
          background-color: #2d3a4f !important;
        }

        .dark input,
        .dark textarea,
        .dark select {
          background-color: #2d3a4f !important;
          border-color: #334155 !important;
          color: #f1f5f9 !important;
        }

        .dark input::placeholder,
        .dark textarea::placeholder {
          color: #64748b !important;
        }

        .dark input:focus,
        .dark textarea:focus,
        .dark select:focus {
          border-color: #F5C400 !important;
          outline: none !important;
        }

        /* Dark mode scrollbar */
        .dark ::-webkit-scrollbar-track {
          background: #1e293b;
        }

        .dark ::-webkit-scrollbar-thumb {
          background: #475569;
        }

        .dark ::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }

        /* Dark mode buttons */
        .dark .bg-user-primary {
          background-color: #F5C400 !important;
          color: #1e1200 !important;
        }

        .dark .bg-user-secondary {
          background-color: #2d3a4f !important;
          color: #f1f5f9 !important;
        }

        .dark .bg-user-error-light {
          background-color: #3a1a1a !important;
        }

        .dark .bg-user-success-light {
          background-color: #1a3a2a !important;
        }

        .dark .bg-user-warning-light {
          background-color: #3a2a10 !important;
        }

        /* Text Size - Applied to entire page */
        html[data-textsize="small"] {
          font-size: 14px;
        }
        
        html[data-textsize="normal"] {
          font-size: 16px;
        }
        
        html[data-textsize="large"] {
          font-size: 18px;
        }

        /* Smooth transitions */
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