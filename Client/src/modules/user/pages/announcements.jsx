import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, orderBy, getDocs, doc, updateDoc, arrayUnion, getDoc, where } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { PageLoadingSkeleton, AnnouncementsListSkeleton } from '../components/skeleton';
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
  announce: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  appts: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2',
  forms: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  ai: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  profile: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  bell: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  menu: 'M3 6h18M3 12h18M3 18h18',
  close: 'M18 6L6 18M6 6l12 12',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  check: 'M20 6L9 17l-5-5',
  help: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 16h.01 M12 8v4',
  alertTriangle: 'M12 9v4 M12 17h.01 M12 2a10 10 0 100 20 10 10 0 000-20z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  info: 'M12 2a10 10 0 100 20 10 10 0 000-20z M12 8v4 M12 16h.01',
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2 M2 5v14a2 2 0 002 2h16a2 2 0 002-2V5a2 2 0 00-2-2H4a2 2 0 00-2 2z',
  unread: 'M21 12a9 9 0 11-9-9 M21 3v6h-6 M3 3l18 18',
  chevLeft: 'M15 18l-6-6 6-6',
  chevRight: 'M9 18l6-6-6-6',
};

// Tag colour map
const TAG = {
  Urgent: { border: '#e05050', chipBg: '#fde8e8', chipText: '#c0392b', icon: IC.alertTriangle },
  Important: { border: '#f59e0b', chipBg: '#fff3dc', chipText: '#b45309', icon: IC.star },
  Information: { border: '#3b82f6', chipBg: '#e8f0fb', chipText: '#1a4a8a', icon: IC.info },
};
const tagCfg = (tag) => TAG[tag] || TAG.Information;

// List of all pages/functions for search
const PAGE_ACTIONS = [
  { name: 'Dashboard', path: '/dashboard', icon: IC.dashboard },
  { name: 'Announcements', path: '/announcements', icon: IC.announce },
  { name: 'Appointments', path: '/appointments', icon: IC.appts },
  { name: 'Forms', path: '/forms', icon: IC.forms },
  { name: 'AI Assistant', path: null, icon: IC.ai },
  { name: 'Profile', path: '/profile', icon: IC.profile },
  { name: 'Settings', path: '/settings', icon: IC.settings },
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
            onClick={() => item.key === 'ai' ? window.openChatbot?.() : navigate(`/${item.key}`)} />
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
            if (page.path === null) { window.openChatbot?.(); setShowResults(false); return; }
            navigate(page.path);
            setShowResults(false);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-user-background ${idx !== filteredPages.length - 1 ? 'border-b border-user-border-light' : ''}`}
        >
          <Icon d={page.icon} size={18} color="#B46A02" />
          <div>
            <div className="text-sm font-bold text-user-text">{page.name}</div>
            <div className="text-xs text-user-text-lighter">Click to go to {page.name}</div>
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
            onClick={() => { if (item.key === 'ai') { window.openChatbot?.(); onClose(); return; } navigate(`/${item.key}`); onClose(); }} />
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

// Detail Modal
const DetailModal = ({ ann, onClose }) => {
  if (!ann) return null;
  const cfg = tagCfg(ann.tag);
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/45 z-[100]" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-[560px] bg-white rounded-xl shadow-2xl overflow-hidden animate-fade-in" style={{ border: `2px solid ${cfg.border}` }}>
        <div className="pt-6 px-6 pb-0">
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-extrabold mb-2.5" style={{ backgroundColor: cfg.chipBg, color: cfg.chipText, border: `1.5px solid ${cfg.border}` }}>
            <Icon d={cfg.icon} size={12} color={cfg.chipText} /> {ann.tag}
          </span>
          <h2 className="text-lg font-black text-user-text mb-1.5 leading-tight">{ann.title}</h2>
          <p className="text-xs text-user-text-lighter font-semibold mb-3.5 flex items-center gap-1">
            <Icon d={IC.calendar} size={12} color="#aaa" /> {ann.dateLabel}
          </p>
          <p className="text-sm text-user-text-light leading-relaxed mb-5">{ann.body}</p>
        </div>
        <div className="py-3.5 px-6 border-t border-user-border-light flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-user-primary border-none rounded-round text-sm font-extrabold text-user-text cursor-pointer transition-all hover:bg-user-primary-dark">
            Close
          </button>
        </div>
      </div>
    </>
  );
};

// Announcement Card
const AnnouncementCard = ({ ann, onClick }) => {
  const cfg = tagCfg(ann.tag);
  const preview = ann.body.length > 160 ? ann.body.slice(0, 160) + '…' : ann.body;

  return (
    <div
      onClick={() => onClick(ann)}
      className="bg-white border rounded-xl p-5 mb-4 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5"
      style={{ borderColor: cfg.border }}
    >
      <div className="mb-2">
        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-extrabold" style={{ backgroundColor: cfg.chipBg, color: cfg.chipText, border: `1.5px solid ${cfg.border}` }}>
          <Icon d={cfg.icon} size={12} color={cfg.chipText} /> {ann.tag}
        </span>
      </div>
      <div className="text-base font-black text-user-text mb-2">{ann.title}</div>
      <div className="text-sm text-user-text-light leading-relaxed mb-3">{preview}</div>
      <span className="text-sm font-extrabold text-user-warning">Read more →</span>
    </div>
  );
};

// Filter Tabs Component
const FilterTabs = ({ tabs, activeTab, onTabChange, counts }) => {
  const scrollContainerRef = useRef(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftShadow(scrollLeft > 5);
      setShowRightShadow(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScroll();
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  return (
    <div className="relative mb-6 border-b border-user-border">
      {/* Left shadow indicator */}
      {showLeftShadow && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
      )}
      
      {/* Right shadow indicator */}
      {showRightShadow && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
      )}

      {/* Horizontal scrollable tabs */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          const count = counts[tab] || 0;
          
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`relative py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0
                ${isActive 
                  ? 'text-user-primary border-b-2 border-user-primary' 
                  : 'text-user-text-lighter hover:text-user-text'
                }`}
            >
              {tab}
              {count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold
                  ${isActive 
                    ? 'bg-user-primary/10 text-user-primary' 
                    : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Scroll hint for mobile */}
      {showRightShadow && (
        <div className="md:hidden flex items-center justify-center gap-1 mt-2 text-[10px] text-user-text-lighter/50">
          <span>← swipe to see more →</span>
        </div>
      )}
    </div>
  );
};

// Pagination
const Pagination = ({ total, perPage, current, onChange }) => {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  const from = (current - 1) * perPage + 1;
  const to = Math.min(current * perPage, total);

  const pgBtn = (p) => (
    <button
      key={p}
      onClick={() => onChange(p)}
      className={`w-9 h-9 rounded-full text-sm font-semibold transition-all ${
        current === p ? 'bg-user-primary text-user-text font-black shadow-sm' : 'border border-user-border bg-white text-user-text-lighter hover:border-user-primary'
      }`}
    >
      {p}
    </button>
  );

  const buildPages = () => {
    const items = [];
    for (let p = 1; p <= Math.min(3, totalPages); p++) items.push(pgBtn(p));
    if (totalPages > 4) items.push(<span key="dots" className="text-sm text-user-text-lighter px-1 leading-9">…</span>);
    if (totalPages > 3) items.push(pgBtn(totalPages));
    return items;
  };

  const navBtn = (label, disabled, action) => (
    <button onClick={action} disabled={disabled} className={`px-4 py-2 rounded-round border border-user-border bg-white text-sm font-bold transition-all ${disabled ? 'text-gray-300 cursor-not-allowed' : 'text-user-text-lighter hover:border-user-primary'}`}>
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 mt-2">
      <span className="text-sm font-semibold text-user-text-lighter">Showing {from} - {to} of {total} announcements</span>
      <div className="flex items-center gap-1.5">
        {navBtn('< Previous', current === 1, () => onChange(current - 1))}
        {buildPages()}
        {navBtn('Next >', current === totalPages, () => onChange(current + 1))}
      </div>
    </div>
  );
};

const PER_PAGE = 3;

const Announcements = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selAnn, setSelAnn] = useState(null);

  const TABS = ['All', 'Urgent', 'Important', 'Information', 'Unread'];

  const getTabCounts = () => ({
    All: announcements.length,
    Urgent: announcements.filter(a => a.tag === 'Urgent').length,
    Important: announcements.filter(a => a.tag === 'Important').length,
    Information: announcements.filter(a => a.tag === 'Information').length,
    Unread: announcements.filter(a => !readIds.has(a.id)).length,
  });

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
          if (snap.exists()) {
            const data = snap.data();
            setUserData(data);
            setReadIds(new Set(data.readAnnouncements || []));
          }
        } catch (e) { console.warn(e.message); }
      } else {
        navigate('/login');
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowSearchResults(false);
      setShowProfileMenu(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch announcements from Firestore
  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      try {
        // Wait for userData to be loaded
        if (!userData) {
          setLoading(false);
          return;
        }
        
        // Fetch ALL active announcements
        const q = query(
          collection(db, 'announcements'), 
          // where('status', 'in', ['Active', 'published']),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const fetchedAnnouncements = snapshot.docs
            .filter(doc => {
              const data = doc.data();
              const announcementGnDiv = data.gnDiv || "";
              const category = data.category || "";

              // Check if this is an admin announcement
              const isAdminAnnouncement = announcementGnDiv === "";
          
              if (isAdminAnnouncement) {
                // ADMIN ANNOUNCEMENT - filter by category
                const allowedCategories = ["residents", "all_users"];
                return allowedCategories.includes(category);
              } else {
                // GN OFFICER ANNOUNCEMENT - show only to citizens in that GN division
                return announcementGnDiv === userData.gnDiv;
              }
            })
            .map(doc => {
              const data = doc.data();
              let dateLabel = 'Recent';
              
              if (data.createdAt?.toDate) {
                const date = data.createdAt.toDate();
                dateLabel = date.toLocaleDateString('en-GB', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric' 
                });
              } else if (data.date) {
                dateLabel = data.date;
              }
              
              // Map GN priority to User display tags
              let mappedTag = 'Information';

              const priorityValue = data.priority ? data.priority.charAt(0).toUpperCase() + data.priority.slice(1).toLowerCase() : '';

              if (priorityValue === 'Urgent') {
                mappedTag = 'Urgent';
              } else if (priorityValue === 'High') {
                mappedTag = 'Important';
              } else if (priorityValue === 'Normal') {
                mappedTag = 'Information';
              }

              // Use mappedTag first, then fallback to data.tag
              const finalTag = mappedTag || data.tag || 'Information';

              return {
                id: doc.id,
                title: data.title || 'Announcement',
                body: data.body || data.description || 'No description available',
                tag: finalTag,
                dateLabel: dateLabel,
              };
            });
          
          setAnnouncements(fetchedAnnouncements);
        } else {
          setAnnouncements([]);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && userData) {
      fetchAnnouncements();
    } else if (!currentUser) {
      setLoading(false);
    }
  }, [currentUser, userData]);

  const markAsRead = async (annId) => {
    // Only mark if not already read
    if (readIds.has(annId)) return;
    
    setReadIds(prev => new Set([...prev, annId]));
    
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          readAnnouncements: arrayUnion(annId),
        });
      } catch (e) { 
        console.warn('Mark read error:', e.message); 
      }
    }
  };

  const handleLogout = async () => { 
    await signOut(auth); 
    navigate('/login'); 
  };

  const filtered = announcements.filter(a => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Unread') return !readIds.has(a.id);
    return a.tag === activeTab;
  });

  const handleTabChange = (t) => { 
    setActiveTab(t); 
    setCurrentPage(1); 
  };
  
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const chipName = userData?.username || userData?.fullName || currentUser?.email?.split('@')[0] || 'User';

  const markAllAsRead = async () => {
    const unreadIds = announcements.filter(a => !readIds.has(a.id)).map(a => a.id);
    if (unreadIds.length === 0) return;
    
    const allIds = [...readIds, ...unreadIds];
    setReadIds(new Set(allIds));
    
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          readAnnouncements: allIds,
        });
      } catch (e) {
        console.warn('Mark all read error:', e.message);
      }
    }
  };

  const tabCounts = getTabCounts();

  if (authLoading) return <PageLoadingSkeleton />;

  return (
    <div className="user-module min-h-screen flex flex-col font-sans bg-user-background">
      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <DesktopSidebar activePage="announcements" navigate={navigate} onLogout={handleLogout} />

        {/* Mobile Sidebar Overlay */}
        <MobileSidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          activePage="announcements"
          navigate={navigate}
          onLogout={handleLogout}
        />

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
          <div className="mobile-topbar hidden h-16 bg-user-primary items-center px-4 gap-3 sticky top-0 z-40 shadow-md">
            <button onClick={() => setMobileMenuOpen(true)} className="bg-none border-none cursor-pointer p-1.5 flex-shrink-0">
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#3d2a00" strokeWidth={2.2}>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="flex-1 flex items-center justify-start">
              <img src="/logo2.png" alt="Smart Grama Sewa" className="h-12 w-auto" />
            </div>
            <LanguageSwitcher currentLanguage={currentLanguage} onLanguageChange={handleLanguageChange} />
            <div className="w-9 h-9 flex items-center justify-center relative">
              <Icon d={IC.bell} size={22} color="#1e1200" />
              <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500 border border-user-primary" />
            </div>
            <div className="w-9 h-9 rounded-full bg-white/85 flex items-center justify-center cursor-pointer" onClick={() => navigate('/profile')}>
              <Icon d={IC.profile} size={20} color="#3d2a00" />
            </div>
          </div>

          {/* Mobile Content */}
          <div className="mobile-content hidden flex-1 bg-user-secondary-light overflow-y-auto">
            {/* Search Bar */}
            <div className="pt-3 px-3.5 relative">
              <div className="flex items-center gap-2.5 bg-white border border-user-border rounded-round px-4 py-2.5">
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
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-user-border z-[1000] overflow-hidden">
                  {PAGE_ACTIONS.filter(page => page.name.toLowerCase().includes(searchQuery.toLowerCase())).map((page, idx) => (
                    <button
                      key={page.path}
                        onClick={() => {
                          if (page.path === null) { window.openChatbot?.(); setSearchQuery(''); setShowSearchResults(false); return; }
                          navigate(page.path);
                          setSearchQuery('');
                          setShowSearchResults(false);
                        }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-user-background ${idx !== PAGE_ACTIONS.length - 1 ? 'border-b border-user-border-light' : ''}`}
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

            {/* Main Mobile Content */}
            <div className="p-3.5 pb-[90px]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-user-text tracking-tight">Announcements</h1>
                  <p className="text-sm text-user-text-lighter mt-1">Stay updated with latest news from your GN Officer</p>
                </div>
                {announcements.filter(a => !readIds.has(a.id)).length > 0 && (
                  <button onClick={markAllAsRead} className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-round border border-user-border bg-white text-sm font-extrabold text-user-text cursor-pointer transition-all hover:bg-user-primary-light hover:border-user-primary">
                    <Icon d={IC.check} size={14} color="#3d2a00" sw={2.5} /> Mark all as read ({announcements.filter(a => !readIds.has(a.id)).length})
                  </button>
                )}
              </div>

              <FilterTabs 
                tabs={TABS} 
                activeTab={activeTab} 
                onTabChange={handleTabChange} 
                counts={tabCounts} 
              />

              {loading && <AnnouncementsListSkeleton />}

              {!loading && (
                <>
                  {paginated.length > 0 ? (
                    <div className="animate-fade-in-up">
                      {paginated.map(ann => <AnnouncementCard key={ann.id} ann={ann} onClick={(a) => { setSelAnn(a); markAsRead(a.id); }} />)}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-white rounded-xl border border-user-border">
                      <div className="flex justify-center mb-4"><Icon d={IC.inbox} size={48} color="#ccc" strokeWidth={1.2} /></div>
                      <div className="text-base font-semibold text-user-text-lighter">
                        {activeTab === 'Unread' ? (
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Icon d={IC.check} size={32} color="#30a050" sw={2.5} />
                            <span>All caught up! No unread announcements.</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3">
                            <span>No {activeTab.toLowerCase()} announcements found.</span>
                            {activeTab !== 'All' && (
                              <button onClick={() => handleTabChange('All')} className="px-4 py-2 bg-user-primary rounded-round text-sm font-bold text-user-text hover:bg-user-primary-dark transition-colors">
                                View all announcements
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {paginated.length > 0 && (
                    <Pagination total={filtered.length} perPage={PER_PAGE} current={currentPage} onChange={setCurrentPage} />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Desktop Content */}
          <div className="hidden md:block p-6 md:p-7 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-user-text tracking-tight">Announcements</h1>
                <p className="text-sm text-user-text-lighter mt-1">Stay updated with latest news from your GN Officer</p>
              </div>
              {announcements.filter(a => !readIds.has(a.id)).length > 0 && (
                <button onClick={markAllAsRead} className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-round border border-user-border bg-white text-sm font-extrabold text-user-text cursor-pointer transition-all hover:bg-user-primary-light hover:border-user-primary">
                  <Icon d={IC.check} size={14} color="#3d2a00" sw={2.5} /> Mark all as read ({announcements.filter(a => !readIds.has(a.id)).length})
                </button>
              )}
            </div>

            <FilterTabs 
              tabs={TABS} 
              activeTab={activeTab} 
              onTabChange={handleTabChange} 
              counts={tabCounts} 
            />

            {loading && <AnnouncementsListSkeleton />}

            {!loading && (
              <>
                {paginated.length > 0 ? (
                  <div className="animate-fade-in-up">
                    {paginated.map(ann => <AnnouncementCard key={ann.id} ann={ann} onClick={(a) => { setSelAnn(a); markAsRead(a.id); }} />)}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white rounded-xl border border-user-border">
                    <div className="flex justify-center mb-4"><Icon d={IC.inbox} size={48} color="#ccc" strokeWidth={1.2} /></div>
                    <div className="text-base font-semibold text-user-text-lighter">
                      {activeTab === 'Unread' ? (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Icon d={IC.check} size={32} color="#30a050" sw={2.5} />
                          <span>All caught up! No unread announcements.</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <span>No {activeTab.toLowerCase()} announcements found.</span>
                          {activeTab !== 'All' && (
                            <button onClick={() => handleTabChange('All')} className="px-4 py-2 bg-user-primary rounded-round text-sm font-bold text-user-text hover:bg-user-primary-dark transition-colors">
                              View all announcements
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {paginated.length > 0 && (
                  <Pagination total={filtered.length} perPage={PER_PAGE} current={currentPage} onChange={setCurrentPage} />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {selAnn && <DetailModal ann={selAnn} onClose={() => setSelAnn(null)} />}

      <footer className="bg-[#6A2301] text-white text-center py-3 px-4 text-sm font-semibold">
        © 2026 Smart Grama Sewa. All rights reserved.
      </footer>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translate(-50%, -45%); } to { opacity: 1; transform: translate(-50%, -50%); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.2s ease; }
        .animate-fade-in-up { animation: fadeInUp 0.3s ease; }
        .rounded-round { border-radius: 999px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        
        /* Desktop */
        @media (min-width: 769px) {
          .desktop-sidebar { display: flex !important; }
          .desktop-topbar { display: flex !important; }
          .mobile-topbar { display: none !important; }
          .mobile-content { display: none !important; }
        }

        /* Mobile */
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

export default Announcements;