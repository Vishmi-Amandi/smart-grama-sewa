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

// Service categories (from spec)
const SERVICE_CATS = [
  {
    key: 'personal', label: 'Personal Documents', services: [
      { id: 'residence', name: 'Residence/Character Certificate', desc: 'Proof of residency for official and legal purposes.' },
      { id: 'nic',       name: 'National Identity Card (NIC)',    desc: 'Apply for new or duplicate NIC documents.' },
      { id: 'death',     name: 'Death Report',                    desc: 'Formal report for legal registration of passing.' },
      { id: 'birth',     name: 'Late Birth Registration',         desc: 'Registering births after the standard grace period.' },
    ]
  },
  {
    key: 'property', label: 'Home & Property', services: [
      { id: 'land',      name: 'Land Ownership Assessment',       desc: 'For proving land ownership.' },
      { id: 'valuation', name: 'Valuation Certificate',           desc: 'For property valuation purposes.' },
      { id: 'water',     name: 'Electricity / Water Connection',  desc: 'GN recommendation for utility connections.' },
      { id: 'crown',     name: 'Crown Land Matters',              desc: 'Report unauthorized residents or other matters.' },
    ]
  },
  {
    key: 'permits', label: 'Permits & Approvals', services: [
      { id: 'tree',      name: 'Jack Tree Cutting Permit',        desc: '1 tree: 1 day. Multiple trees: 3 days.' },
      { id: 'timber',    name: 'Timber Transport Permit',         desc: 'GN recommends to Divisional Secretary.' },
      { id: 'animal',    name: 'Animal Transport Permit',         desc: 'GN recommends to Divisional Secretary.' },
      { id: 'mining',    name: 'Stone / Sand Mining Permit',      desc: 'GN recommends to Divisional Secretary.' },
    ]
  },
  {
    key: 'business', label: 'Livelihood & Business', services: [
      { id: 'income',    name: 'Income Certificate Recommendation', desc: 'GN recommends to Divisional Secretary.' },
      { id: 'biz',       name: 'Business Registration',             desc: 'GN recommends to Divisional Secretary.' },
      { id: 'gun',       name: 'Gun License Recommendation',        desc: 'GN recommends to Divisional Secretary.' },
    ]
  },
  {
    key: 'community', label: 'Community Support', services: [
      { id: 'welfare',   name: 'Public Aid / Welfare Assistance',  desc: 'GN recommends your application.' },
      { id: 'president', name: 'Presidential Fund Assistance',     desc: 'GN recommends to Divisional Secretary.' },
      { id: 'scholar',   name: 'Scholarship Application',          desc: 'GN recommends to Divisional Secretary.' },
    ]
  },
  {
    key: 'disputes', label: 'Complaints & Disputes', services: [
      { id: 'complaint', name: 'Complaint Report',   desc: 'This year: 1 day. Older: 3 days.' },
      { id: 'urgent',    name: 'Urgent Report',      desc: 'Emergency to DS: 6 hours. Detailed: 3 days.' },
      { id: 'dispute',   name: 'Dispute Resolution', desc: 'GN helps settle community disputes.' },
    ]
  },
];

// Shared styles
const S = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Nunito, system-ui, sans-serif', backgroundColor: '#f5f0e8' },
  shell: { flex: 1, display: 'flex' },
  sidebar: { width: '240px', flexShrink: 0, backgroundColor: '#F5C400', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  topbar: { height: '64px', backgroundColor: '#fff', borderBottom: '1px solid #e8d8b0', display: 'flex', alignItems: 'center', padding: '0 28px', gap: '14px', position: 'sticky', top: 0, zIndex: 40 },
  content: { padding: '28px 32px', flex: 1 },
  footer: { backgroundColor: '#6A2301', color: '#fff', textAlign: 'center', padding: '13px 16px', fontSize: '13px', fontWeight: 600 },
  card: { backgroundColor: '#fff', border: '1.5px solid #e8d5ac', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
};

// NavItem for sidebar
const NavItem = ({ iconPath, label, active, onClick }) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
    padding: '11px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
    backgroundColor: active ? 'rgba(255,255,255,0.9)' : 'transparent',
    color: '#3d2a00', fontWeight: active ? 800 : 600, fontSize: '14px',
    fontFamily: 'inherit', textAlign: 'left', marginBottom: '2px',
    transition: 'background 0.15s',
    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.10)' : 'none',
  }}>
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
    <div className="desktop-sidebar" style={{
      width: '220px', flexShrink: 0, backgroundColor: '#F5C400',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
    }}>
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <img src="/logo2.png" alt="Smart Grama Sewa" style={{ height: '80px', width: 'auto' }} />
      </div>
      <div style={{ flex: 1, padding: '12px 10px' }}>
        {navItems.map((item) => (
          <NavItem key={item.key} iconPath={item.icon} label={item.label}
            active={activePage === item.key}
            onClick={() => navigate(`/${item.key}`)} />
        ))}
      </div>
      <div style={{ padding: '10px 10px 20px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
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
const SearchResultsDropdown = ({ searchQuery, onNavigate, onClose }) => {
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

  if (filteredPages.length === 0) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      marginTop: '8px',
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      border: '1px solid #e8d5ac',
      zIndex: 1000,
      overflow: 'hidden',
    }}>
      {filteredPages.map((page, idx) => (
        <button
          key={page.path}
          onClick={() => {
            onNavigate(page.path);
            onClose();
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            border: 'none',
            borderBottom: idx === filteredPages.length - 1 ? 'none' : '1px solid #f0e8d0',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background 0.15s',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f0e8'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
        >
          <Icon d={page.icon} size={18} color="#B46A02" />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e1200' }}>{page.name}</div>
            <div style={{ fontSize: '11px', color: '#888' }}>Click to go to {page.name}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

// Desktop Topbar with Search and Language Switcher
const DesktopTopbar = ({ chipName, searchQuery, setSearchQuery, showResults, setShowResults, navigate, currentLanguage, onLanguageChange }) => (
  <div className="desktop-topbar" style={{
    height: '64px', backgroundColor: '#fff', borderBottom: '1px solid #ede8d8',
    display: 'flex', alignItems: 'center', padding: '0 28px', gap: '14px',
    position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 0 #ede8d8'
  }}>
    <div style={{ flex: 1, maxWidth: 400, position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        backgroundColor: '#f5f0e8', border: '1.5px solid #e8d8b0',
        borderRadius: 999, padding: '9px 18px'
      }}>
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
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            fontWeight: 500,
            color: '#1e1200',
            background: 'transparent',
          }}
        />
        {searchQuery && (
          <button onClick={() => { setSearchQuery(''); setShowResults(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <Icon d={IC.close} size={14} color="#aaa" />
          </button>
        )}
      </div>
      {showResults && <SearchResultsDropdown searchQuery={searchQuery} onNavigate={navigate} onClose={() => setShowResults(false)} />}
    </div>
    <div style={{ flex: 1 }} />
    <LanguageSwitcher 
      currentLanguage={currentLanguage} 
      onLanguageChange={onLanguageChange}
    />
    <div style={{
      width: 38, height: 38, borderRadius: '50%',
      backgroundColor: '#f5f0e8', border: '1.5px solid #e8d8b0',
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative'
    }}>
      <Icon d={IC.bell} size={18} color="#5a3a00" />
      <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', backgroundColor: '#e05050', border: '1.5px solid #fff' }} />
    </div>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px 5px 6px',
      backgroundColor: '#f5f0e8', border: '1.5px solid #e8d8b0',
      borderRadius: 999, cursor: 'pointer'
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#1e1200' }}>{chipName}</span>
      <div style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: '#F5C400', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon d={IC.profile} size={16} color="#3d2a00" />
      </div>
    </div>
  </div>
);

// Mobile Topbar with Search and Language Switcher
const MobileTopbar = ({ chipName, onMenuClick, searchQuery, setSearchQuery, showResults, setShowResults, navigate, currentLanguage, onLanguageChange }) => (
  <div className="mobile-header" style={{
    display: 'none',
    backgroundColor: '#F5C400',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', gap: '12px',
    }}>
      <button onClick={onMenuClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, flexShrink: 0 }}>
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#3d2a00" strokeWidth={2.2}>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'left' }}>
        <img src="/logo2.png" alt="Smart Grama Sewa" style={{ height: '48px', width: 'auto' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <LanguageSwitcher 
          currentLanguage={currentLanguage} 
          onLanguageChange={onLanguageChange}
        />
        <div style={{ position: 'relative' }}>
          <Icon d={IC.bell} size={20} color="#3d2a00" />
          <div style={{ position: 'absolute', top: -2, right: -4, width: 8, height: 8, borderRadius: '50%', backgroundColor: '#e05050', border: '1.5px solid #F5C400' }} />
        </div>
        <div onClick={() => window.location.href = '/profile'} style={{
          width: 32, height: 32, borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <Icon d={IC.profile} size={18} color="#3d2a00" />
        </div>
      </div>
    </div>
    {/* Mobile Search Bar */}
    <div style={{ padding: '8px 16px 12px 16px', backgroundColor: '#f5f0e8', position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        backgroundColor: '#fff', border: '1.5px solid #e8d8b0',
        borderRadius: 999, padding: '10px 16px',
      }}>
        <Icon d={IC.search} size={16} color="#aaa" />
        <input
          type="text"
          placeholder="Search for a page..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            fontWeight: 500,
            color: '#1e1200',
            background: 'transparent',
          }}
        />
        {searchQuery && (
          <button onClick={() => { setSearchQuery(''); setShowResults(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <Icon d={IC.close} size={14} color="#aaa" />
          </button>
        )}
      </div>
      {showResults && <SearchResultsDropdown searchQuery={searchQuery} onNavigate={navigate} onClose={() => setShowResults(false)} />}
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
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
      <div style={{ position: 'fixed', top: 0, left: 0, width: 250, height: '100vh', backgroundColor: '#F5C400', zIndex: 1001, overflowY: 'auto', padding: '20px 0' }}>
        <div style={{ padding: '0 20px 20px', textAlign: 'right' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
        </div>
        {navItems.map((item) => (
          <NavItem key={item.key} iconPath={item.icon} label={item.label}
            active={activePage === item.key}
            onClick={() => { navigate(`/${item.key}`); onClose(); }} />
        ))}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', margin: '10px 0', paddingTop: '10px' }}>
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
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 0, marginBottom: 28 }}>
      {steps.map((label, i) => {
        const n = i + 1;
        const done   = step > n;
        const active = step === n;
        return (
          <React.Fragment key={n}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 110 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                backgroundColor: active ? '#3d2a00' : done ? '#8a6a40' : '#ddd',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: active ? '3px solid #3d2a00' : 'none',
              }}>
                {done
                  ? <Icon d={IC.check} size={18} color="#fff" sw={2.5} />
                  : <span style={{ fontSize: 16, fontWeight: 900, color: active ? '#fff' : '#999' }}>{n}</span>
                }
              </div>
              <span style={{ fontSize: 12, fontWeight: active ? 800 : 600, color: active ? '#3d2a00' : '#999', marginTop: 6, textAlign: 'center' }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ height: 2, flex: 1, backgroundColor: done ? '#8a6a40' : '#ddd', marginTop: 19 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Brown pill button 
const BrownBtn = ({ onClick, children, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px',
    backgroundColor: disabled ? '#c0a888' : '#8a6040',
    border: 'none', borderRadius: 999, fontSize: 15, fontWeight: 800,
    color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .15s',
  }}
    onMouseOver={e => { if (!disabled) e.currentTarget.style.backgroundColor = '#6a4020'; }}
    onMouseOut={e  => { if (!disabled) e.currentTarget.style.backgroundColor = '#8a6040'; }}
  >{children}</button>
);

// Yellow pill button 
const YellowBtn = ({ onClick, children, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px',
    backgroundColor: disabled ? '#e8d888' : '#F5C400',
    border: 'none', borderRadius: 999, fontSize: 15, fontWeight: 800,
    color: '#3d2a00', cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .15s',
  }}
    onMouseOver={e => { if (!disabled) e.currentTarget.style.backgroundColor = '#d4a800'; }}
    onMouseOut={e  => { if (!disabled) e.currentTarget.style.backgroundColor = '#F5C400'; }}
  >{children}</button>
);

//  SCREEN — MY APPOINTMENTS LIST
const MONTHS_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const MONTHS_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES_SHORT = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// Details Modal (keep your existing code - too long but working)
const DetailsModal = ({ appt, onClose, onCancel, cancelling }) => {
  // ... keep your existing DetailsModal code exactly as is
};

// Appointments List
const AppointmentsList = ({ currentUser, refreshKey = 0, onBook }) => {
  // ... keep your existing AppointmentsList code exactly as is
};

// BOOK STEP 1: SELECT SERVICE
const BookStep1 = ({ booking, setBooking, onNext, onCancel }) => {
  // ... keep your existing BookStep1 code exactly as is
};

// BOOK STEP 2: DATE & TIME
const BookStep2 = ({ booking, setBooking, onNext, onBack }) => {
  // ... keep your existing BookStep2 code exactly as is
};

// BOOK STEP 3: REVIEW & SUBMIT
const BookStep3 = ({ booking, userData, currentUser, onBack, onSubmit, submitting }) => {
  // ... keep your existing BookStep3 code exactly as is
};

//  SCREEN — SUCCESS
const BookSuccess = ({ onBack }) => {
  // ... keep your existing BookSuccess code exactly as is
};

//  MAIN COMPONENT
const Appointments = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // SEARCH STATE
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // LANGUAGE STATE
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  // Click outside to close search results
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSearchResults(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle language change
  const handleLanguageChange = (langCode) => {
    setCurrentLanguage(langCode);
    console.log('Language changed to:', langCode);
  };

  // Auth + user data
  const [currentUser, setCurrentUser] = useState(null);
  const [userData,    setUserData]    = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Screen: 'list' | 'step1' | 'step2' | 'step3' | 'success'
  const [screen, setScreen] = useState('list');
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Booking state passed through all steps
  const [booking, setBooking] = useState({
    service: null, notes: '',
    day: null, month: null, year: null, slot: null,
  });

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

  const handleLogout = async () => { await signOut(auth); navigate('/login'); };

  // Submit to Firestore
  const handleSubmit = async () => {
    if (!currentUser) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        uid:         currentUser.uid,
        fullName:    userData?.fullName || currentUser.displayName || '',
        nic:         userData?.nic      || '',
        mobile:      userData?.mobile   || '',
        email:       currentUser.email  || '',
        service:     booking.service?.name || '',
        serviceId:   booking.service?.id   || '',
        date:        `${booking.year}-${String(booking.month + 1).padStart(2,'0')}-${String(booking.day).padStart(2,'0')}`,
        slot:        booking.slot,
        notes:       booking.notes,
        dsDiv:       userData?.dsDiv    || '',
        gnDiv:       userData?.gnDiv    || '',
        district:    userData?.district || '',
        status:      'Pending',
        createdAt:   serverTimestamp(),
      });
      setScreen('success');
      setRefreshKey(k => k + 1);
    } catch (e) {
      console.error('Submit error:', e.message);
      alert('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const chipName = userData?.username || userData?.fullName || currentUser?.email?.split('@')[0] || 'User';

  if (authLoading) return <PageLoadingSkeleton />;

  return (
    <div style={S.page}>
      <div style={{ flex: 1, display: 'flex' }}>

        {/* Desktop Sidebar */}
        {!isMobile && <DesktopSidebar activePage="appointments" navigate={navigate} onLogout={handleLogout} />}

        {/* Mobile Sidebar Overlay */}
        <MobileSidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          activePage="appointments"
          navigate={navigate}
          onLogout={handleLogout}
        />

        <div style={S.main}>
          {isMobile
            ? <MobileTopbar 
                chipName={chipName} 
                onMenuClick={() => setMobileMenuOpen(true)}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                showResults={showSearchResults}
                setShowResults={setShowSearchResults}
                navigate={navigate}
                currentLanguage={currentLanguage}
                onLanguageChange={handleLanguageChange}
              />
            : <DesktopTopbar 
                chipName={chipName}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                showResults={showSearchResults}
                setShowResults={setShowSearchResults}
                navigate={navigate}
                currentLanguage={currentLanguage}
                onLanguageChange={handleLanguageChange}
              />
          }

          {screen === 'list'    && <AppointmentsList currentUser={currentUser} refreshKey={refreshKey} onBook={() => { setBooking({ service: null, notes: '', day: null, month: null, year: null, slot: null }); setScreen('step1'); }} />}
          {screen === 'step1'   && <BookStep1  booking={booking} setBooking={setBooking} onNext={() => setScreen('step2')} onCancel={() => setScreen('list')} />}
          {screen === 'step2'   && <BookStep2  booking={booking} setBooking={setBooking} onNext={() => setScreen('step3')} onBack={() => setScreen('step1')} />}
          {screen === 'step3'   && <BookStep3  booking={booking} userData={userData} currentUser={currentUser} onBack={() => setScreen('step2')} onSubmit={handleSubmit} submitting={submitting} />}
          {screen === 'success' && <BookSuccess onBack={() => setScreen('list')} />}
        </div>
      </div>
      <footer style={S.footer}>©2026 Smart Grama Sewa</footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        
        /* Desktop */
        @media (min-width: 769px) {
          .desktop-sidebar { display: flex !important; }
          .desktop-topbar { display: flex !important; }
          .mobile-header { display: none !important; }
        }

        /* Mobile */
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .desktop-topbar { display: none !important; }
          .mobile-header { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default Appointments;