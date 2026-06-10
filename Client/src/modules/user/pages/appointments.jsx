import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { PageLoadingSkeleton, AppointmentsListSkeleton } from '../components/skeleton';
import LanguageSwitcher from '../components/languageSwitcher';

// Icons
const Icon = ({ d, size = 20, color = 'currentColor', sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const IC = {
  dashboard:    'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  announce:     'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  appts:        'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2',
  forms:        'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  ai:           'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  profile:      'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  settings:     'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
  logout:       'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
  search:       'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  bell:         'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  plus:         'M12 5v14M5 12h14',
  calendar:     'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  clock:        'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0',
  location:     'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 10a1 1 0 100-2 1 1 0 000 2z',
  doc:          'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6',
  check:        'M20 6L9 17l-5-5',
  chevR:        'M9 18l6-6-6-6',
  chevL:        'M15 18l-6-6 6-6',
  chevDown:     'M6 9l6 6 6-6',
  chevUp:       'M18 15l-6-6-6 6',
  info:         'M12 2a10 10 0 100 20A10 10 0 0012 2z M12 8v4 M12 16h.01',
  x:            'M18 6L6 18M6 6l12 12',
  menu:         'M3 6h18M3 12h18M3 18h18',
  close:        'M6 18L18 6M6 6l12 12',
  note:         'M12 4h8a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h8z M16 8v2M8 8v2M12 12v2M8 12v2M12 16v2M8 16v2',
  message:      'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  edit:         'M17 3l4 4-7 7H10v-4l7-7z M4 20h16',
  details:      'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  success:      'M20 6L9 17l-5-5',
  warning:      'M12 9v4 M12 17h.01 M12 2a10 10 0 100 20 10 10 0 000-20z',
  error:        'M12 8v4 M12 16h.01 M12 2a10 10 0 100 20 10 10 0 000-20z',
  sun:          'M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M5.64 17.66l1.41-1.41 M16.95 6.05l1.41-1.41 M12 6a6 6 0 100 12 6 6 0 000-12z',
  bolt:         'M13 10V3L4 14h7v7l9-11h-7z',
  wave:         'M2 12c3.5-4 8.5-4 12 0s8.5 4 12 0 M4 16c3-3 9-3 12 0s9 3 12 0',
  star:         'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  inbox:        'M22 12h-6l-2 3h-4l-2-3H2 M2 5v14a2 2 0 002 2h16a2 2 0 002-2V5a2 2 0 00-2-2H4a2 2 0 00-2 2z',
  unread:       'M21 12a9 9 0 11-9-9 M21 3v6h-6 M3 3l18 18',
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

// Service categories
const SERVICE_CATS = [
  {
    key: 'personal', label: 'Personal Documents', services: [
      { id: 'residence', name: 'Residence/Character Certificate', desc: 'Proof of residency for official and legal purposes.' },
      { id: 'nic', name: 'National Identity Card (NIC)', desc: 'Apply for new or duplicate NIC documents.' },
      { id: 'death', name: 'Death Report', desc: 'Formal report for legal registration of passing.' },
      { id: 'birth', name: 'Late Birth Registration', desc: 'Registering births after the standard grace period.' },
    ]
  },
  {
    key: 'property', label: 'Home & Property', services: [
      { id: 'land', name: 'Land Ownership Assessment', desc: 'For proving land ownership.' },
      { id: 'valuation', name: 'Valuation Certificate', desc: 'For property valuation purposes.' },
      { id: 'water', name: 'Electricity / Water Connection', desc: 'GN recommendation for utility connections.' },
      { id: 'crown', name: 'Crown Land Matters', desc: 'Report unauthorized residents or other matters.' },
    ]
  },
  {
    key: 'permits', label: 'Permits & Approvals', services: [
      { id: 'tree', name: 'Jack Tree Cutting Permit', desc: '1 tree: 1 day. Multiple trees: 3 days.' },
      { id: 'timber', name: 'Timber Transport Permit', desc: 'GN recommends to Divisional Secretary.' },
      { id: 'animal', name: 'Animal Transport Permit', desc: 'GN recommends to Divisional Secretary.' },
      { id: 'mining', name: 'Stone / Sand Mining Permit', desc: 'GN recommends to Divisional Secretary.' },
    ]
  },
  {
    key: 'business', label: 'Livelihood & Business', services: [
      { id: 'income', name: 'Income Certificate Recommendation', desc: 'GN recommends to Divisional Secretary.' },
      { id: 'biz', name: 'Business Registration', desc: 'GN recommends to Divisional Secretary.' },
      { id: 'gun', name: 'Gun License Recommendation', desc: 'GN recommends to Divisional Secretary.' },
    ]
  },
  {
    key: 'community', label: 'Community Support', services: [
      { id: 'welfare', name: 'Public Aid / Welfare Assistance', desc: 'GN recommends your application.' },
      { id: 'president', name: 'Presidential Fund Assistance', desc: 'GN recommends to Divisional Secretary.' },
      { id: 'scholar', name: 'Scholarship Application', desc: 'GN recommends to Divisional Secretary.' },
    ]
  },
  {
    key: 'disputes', label: 'Complaints & Disputes', services: [
      { id: 'complaint', name: 'Complaint Report', desc: 'This year: 1 day. Older: 3 days.' },
      { id: 'urgent', name: 'Urgent Report', desc: 'Emergency to DS: 6 hours. Detailed: 3 days.' },
      { id: 'dispute', name: 'Dispute Resolution', desc: 'GN helps settle community disputes.' },
    ]
  },
];

// NavItem for sidebar
const NavItem = ({ iconPath, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-none cursor-pointer transition-all duration-150 text-left mb-0.5 ${
    active 
      ? 'bg-user-background text-white font-extrabold shadow-md' 
      : 'bg-transparent text-gray-700 font-semibold hover:bg-yellow-100'
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

// Desktop Topbar
const DesktopTopbar = ({ chipName, searchQuery, setSearchQuery, showResults, setShowResults, navigate, currentLanguage, onLanguageChange, showProfileMenu, setShowProfileMenu, handleLogout, userData, currentUser }) => (
  <div className="desktop-topbar h-16 bg-white border-b border-user-border-light flex items-center px-7 gap-3.5 sticky top-0 z-40 shadow-sm">
    <div className="flex-1 max-w-[400px] relative">
      <div className="flex items-center gap-2.5 bg-user-secondary-light border border-user-border rounded-round px-4 py-2 transition-colors hover:border-user-primary">
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
            <p className="text-xs text-user-text-lighter mt-1">{currentUser?.email}</p>
          </div>
          <button onClick={() => { navigate('/profile'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-user-text hover:bg-user-background transition-colors">
            <Icon d={IC.profile} size={16} color="#B46A02" /> My Profile
          </button>
          <button onClick={() => { navigate('/settings'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-user-text hover:bg-user-background transition-colors">
            <Icon d={IC.settings} size={16} color="#B46A02" /> Settings
          </button>
          <div className="border-t border-user-border-light my-1"></div>
          <button onClick={() => { handleLogout(); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors">
            <Icon d={IC.logout} size={16} color="#ef4444" /> Sign Out
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

// Step Indicator 
const StepBar = ({ step }) => {
  const steps = ['Select Service', 'Date & Time', 'Review & Submit'];
  return (
    <div className="flex items-start justify-center gap-0 mb-7">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <React.Fragment key={n}>
            <div className="flex flex-col items-center w-[110px]">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${active ? 'bg-user-text border-3 border-user-text' : done ? 'bg-user-secondary' : 'bg-gray-300'}`}>
                {done ? (
                  <Icon d={IC.check} size={18} color="#fff" sw={2.5} />
                ) : (
                  <span className={`text-base font-black ${active ? 'text-white' : 'text-gray-500'}`}>{n}</span>
                )}
              </div>
              <span className={`text-xs font-semibold mt-1.5 text-center ${active ? 'text-user-text font-extrabold' : 'text-gray-500'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mt-5 ${done ? 'bg-user-secondary' : 'bg-gray-300'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Brown pill button 
const BrownBtn = ({ onClick, children, disabled }) => (
  <button onClick={onClick} disabled={disabled} className={`flex items-center justify-center gap-2 py-3.5 px-7 rounded-round font-extrabold text-white transition-all duration-150 ${disabled ? 'bg-user-secondary/50 cursor-not-allowed' : 'bg-user-secondary hover:bg-user-secondary-dark cursor-pointer'}`}>
    {children}
  </button>
);

// Yellow pill button 
const YellowBtn = ({ onClick, children, disabled }) => (
  <button onClick={onClick} disabled={disabled} className={`flex items-center justify-center gap-2 py-3.5 px-7 rounded-round font-extrabold text-user-text transition-all duration-150 ${disabled ? 'bg-user-primary/50 cursor-not-allowed' : 'bg-user-primary hover:bg-user-primary-dark cursor-pointer'}`}>
    {children}
  </button>
);

// SCREEN — MY APPOINTMENTS LIST
const MONTHS_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES_SHORT = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Details Modal
const DetailsModal = ({ appt, onClose, onCancel, cancelling }) => {
  if (!appt) return null;

  const statusColor = {
    Confirmed: { bg: '#e6f9ee', text: '#1a7a3a', border: '#7ec07e' },
    Pending: { bg: '#fff3dc', text: '#b45309', border: '#f0c060' },
    Completed: { bg: '#e8f0fb', text: '#1a4a8a', border: '#90b4e8' },
    Cancelled: { bg: '#f0f0f0', text: '#666', border: '#ccc' },
  };
  const sc = statusColor[appt.status] || statusColor.Pending;
  const canCancel = appt.status === 'Pending' || appt.status === 'Confirmed';

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/45 z-[100] animate-fade-in" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-[520px] bg-user-surface rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="bg-user-secondary-dark p-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-extrabold text-yellow-200 uppercase tracking-wider mb-0.5">Appointment Details</div>
            <div className="text-base font-black text-white">{appt.title}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/15 border-none cursor-pointer text-white flex items-center justify-center text-lg font-bold">×</button>
        </div>

        {/* Body */}
        <div className="p-6 bg-user-primary-light">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-sm font-bold text-user-text-lighter">Status:</span>
            <span className="px-3.5 py-1 rounded-full text-xs font-extrabold border"
              style={{ backgroundColor: sc.bg, color: sc.text, borderColor: sc.border }}>
              {appt.status}
            </span>
          </div>

          {[
            { icon: <Icon d={IC.calendar} size={16} color="#B46A02" />, label: 'Date', value: `${DAY_NAMES_SHORT[new Date(appt.date).getDay()]}, ${appt.day} ${MONTHS_FULL[parseInt(appt.mon_num) - 1] || appt.mon} ${appt.year}` },
            { icon: <Icon d={IC.clock} size={16} color="#B46A02" />, label: 'Time', value: appt.time },
            { icon: <Icon d={IC.doc} size={16} color="#B46A02" />, label: 'Service', value: appt.title },
            { icon: <Icon d={IC.location} size={16} color="#B46A02" />, label: 'Location', value: appt.location || 'Grama Niladhari Office' },
          ].map(row => (
            <div key={row.label} className="flex items-start gap-3 py-2.5 border-b border-user-border">
              <span className="flex-shrink-0">{row.icon}</span>
              <div>
                <div className="text-[11px] font-extrabold text-user-warning uppercase tracking-wider mb-0.5">{row.label}</div>
                <div className="text-sm font-bold text-user-text">{row.value || '—'}</div>
              </div>
            </div>
          ))}

          {/* Notes */}
          {appt.notes && (
            <div className="flex items-start gap-3 py-2.5 border-b border-user-border">
              <Icon d={IC.message} size={16} color="#B46A02" />
              <div>
                <div className="text-[11px] font-extrabold text-user-warning uppercase tracking-wider mb-0.5">Notes</div>
                <div className="text-sm font-semibold text-user-text-lighter italic">"{appt.notes}"</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-user-surface flex justify-between items-center border-t border-user-border">
          <button onClick={onClose} className="px-6 py-2.5 rounded-round border border-user-border bg-user-surface text-sm font-bold text-user-text-lighter cursor-pointer transition-all hover:border-user-warning">
            Close
          </button>
          {canCancel && (
            <button onClick={onCancel} disabled={cancelling}
              className={`px-6 py-2.5 rounded-round border border-red-300 bg-user-surface text-sm font-extrabold text-red-500 cursor-pointer flex items-center gap-1.5 transition-all hover:bg-red-50 ${cancelling ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {cancelling ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <Icon d={IC.x} size={14} color="#ef4444" sw={2} />
                  Cancel Appointment
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

// Appointments List
const AppointmentsList = ({ currentUser, refreshKey = 0, onBook }) => {
  const [tab, setTab] = useState('All');
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selAppt, setSelAppt] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  const tabs = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    const fetchAppts = async () => {
      setLoading(true);
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000));
        const q = query(collection(db, 'appointments'), where('uid', '==', currentUser.uid));
        const snap = await Promise.race([getDocs(q), timeoutPromise]);

        const list = snap.docs.map(d => {
          const data = d.data();
          const [y, m, day] = (data.date || '').split('-').map(Number);
          const dateObj = new Date(y, m - 1, day);
          return {
            id: d.id,
            day: day || '--',
            mon: MONTHS_SHORT[(m - 1)] || '---',
            mon_num: m,
            year: y,
            dow: isNaN(dateObj) ? '' : DAY_NAMES_SHORT[dateObj.getDay()],
            time: data.slot || '',
            title: data.service || 'Appointment',
            status: data.status || 'Pending',
            date: data.date || '',
            notes: data.notes || '',
          };
        });
        list.sort((a, b) => b.date.localeCompare(a.date));
        setAppts(list);
      } catch (e) {
        console.error('Fetch appointments error:', e.code, e.message);
        setAppts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAppts();
  }, [currentUser, refreshKey]);

  const handleCancel = async () => {
    if (!selAppt) return;
    setCancelling(true);
    try {
      await updateDoc(doc(db, 'appointments', selAppt.id), { status: 'Cancelled' });
      setAppts(prev => prev.map(a => a.id === selAppt.id ? { ...a, status: 'Cancelled' } : a));
      setSelAppt(prev => ({ ...prev, status: 'Cancelled' }));
    } catch (e) {
      console.error('Cancel error:', e.message);
      alert('Could not cancel appointment. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const filtered = tab === 'All' ? appts : appts.filter(a => a.status === tab);
  const pendingCount = appts.filter(a => a.status === 'Pending').length;
  const confirmedCount = appts.filter(a => a.status === 'Confirmed').length;

  const statusColor = {
    Confirmed: { bg: '#e6f9ee', text: '#1a7a3a', border: '#7ec07e' },
    Pending: { bg: '#fff3dc', text: '#b45309', border: '#f0c060' },
    Completed: { bg: '#e8f0fb', text: '#1a4a8a', border: '#90b4e8' },
    Cancelled: { bg: '#f0f0f0', text: '#666', border: '#ccc' },
  };
  const accentColor = {
    Confirmed: '#22c55e', Pending: '#f59e0b',
    Completed: '#3b82f6', Cancelled: '#ccc',
  };

  return (
    <>
      {selAppt && <DetailsModal appt={selAppt} onClose={() => setSelAppt(null)} onCancel={handleCancel} cancelling={cancelling} />}

      <div className="p-7 flex-1">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-user-text tracking-tight mb-1">My Appointments</h1>
            <p className="text-sm font-semibold text-user-text-lighter">Manage your scheduled meetings with Grama Niladhari officers.</p>
          </div>
          <button onClick={onBook} className="flex items-center gap-2 py-3 px-5 bg-user-primary border-none rounded-round text-sm font-extrabold text-user-text cursor-pointer transition-all shadow-md hover:bg-user-primary-dark">
            <Icon d={IC.plus} size={16} color="#3d2a00" sw={2.5} /> Book New Appointment
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-7">
          <div className="bg-[#f0a060] rounded-xl p-5">
            <div className="text-4xl font-black text-white leading-tight">{pendingCount}</div>
            <div className="text-base font-extrabold text-white mt-1.5">Pending Appointments</div>
            <div className="text-xs font-semibold text-white/80 mt-0.5">Awaiting GN Officer approval</div>
          </div>
          <div className="bg-[#60b880] rounded-xl p-5">
            <div className="text-4xl font-black text-white leading-tight">{confirmedCount}</div>
            <div className="text-base font-extrabold text-white mt-1.5">Confirmed Appointments</div>
            <div className="text-xs font-semibold text-white/80 mt-0.5">Ready for your visit</div>
          </div>
        </div>

        <div className={`flex gap-5 md:gap-7 mb-5 border-b-2 border-user-border-light overflow-x-auto ${isMobile ? 'flex-nowrap' : 'flex-wrap'}`}>
          {tabs.map(t => {
            const isActive = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`py-2.5 border-none bg-transparent text-base md:text-base font-semibold cursor-pointer transition-all whitespace-nowrap flex-shrink-0 ${isActive ? 'text-user-text font-extrabold border-b-3 border-user-primary' : 'text-gray-400 hover:text-user-text'}`}
              >
                {t}
              </button>
            );
          })}
        </div>

        {isMobile && (
          <div className="text-center -mt-2 mb-4 text-[10px] text-gray-300 flex items-center justify-center gap-1.5">
            <Icon d={IC.chevL} size={10} color="#ccc" />
            <span>scroll</span>
            <Icon d={IC.chevR} size={10} color="#ccc" />
          </div>
        )}

        {loading && <AppointmentsListSkeleton />}

        {!loading && (
          <div className="flex flex-col gap-3.5">
            {filtered.map(a => (
              <div key={a.id} className={`bg-white border border-user-border rounded-xl p-5 transition-all ${a.status === 'Cancelled' ? 'opacity-65' : ''}`} style={{ borderLeftWidth: '8px', borderLeftColor: accentColor[a.status] || '#ccc' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-4xl font-black text-user-text leading-tight">{a.day}</div>
                    <div className="text-sm font-extrabold text-warning uppercase tracking-wider">{a.mon}</div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-sm font-extrabold border`} style={{ backgroundColor: (statusColor[a.status] || statusColor.Pending).bg, color: (statusColor[a.status] || statusColor.Pending).text, borderColor: (statusColor[a.status] || statusColor.Pending).border }}>
                    {a.status}
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-500 mb-2.5">{a.dow} - {a.time}</div>
                <div className="text-base font-extrabold text-user-text mb-5">{a.title}</div>
                <div className="flex gap-2.5 flex-wrap">
                  <button onClick={() => setSelAppt(a)} className="flex-1 min-w-[100px] py-2.5 px-4 rounded-round bg-blue-50 border border-blue-200 text-blue-800 text-sm font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:bg-blue-100">
                    <Icon d={IC.details} size={14} color="#2c4c7c" /> Details
                  </button>
                  {(a.status === 'Pending' || a.status === 'Confirmed') && (
                    <button onClick={() => setSelAppt(a)} className="flex-1 min-w-[100px] py-2.5 px-4 rounded-round bg-red-50 border border-red-200 text-red-700 text-sm font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:bg-red-100">
                      <Icon d={IC.x} size={14} color="#bc3f2e" sw={2} /> Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="bg-white border border-user-border rounded-xl text-center py-12 px-6">
                <div className="flex justify-center mb-4">
                  <Icon d={IC.calendar} size={48} color="#ccc" strokeWidth={1.2} />
                </div>
                <div className="text-base font-extrabold text-user-text mb-2">{tab === 'All' ? 'No appointments yet' : `No ${tab.toLowerCase()} appointments`}</div>
                <div className="text-sm font-semibold text-gray-400 mb-5">{tab === 'All' ? 'Book your first appointment with your GN Officer.' : `You have no ${tab.toLowerCase()} appointments at the moment.`}</div>
                {tab === 'All' && (
                  <button onClick={onBook} className="py-2.5 px-5 bg-user-primary border-none rounded-round text-sm font-extrabold text-user-text cursor-pointer flex items-center justify-center gap-2 mx-auto">
                    <Icon d={IC.plus} size={14} color="#3d2a00" sw={2.5} /> Book New Appointment
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// BOOK STEP 1: SELECT SERVICE
const BookStep1 = ({ booking, setBooking, onNext, onCancel }) => {
  const [openCats, setOpenCats] = useState({ personal: true });
  const [notes, setNotes] = useState(booking.notes || '');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleCat = key => setOpenCats(p => ({ ...p, [key]: !p[key] }));

  const selectService = (svc) => {
    setBooking(p => ({ ...p, service: svc }));
  };

  return (
    <div className="p-7 flex-1">
      <h1 className="text-2xl md:text-3xl font-black text-user-text mb-5">Book an appointment</h1>
      <StepBar step={1} />

      <div className="bg-user-primary-light border border-user-border rounded-xl p-6 md:p-7 mb-4">
        <h2 className="text-lg font-extrabold text-user-text-light mb-5">What is this appointment for?</h2>

        {SERVICE_CATS.map(cat => (
          <div key={cat.key} className="mb-2.5">
            {/* Category Header Button */}
            <button 
              onClick={() => toggleCat(cat.key)} 
              className={`w-full flex items-center gap-2.5 p-3.5 border border-gray-200 dark:border-gray-600
                ${openCats[cat.key] ? 'rounded-t-xl' : 'rounded-xl'}
                bg-user-secondary
                cursor-pointer transition-all hover:bg-user-background`}
            >
              <Icon 
                d={openCats[cat.key] ? IC.chevDown : IC.chevR} 
                size={16} 
                color="currentColor" 
              />
              <span className="text-sm font-extrabold text-user-text">
                {cat.label}
              </span>
            </button>

            {/* Service Items */}
            {openCats[cat.key] && (
              <div className="border border-gray-200 dark:border-gray-600 border-t-0 rounded-b-xl overflow-hidden">                {cat.services.map((svc, i) => {
                  const selected = booking.service?.id === svc.id;
                  return (
                    <div 
                      key={svc.id} 
                      onClick={() => selectService(svc)} 
                      className={`p-4 cursor-pointer border-b border-gray-100 dark:border-gray-600 transition-all 
                        ${selected 
                          ? 'bg-yellow-100' 
                          : 'bg-user-secondary-light hover:bg-user-primary-light'
                        }`} 
                      style={{ 
                        borderLeft: selected ? '4px solid #F5C400' : '4px solid transparent' 
                      }}
                    >
                      <div className={`text-sm font-extrabold mb-0.5 
                        ${selected 
                          ? 'text-gray-700' 
                          : 'user-text-lighter'
                        }`}
                      >
                        {svc.name}
                      </div>
                      <div className={`text-xs font-semibold 
                        ${selected 
                          ? 'text-gray-600' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                      >
                        {svc.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* Selected Service Summary */}
        {booking.service && (
          <div className="mt-4 p-3.5 bg-gray-800 dark:bg-yellow-100 border border-yellow-400 dark:border-yellow-600 rounded-xl flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
              <Icon d={IC.check} size={14} color="#fff" sw={2.5} />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-extrabold text-yellow-700 dark:text-yellow-400 uppercase tracking-wider mb-0.5">
                Selected Service
              </div>
              <div className="text-sm font-black text-white dark:text-gray-800">
                {booking.service.name}
              </div>
            </div>
            <button 
              onClick={() => setBooking(p => ({ ...p, service: null }))} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 dark:bg-white border border-gray-200 dark:border-gray-600 rounded-round text-xs font-bold text-gray-300 dark:text-gray-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <Icon d={IC.x} size={12} color="#888" /> CHANGE
            </button>
          </div>
        )}
      </div>

      {/* Additional Notes */}
      <div className="bg-user-primary-light border border-user-border rounded-xl p-5 md:p-7 mb-6">
        <h2 className="text-base font-extrabold text-user-text-light mb-3">
          Additional notes (optional)
        </h2>
        <textarea 
          value={notes} 
          onChange={e => { 
            setNotes(e.target.value); 
            setBooking(p => ({ ...p, notes: e.target.value })); 
          }} 
          placeholder="Please provide any specific details or requirements for your request..." 
          rows={4} 
          className="w-full p-3 text-sm font-semibold text-white dark:text-zinc-500 bg-user-surface border border-gray-200 dark:border-gray-600 rounded-lg outline-none resize-vertical transition-colors focus:border-yellow-500 dark:focus:border-yellow-400" 
        />
      </div>

      {/* Buttons */}
      <div className={`flex justify-between gap-3 ${isMobile ? 'flex-col' : 'flex-row'}`}>
        <button 
          onClick={onCancel} 
          className={`flex items-center justify-center gap-2 py-3.5 px-7 rounded-round border-2 border-gray-300 dark:border-gray-600 bg-neutral-600 dark:bg-neutral-100 text-sm font-extrabold text-gray-200 dark:text-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700 ${isMobile ? 'w-full' : ''}`}
        >
          Cancel
        </button>
        <button 
          onClick={onNext} 
          disabled={!booking.service} 
          className={`flex items-center justify-center gap-2 py-3.5 px-7 rounded-round text-sm font-extrabold text-white transition-all ${!booking.service ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'bg-yellow-600 dark:bg-yellow-600 hover:bg-yellow-700 dark:hover:bg-yellow-500 cursor-pointer'} ${isMobile ? 'w-full' : ''}`}
        >
          Next → Pick a time & date
        </button>
      </div>
    </div>
  );
};

// BOOK STEP 2: DATE & TIME (HOURLY BREAKDOWN WITH 15-MINUTE SLOTS)
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Generate all time slots (9:00 AM to 3:45 PM, 15-minute intervals)
// GN work ends at 4:00 PM, so last appointment at 3:45 PM
const generateAllTimeSlots = () => {
  const slots = [];
  
  // 9:00 AM to 11:45 AM (Morning)
  for (let hour = 9; hour <= 11; hour++) {
    for (let minute of [0, 15, 30, 45]) {
      const timeStr = `${hour}:${minute.toString().padStart(2, '0')} AM`;
      slots.push(timeStr);
    }
  }
  
  // 12:00 PM to 12:45 PM (Noon)
  for (let minute of [0, 15, 30, 45]) {
    const timeStr = `12:${minute.toString().padStart(2, '0')} PM`;
    slots.push(timeStr);
  }
  
  // 1:00 PM to 3:45 PM (Afternoon)
  for (let hour = 1; hour <= 3; hour++) {
    for (let minute of [0, 15, 30, 45]) {
      const timeStr = `${hour}:${minute.toString().padStart(2, '0')} PM`;
      slots.push(timeStr);
    }
  }
  
  return slots; // 28 slots total
};

const ALL_TIME_SLOTS = generateAllTimeSlots();

// Group slots by hour for display
const groupSlotsByHour = (slots) => {
  const grouped = {};
  
  slots.forEach(slot => {
    // Extract hour number for grouping
    let hourNum = parseInt(slot.split(':')[0]);
    const isPM = slot.includes('PM');
    
    // Convert to 12-hour format for display
    let displayHour = hourNum;
    let period = isPM ? 'PM' : 'AM';
    
    // Special case for 12 PM
    if (hourNum === 12 && !isPM) {
      period = 'AM';
    }
    
    const hourKey = `${displayHour} ${period}`;
    
    if (!grouped[hourKey]) {
      grouped[hourKey] = [];
    }
    grouped[hourKey].push(slot);
  });
  
  // Sort hours in chronological order
  const hourOrder = ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM'];
  const sortedGrouped = {};
  hourOrder.forEach(hour => {
    if (grouped[hour]) {
      sortedGrouped[hour] = grouped[hour];
    }
  });
  
  return sortedGrouped;
};

const BookStep2 = ({ booking, setBooking, onNext, onBack }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selDay, setSelDay] = useState(booking.day || null);
  const [selSlot, setSelSlot] = useState(booking.slot || null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [expandedHours, setExpandedHours] = useState({
    '9 AM': true,
    '10 AM': true,
    '11 AM': true,
    '12 PM': true,
    '1 PM': true,
    '2 PM': true,
    '3 PM': true
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => { 
    const handleResize = () => setIsMobile(window.innerWidth <= 768); 
    window.addEventListener('resize', handleResize); 
    return () => window.removeEventListener('resize', handleResize); 
  }, []);

  // Fetch booked slots for the selected date
  const fetchBookedSlots = async (year, month, day) => {
    if (!year || month === null || !day) return;
    
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    setLoadingSlots(true);
    try {
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('date', '==', dateStr),
        where('status', 'in', ['Pending', 'Confirmed'])
      );
      const snapshot = await getDocs(appointmentsQuery);
      
      const booked = snapshot.docs.map(doc => doc.data().slot).filter(slot => slot);
      setBookedSlots(booked);
      
      // If current selected slot is now booked, clear it
      if (selSlot && booked.includes(selSlot)) {
        setSelSlot(null);
        setBooking(p => ({ ...p, slot: null }));
      }
    } catch (error) {
      console.error('Error fetching booked slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Fetch when selected date changes
  useEffect(() => {
    if (selDay !== null && viewMonth !== null && viewYear !== null) {
      fetchBookedSlots(viewYear, viewMonth, selDay);
    }
  }, [selDay, viewYear, viewMonth]);

  const toggleHour = (hour) => {
    setExpandedHours(prev => ({ ...prev, [hour]: !prev[hour] }));
  };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => { 
    if (viewMonth === 0) { 
      setViewYear(y => y - 1); 
      setViewMonth(11); 
    } else { 
      setViewMonth(m => m - 1); 
    } 
  };
  
  const nextMonth = () => { 
    if (viewMonth === 11) { 
      setViewYear(y => y + 1); 
      setViewMonth(0); 
    } else { 
      setViewMonth(m => m + 1); 
    } 
  };

  const isWeekend = (day) => { 
    const d = new Date(viewYear, viewMonth, day).getDay(); 
    return d === 0 || d === 6; 
  };
  
  const isPast = (day) => {
    const selectedDate = new Date(viewYear, viewMonth, day);
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return selectedDate < todayDate;
  };

  const pickDay = (day) => { 
    if (isWeekend(day) || isPast(day)) return; 
    setSelDay(day); 
    setSelSlot(null);
    setBooking(p => ({ ...p, day, month: viewMonth, year: viewYear, slot: null })); 
  };
  
  const pickSlot = (slot) => { 
    if (bookedSlots.includes(slot)) return; 
    setSelSlot(slot); 
    setBooking(p => ({ ...p, slot })); 
  };

  const selDateLabel = selDay ? `${DAY_NAMES[new Date(viewYear, viewMonth, selDay).getDay()]}, ${MONTHS[viewMonth]} ${selDay}, ${viewYear}` : 'No date selected';
  const isDateSelected = selDay !== null;
  
  // Group slots for display
  const groupedSlots = groupSlotsByHour(ALL_TIME_SLOTS);
  const availableSlotsCount = ALL_TIME_SLOTS.filter(slot => !bookedSlots.includes(slot)).length;

  return (
    <div className="p-4 md:p-7 flex-1">
      <h1 className="text-2xl md:text-3xl font-black text-user-text mb-5">Book an appointment</h1>
      <StepBar step={2} />

      <div className="bg-user-primary-light border border-user-border rounded-xl p-5 md:p-7 mb-4">
        <h2 className="text-lg font-extrabold text-user-text mb-5">When would you like to visit?</h2>

        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-5`}>
          {/* Calendar Section */}
          <div className="flex-1 border border-user-border rounded-xl p-4 md:p-5 bg-user-secondary-light">
            <div className="flex items-center gap-2 mb-4">
              <Icon d={IC.calendar} size={18} color="#B46A02" />
              <span className="text-sm font-extrabold text-user-text">Select Date</span>
            </div>
            <div className="flex items-center justify-between mb-3.5">
              <button onClick={prevMonth} className="w-8 h-8 rounded-full border border-user-border bg-white cursor-pointer flex items-center justify-center">
                <Icon d={IC.chevL} size={14} color="#888" />
              </button>
              <span className="ttext-sm font-extrabold text-user-text">{MONTHS[viewMonth]} {viewYear}</span>
              <button onClick={nextMonth} className="w-8 h-8 rounded-full border border-user-border bg-white cursor-pointer flex items-center justify-center">
                <Icon d={IC.chevR} size={14} color="#888" />
              </button>
            </div>
            
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-0.5 mb-2 text-center">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                <div key={day} className="text-[11px] font-extrabold text-gray-400 py-1">{day}</div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-0.5">
              {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
              {Array(daysInMonth).fill(null).map((_, i) => {
                const day = i + 1;
                const weekend = isWeekend(day);
                const past = isPast(day);
                const picked = selDay === day && viewMonth === booking.month && viewYear === booking.year;
                const disabled = weekend || past;
                return (
                  <div 
                    key={day} 
                    onClick={() => pickDay(day)} 
                    className={`w-8 h-8 rounded-full mx-auto my-0.5 flex items-center justify-center text-sm font-semibold transition-all ${
                      picked 
                        ? 'bg-user-primary text-user-text font-black shadow-sm' 
                        : disabled 
                          ? 'text-gray-300 cursor-not-allowed bg-gray-50 dark:bg-transparent' 
                          : 'text-user-text hover:bg-user-primary-light cursor-pointer'
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            
            {/* Weekend note */}
            <div className="mt-3 text-center text-[10px] text-gray-400 flex items-center justify-center gap-1">
              <Icon d={IC.calendar} size={10} color="#aaa" />
              <span>Weekends closed</span>
            </div>
          </div>

          {/* Time Slots Section */}
          <div className="flex-1 border border-user-border rounded-xl p-4 md:p-5 bg-user-secondary-light flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon d={IC.clock} size={18} color="#B46A02" />
                <span className="text-sm font-extrabold text-user-text">Select Time Slot</span>
              </div>
              {loadingSlots && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-user-primary border-t-transparent animate-spin" />
                  <span className="text-[10px] text-gray-400">Checking...</span>
                </div>
              )}
            </div>
            
            {!isDateSelected ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[280px] text-center">
                <Icon d={IC.calendar} size={48} color="#ccc" strokeWidth={1.2} />
                <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 mt-3">Select a date first</p>
              </div>
            ) : (
              <>
                {/* Summary bar */}
                <div className="mb-4 p-2.5 bg-user-surface rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon d={IC.info} size={14} color="#888" />
                    <span className="text-xs font-semibold text-user-text-lighter">
                      {availableSlotsCount} slots available today
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    15 min per appointment
                  </div>
                </div>

                {/* Hourly breakdown */}
                <div className="max-h-[400px] overflow-y-auto pr-1">
                  {Object.entries(groupedSlots).map(([hour, slots]) => {
                    const availableInHour = slots.filter(slot => !bookedSlots.includes(slot)).length;
                    const totalInHour = slots.length;
                    const isExpanded = expandedHours[hour];
                    
                    return (
                      <div key={hour} className="mb-3 border border-gray-100 rounded-lg overflow-hidden">
                        {/* Hour header */}
                        <button
                          onClick={() => toggleHour(hour)}
                          className="w-full flex items-center justify-between p-3 bg-user-secondary hover:bg-user-background transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Icon d={isExpanded ? IC.chevUp : IC.chevDown} size={14} color="#888" />
                            <span className="text-sm font-extrabold text-user-text">{hour}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${availableInHour === 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {availableInHour}/{totalInHour} available
                            </span>
                          </div>
                        </button>
                        
                        {/* Time slots grid */}
                        {isExpanded && (
                          <div className="p-3 bg-white">
                            <div className="grid grid-cols-2 gap-2">
                              {slots.map(slot => {
                                const isBooked = bookedSlots.includes(slot);
                                const isSelected = selSlot === slot;
                                return (
                                  <button
                                    key={slot}
                                    onClick={() => pickSlot(slot)}
                                    disabled={isBooked}
                                    className={`py-2.5 px-2 text-xs font-extrabold text-center rounded-lg transition-all ${
                                      isSelected
                                        ? 'bg-user-primary text-user-text'
                                        : isBooked
                                          ? 'bg-user-surface text-user-text-lighter border border-dashed border-user-border cursor-not-allowed'
                                          : 'border border-user-border bg-user-secondary-light text-user-text hover:bg-user-primary-light cursor-pointer'
                                    }`}
                                  >
                                    {slot}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 justify-center pt-3 mt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: '#F5C400' }} />
                    <span className="text-[10px] font-semibold text-gray-500">Selected</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded border border-user-border bg-white" />
                    <span className="text-[10px] font-semibold text-gray-500">Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded border border-dashed border-gray-300 bg-gray-100" />
                    <span className="text-[10px] font-semibold text-gray-500">Booked</span>
                  </div>
                </div>

                {/* Office hours note */}
                <div className="mt-3 p-2.5 bg-user-surface rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icon d={IC.info} size={12} color="#3b82f6" />
                    <span className="text-[10px] font-semibold text-user-text-lighter">
                      Office hours: 9:00 AM - 4:00 PM. Last appointment at 3:45 PM
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Selected Date Summary */}
        {isDateSelected && !loadingSlots && (
          <div className="mt-6 p-3 bg-user-primary-light border border-user-border rounded-lg flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-user-text">
              <Icon d={IC.info} size={16} color="#B46A02" /> 
              {selSlot ? 'Selected time:' : 'Please select a time slot'}
            </div>
            <div className="text-sm font-bold text-user-text bg-user-surface px-3 py-1.5 rounded-lg border border-user-border">
              {selDateLabel} {selSlot && <span className="text-user-primary ml-1">- {selSlot}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className={`flex justify-between gap-3 mt-4 ${isMobile ? 'flex-col' : 'flex-row'}`}>
        <BrownBtn onClick={onBack} isMobile={isMobile}>
          ← Back
        </BrownBtn>
        <BrownBtn 
          onClick={onNext} 
          disabled={!selDay || !selSlot} 
          isMobile={isMobile}
        >
          Continue →
        </BrownBtn>
      </div>
    </div>
  );
};

// BOOK STEP 3: REVIEW & SUBMIT
const BookStep3 = ({ booking, userData, currentUser, onBack, onSubmit, submitting }) => {
  const [isAgreed, setIsAgreed] = useState(false); 
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => { 
    const handleResize = () => setIsMobile(window.innerWidth <= 768); 
    handleResize();
    window.addEventListener('resize', handleResize); 
    return () => window.removeEventListener('resize', handleResize); 
  }, []);

  const dateStr = booking.day ? `${MONTHS[booking.month]} ${booking.day}, ${booking.year}` : '—';
  
  // Display just the selected time slot (no end time calculation needed)
  const timeStr = booking.slot ? booking.slot : '—';
  
  const nicMasked = userData?.nic 
    ? userData.nic.slice(0, 3) + 'XXXXXXXXX' + userData.nic.slice(-1)
    : 'XXXXXXXXXXXX';

  return (
    <div className="p-4 md:p-7 flex-1">
      <h1 className="text-2xl md:text-3xl font-black text-user-text mb-5">Book an appointment</h1>
      <StepBar step={3} />

      <div className="bg-user-primary-light border border-user-border rounded-xl p-5 md:p-7 mb-6">
        <h2 className="text-xl md:text-2xl font-black text-user-text mb-5">Review your request</h2>

        {/* Selected Service Banner */}
        <div className="bg-user-secondary rounded-xl p-4 md:p-3.5 mb-4">
          <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} items-start gap-3`}>
            <Icon d={IC.doc} size={isMobile ? 20 : 18} color="#f0d890" />
            <div>
              <div className="text-[10px] font-extrabold text-yellow-200 uppercase tracking-wider mb-1">
                Selected Service
              </div>
              <div className="text-base font-black text-white">
                {booking.service?.name || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-user-surface border border-user-border rounded-xl p-5 md:p-6">
          <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-6 md:gap-8`}>
            {/* Left Column - Appointment Details */}
            <div className="flex-1">
              <div className="text-[11px] font-extrabold text-user-text uppercase tracking-wider mb-3.5 flex items-center gap-2">
                <Icon d={IC.calendar} size={14} color="#B46A02" /> 
                Appointment Details
              </div>
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-8 h-8 rounded-full bg-user-primary-light flex items-center justify-center flex-shrink-0">
                    <Icon d={IC.calendar} size={16} color="#B46A02" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-user-text-lighter mb-0.5">Date</div>
                    <div className="text-sm md:text-base font-bold text-user-text">{dateStr}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-8 h-8 rounded-full bg-user-primary-light flex items-center justify-center flex-shrink-0">
                    <Icon d={IC.clock} size={16} color="#B46A02" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-user-text-lighter mb-0.5">Time</div>
                    <div className="text-sm md:text-base font-bold text-user-text">{timeStr}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-8 h-8 rounded-full bg-user-primary-light flex items-center justify-center flex-shrink-0">
                    <Icon d={IC.location} size={16} color="#B46A02" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-user-text-lighter mb-0.5">Location</div>
                    <div className="text-sm md:text-base font-bold text-user-text">
                      {userData?.dsDiv ? `Grama Niladhari Office, ${userData.dsDiv}` : 'Grama Niladhari Office'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            {!isMobile && <div className="w-px bg-yellow-200 mx-2" />}

            {/* Right Column - Applicant Information */}
            <div className="flex-1">
              <div className="text-[11px] font-extrabold text-user-text uppercase tracking-wider mb-3.5 flex items-center gap-2">
                <Icon d={IC.profile} size={14} color="#B46A02" /> 
                Applicant Information
              </div>
              <div className="flex flex-col gap-3.5">
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Full Name</div>
                  <div className="text-sm md:text-base font-extrabold text-gray-800 dark:text-gray-400">
                    {userData?.fullName || currentUser?.displayName || 'User'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">NIC Number</div>
                  <div className="text-sm md:text-base font-semibold text-gray-600 dark:text-gray-400 font-mono">
                    {nicMasked}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Mobile Number</div>
                  <div className="text-sm md:text-base font-semibold text-gray-600 dark:text-gray-400">
                    {userData?.mobile || currentUser?.phoneNumber || 'Not provided'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Divider */}
          {isMobile && <div className="h-px bg-yellow-200 my-5" />}

          {/* Additional Notes */}
          {booking.notes && (
            <>
              <div className="mt-5">
                <div className="text-[11px] font-extrabold text-yellow-700 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <Icon d={IC.message} size={14} color="#B46A02" /> 
                  Additional Notes
                </div>
                <div className="bg-user-primary-light p-3 md:p-4 rounded-lg border-l-3 border-user-primary text-sm font-semibold text-user-text italic">
                  "{booking.notes}"
                </div>
              </div>
              {isMobile && <div className="h-px bg-yellow-200 my-5" />}
            </>
          )}

          {/* Terms & Conditions Checkbox */}
          <div className={`mt-5 flex items-start gap-3 ${isMobile ? 'bg-user-primary-light p-4 rounded-xl border border-user-border' : ''}`}>
            <input 
              type="checkbox" 
              id="agreementCheckbox" 
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="w-5 h-5 accent-user-primary mt-0.5 cursor-pointer flex-shrink-0" 
            />
            <label htmlFor="agreementCheckbox" className="text-xs font-semibold text-user-text leading-relaxed cursor-pointer">
              I confirm that the information provided is accurate and I agree to the appointment terms.
            </label>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className={`flex justify-between gap-3 ${isMobile ? 'flex-col' : 'flex-row'}`}>
        <BrownBtn onClick={onBack} isMobile={isMobile}>
          ← Back
        </BrownBtn>
        <BrownBtn 
          onClick={onSubmit} 
          disabled={submitting || !isAgreed} 
          isMobile={isMobile}
        >
          {submitting ? 'Submitting...' : 'Submit appointment request'}
        </BrownBtn>
      </div>
    </div>
  );
};

// SCREEN — SUCCESS
const BookSuccess = ({ onBack }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] p-7">
      <div className="bg-user-surface border border-gray-200 dark:border-gray-700 rounded-2xl p-8 md:p-12 text-center max-w-md w-full mx-auto shadow-sm">
        
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-600/30 flex items-center justify-center mx-auto mb-5">
          <Icon d={IC.success} size={36} color="#1a7a3a" strokeWidth={2.5} />
        </div>
        
        {/* Title */}
        <h2 className="text-xl md:text-2xl font-black user-text mb-3">
          Appointment Requested!
        </h2>
        
        {/* Message */}
        <p className="text-sm text-user-text-light font-semibold leading-relaxed mb-2">
          Your appointment request has been submitted.
        </p>
        <p className="text-sm text-user-text-light font-semibold leading-relaxed mb-7">
          You will receive a confirmation once the GN Officer approves it.
        </p>
        
        {/* Button */}
        <div className="flex justify-center">
          <YellowBtn onClick={onBack} isMobile={isMobile}>
            ← Back to My Appointments
          </YellowBtn>
        </div>
      </div>
    </div>
  );
};

// MAIN COMPONENT
const Appointments = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [screen, setScreen] = useState('list');
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filteredPages, setFilteredPages] = useState([]);
  const [booking, setBooking] = useState({ service: null, notes: '', day: null, month: null, year: null, slot: null });

  const handleLanguageChange = (langCode) => {
    setCurrentLanguage(langCode);
    console.log('Language changed to:', langCode);
  };

  useEffect(() => { const handle = () => setIsMobile(window.innerWidth <= 768); window.addEventListener('resize', handle); return () => window.removeEventListener('resize', handle); }, []);
  
  useEffect(() => { const handleClickOutside = () => { setShowSearchResults(false); setShowProfileMenu(false); }; document.addEventListener('click', handleClickOutside); return () => document.removeEventListener('click', handleClickOutside); }, []);

  // Filter pages for search
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try { const snap = await getDoc(doc(db, 'users', user.uid)); if (snap.exists()) setUserData(snap.data()); } catch (e) { console.warn(e.message); }
      } else { navigate('/login'); }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  const handleLogout = async () => { await signOut(auth); navigate('/login'); };

  const handleSubmit = async () => {
    if (!currentUser) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        uid: currentUser.uid, fullName: userData?.fullName || currentUser.displayName || '', nic: userData?.nic || '', mobile: userData?.mobile || '',
        email: currentUser.email || '', service: booking.service?.name || '', serviceId: booking.service?.id || '',
        date: `${booking.year}-${String(booking.month + 1).padStart(2, '0')}-${String(booking.day).padStart(2, '0')}`, slot: booking.slot, notes: booking.notes,
        dsDiv: userData?.dsDiv || '', gnDiv: userData?.gnDiv || '', district: userData?.district || '', status: 'Pending', createdAt: serverTimestamp(),
      });
      setScreen('success');
      setRefreshKey(k => k + 1);
    } catch (e) { console.error('Submit error:', e.message); alert('Failed to submit. Please try again.'); } finally { setSubmitting(false); }
  };

  const chipName = userData?.username || userData?.fullName || currentUser?.email?.split('@')[0] || 'User';

  if (authLoading) return <PageLoadingSkeleton />;

  return (
    <div className="user-module min-h-screen flex flex-col font-sans bg-user-background">
      <div className="flex-1 flex">
        {!isMobile && <DesktopSidebar activePage="appointments" navigate={navigate} onLogout={handleLogout} />}
        <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} activePage="appointments" navigate={navigate} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Desktop Topbar */}
          {!isMobile && (
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
          )}

          {/* Mobile Topbar */}
          <MobileTopbar 
            chipName={chipName}
            onMenuClick={() => setMobileMenuOpen(true)}
            navigate={navigate}
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
          />

          {/* Mobile Content */}
          <div className="mobile-content md:hidden flex-1 bg-user-secondary-light overflow-y-auto">
            {/* Search Bar */}
            <div className="pt-3 px-3.5 relative">
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
              {showSearchResults && filteredPages.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-user-border z-[1000] overflow-hidden">
                  {filteredPages.map((page, idx) => (
                    <button
                      key={page.path}
                      onClick={() => {
                        navigate(page.path);
                        setSearchQuery('');
                        setShowSearchResults(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-user-background ${idx !== filteredPages.length - 1 ? 'border-b border-user-border-light' : ''}`}
                    >
                      <Icon d={page.icon} size={18} color="#B46A02" />
                      <div>
                        <div className="text-sm font-bold text-user-text">{page.name}</div>
                        <div className="text-[11px] text-user-text-lighter">Click to go</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Appointments Content */}
            <div className="p-3.5 pb-[90px]">
              {screen === 'list' && (
                <AppointmentsList 
                  currentUser={currentUser} 
                  refreshKey={refreshKey} 
                  onBook={() => { 
                    setBooking({ service: null, notes: '', day: null, month: null, year: null, slot: null }); 
                    setScreen('step1'); 
                  }} 
                />
              )}
              {screen === 'step1' && (
                <BookStep1 
                  booking={booking} 
                  setBooking={setBooking} 
                  onNext={() => setScreen('step2')} 
                  onCancel={() => setScreen('list')} 
                />
              )}
              {screen === 'step2' && (
                <BookStep2 
                  booking={booking} 
                  setBooking={setBooking} 
                  onNext={() => setScreen('step3')} 
                  onBack={() => setScreen('step1')} 
                />
              )}
              {screen === 'step3' && (
                <BookStep3 
                  booking={booking} 
                  userData={userData} 
                  currentUser={currentUser} 
                  onBack={() => setScreen('step2')} 
                  onSubmit={handleSubmit} 
                  submitting={submitting} 
                />
              )}
              {screen === 'success' && <BookSuccess onBack={() => setScreen('list')} />}
            </div>
          </div>

          {/* Desktop Content */}
          <div className="hidden md:block flex-1">
            {screen === 'list' && <AppointmentsList currentUser={currentUser} refreshKey={refreshKey} onBook={() => { setBooking({ service: null, notes: '', day: null, month: null, year: null, slot: null }); setScreen('step1'); }} />}
            {screen === 'step1' && <BookStep1 booking={booking} setBooking={setBooking} onNext={() => setScreen('step2')} onCancel={() => setScreen('list')} />}
            {screen === 'step2' && <BookStep2 booking={booking} setBooking={setBooking} onNext={() => setScreen('step3')} onBack={() => setScreen('step1')} />}
            {screen === 'step3' && <BookStep3 booking={booking} userData={userData} currentUser={currentUser} onBack={() => setScreen('step2')} onSubmit={handleSubmit} submitting={submitting} />}
            {screen === 'success' && <BookSuccess onBack={() => setScreen('list')} />}
          </div>
        </div>
      </div>
      <footer className="bg-[#6A2301] text-white text-center py-3 px-4 text-sm font-semibold">© 2026 Smart Grama Sewa. All rights reserved.</footer>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translate(-50%, -45%); opacity: 0; } to { transform: translate(-50%, -50%); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-fade-in { animation: fadeIn 0.2s ease; }
        .animate-slide-up { animation: slideUp 0.25s ease; }
        .animate-spin { animation: spin 0.7s linear infinite; }
        .rounded-round { border-radius: 999px; }

        @media (min-width: 769px) {
          .desktop-sidebar { display: flex !important; }
          .desktop-topbar { display: flex !important; }
          .mobile-topbar { display: none !important; }
          .mobile-content { display: none !important; }
        }

        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .desktop-topbar { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .mobile-content { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default Appointments;