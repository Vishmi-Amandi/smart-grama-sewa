import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';

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
  globe:     'M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z M2 12h20',
  palette:   'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z',
  notif:     'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  shield:    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  user:      'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
};

// Apply theme to the whole app
const applySettings = (s) => {
  const root = document.documentElement;

  if (s.theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
    root.style.setProperty('--bg-page',    '#1a1a2e');
    root.style.setProperty('--bg-sidebar', '#16213e');
    root.style.setProperty('--bg-card',    '#2d2d44');
    root.style.setProperty('--bg-topbar',  '#16213e');
    root.style.setProperty('--text-main',  '#f0f0f0');
    root.style.setProperty('--text-sub',   '#aaaacc');
    root.style.setProperty('--border',     '#3a3a5c');
  } else {
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
    root.style.setProperty('--bg-page',    '#f5f0e8');
    root.style.setProperty('--bg-sidebar', '#F5C400');
    root.style.setProperty('--bg-card',    '#ffffff');
    root.style.setProperty('--bg-topbar',  '#ffffff');
    root.style.setProperty('--text-main',  '#1e1200');
    root.style.setProperty('--text-sub',   '#888888');
    root.style.setProperty('--border',     '#e8d5ac');
  }

  // Text size
  const sizes = { small: '14px', normal: '16px', large: '18px' };
  if (s.textSize === 'small') {
    document.body.style.fontSize = '14px';
  } else if (s.textSize === 'large') {
    document.body.style.fontSize = '18px';
  } else {
    document.body.style.fontSize = '16px';
  }

  root.setAttribute('data-textsize', s.textSize || 'normal');
};

// NavItem for sidebar
const NavItem = ({ iconPath, label, active, onClick }) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
    padding: '11px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
    backgroundColor: active ? 'rgba(255,255,255,0.9)' : 'transparent',
    color: '#3d2a00', fontWeight: active ? 800 : 600, fontSize: '14px',
    fontFamily: 'inherit', textAlign: 'left', marginBottom: '2px', transition: 'background 0.15s',
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
    { key: 'logout', icon: IC.logout, label: 'Signout' },
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

// Mobile Topbar
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
      <div style={{ flex: 1, display: 'flex', justifyContent: 'left' }}>
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

// Mobile Search Bar )
const MobileSearchBar = () => (
  <div style={{
    padding: '12px 16px',
    backgroundColor: '#f5f0e8',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      backgroundColor: '#fff', border: '1.5px solid #e8d8b0',
      borderRadius: 999, padding: '12px 16px',
    }}>
      <Icon d={IC.search} size={16} color="#aaa" />
      <span style={{ fontSize: 14, color: '#bbb', fontWeight: 600 }}>Search ...</span>
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

// Radio option row
const RadioOption = ({ selected, onClick, label, sub }) => (
  <div onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '16px 20px',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    cursor: 'pointer',
    border: '1.5px solid transparent',
    transition: 'all .15s',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  }}
    onMouseOver={e => { if (!selected) e.currentTarget.style.border = '1.5px solid #F5C400'; }}
    onMouseOut={e  => { if (!selected) e.currentTarget.style.border = '1.5px solid transparent'; }}
  >
    <div style={{
      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
      border: selected ? '5px solid #1e1200' : '2px solid #ccc',
      backgroundColor: '#fff',
      transition: 'all .15s',
    }} />
    <div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1e1200' }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#aaa', marginTop: 2 }}>{sub}</div>
    </div>
  </div>
);

// Horizontal tab
const HTab = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '12px 18px', border: 'none', background: 'none',
    fontSize: 14, fontWeight: active ? 800 : 600,
    color: active ? '#1e1200' : '#888',
    borderBottom: active ? '2.5px solid #1e1200' : '2.5px solid transparent',
    marginBottom: -2, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all .15s', flexShrink: 0, whiteSpace: 'nowrap',
  }}>
    <span style={{ fontSize: 16 }}>{icon}</span>
    {label}
  </button>
);

// Toast
const Toast = ({ show }) => (
  <div style={{
    position: 'fixed', bottom: 28, right: 28, zIndex: 999,
    backgroundColor: '#1e1200', color: '#fff',
    padding: '12px 22px', borderRadius: 12,
    fontSize: 13, fontWeight: 700,
    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    opacity: show ? 1 : 0,
    transform: show ? 'translateY(0)' : 'translateY(12px)',
    transition: 'all .3s ease',
    pointerEvents: 'none',
  }}>
    ✓ Settings saved
  </div>
);

// Content Card
const ContentCard = ({ children }) => (
  <div style={{
    backgroundColor: '#fffbe8',
    border: '1.5px solid #f0e4a0',
    borderRadius: 16,
    padding: '28px 28px',
  }}>
    {children}
  </div>
);

// SECURITY TAB COMPONENT
const inp = {
  width: '100%', padding: '13px 16px', fontSize: '14px', fontWeight: 500,
  color: '#1e1200', backgroundColor: '#f5f0e8', border: '1.5px solid #e8d5ac',
  borderRadius: '10px', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s', fontFamily: 'inherit',
};

const SecurityTab = ({ currentUser, userData, db }) => {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const [newMobile, setNewMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [mobLoading, setMobLoading] = useState(false);
  const [mobError, setMobError] = useState('');
  const [mobSuccess, setMobSuccess] = useState(false);
  
  // mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleChangePassword = async () => {
    setPwError(''); setPwSuccess(false);
    if (!currentPw || !newPw || !confirmPw) { setPwError('Please fill all fields.'); return; }
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setPwError("New passwords don't match."); return; }

    setPwLoading(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPw);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPw);
      setPwSuccess(true);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
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

  const handleSendOtp = () => {
    setMobError('');
    if (!newMobile.trim()) { setMobError('Please enter a new mobile number.'); return; }
    if (!/^(\+94|0)?[0-9]{9,10}$/.test(newMobile.replace(/\s/g, ''))) {
      setMobError('Please enter a valid Sri Lanka mobile number.'); return;
    }
    setMobLoading(true);
    setTimeout(() => {
      setMobLoading(false);
      setOtpSent(true);
      setMobError('');
    }, 1000);
  };

  const handleVerifyOtp = async () => {
    setMobError('');
    if (otp.length !== 6) { setMobError('Please enter the 6-digit OTP.'); return; }
    if (otp !== '123456') { setMobError('Incorrect OTP. Please try again.'); return; }
    setMobLoading(true);
    try {
      if (currentUser) {
        await updateDoc(doc(db, 'users', currentUser.uid), { mobile: newMobile });
      }
      setMobSuccess(true);
      setNewMobile(''); setOtp(''); setOtpSent(false);
      setTimeout(() => setMobSuccess(false), 3000);
    } catch (e) {
      setMobError('Failed to update mobile. Please try again.');
    } finally {
      setMobLoading(false);
    }
  };

  const fieldStyle = (hasError) => ({
    ...inp,
    borderColor: hasError ? '#e05050' : '#e8d5ac',
    marginBottom: '10px',
  });

  return (
    <div style={{ backgroundColor: '#fffbe8', border: '1.5px solid #f0e4a0', borderRadius: 16, padding: isMobile ? '20px' : '24px 24px' }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#3d2a00', marginBottom: 20 }}>
        Privacy & Security
      </div>
      
      {/* Responsive Grid - Stacks on mobile, side by side on desktop */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        gap: 18 
      }}>
        
        {/* Left: Change Password */}
        <div style={{ 
          flex: 1,
          backgroundColor: '#fff', 
          borderRadius: 14, 
          padding: isMobile ? '20px' : '22px 22px', 
          boxShadow: '0 1px 6px rgba(0,0,0,0.06)' 
        }}>
          <div style={{ 
            fontSize: isMobile ? 16 : 14, 
            fontWeight: 800, 
            color: '#1e1200', 
            marginBottom: 18 
          }}>🔐 Change password</div>
          
          {pwSuccess && (
            <div style={{ 
              backgroundColor: '#e6f9ee', border: '1px solid #7ec07e', 
              borderRadius: 10, padding: '12px', marginBottom: 14, 
              fontSize: 13, fontWeight: 700, color: '#1a5c1a' 
            }}>
              ✅ Password changed successfully!
            </div>
          )}
          
          {pwError && (
            <div style={{ 
              backgroundColor: '#fde8e8', border: '1px solid #f0a0a0', 
              borderRadius: 10, padding: '12px', marginBottom: 14, 
              fontSize: 13, fontWeight: 700, color: '#8b1a1a' 
            }}>
              ⚠ {pwError}
            </div>
          )}
          
          <input 
            type="password" 
            value={currentPw} 
            onChange={e => { setCurrentPw(e.target.value); setPwError(''); }} 
            placeholder="Current Password" 
            style={fieldStyle(pwError && !currentPw)} 
          />
          
          <input 
            type="password" 
            value={newPw} 
            onChange={e => { setNewPw(e.target.value); setPwError(''); }} 
            placeholder="New Password (min. 8 characters)" 
            style={fieldStyle(pwError && !newPw)} 
          />
          
          <input 
            type="password" 
            value={confirmPw} 
            onChange={e => { setConfirmPw(e.target.value); setPwError(''); }} 
            placeholder="Confirm New Password" 
            style={{ ...fieldStyle(pwError && !confirmPw), marginBottom: 18 }} 
          />
          
          <button 
            onClick={handleChangePassword} 
            disabled={pwLoading} 
            style={{ 
              width: '100%', 
              padding: isMobile ? '14px' : '13px', 
              borderRadius: 10, 
              backgroundColor: pwLoading ? '#555' : '#1e1200', 
              border: 'none', 
              color: '#fff', 
              fontSize: isMobile ? 15 : 14, 
              fontWeight: 800, 
              cursor: pwLoading ? 'not-allowed' : 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 8,
              fontFamily: 'inherit',
            }}
          >
            {pwLoading ? (
              <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin .7s linear infinite' }} /> Updating…</>
            ) : 'Update Password'}
          </button>
        </div>

        {/* Right: Update Mobile Number */}
        <div style={{ 
          flex: 1,
          backgroundColor: '#fff', 
          borderRadius: 14, 
          padding: isMobile ? '20px' : '22px 22px', 
          boxShadow: '0 1px 6px rgba(0,0,0,0.06)' 
        }}>
          <div style={{ 
            fontSize: isMobile ? 16 : 14, 
            fontWeight: 800, 
            color: '#1e1200', 
            marginBottom: 18 
          }}>📱 Update Mobile Number</div>
          
          {mobSuccess && (
            <div style={{ 
              backgroundColor: '#e6f9ee', border: '1px solid #7ec07e', 
              borderRadius: 10, padding: '12px', marginBottom: 14, 
              fontSize: 13, fontWeight: 700, color: '#1a5c1a' 
            }}>
              ✅ Mobile number updated successfully!
            </div>
          )}
          
          {mobError && (
            <div style={{ 
              backgroundColor: '#fde8e8', border: '1px solid #f0a0a0', 
              borderRadius: 10, padding: '12px', marginBottom: 14, 
              fontSize: 13, fontWeight: 700, color: '#8b1a1a' 
            }}>
              ⚠ {mobError}
            </div>
          )}
          
          <input 
            type="tel" 
            value={newMobile} 
            onChange={e => { setNewMobile(e.target.value); setMobError(''); setOtpSent(false); setOtp(''); }} 
            placeholder="New Mobile Number" 
            style={fieldStyle(false)} 
          />
          
          <button 
            onClick={handleSendOtp} 
            disabled={mobLoading || otpSent} 
            style={{ 
              width: '100%', 
              padding: isMobile ? '14px' : '13px', 
              borderRadius: 10, 
              marginBottom: 12, 
              backgroundColor: (mobLoading || otpSent) ? '#e8d888' : '#F5C400', 
              border: 'none', 
              color: '#3d2a00', 
              fontSize: isMobile ? 15 : 14, 
              fontWeight: 800, 
              cursor: (mobLoading || otpSent) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {mobLoading && !otpSent ? 'Sending OTP…' : otpSent ? '✓ OTP Sent' : 'Send OTP'}
          </button>
          
          <input 
            type="text" 
            value={otp} 
            onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setMobError(''); }} 
            placeholder="Enter 6-digit OTP" 
            disabled={!otpSent} 
            style={{ 
              ...fieldStyle(false), 
              backgroundColor: otpSent ? '#f5f0e8' : '#f0ece8', 
              cursor: otpSent ? 'text' : 'not-allowed', 
              opacity: otpSent ? 1 : 0.6, 
              letterSpacing: otp ? (isMobile ? '4px' : '6px') : '0', 
              fontWeight: 800,
              textAlign: 'center',
              fontSize: isMobile ? 16 : 14,
            }} 
          />
          
          {otpSent && (
            <button 
              onClick={handleVerifyOtp} 
              disabled={mobLoading || otp.length !== 6} 
              style={{ 
                width: '100%', 
                padding: isMobile ? '14px' : '13px', 
                borderRadius: 10, 
                marginTop: 4, 
                backgroundColor: (mobLoading || otp.length !== 6) ? '#555' : '#1e1200', 
                border: 'none', 
                color: '#fff', 
                fontSize: isMobile ? 15 : 14, 
                fontWeight: 800, 
                cursor: (mobLoading || otp.length !== 6) ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {mobLoading ? (
                <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin .7s linear infinite' }} /> Verifying…</>
              ) : 'Verify & Update'}
            </button>
          )}
          
          {otpSent && (
            <p style={{ 
              fontSize: isMobile ? 11 : 11, 
              color: '#aaa', 
              fontWeight: 600, 
              marginTop: 12, 
              textAlign: 'center' 
            }}>
              Demo OTP: <strong>123456</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ACCOUNT TAB COMPONENT
const AccountTab = ({ currentUser, userData, navigate }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);
  
  // Detect mobile
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

  const rowStyle = { 
    paddingBottom: isMobile ? 14 : 16, 
    marginBottom: isMobile ? 14 : 16, 
    borderBottom: '1px solid #f0ece4' 
  };
  
  const labelStyle = { 
    fontSize: isMobile ? 11 : 12, 
    fontWeight: 700, 
    color: '#B46A02', 
    marginBottom: 4 
  };
  
  const valueStyle = { 
    fontSize: isMobile ? 15 : 15, 
    fontWeight: 700, 
    color: '#1e1200' 
  };

  return (
    <div style={{ 
      backgroundColor: '#fffbe8', 
      border: '1.5px solid #f0e4a0', 
      borderRadius: 16, 
      padding: isMobile ? '20px' : '24px 24px' 
    }}>
      <div style={{ fontSize: isMobile ? 16 : 15, fontWeight: 800, color: '#3d2a00', marginBottom: 20 }}>
        Account
      </div>

      {/* Account Summary Card */}
      <div style={{ 
        backgroundColor: '#fff', 
        borderRadius: 14, 
        padding: isMobile ? '20px' : '22px 24px', 
        marginBottom: 16, 
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)' 
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: 20,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 12 : 0,
        }}>
          <div style={{ fontSize: isMobile ? 15 : 14, fontWeight: 800, color: '#1e1200' }}>
            Account Summary
          </div>
          <button 
            onClick={() => navigate('/profile')} 
            style={{ 
              padding: isMobile ? '10px 20px' : '10px 22px', 
              borderRadius: 999, 
              backgroundColor: '#3d2a00', 
              border: 'none', 
              fontSize: isMobile ? 13 : 13, 
              fontWeight: 800, 
              color: '#fff', 
              cursor: 'pointer', 
              width: isMobile ? '100%' : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            Edit profile →
          </button>
        </div>
        
        <div style={rowStyle}>
          <div style={labelStyle}>Citizen</div>
          <div style={valueStyle}>{userData?.fullName || currentUser?.displayName || 'N/A'}</div>
        </div>
        
        <div style={rowStyle}>
          <div style={labelStyle}>Member since</div>
          <div style={valueStyle}>{createdAt}</div>
        </div>
        
        <div>
          <div style={labelStyle}>GN division</div>
          <div style={valueStyle}>{gnDivLabel}</div>
        </div>
      </div>

      {/* Danger Zone Card */}
      <div style={{ 
        backgroundColor: '#fff', 
        borderRadius: 14, 
        padding: isMobile ? '20px' : '22px 24px', 
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)', 
        border: '1.5px solid #f0c0c0' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span style={{ fontSize: isMobile ? 15 : 14, fontWeight: 900, color: '#c0392b' }}>Danger Zone</span>
        </div>
        <p style={{ 
          fontSize: isMobile ? 11 : 12, 
          fontWeight: 600, 
          color: '#e05050', 
          marginBottom: 22 
        }}>
          These actions are permanent and cannot be undone
        </p>

        {/* Sign Out Section */}
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'flex-start', 
          justifyContent: 'space-between', 
          gap: isMobile ? 16 : 16, 
          paddingBottom: 20, 
          marginBottom: 20, 
          borderBottom: '1px solid #f0ece4' 
        }}>
          <div>
            <div style={{ fontSize: isMobile ? 15 : 14, fontWeight: 800, color: '#1e1200', marginBottom: 4 }}>
              Sign Out of All Devices
            </div>
            <div style={{ fontSize: isMobile ? 11 : 12, fontWeight: 600, color: '#888' }}>
              Immediately ends all active sessions across every device.
            </div>
          </div>
          <button 
            onClick={handleSignOutEverywhere} 
            disabled={signOutLoading} 
            style={{ 
              padding: isMobile ? '12px 20px' : '10px 20px', 
              borderRadius: 999, 
              flexShrink: 0, 
              width: isMobile ? '100%' : 'auto',
              backgroundColor: '#fde8e8', 
              border: '1.5px solid #f0a0a0', 
              fontSize: isMobile ? 14 : 13, 
              fontWeight: 800, 
              color: '#c0392b', 
              cursor: signOutLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {signOutLoading ? 'Signing out…' : '🚪 Sign Out everywhere'}
          </button>
        </div>

        {/* Delete Account Section */}
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'flex-start', 
          justifyContent: 'space-between', 
          gap: isMobile ? 16 : 16 
        }}>
          <div>
            <div style={{ fontSize: isMobile ? 15 : 14, fontWeight: 800, color: '#1e1200', marginBottom: 4 }}>
              Delete My Account
            </div>
            <div style={{ fontSize: isMobile ? 11 : 12, fontWeight: 600, color: '#888' }}>
              Permanently deletes your account and all data. This requires GN Officer approval and cannot be reversed.
            </div>
          </div>
          <button 
            onClick={() => setShowDeleteConfirm(true)} 
            style={{ 
              padding: isMobile ? '12px 20px' : '10px 20px', 
              borderRadius: 999, 
              flexShrink: 0, 
              width: isMobile ? '100%' : 'auto',
              backgroundColor: '#fde8e8', 
              border: '1.5px solid #e05050', 
              fontSize: isMobile ? 14 : 13, 
              fontWeight: 800, 
              color: '#c0392b', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            🗑️ Request Deletion
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal - Mobile Responsive */}
      {showDeleteConfirm && (
        <>
          <div 
            onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }} 
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 }} 
          />
          <div style={{ 
            position: 'fixed', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%,-50%)', 
            zIndex: 101, 
            width: 'calc(100% - 32px)', 
            maxWidth: 440, 
            backgroundColor: '#fff', 
            borderRadius: 20, 
            padding: isMobile ? '24px' : '28px 28px', 
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)', 
            border: '2px solid #f0a0a0' 
          }}>
            <div style={{ fontSize: isMobile ? 40 : 36, textAlign: 'center', marginBottom: 10 }}>⚠️</div>
            <h2 style={{ 
              fontSize: isMobile ? 18 : 18, 
              fontWeight: 900, 
              color: '#1e1200', 
              textAlign: 'center', 
              marginBottom: 8 
            }}>
              Request Account Deletion?
            </h2>
            <p style={{ 
              fontSize: isMobile ? 13 : 13, 
              color: '#888', 
              fontWeight: 600, 
              textAlign: 'center', 
              lineHeight: 1.6, 
              marginBottom: 20 
            }}>
              This will submit a deletion request to your GN Officer.<br />
              Your account will remain active until approved.<br />
              <strong style={{ color: '#c0392b' }}>This cannot be undone.</strong>
            </p>
            <p style={{ 
              fontSize: isMobile ? 12 : 12, 
              fontWeight: 700, 
              color: '#555', 
              marginBottom: 8 
            }}>
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input 
              type="text" 
              value={deleteInput} 
              onChange={e => setDeleteInput(e.target.value)} 
              placeholder="Type DELETE here" 
              style={{ 
                width: '100%', 
                padding: isMobile ? '14px' : '12px 14px', 
                borderRadius: 10, 
                boxSizing: 'border-box', 
                border: '1.5px solid #e8d5ac', 
                fontSize: isMobile ? 14 : 14, 
                fontWeight: 700, 
                fontFamily: 'inherit', 
                outline: 'none', 
                marginBottom: 20, 
                backgroundColor: '#f8f6f0',
                textAlign: 'center',
                letterSpacing: deleteInput === 'DELETE' ? '2px' : '0',
              }} 
            />
            <div style={{ 
              display: 'flex', 
              gap: 12, 
              flexDirection: isMobile ? 'column' : 'row',
            }}>
              <button 
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }} 
                style={{ 
                  flex: 1, 
                  padding: isMobile ? '14px' : '12px', 
                  borderRadius: 999, 
                  border: '1.5px solid #e8d5ac', 
                  backgroundColor: '#fff', 
                  fontSize: isMobile ? 14 : 14, 
                  fontWeight: 800, 
                  color: '#888', 
                  cursor: 'pointer', 
                  fontFamily: 'inherit' 
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleRequestDeletion} 
                disabled={deleteInput !== 'DELETE' || deleting} 
                style={{ 
                  flex: 1, 
                  padding: isMobile ? '14px' : '12px', 
                  borderRadius: 999, 
                  border: 'none', 
                  backgroundColor: deleteInput === 'DELETE' ? '#c0392b' : '#f0c0c0', 
                  fontSize: isMobile ? 14 : 14, 
                  fontWeight: 800, 
                  color: '#fff', 
                  cursor: deleteInput !== 'DELETE' || deleting ? 'not-allowed' : 'pointer', 
                  fontFamily: 'inherit',
                }}
              >
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

  const updateSetting = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    localStorage.setItem('userSettings', JSON.stringify(next));
    applySettings(next);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleLogout = async () => { await signOut(auth); navigate('/login'); };
  const chipName = userData?.username || userData?.fullName || currentUser?.email?.split('@')[0] || 'User';

  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f0e8' }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', border: '4px solid #F5C400', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const TABS = [
    { id: 'language', icon: '🌐', label: 'Language' },
    { id: 'appearance', icon: '🎨', label: 'Appearance' },
    { id: 'notif', icon: '🔔', label: 'Notifications' },
    { id: 'security', icon: '🛡️', label: 'Privacy & Security' },
    { id: 'account', icon: '👤', label: 'Account' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Nunito, system-ui, sans-serif', backgroundColor: '#f5f0e8' }}>
      <div style={{ flex: 1, display: 'flex' }}>

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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Desktop Topbar */}
          <DesktopTopbar chipName={chipName} />

          {/* Mobile Topbar */}
          <MobileTopbar chipName={chipName} onMenuClick={() => setMobileMenuOpen(true)} />

          {/* Mobile Search Bar */}
          {isMobile && <MobileSearchBar />}


          {/* Content Area */}
          <div style={{ padding: '28px 32px', flex: 1 }}>

            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1e1200', marginBottom: 4, letterSpacing: '-0.4px' }}>Settings</h1>
            <p style={{ fontSize: 13, color: '#888', fontWeight: 600, marginBottom: 24 }}>
              Manage your account preferences and accessibility options
            </p>

            {/* Horizontal tabs */}
            <div style={{ 
              display: 'flex', 
              borderBottom: '2px solid #e8d5ac', 
              marginBottom: 28, 
              overflowX: 'auto',
              // Hide scrollbar but keep scrolling functionality
              scrollbarWidth: 'none',  // For Firefox
              msOverflowStyle: 'none',  // For IE/Edge
            }} className="hide-scrollbar">
              {TABS.map(t => (
                <HTab key={t.id} icon={t.icon} label={t.label} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />
              ))}
            </div>

            {/* LANGUAGE */}
            {activeTab === 'language' && (
              <ContentCard>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#3d2a00', marginBottom: 16 }}>Portal Language</div>
                <RadioOption selected={settings.language === 'si'} onClick={() => updateSetting('language', 'si')} label="Sinhala" sub="Use the system in Sinhala" />
                <RadioOption selected={settings.language === 'ta'} onClick={() => updateSetting('language', 'ta')} label="Tamil" sub="Use the system in Tamil" />
                <RadioOption selected={settings.language === 'en'} onClick={() => updateSetting('language', 'en')} label="English" sub="Use the system in English" />
              </ContentCard>
            )}

            {/* APPEARANCE */}
            {activeTab === 'appearance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <ContentCard>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#3d2a00', marginBottom: 16 }}>Theme</div>
                  <RadioOption selected={settings.theme === 'light'} onClick={() => updateSetting('theme', 'light')} label="☀️ Light Mode" sub="Bright and clean interface — default" />
                  <RadioOption selected={settings.theme === 'dark'} onClick={() => updateSetting('theme', 'dark')} label="🌙 Dark Mode" sub="Dark background, easy on the eyes at night" />
                  <div style={{ marginTop: 12, padding: '10px 16px', borderRadius: 10, backgroundColor: settings.theme === 'dark' ? '#2d2d44' : '#f5f0e8', border: '1.5px solid #e8d5ac', fontSize: 12, fontWeight: 600, color: settings.theme === 'dark' ? '#aaaacc' : '#888', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {settings.theme === 'dark' ? '🌙' : '☀️'} Currently: <strong style={{ color: settings.theme === 'dark' ? '#f0f0f0' : '#3d2a00' }}>{settings.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</strong> — applied to entire app immediately
                  </div>
                </ContentCard>

                <ContentCard>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#3d2a00', marginBottom: 16 }}>Text Size</div>
                  <RadioOption selected={settings.textSize === 'small'} onClick={() => updateSetting('textSize', 'small')} label="Small" sub="Compact text — 14px" />
                  <RadioOption selected={settings.textSize === 'normal'} onClick={() => updateSetting('textSize', 'normal')} label="Normal" sub="Default text size — 16px" />
                  <RadioOption selected={settings.textSize === 'large'} onClick={() => updateSetting('textSize', 'large')} label="Large" sub="Larger text for better readability — 18px" />
                </ContentCard>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === 'notif' && (
              <ContentCard>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#3d2a00', marginBottom: 20 }}>Notifications</div>
                <div style={{ backgroundColor: '#fff', borderRadius: 14, padding: '20px 22px', marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1e1200', marginBottom: 18 }}>Updates and Announcements</div>
                  {[
                    { key: 'notifReminders', label: 'Appointment reminders', sub: 'Get notified 24 hours before your GN meeting' },
                    { key: 'notifUpdates', label: 'Appointment updates', sub: 'Instant alerts when your appointments are processed' },
                    { key: 'notifAnnouncements', label: 'New announcements', sub: 'Important notices and events' },
                  ].map((item, i, arr) => (
                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: i < arr.length - 1 ? 16 : 0, marginBottom: i < arr.length - 1 ? 16 : 0, borderBottom: i < arr.length - 1 ? '1px solid #f0ece4' : 'none' }}>
                      <div><div style={{ fontSize: 14, fontWeight: 700, color: '#1e1200', marginBottom: 3 }}>{item.label}</div><div style={{ fontSize: 12, fontWeight: 600, color: '#B46A02' }}>{item.sub}</div></div>
                      <div onClick={() => updateSetting(item.key, !settings[item.key])} style={{ width: 48, height: 26, borderRadius: 999, backgroundColor: settings[item.key] ? '#1e1200' : '#d0ccc4', position: 'relative', cursor: 'pointer', transition: 'background-color .2s', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', top: 3, left: settings[item.key] ? 25 : 3, width: 20, height: 20, borderRadius: '50%', backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left .2s' }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ backgroundColor: '#fff', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1e1200', marginBottom: 16 }}>Delivery Methods</div>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    {[
                      { key: 'deliveryEmail', label: 'Email notifications' },
                      { key: 'deliveryBrowser', label: 'Browser Push notifications' },
                      { key: 'deliverySMS', label: 'SMS notifications (message rates may apply)' },
                    ].map(item => {
                      const on = settings[item.key];
                      return (
                        <div key={item.key} onClick={() => updateSetting(item.key, !on)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, backgroundColor: on ? '#F5C400' : '#fff', border: on ? '2px solid #d4a800' : '2px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>{on && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3d2a00' }} />}</div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#1e1200' }}>{item.label}</span>
                        </div>
                      );
                    })}
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

      <footer style={{ backgroundColor: '#6A2301', color: '#fff', textAlign: 'center', padding: '13px 16px', fontSize: '13px', fontWeight: 600 }}>
        ©2026 Smart Grama Sewa
      </footer>

      <Toast show={showToast} />
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

export default Settings;