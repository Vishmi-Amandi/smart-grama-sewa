import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { PageLoadingSkeleton, AppointmentsListSkeleton } from '../components/skeleton';

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
};

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
    { key: 'logout', icon: IC.logout, label: 'Logout' },
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

// Desktop Topbar
const DesktopTopbar = ({ chipName }) => (
  <div className="desktop-topbar" style={{
    height: '64px', backgroundColor: '#fff', borderBottom: '1px solid #ede8d8',
    display: 'flex', alignItems: 'center', padding: '0 28px', gap: '14px',
    position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 0 #ede8d8'
  }}>
    <div style={{
      flex: 1, maxWidth: 400, display: 'flex', alignItems: 'center', gap: 10,
      backgroundColor: '#f5f0e8', border: '1.5px solid #e8d8b0',
      borderRadius: 999, padding: '9px 18px'
    }}>
      <Icon d={IC.search} size={16} color="#aaa" />
      <span style={{ fontSize: 14, color: '#bbb', fontWeight: 600 }}>search</span>
    </div>
    <div style={{ flex: 1 }} />
    <span style={{ fontSize: 14, fontWeight: 800, color: '#1e1200' }}>EN</span>
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

// Mobile Topbar with Search Below
const MobileTopbar = ({ chipName, onMenuClick }) => (
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
        <span style={{ fontSize: '14px', fontWeight: 800, color: '#3d2a00' }}>EN</span>
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
    { key: 'logout', icon: IC.logout, label: 'Logout' },
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

// NavItem (original for sidebar)
const OriginalNavItem = ({ d, label, active, onClick }) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
    padding: '11px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
    backgroundColor: active ? 'rgba(255,255,255,0.9)' : 'transparent',
    color: '#3d2a00', fontWeight: active ? 800 : 600, fontSize: '14px',
    fontFamily: 'inherit', textAlign: 'left', marginBottom: '2px',
    transition: 'background 0.15s',
    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.10)' : 'none',
  }}
    onMouseOver={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.4)'; }}
    onMouseOut={e  => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
  >
    <Icon d={d} size={18} color={active ? '#B46A02' : '#5a3a00'} />
    {label}
  </button>
);

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

// Details Modal
const DetailsModal = ({ appt, onClose, onCancel, cancelling }) => {
  if (!appt) return null;
 
  const statusColor = {
    Confirmed: { bg: '#e6f9ee', text: '#1a7a3a', border: '#7ec07e' },
    Pending:   { bg: '#fff3dc', text: '#b45309', border: '#f0c060' },
    Completed: { bg: '#e8f0fb', text: '#1a4a8a', border: '#90b4e8' },
    Cancelled: { bg: '#f0f0f0', text: '#666',    border: '#ccc'    },
  };
  const sc = statusColor[appt.status] || statusColor.Pending;
  const canCancel = appt.status === 'Pending' || appt.status === 'Confirmed';
 
  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        zIndex: 100,
        animation: 'fadeIn .2s ease',
      }} />
 
      {/* Modal box */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 101,
        width: '100%', maxWidth: 520,
        backgroundColor: '#fff',
        borderRadius: 20,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        animation: 'slideUp .25s ease',
      }}>
 
        {/* Header */}
        <div style={{
          backgroundColor: '#8a6040',
          padding: '18px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#f0d890', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>
              Appointment Details
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{appt.title}</div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.15)',
            border: 'none', cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700,
          }}>×</button>
        </div>
 
        {/* Body */}
        <div style={{ padding: '22px 24px', backgroundColor: '#fffbe8' }}>
 
          {/* Status */}
          <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#888' }}>Status:</span>
            <span style={{
              padding: '4px 14px', borderRadius: 999, fontSize: 12, fontWeight: 800,
              backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
            }}>{appt.status}</span>
          </div>
 
          {/* Info rows */}
          {[
            { icon: '📅', label: 'Date',     value: `${DAY_NAMES_SHORT[new Date(appt.date).getDay()]}, ${appt.day} ${MONTHS_FULL[parseInt(appt.mon_num) - 1] || appt.mon} ${appt.year}` },
            { icon: '🕐', label: 'Time',     value: appt.time },
            { icon: '📋', label: 'Service',  value: appt.title },
            { icon: '📍', label: 'Location', value: appt.location || 'Grama Niladhari Office' },
          ].map(row => (
            <div key={row.label} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '10px 0', borderBottom: '1px solid #f0e8d0',
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{row.icon}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{row.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e1200' }}>{row.value || '—'}</div>
              </div>
            </div>
          ))}
 
          {/* Notes */}
          {appt.notes && (
            <div style={{ padding: '10px 0', borderBottom: '1px solid #f0e8d0' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 16 }}>📝</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Notes</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#666', fontStyle: 'italic', lineHeight: 1.5 }}>"{appt.notes}"</div>
                </div>
              </div>
            </div>
          )}
        </div>
 
        {/* Footer buttons */}
        <div style={{
          padding: '16px 24px',
          backgroundColor: '#fff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTop: '1px solid #f0e8d0',
        }}>
          <button onClick={onClose} style={{
            padding: '10px 24px', borderRadius: 999,
            border: '1.5px solid #e8d5ac', background: '#fff',
            fontSize: 14, fontWeight: 700, color: '#888',
            cursor: 'pointer', transition: 'all .15s',
          }}
            onMouseOver={e => e.currentTarget.style.borderColor = '#B46A02'}
            onMouseOut={e  => e.currentTarget.style.borderColor = '#e8d5ac'}
          >Close</button>
 
          {/* Cancel button — only for Pending or Confirmed */}
          {canCancel && (
            <button onClick={onCancel} disabled={cancelling} style={{
              padding: '10px 24px', borderRadius: 999,
              border: '1.5px solid #f0a0a0',
              backgroundColor: cancelling ? '#fde8e8' : '#fff',
              fontSize: 14, fontWeight: 800, color: '#8b1a1a',
              cursor: cancelling ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 7,
              transition: 'all .15s',
            }}
              onMouseOver={e => { if (!cancelling) e.currentTarget.style.backgroundColor = '#fde8e8'; }}
              onMouseOut={e  => { if (!cancelling) e.currentTarget.style.backgroundColor = '#fff'; }}
            >
              {cancelling ? (
                <>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #8b1a1a', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                  Cancelling…
                </>
              ) : '❌ Cancel Appointment'}
            </button>
          )}
        </div>
      </div>
 
      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{transform:translate(-50%,-45%);opacity:0} to{transform:translate(-50%,-50%);opacity:1} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>
    </>
  );
};

// Appointments List
const AppointmentsList = ({ currentUser, refreshKey = 0, onBook }) => {
  const [tab, setTab] = useState('All');
  const [appts,  setAppts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [selAppt,    setSelAppt]    = useState(null);  // selected appt for modal
  const [cancelling, setCancelling] = useState(false);

  const tabs = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

  // Fetch this user's appointments from Firestore
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    const fetchAppts = async () => {
      setLoading(true);
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 10000)
        );
        const q = query(
          collection(db, 'appointments'),
          where('uid', '==', currentUser.uid),
        );
        const snap = await Promise.race([getDocs(q), timeoutPromise]);

        const list = snap.docs.map(d => {
          const data = d.data();
          const [y, m, day] = (data.date || '').split('-').map(Number);
          const dateObj = new Date(y, m - 1, day);
          return {
            id:     d.id,
            day:    day   || '--',
            mon:    MONTHS_SHORT[(m - 1)] || '---',
            mon_num:  m,
            year:     y,
            dow:    isNaN(dateObj) ? '' : DAY_NAMES_SHORT[dateObj.getDay()],
            time:   data.slot    || '',
            title:  data.service || 'Appointment',
            status: data.status  || 'Pending',
            date:   data.date    || '',
            notes:    data.notes    || '',
          };
        });
        // Sort newest first
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
  }, [currentUser, refreshKey]); // re-fetch when refreshKey changes

  // Cancel appointment 
  const handleCancel = async () => {
    if (!selAppt) return;
    setCancelling(true);
    try {
      await updateDoc(doc(db, 'appointments', selAppt.id), {
        status: 'Cancelled',
      });
      // Update local state immediately — no need to re-fetch
      setAppts(prev => prev.map(a =>
        a.id === selAppt.id ? { ...a, status: 'Cancelled' } : a
      ));
      setSelAppt(prev => ({ ...prev, status: 'Cancelled' }));
    } catch (e) {
      console.error('Cancel error:', e.message);
      alert('Could not cancel appointment. Please try again.');
    } finally {
      setCancelling(false);
    }
  };
 
  const filtered = tab === 'All' ? appts : appts.filter(a => a.status === tab);
  const pendingCount   = appts.filter(a => a.status === 'Pending').length;
  const confirmedCount = appts.filter(a => a.status === 'Confirmed').length;
 
  const statusColor = {
    Confirmed: { bg: '#e6f9ee', text: '#1a7a3a', border: '#7ec07e' },
    Pending:   { bg: '#fff3dc', text: '#b45309', border: '#f0c060' },
    Completed: { bg: '#e8f0fb', text: '#1a4a8a', border: '#90b4e8' },
    Cancelled: { bg: '#f0f0f0', text: '#666',    border: '#ccc'    },
  };
  const accentColor = {
    Confirmed: '#22c55e', Pending: '#f59e0b',
    Completed: '#3b82f6', Cancelled: '#ccc',
  };
 
  return (
    <>
    <div style={{ padding: '12px 16px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        backgroundColor: '#fff', border: '1.5px solid #e8d8b0',
        borderRadius: 999, padding: '10px 16px',
      }}>
        <Icon d={IC.search} size={16} color="#aaa" />
        <span style={{ fontSize: 14, color: '#bbb', fontWeight: 600 }}>Search</span>
      </div>
    </div>

      {/* Details modal */}
      {selAppt && (
        <DetailsModal
          appt={selAppt}
          onClose={() => setSelAppt(null)}
          onCancel={handleCancel}
          cancelling={cancelling}
        />
      )}
 
      <div style={S.content}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>          
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1e1200', letterSpacing: '-0.4px', marginBottom: 4 }}>My Appointments</h1>
            <p style={{ fontSize: 13, color: '#888', fontWeight: 600 }}>Manage your scheduled meetings with Grama Niladhari officers.</p>
          </div>
          <button onClick={onBook} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            backgroundColor: '#F5C400', border: 'none', borderRadius: 999,
            padding: '12px 22px', fontSize: 14, fontWeight: 800, color: '#3d2a00',
            cursor: 'pointer', transition: 'all .15s',
            boxShadow: '0 3px 12px rgba(245,196,0,0.35)',
          }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#d4a800'}
            onMouseOut={e  => e.currentTarget.style.backgroundColor = '#F5C400'}
          >
            <Icon d={IC.plus} size={16} color="#3d2a00" sw={2.5} />
            Book New Appointment
          </button>
        </div>
 
        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
          <div style={{ backgroundColor: '#f0a060', borderRadius: 16, padding: '22px 24px' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{pendingCount}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginTop: 6 }}>Pending Appointments</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginTop: 3 }}>Awaiting GN Officer approval</div>
          </div>
          <div style={{ backgroundColor: '#60b880', borderRadius: 16, padding: '22px 24px' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{confirmedCount}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginTop: 6 }}>Confirmed Appointments</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginTop: 3 }}>Upcoming this week</div>
          </div>
        </div>
 
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e8d5ac', marginBottom: 20, overflowX: 'auto', flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 20px', border: 'none', background: 'none',
              fontSize: 15, fontWeight: tab === t ? 900 : 600,
              color: tab === t ? '#3d2a00' : '#888', cursor: 'pointer',
              borderBottom: tab === t ? '3px solid #F5C400' : '3px solid transparent',
              marginBottom: -2, fontFamily: 'inherit', transition: 'all .15s',
              whiteSpace: 'nowrap',
            }}>{t}</button>
          ))}
        </div>
 
        {/* Loading */}
        {loading && <AppointmentsListSkeleton />}
 
        {/* Appointment cards */}
        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map(a => (
              <div key={a.id} style={{
                ...S.card,
                borderLeft: `5px solid ${accentColor[a.status] || '#ccc'}`,
                padding: '18px 22px',
                opacity: a.status === 'Cancelled' ? 0.65 : 1,
                transition: 'all .15s',
              }}>
                {/* Header Row: Date (30 APR) and Status Badge (stuck to right) */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}>
                  {/* Date Block */}
                  <div>
                    <div style={{
                      fontSize: 42,
                      fontWeight: 900,
                      color: '#1e1200',
                      lineHeight: 1,
                    }}>{a.day}</div>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: '#B46A02',
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                    }}>{a.mon}</div>
                  </div>

                  {/* Status Badge - Stuck to the right */}
                  <div style={{
                    padding: '6px 16px',
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 800,
                    backgroundColor: (statusColor[a.status] || statusColor.Pending).bg,
                    color: (statusColor[a.status] || statusColor.Pending).text,
                    border: `1px solid ${(statusColor[a.status] || statusColor.Pending).border}`,
                    whiteSpace: 'nowrap',
                    alignSelf: 'flex-start',
                  }}>{a.status}</div>
                </div>

                {/* Time Row */}
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#666',
                  marginBottom: 10,
                }}>
                  {a.dow} - {a.time}
                </div>

                {/* Description Row */}
                <div style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: '#1e1200',
                  marginBottom: 20,
                }}>
                  {a.title}
                </div>

                {/* Buttons Row - All three buttons */}
                <div style={{
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                }}>

                  {/* Details Button */}
                  <button onClick={() => setSelAppt(a)} style={{
                    flex: '1 1 auto',
                    minWidth: '100px',
                    padding: '10px 16px',
                    borderRadius: 40,
                    backgroundColor: '#eff3f9',
                    border: '1px solid #d4dfed',
                    color: '#2c4c7c',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.backgroundColor = '#e2e9f2'; }}
                  onMouseOut={e => { e.currentTarget.style.backgroundColor = '#eff3f9'; }}>
                    <span>📋</span> Details
                  </button>

                  {/* Cancel Button */}
                  {(a.status === 'Pending' || a.status === 'Confirmed') && (
                    <button onClick={() => { setSelAppt(a); }} style={{
                      flex: '1 1 auto',
                      minWidth: '100px',
                      padding: '10px 16px',
                      borderRadius: 40,
                      backgroundColor: '#fef3f2',
                      border: '1px solid #f3c1bc',
                      color: '#bc3f2e',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.backgroundColor = '#fce4e1'; }}
                    onMouseOut={e => { e.currentTarget.style.backgroundColor = '#fef3f2'; }}>
                      <span>✖</span> Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
 
            {/* Empty state */}
            {filtered.length === 0 && (
              <div style={{ ...S.card, textAlign: 'center', padding: '52px 24px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1e1200', marginBottom: 8 }}>
                  {tab === 'All' ? 'No appointments yet' : `No ${tab.toLowerCase()} appointments`}
                </div>
                <div style={{ fontSize: 13, color: '#aaa', fontWeight: 600, marginBottom: 20 }}>
                  {tab === 'All' ? 'Book your first appointment with your GN Officer.' : `You have no ${tab.toLowerCase()} appointments at the moment.`}
                </div>
                {tab === 'All' && (
                  <button onClick={onBook} style={{
                    backgroundColor: '#F5C400', border: 'none', borderRadius: 999,
                    padding: '11px 22px', fontSize: 14, fontWeight: 800,
                    color: '#3d2a00', cursor: 'pointer',
                  }}>+ Book New Appointment</button>
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

  const toggleCat = key => setOpenCats(p => ({ ...p, [key]: !p[key] }));

  const selectService = (svc) => {
    setBooking(p => ({ ...p, service: svc }));
  };

  return (
    <div style={S.content}>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1e1200', marginBottom: 20 }}>Book an appointment</h1>
      <StepBar step={1} />

      {/* White card */}
      <div style={{ ...S.card, padding: '24px 28px', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1e1200', marginBottom: 20 }}>What is this appointment for?</h2>

        {/* Categories */}
        {SERVICE_CATS.map(cat => (
          <div key={cat.key} style={{ marginBottom: 10 }}>
            {/* Category header */}
            <button onClick={() => toggleCat(cat.key)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 18px', backgroundColor: openCats[cat.key] ? '#fff8e0' : '#f8f6f0',
              border: '1.5px solid #e8d5ac', borderRadius: openCats[cat.key] ? '12px 12px 0 0' : 12,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
            }}>
              <Icon d={openCats[cat.key] ? IC.chevDown : IC.chevR} size={16} color="#B46A02" />
              <span style={{ fontSize: 15, fontWeight: 800, color: '#1e1200' }}>{cat.label}</span>
            </button>

            {/* Services list */}
            {openCats[cat.key] && (
              <div style={{ border: '1.5px solid #e8d5ac', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
                {cat.services.map((svc, i) => {
                  const selected = booking.service?.id === svc.id;
                  return (
                    <div key={svc.id} onClick={() => selectService(svc)} style={{
                      padding: '16px 20px', cursor: 'pointer',
                      backgroundColor: selected ? '#f0e8cc' : '#fff',
                      borderBottom: i < cat.services.length - 1 ? '1px solid #f0e8d0' : 'none',
                      borderLeft: selected ? '4px solid #F5C400' : '4px solid transparent',
                      transition: 'all .15s',
                    }}
                      onMouseOver={e => { if (!selected) e.currentTarget.style.backgroundColor = '#fffbe0'; }}
                      onMouseOut={e  => { if (!selected) e.currentTarget.style.backgroundColor = '#fff'; }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#1e1200', marginBottom: 3 }}>{svc.name}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#888' }}>{svc.desc}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* Selected service banner */}
        {booking.service && (
          <div style={{
            marginTop: 16, backgroundColor: '#fff8e0', border: '1.5px solid #f0c060',
            borderRadius: 12, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#F5C400', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon d={IC.check} size={14} color="#3d2a00" sw={2.5} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Selected Service</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#3d2a00' }}>{booking.service.name}</div>
            </div>
            <button onClick={() => setBooking(p => ({ ...p, service: null }))} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              backgroundColor: '#fff', border: '1.5px solid #e8d5ac',
              borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 700,
              color: '#888', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Icon d={IC.x} size={12} color="#888" />
              CHANGE
            </button>
          </div>
        )}
      </div>

      {/* Additional notes */}
      <div style={{ ...S.card, padding: '22px 28px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1e1200', marginBottom: 12 }}>Additional notes (optional)</h2>
        <textarea
          value={notes}
          onChange={e => { setNotes(e.target.value); setBooking(p => ({ ...p, notes: e.target.value })); }}
          placeholder="Please provide any specific details or requirements for your request..."
          rows={4}
          style={{
            width: '100%', padding: '12px 14px', fontSize: 14, fontWeight: 600,
            color: '#1e1200', backgroundColor: '#fff', border: '1.5px solid #e8d5ac',
            borderRadius: 10, outline: 'none', resize: 'vertical',
            boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color .15s',
          }}
          onFocus={e => e.target.style.borderColor = '#F5C400'}
          onBlur={e  => e.target.style.borderColor = '#e8d5ac'}
        />
      </div>

      {/* Bottom buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <BrownBtn onClick={onCancel}>Cancel</BrownBtn>
        <BrownBtn onClick={onNext} disabled={!booking.service}>
          Next → Pick a time &amp; date
        </BrownBtn>
      </div>
    </div>
  );
};

// BOOK STEP 2: DATE & TIME
const DAYS   = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const BookStep2 = ({ booking, setBooking, onNext, onBack }) => {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selDay,    setSelDay]    = useState(booking.day  || null);
  const [selSlot,   setSelSlot]   = useState(booking.slot || null);

  // Taken slots (simulate)
  const takenSlots = ['10:30 AM', '03:00 PM'];

  const morningSlots   = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'];
  const afternoonSlots = ['01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM'];

  const firstDay   = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const isWeekend = (day) => {
    const d = new Date(viewYear, viewMonth, day).getDay();
    return d === 0 || d === 6;
  };
  const isPast = (day) => new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const pickDay = (day) => {
    if (isWeekend(day) || isPast(day)) return;
    setSelDay(day);
    setSelSlot(null);
    setBooking(p => ({ ...p, day, month: viewMonth, year: viewYear, slot: null }));
  };

  const pickSlot = (slot) => {
    if (takenSlots.includes(slot)) return;
    setSelSlot(slot);
    setBooking(p => ({ ...p, slot }));
  };

  const selDateLabel = selDay
    ? `${DAY_NAMES[new Date(viewYear, viewMonth, selDay).getDay()]}, ${MONTHS[viewMonth]} ${selDay}${['th','st','nd','rd'][Math.min(selDay % 10, 3)] || 'th'}`
    : 'No date selected';

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={S.content}>
      <h1 style={{ 
        fontSize: 26, 
        fontWeight: 900, 
        color: '#1e1200', 
        marginBottom: 20 
      }}>Book an appointment</h1>
      <StepBar step={2} />

      <div style={{ 
        ...S.card, 
        padding: '26px 28px', 
        marginBottom: 16 
      }}>
        <h2 style={{ 
          fontSize: 18, 
          fontWeight: 800, 
          color: '#1e1200', 
          marginBottom: 22 
        }}>When would you like to visit?</h2>

        {/* Responsive Grid */}
        <div style={{ 
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 20,
        }}>

          {/* Calendar Section */}
          <div style={{ 
            flex: 1,
            border: '1.5px solid #e8d5ac', 
            borderRadius: 14, 
            padding: '20px 18px' 
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              marginBottom: 16 
            }}>
              <Icon d={IC.calendar} size={18} color="#B46A02" />
              <span style={{ fontSize: 15, fontWeight: 800, color: '#1e1200' }}>Select Date</span>
            </div>
            
            {/* Month Navigation */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: 14 
            }}>
              <button onClick={prevMonth} style={{ 
                width: 32, height: 32, borderRadius: '50%', 
                border: '1.5px solid #e8d5ac', background: '#fff', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', 
                justifyContent: 'center'
              }}>
                <Icon d={IC.chevL} size={14} color="#888" />
              </button>
              <span style={{ fontSize: 15, fontWeight: 800 }}>
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button onClick={nextMonth} style={{ 
                width: 32, height: 32, borderRadius: '50%', 
                border: '1.5px solid #e8d5ac', background: '#fff', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', 
                justifyContent: 'center'
              }}>
                <Icon d={IC.chevR} size={14} color="#888" />
              </button>
            </div>
            
            {/* Day Headers */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: 2, 
              marginBottom: 8 
            }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} style={{ 
                  textAlign: 'center', 
                  fontSize: 11, 
                  fontWeight: 800, 
                  color: '#aaa', 
                  padding: '4px 0' 
                }}>{d}</div>
              ))}
            </div>
            
            {/* Days Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: 2 
            }}>
              {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
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
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      margin: '1px auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: picked ? 900 : 600,
                      backgroundColor: picked ? '#F5C400' : 'transparent',
                      color: picked ? '#3d2a00' : disabled ? '#ccc' : '#1e1200',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      boxShadow: picked ? '0 2px 8px rgba(245,196,0,0.4)' : 'none',
                      transition: 'all 0.12s',
                    }}
                    onMouseOver={e => { if (!disabled && !picked) e.currentTarget.style.backgroundColor = '#fff8e0'; }}
                    onMouseOut={e => { if (!disabled && !picked) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Slots Section */}
          <div style={{ 
            flex: 1,
            border: '1.5px solid #e8d5ac', 
            borderRadius: 14, 
            padding: '20px 18px' 
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              marginBottom: 16 
            }}>
              <Icon d={IC.clock} size={18} color="#B46A02" />
              <span style={{ fontSize: 15, fontWeight: 800, color: '#1e1200' }}>Select Time</span>
            </div>

            {/* Morning Slots */}
            <div style={{ 
              fontSize: 12, 
              fontWeight: 800, 
              color: '#B46A02', 
              marginBottom: 10, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6 
            }}>
              ☀️ Morning
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: 8, 
              marginBottom: 16 
            }}>
              {morningSlots.map(slot => {
                const taken = takenSlots.includes(slot);
                const picked = selSlot === slot;
                return (
                  <button 
                    key={slot} 
                    onClick={() => pickSlot(slot)} 
                    disabled={taken} 
                    style={{
                      padding: '10px 4px',
                      fontSize: 12,
                      fontWeight: 800,
                      textAlign: 'center',
                      border: picked ? '2px solid #F5C400' : taken ? '1.5px dashed #ddd' : '1.5px solid #e8d5ac',
                      borderRadius: 10,
                      cursor: taken ? 'not-allowed' : 'pointer',
                      backgroundColor: picked ? '#F5C400' : taken ? '#f5f0e8' : '#fff',
                      color: picked ? '#3d2a00' : taken ? '#ccc' : '#1e1200',
                      fontFamily: 'inherit',
                      transition: 'all 0.12s',
                    }}
                    onMouseOver={e => { if (!taken && !picked) e.currentTarget.style.backgroundColor = '#fff8e0'; }}
                    onMouseOut={e => { if (!taken && !picked) e.currentTarget.style.backgroundColor = '#fff'; }}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>

            {/* Afternoon Slots */}
            <div style={{ 
              fontSize: 12, 
              fontWeight: 800, 
              color: '#B46A02', 
              marginBottom: 10, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6 
            }}>
              🌤️ Afternoon
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: 8, 
              marginBottom: 20 
            }}>
              {afternoonSlots.map(slot => {
                const taken = takenSlots.includes(slot);
                const picked = selSlot === slot;
                return (
                  <button 
                    key={slot} 
                    onClick={() => pickSlot(slot)} 
                    disabled={taken} 
                    style={{
                      padding: '10px 4px',
                      fontSize: 12,
                      fontWeight: 800,
                      textAlign: 'center',
                      border: picked ? '2px solid #F5C400' : taken ? '1.5px dashed #ddd' : '1.5px solid #e8d5ac',
                      borderRadius: 10,
                      cursor: taken ? 'not-allowed' : 'pointer',
                      backgroundColor: picked ? '#F5C400' : taken ? '#f5f0e8' : '#fff',
                      color: picked ? '#3d2a00' : taken ? '#ccc' : '#1e1200',
                      fontFamily: 'inherit',
                      transition: 'all 0.12s',
                    }}
                    onMouseOver={e => { if (!taken && !picked) e.currentTarget.style.backgroundColor = '#fff8e0'; }}
                    onMouseOut={e => { if (!taken && !picked) e.currentTarget.style.backgroundColor = '#fff'; }}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ 
              display: 'flex', 
              gap: 16,
              justifyContent: 'center',
              paddingTop: 8,
              borderTop: '1px solid #e8d5ac',
              flexWrap: 'wrap',
            }}>
              {[
                { color: '#F5C400', border: 'none', label: 'Selected' },
                { color: '#fff', border: '1.5px solid #e8d5ac', label: 'Available' },
                { color: '#f5f0e8', border: '1.5px dashed #ddd', label: 'Not available' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: l.color, border: l.border }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#888' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notice Bar */}
        <div style={{
          marginTop: 24,
          backgroundColor: '#fff8e0',
          border: '1.5px solid #f0d870',
          borderRadius: 10,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            fontSize: 13, 
            fontWeight: 600, 
            color: '#7a5a00'
          }}>
            <Icon d={IC.info} size={16} color="#B46A02" />
            Appointments must be booked at least 24 hours in advance.
          </div>
          <div style={{ 
            fontSize: 13, 
            fontWeight: 700, 
            color: '#3d2a00',
            backgroundColor: '#fff',
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid #f0d870'
          }}>
            Selected date: <strong>{selDateLabel}</strong>
          </div>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        flexDirection: 'row',
      }}>
        <BrownBtn onClick={onBack}>
          <span>← Back</span>
        </BrownBtn>
        <BrownBtn onClick={onNext} disabled={!selDay || !selSlot}>
          Next → Review &amp; submit
        </BrownBtn>
      </div>
    </div>
  );
};

// BOOK STEP 3: REVIEW & SUBMIT
const BookStep3 = ({ booking, userData, currentUser, onBack, onSubmit, submitting }) => {
  const dateStr = booking.day
    ? `${MONTHS[booking.month]} ${booking.day}, ${booking.year}`
    : '—';
  const timeEnd = booking.slot
    ? (() => {
        const [h, m, ap] = booking.slot.replace(' AM','').replace(' PM','').split(/[: ]/).concat([booking.slot.includes('AM') ? 'AM' : 'PM']);
        let hh = parseInt(h), mm = parseInt(m);
        mm += 30; if (mm >= 60) { hh += 1; mm -= 60; }
        if (hh > 12) hh -= 12;
        return `${hh}:${mm.toString().padStart(2,'0')} ${ap}`;
      })()
    : '';
  const timeStr = booking.slot ? `${booking.slot} — ${timeEnd}` : '—';

  const nicMasked = userData?.nic
    ? 'X'.repeat(userData.nic.length)
    : 'XXXXXXXXXXXX';

  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={S.content}>
      <h1 style={{ 
        fontSize: isMobile ? 'clamp(22px, 6vw, 26px)' : 26, 
        fontWeight: 900, 
        color: '#1e1200', 
        marginBottom: 20 
      }}>Book an appointment</h1>
      <StepBar step={3} />

      <div style={{ 
        ...S.card, 
        padding: isMobile ? '20px' : '26px 28px', 
        marginBottom: 24 
      }}>
        <h2 style={{ 
          fontSize: isMobile ? 'clamp(18px, 5vw, 22px)' : 20, 
          fontWeight: 900, 
          color: '#1e1200', 
          marginBottom: 20 
        }}>Review your request</h2>

        {/* Selected Service Banner */}
        <div style={{
          backgroundColor: '#8a6040',
          borderRadius: '12px',
          padding: isMobile ? '16px' : '14px 20px',
          marginBottom: isMobile ? 16 : 0,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            <Icon d={IC.doc} size={isMobile ? 20 : 18} color="#f0d890" />
            <div>
              <div style={{ 
                fontSize: isMobile ? 11 : 10, 
                fontWeight: 800, 
                color: '#f0d890', 
                textTransform: 'uppercase', 
                letterSpacing: 1, 
                marginBottom: 4 
              }}>
                Selected Service
              </div>
              <div style={{ 
                fontSize: isMobile ? 'clamp(15px, 4.5vw, 18px)' : 16, 
                fontWeight: 900, 
                color: '#fff' 
              }}>
                {booking.service?.name || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Details Container */}
        <div style={{
          backgroundColor: '#fffbe8',
          border: '1.5px solid #f0e4b0',
          borderRadius: '12px',
          padding: isMobile ? '20px' : '22px 24px',
          marginTop: isMobile ? 0 : -1,
        }}>
          {/* Responsive Grid */}
          <div style={{ 
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 24 : 32,
          }}>
            {/* Left - Appointment Details */}
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: isMobile ? 12 : 11, 
                fontWeight: 800, 
                color: '#B46A02', 
                textTransform: 'uppercase', 
                letterSpacing: 1, 
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <Icon d={IC.calendar} size={14} color="#B46A02" />
                Appointment Details
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Date */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12,
                  flexWrap: 'wrap',
                }}>
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    backgroundColor: '#fff0d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon d={IC.calendar} size={16} color="#B46A02" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#999', marginBottom: 2 }}>Date</div>
                    <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, color: '#1e1200' }}>
                      {dateStr}
                    </div>
                  </div>
                </div>

                {/* Time */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12,
                  flexWrap: 'wrap',
                }}>
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    backgroundColor: '#fff0d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon d={IC.clock} size={16} color="#B46A02" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#999', marginBottom: 2 }}>Time</div>
                    <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, color: '#1e1200' }}>
                      {timeStr}
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12,
                  flexWrap: 'wrap',
                }}>
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    backgroundColor: '#fff0d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon d={IC.location} size={16} color="#B46A02" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#999', marginBottom: 2 }}>Location</div>
                    <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, color: '#1e1200' }}>
                      {userData?.dsDiv ? `Divisional Secretariat, ${userData.dsDiv}` : 'Divisional Secretariat Office'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vertical Divider - only on desktop */}
            {!isMobile && (
              <div style={{ width: 1, backgroundColor: '#f0e4b0', margin: '0 8px' }} />
            )}

            {/* Right - Applicant Information */}
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: isMobile ? 12 : 11, 
                fontWeight: 800, 
                color: '#B46A02', 
                textTransform: 'uppercase', 
                letterSpacing: 1, 
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <Icon d={IC.profile} size={14} color="#B46A02" />
                Applicant Information
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Name */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#999', marginBottom: 4 }}>Full Name</div>
                  <div style={{ 
                    fontSize: isMobile ? 15 : 16, 
                    fontWeight: 800, 
                    color: '#1e1200',
                    backgroundColor: '#fff',
                    padding: isMobile ? '8px 12px' : 0,
                    borderRadius: isMobile ? 8 : 0,
                  }}>
                    {userData?.fullName || currentUser?.displayName || 'User'}
                  </div>
                </div>

                {/* NIC */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#999', marginBottom: 4 }}>NIC Number</div>
                  <div style={{ 
                    fontSize: isMobile ? 14 : 15, 
                    fontWeight: 600, 
                    color: '#555',
                    fontFamily: 'monospace',
                    backgroundColor: '#fff',
                    padding: isMobile ? '8px 12px' : 0,
                    borderRadius: isMobile ? 8 : 0,
                  }}>
                    {nicMasked}
                  </div>
                </div>

                {/* Mobile */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#999', marginBottom: 4 }}>Mobile Number</div>
                  <div style={{ 
                    fontSize: isMobile ? 14 : 15, 
                    fontWeight: 600, 
                    color: '#555',
                    backgroundColor: '#fff',
                    padding: isMobile ? '8px 12px' : 0,
                    borderRadius: isMobile ? 8 : 0,
                  }}>
                    {userData?.mobile || currentUser?.phoneNumber || 'Not provided'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Horizontal Divider for mobile */}
          {isMobile && (
            <div style={{ 
              height: 1, 
              backgroundColor: '#f0e4b0', 
              margin: '20px 0' 
            }} />
          )}

          {/* Additional Notes Section */}
          {booking.notes && (
            <>
              <div style={{ marginTop: isMobile ? 0 : 20 }}>
                <div style={{ 
                  fontSize: 11, 
                  fontWeight: 800, 
                  color: '#B46A02', 
                  textTransform: 'uppercase', 
                  letterSpacing: 1, 
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <Icon d={IC.info} size={14} color="#B46A02" />
                  Additional Notes
                </div>
                <div style={{
                  backgroundColor: '#fff8e8',
                  padding: isMobile ? '14px' : '12px 16px',
                  borderRadius: 10,
                  borderLeft: '3px solid #F5C400',
                  fontSize: isMobile ? 13 : 14,
                  fontWeight: 600,
                  color: '#555',
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                }}>
                  "{booking.notes}"
                </div>
              </div>
              {isMobile && <div style={{ height: 1, backgroundColor: '#f0e4b0', margin: '20px 0' }} />}
            </>
          )}

          {/* Agreement Checkbox */}
          <div style={{ 
            marginTop: isMobile ? 8 : 20,
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: 12,
            backgroundColor: isMobile ? '#fff8e8' : 'transparent',
            padding: isMobile ? '16px' : 0,
            borderRadius: isMobile ? 12 : 0,
            border: isMobile ? '1.5px solid #f0e4b0' : 'none',
          }}>
            <input 
              type="checkbox" 
              defaultChecked 
              id="agreementCheckbox"
              style={{ 
                width: isMobile ? 20 : 18, 
                height: isMobile ? 20 : 18, 
                accentColor: '#F5C400', 
                marginTop: 2, 
                cursor: 'pointer', 
                flexShrink: 0 
              }} 
            />
            <label 
              htmlFor="agreementCheckbox"
              style={{ 
                fontSize: isMobile ? 'clamp(12px, 3.5vw, 13px)' : 12, 
                fontWeight: 600, 
                color: '#666', 
                lineHeight: 1.5,
                cursor: 'pointer',
              }}
            >
              I confirm that the information provided is accurate and I agree to the appointment terms.
            </label>
          </div>
        </div>
      </div>

      {/* Bottom Buttons - Inline on all devices */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        flexDirection: 'row',
      }}>
        <BrownBtn onClick={onBack} style={{ 
          width: isMobile ? '100%' : 'auto',
          justifyContent: 'center',
        }}>
          <span>← Back</span>
        </BrownBtn>
        <YellowBtn 
          onClick={onSubmit} 
          disabled={submitting}
          style={{ 
            width: isMobile ? '100%' : 'auto',
            justifyContent: 'center',
          }}
        >
          {submitting ? 'Submitting…' : 'Submit appointment request'}
        </YellowBtn>
      </div>
    </div>
  );
};

//  SCREEN — SUCCESS
const BookSuccess = ({ onBack }) => {
  // Detect mobile for responsive adjustments
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ 
      ...S.content, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: 'calc(100vh - 200px)',
      padding: isMobile ? '16px' : '28px 32px',
    }}>
      <div style={{ 
        ...S.card, 
        padding: isMobile ? '28px 20px' : '30px 28px', 
        textAlign: 'center', 
        maxWidth: isMobile ? 360 : 400,
        width: '90%',
        margin: '0',
      }}>
        {/* Success Icon */}
        <div style={{ 
          width: isMobile ? 56 : 64, 
          height: isMobile ? 56 : 64, 
          borderRadius: '50%', 
          backgroundColor: '#e6f9ee', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 16px',
        }}>
          <Icon d={IC.check} size={isMobile ? 28 : 32} color="#1a7a3a" sw={2.5} />
        </div>
        
        {/* Success Title */}
        <h2 style={{ 
          fontSize: isMobile ? 20 : 22, 
          fontWeight: 900, 
          color: '#1e1200', 
          marginBottom: 12 
        }}>
          Appointment Requested!
        </h2>
        
        {/* Success Messages */}
        <p style={{ 
          fontSize: isMobile ? 13 : 14, 
          color: '#666', 
          fontWeight: 500, 
          lineHeight: 1.5, 
          marginBottom: 8,
        }}>
          Your appointment request has been submitted.
        </p>
        
        <p style={{ 
          fontSize: isMobile ? 13 : 14, 
          color: '#666', 
          fontWeight: 500, 
          lineHeight: 1.5, 
          marginBottom: 24,
        }}>
          You will receive a confirmation once the GN Officer approves it.
        </p>
        
        {/* Back Button */}
        <button 
          onClick={onBack}
          style={{ 
            width: '100%',
            backgroundColor: '#F5C400',
            border: 'none',
            borderRadius: 999,
            padding: isMobile ? '10px 16px' : '10px 20px',
            fontSize: isMobile ? 14 : 13,
            fontWeight: 800,
            color: '#3d2a00',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#d4a800'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#F5C400'}
        >
          ← Back to My Appointments
        </button>
      </div>
    </div>
  );
};

//  MAIN COMPONENT
const Appointments = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        <DesktopSidebar activePage="appointments" navigate={navigate} onLogout={handleLogout} />

        {/* Mobile Sidebar Overlay */}
        <MobileSidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          activePage="appointments"
          navigate={navigate}
          onLogout={handleLogout}
        />

        <div style={S.main}>
          {/* Desktop Topbar */}
          <DesktopTopbar chipName={chipName} />

          {/* Mobile Topbar with Search Below */}
          <MobileTopbar chipName={chipName} onMenuClick={() => setMobileMenuOpen(true)} />

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
