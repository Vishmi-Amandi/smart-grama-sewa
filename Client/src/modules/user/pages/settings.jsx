import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
    // Apply dark CSS variables
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
  root.style.fontSize = sizes[s.textSize] || '16px';
};

// NavItem 
const NavItem = ({ d, label, active, onClick }) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
    padding: '11px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
    backgroundColor: active ? 'rgba(255,255,255,0.9)' : 'transparent',
    color: '#3d2a00', fontWeight: active ? 800 : 600, fontSize: '14px',
    fontFamily: 'inherit', textAlign: 'left', marginBottom: '2px', transition: 'background 0.15s',
    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.10)' : 'none',
  }}
    onMouseOver={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.4)'; }}
    onMouseOut={e  => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
  >
    <Icon d={d} size={18} color={active ? '#B46A02' : '#5a3a00'} />
    {label}
  </button>
);

// Sidebar 
const Sidebar = ({ active, navigate, onLogout }) => (
  <div style={{ width: '235px', flexShrink: 0, backgroundColor: '#F5C400', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
    <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
      <img src="/logo2.png" alt="Smart Grama Sewa" style={{ height: '80px', width: 'auto' }} />
    </div>
    <div style={{ flex: 1, padding: '12px 10px' }}>
      {[
        { key: 'dashboard',     d: IC.dashboard, label: 'Dashboard'     },
        { key: 'announcements', d: IC.announce,  label: 'Announcements' },
        { key: 'appointments',  d: IC.appts,     label: 'Appointments'  },
        { key: 'forms',         d: IC.forms,     label: 'Forms'         },
        { key: 'ai',            d: IC.ai,        label: 'AI assistant'  },
      ].map(i => (
        <NavItem key={i.key} d={i.d} label={i.label} active={active === i.key}
          onClick={() => i.key === 'ai' ? window.dispatchEvent(new CustomEvent('open-chatbot')) : navigate(`/${i.key}`)} />
      ))}
    </div>
    <div style={{ padding: '10px 10px 20px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
      {[
        { key: 'profile',  d: IC.profile,  label: 'Profile'  },
        { key: 'settings', d: IC.settings, label: 'Settings' },
        { key: 'logout',   d: IC.logout,   label: 'Logout'   },
      ].map(i => (
        <NavItem key={i.key} d={i.d} label={i.label} active={active === i.key}
          onClick={() => i.key === 'logout' ? onLogout() : navigate(`/${i.key}`)} />
      ))}
    </div>
  </div>
);

// Topbar
const Topbar = ({ chipName }) => (
  <div style={{ height: '64px', backgroundColor: '#fff', borderBottom: '1px solid #e8d8b0', display: 'flex', alignItems: 'center', padding: '0 28px', gap: '14px', position: 'sticky', top: 0, zIndex: 40 }}>
    <div style={{ flex: 1, maxWidth: 420, display: 'flex', alignItems: 'center', gap: 10, backgroundColor: '#f5f0e8', border: '1.5px solid #e8d8b0', borderRadius: 999, padding: '9px 18px' }}>
      <Icon d={IC.search} size={16} color="#aaa" />
      <span style={{ fontSize: 14, color: '#bbb', fontWeight: 600 }}>search</span>
    </div>
    <div style={{ flex: 1 }} />
    <span style={{ fontSize: 14, fontWeight: 800, color: '#1e1200' }}>EN</span>
    <div style={{ width: 38, height: 38, borderRadius: '50%', backgroundColor: '#f5f0e8', border: '1.5px solid #e8d8b0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
      <Icon d={IC.bell} size={18} color="#5a3a00" />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px 5px 6px', backgroundColor: '#f5f0e8', border: '1.5px solid #e8d8b0', borderRadius: 999, cursor: 'pointer' }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#1e1200' }}>{chipName}</span>
      <div style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: '#F5C400', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon d={IC.profile} size={16} color="#3d2a00" />
      </div>
    </div>
  </div>
);

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
    {/* Radio circle */}
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
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '12px 18px', border: 'none', background: 'none',
    fontSize: 14, fontWeight: active ? 800 : 600,
    color: active ? '#1e1200' : '#888',
    borderBottom: active ? '2.5px solid #1e1200' : '2.5px solid transparent',
    marginBottom: -2, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all .15s', flexShrink: 0,
  }}
    onMouseOver={e => { if (!active) e.currentTarget.style.color = '#3d2a00'; }}
    onMouseOut={e  => { if (!active) e.currentTarget.style.color = '#888'; }}
  >
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

//  SECURITY TAB COMPONENT
const inp = {
  width: '100%', padding: '13px 16px', fontSize: '14px', fontWeight: 500,
  color: '#1e1200', backgroundColor: '#f5f0e8', border: '1.5px solid #e8d5ac',
  borderRadius: '10px', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s', fontFamily: 'inherit',
};
 
const SecurityTab = ({ currentUser, userData, db }) => {
  // Change Password state
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [pwLoading,  setPwLoading]  = useState(false);
  const [pwError,    setPwError]    = useState('');
  const [pwSuccess,  setPwSuccess]  = useState(false);
 
  // Update Mobile state
  const [newMobile,  setNewMobile]  = useState('');
  const [otp,        setOtp]        = useState('');
  const [otpSent,    setOtpSent]    = useState(false);
  const [mobLoading, setMobLoading] = useState(false);
  const [mobError,   setMobError]   = useState('');
  const [mobSuccess, setMobSuccess] = useState(false);
 
  // Change Password
  const handleChangePassword = async () => {
    setPwError(''); setPwSuccess(false);
    if (!currentPw || !newPw || !confirmPw) { setPwError('Please fill all fields.'); return; }
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setPwError("New passwords don't match."); return; }
 
    setPwLoading(true);
    try {
      // Re-authenticate first (Firebase requires this before password change)
      const credential = EmailAuthProvider.credential(currentUser.email, currentPw);
      await reauthenticateWithCredential(currentUser, credential);
      // Now update password
      await updatePassword(currentUser, newPw);
      setPwSuccess(true);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (e) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        setPwError('Current password is incorrect.');
      } else {
        setPwError('Failed to change password. Please try again.');
      }
    } finally {
      setPwLoading(false);
    }
  };
 
  // Send OTP (simulated — real OTP needs Firebase Phone Auth or SMS API)
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
 
  // Verify OTP and update mobile in Firestore
  const handleVerifyOtp = async () => {
    setMobError('');
    if (otp.length !== 6) { setMobError('Please enter the 6-digit OTP.'); return; }
    // Simulated OTP check — in production verify via Firebase Phone Auth
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
    <div style={{ backgroundColor: '#fffbe8', border: '1.5px solid #f0e4a0', borderRadius: 16, padding: '24px 24px' }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#3d2a00', marginBottom: 20 }}>
        Privacy &amp; Security
      </div>
 
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
 
        {/* ── Left: Change Password ── */}
        <div style={{ backgroundColor: '#fff', borderRadius: 14, padding: '22px 22px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1e1200', marginBottom: 18 }}>
            Change password
          </div>
 
          {/* Success banner */}
          {pwSuccess && (
            <div style={{ backgroundColor: '#e6f9ee', border: '1px solid #7ec07e', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, fontWeight: 700, color: '#1a5c1a' }}>
              ✅ Password changed successfully!
            </div>
          )}
 
          {/* Error banner */}
          {pwError && (
            <div style={{ backgroundColor: '#fde8e8', border: '1px solid #f0a0a0', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, fontWeight: 700, color: '#8b1a1a' }}>
              ⚠ {pwError}
            </div>
          )}
 
          <input
            type="password" value={currentPw}
            onChange={e => { setCurrentPw(e.target.value); setPwError(''); }}
            placeholder="Current Password"
            style={fieldStyle(pwError && !currentPw)}
            onFocus={e => e.target.style.borderColor = '#F5C400'}
            onBlur={e  => e.target.style.borderColor = '#e8d5ac'}
          />
          <input
            type="password" value={newPw}
            onChange={e => { setNewPw(e.target.value); setPwError(''); }}
            placeholder="New Password"
            style={fieldStyle(pwError && !newPw)}
            onFocus={e => e.target.style.borderColor = '#F5C400'}
            onBlur={e  => e.target.style.borderColor = '#e8d5ac'}
          />
          <input
            type="password" value={confirmPw}
            onChange={e => { setConfirmPw(e.target.value); setPwError(''); }}
            placeholder="Confirm New Password"
            style={{ ...fieldStyle(pwError && !confirmPw), marginBottom: 18 }}
            onFocus={e => e.target.style.borderColor = '#F5C400'}
            onBlur={e  => e.target.style.borderColor = '#e8d5ac'}
          />
 
          <button
            onClick={handleChangePassword}
            disabled={pwLoading}
            style={{
              width: '100%', padding: '13px', borderRadius: 10,
              backgroundColor: pwLoading ? '#555' : '#1e1200',
              border: 'none', color: '#fff', fontSize: 14, fontWeight: 800,
              cursor: pwLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background-color .15s', fontFamily: 'inherit',
            }}
            onMouseOver={e => { if (!pwLoading) e.currentTarget.style.backgroundColor = '#3d2a00'; }}
            onMouseOut={e  => { if (!pwLoading) e.currentTarget.style.backgroundColor = '#1e1200'; }}
          >
            {pwLoading ? (
              <>
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin .7s linear infinite' }} />
                Updating…
              </>
            ) : 'Confirm New Password'}
          </button>
        </div>
 
        {/* Right: Update Mobile Number */}
        <div style={{ backgroundColor: '#fff', borderRadius: 14, padding: '22px 22px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1e1200', marginBottom: 18 }}>
            Update Mobile Number
          </div>
 
          {/* Success */}
          {mobSuccess && (
            <div style={{ backgroundColor: '#e6f9ee', border: '1px solid #7ec07e', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, fontWeight: 700, color: '#1a5c1a' }}>
              ✅ Mobile number updated successfully!
            </div>
          )}
 
          {/* Error */}
          {mobError && (
            <div style={{ backgroundColor: '#fde8e8', border: '1px solid #f0a0a0', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, fontWeight: 700, color: '#8b1a1a' }}>
              ⚠ {mobError}
            </div>
          )}
 
          <input
            type="tel" value={newMobile}
            onChange={e => { setNewMobile(e.target.value); setMobError(''); setOtpSent(false); setOtp(''); }}
            placeholder="New Number"
            style={fieldStyle(false)}
            onFocus={e => e.target.style.borderColor = '#F5C400'}
            onBlur={e  => e.target.style.borderColor = '#e8d5ac'}
          />
 
          {/* Send OTP button */}
          <button
            onClick={handleSendOtp}
            disabled={mobLoading || otpSent}
            style={{
              width: '100%', padding: '13px', borderRadius: 10, marginBottom: 10,
              backgroundColor: (mobLoading || otpSent) ? '#e8d888' : '#F5C400',
              border: 'none', color: '#3d2a00', fontSize: 14, fontWeight: 800,
              cursor: (mobLoading || otpSent) ? 'not-allowed' : 'pointer',
              transition: 'background-color .15s', fontFamily: 'inherit',
            }}
            onMouseOver={e => { if (!mobLoading && !otpSent) e.currentTarget.style.backgroundColor = '#d4a800'; }}
            onMouseOut={e  => { if (!mobLoading && !otpSent) e.currentTarget.style.backgroundColor = '#F5C400'; }}
          >
            {mobLoading && !otpSent ? 'Sending OTP…' : otpSent ? '✓ OTP Sent' : 'Send OTP to new number'}
          </button>
 
          {/* OTP field — shown after OTP sent */}
          <input
            type="text" value={otp}
            onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setMobError(''); }}
            placeholder="Enter 6-digit OTP"
            disabled={!otpSent}
            style={{
              ...fieldStyle(false),
              backgroundColor: otpSent ? '#f5f0e8' : '#f0ece8',
              cursor: otpSent ? 'text' : 'not-allowed',
              opacity: otpSent ? 1 : 0.6,
              letterSpacing: otp ? '6px' : '0',
              fontWeight: 800,
            }}
            onFocus={e => { if (otpSent) e.target.style.borderColor = '#F5C400'; }}
            onBlur={e  => e.target.style.borderColor = '#e8d5ac'}
          />
 
          {/* Verify OTP button — shown after OTP sent */}
          {otpSent && (
            <button
              onClick={handleVerifyOtp}
              disabled={mobLoading || otp.length !== 6}
              style={{
                width: '100%', padding: '13px', borderRadius: 10, marginTop: 4,
                backgroundColor: (mobLoading || otp.length !== 6) ? '#555' : '#1e1200',
                border: 'none', color: '#fff', fontSize: 14, fontWeight: 800,
                cursor: (mobLoading || otp.length !== 6) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'inherit', transition: 'background-color .15s',
              }}
              onMouseOver={e => { if (!mobLoading && otp.length === 6) e.currentTarget.style.backgroundColor = '#3d2a00'; }}
              onMouseOut={e  => { if (!mobLoading && otp.length === 6) e.currentTarget.style.backgroundColor = '#1e1200'; }}
            >
              {mobLoading ? (
                <>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin .7s linear infinite' }} />
                  Verifying…
                </>
              ) : 'Verify & Update'}
            </button>
          )}
 
          {/* Demo hint */}
          {otpSent && (
            <p style={{ fontSize: 11, color: '#aaa', fontWeight: 600, marginTop: 8, textAlign: 'center' }}>
              Demo OTP: <strong>123456</strong>
            </p>
          )}
        </div>
 
      </div>
    </div>
  );
};
 
//  ACCOUNT TAB COMPONENT
const AccountTab = ({ currentUser, userData, navigate }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput,       setDeleteInput]       = useState('');
  const [deleting,          setDeleting]          = useState(false);
  const [signOutLoading,    setSignOutLoading]    = useState(false);
 
  // Member since — from Firebase Auth metadata
  const createdAt = currentUser?.metadata?.creationTime
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : 'N/A';
 
  const gnDivLabel = userData?.gnDiv && userData?.dsDiv
    ? `${userData.dsDiv} - ${userData.gnDiv}`
    : userData?.gnDiv || userData?.dsDiv || '[GN Division not set]';
 
  // Sign out of all devices — just signs out locally (Firebase doesn't support remote revocation easily)
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
 
  // Request deletion — sets a flag in Firestore for GN Officer to review
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
 
  const rowStyle = { paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid #f0ece4' };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: '#B46A02', marginBottom: 4 };
  const valueStyle = { fontSize: 15, fontWeight: 700, color: '#1e1200' };
 
  return (
    <div style={{ backgroundColor: '#fffbe8', border: '1.5px solid #f0e4a0', borderRadius: 16, padding: '24px 24px' }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#3d2a00', marginBottom: 20 }}>Account</div>
 
      {/* ── Account Summary ── */}
      <div style={{ backgroundColor: '#fff', borderRadius: 14, padding: '22px 24px', marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1e1200' }}>Account Summary</div>
          {/* Edit profile button */}
          <button
            onClick={() => navigate('/profile')}
            style={{
              padding: '10px 22px', borderRadius: 999,
              backgroundColor: '#3d2a00', border: 'none',
              fontSize: 13, fontWeight: 800, color: '#fff',
              cursor: 'pointer', transition: 'all .15s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#5a3a10'}
            onMouseOut={e  => e.currentTarget.style.backgroundColor = '#3d2a00'}
          >
            Edit profile →
          </button>
        </div>
 
        {/* Citizen row */}
        <div style={rowStyle}>
          <div style={labelStyle}>Citizen</div>
          <div style={valueStyle}>{userData?.fullName || currentUser?.displayName || 'N/A'}</div>
        </div>
 
        {/* Member since row */}
        <div style={rowStyle}>
          <div style={labelStyle}>Member since</div>
          <div style={valueStyle}>{createdAt}</div>
        </div>
 
        {/* GN Division row — last, no border */}
        <div>
          <div style={labelStyle}>GN division</div>
          <div style={valueStyle}>{gnDivLabel}</div>
        </div>
      </div>
 
      {/* ── Danger Zone ── */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: '22px 24px',
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
        border: '1.5px solid #f0c0c0',
      }}>
        {/* Danger header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>⚠</span>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#c0392b' }}>Danger Zone</span>
        </div>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#e05050', marginBottom: 22 }}>
          These actions are permanent and cannot be undone
        </p>
 
        {/* Sign Out Everywhere */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid #f0ece4' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1e1200', marginBottom: 4 }}>Sign Out of All Devices</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#888' }}>Immediately ends all active sessions across every device.</div>
          </div>
          <button
            onClick={handleSignOutEverywhere}
            disabled={signOutLoading}
            style={{
              padding: '10px 20px', borderRadius: 999, flexShrink: 0,
              backgroundColor: '#fde8e8', border: '1.5px solid #f0a0a0',
              fontSize: 13, fontWeight: 800, color: '#c0392b',
              cursor: signOutLoading ? 'not-allowed' : 'pointer',
              transition: 'all .15s',
            }}
            onMouseOver={e => { if (!signOutLoading) e.currentTarget.style.backgroundColor = '#f0c0c0'; }}
            onMouseOut={e  => { if (!signOutLoading) e.currentTarget.style.backgroundColor = '#fde8e8'; }}
          >
            {signOutLoading ? 'Signing out…' : 'Sign Out everywhere'}
          </button>
        </div>
 
        {/* Delete My Account */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1e1200', marginBottom: 4 }}>Delete My Account</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#888', maxWidth: 340 }}>
              Permanently deletes your account and all data. This requires GN Officer approval and cannot be reversed.
            </div>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              padding: '10px 20px', borderRadius: 999, flexShrink: 0,
              backgroundColor: '#fde8e8', border: '1.5px solid #e05050',
              fontSize: 13, fontWeight: 800, color: '#c0392b',
              cursor: 'pointer', transition: 'all .15s',
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#f0c0c0'}
            onMouseOut={e  => e.currentTarget.style.backgroundColor = '#fde8e8'}
          >
            Request Deletion
          </button>
        </div>
      </div>
 
      {/* ── Delete Confirmation Modal ── */}
      {showDeleteConfirm && (
        <>
          <div
            onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            zIndex: 101, width: '100%', maxWidth: 440,
            backgroundColor: '#fff', borderRadius: 20,
            padding: '28px 28px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            border: '2px solid #f0a0a0',
          }}>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 10 }}>⚠️</div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1e1200', textAlign: 'center', marginBottom: 8 }}>
              Request Account Deletion?
            </h2>
            <p style={{ fontSize: 13, color: '#888', fontWeight: 600, textAlign: 'center', lineHeight: 1.6, marginBottom: 20 }}>
              This will submit a deletion request to your GN Officer.<br />
              Your account will remain active until approved.<br />
              <strong style={{ color: '#c0392b' }}>This cannot be undone.</strong>
            </p>
 
            {/* Type DELETE to confirm */}
            <p style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 8 }}>
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="Type DELETE here"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, boxSizing: 'border-box',
                border: '1.5px solid #e8d5ac', fontSize: 14, fontWeight: 700,
                fontFamily: 'inherit', outline: 'none', marginBottom: 16,
                backgroundColor: '#f8f6f0',
              }}
              onFocus={e => e.target.style.borderColor = '#e05050'}
              onBlur={e  => e.target.style.borderColor = '#e8d5ac'}
            />
 
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                style={{
                  flex: 1, padding: '12px', borderRadius: 999,
                  border: '1.5px solid #e8d5ac', backgroundColor: '#fff',
                  fontSize: 14, fontWeight: 800, color: '#888', cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >Cancel</button>
              <button
                onClick={handleRequestDeletion}
                disabled={deleteInput !== 'DELETE' || deleting}
                style={{
                  flex: 1, padding: '12px', borderRadius: 999, border: 'none',
                  backgroundColor: deleteInput === 'DELETE' ? '#c0392b' : '#f0c0c0',
                  fontSize: 14, fontWeight: 800, color: '#fff',
                  cursor: deleteInput !== 'DELETE' || deleting ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', transition: 'all .15s',
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

//  MAIN
const Settings = () => {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [userData,    setUserData]    = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('language');
  const [settings, setSettings]   = useState({ 
    language: 'en', theme: 'light', textSize: 'normal',
    // Notification toggles
    notifReminders:    true,
    notifUpdates:      false,
    notifAnnouncements: true,
    // Delivery methods — multi-select
    deliveryEmail:   true,
    deliveryBrowser: true,
    deliverySMS:     false,
  });
  const [showToast, setShowToast] = useState(false);

  // Auth
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

  // Load saved settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        applySettings(parsed);
      } catch (e) {}
    }
  }, []);

  const applySettings = (s) => {
  const root = document.documentElement;

  // Theme (keep existing code)
  if (s.theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
    // ... rest of dark code
  } else {
    root.setAttribute('data-theme', 'light');
    // ... rest of light code
  }

  // Text size — use data attribute so CSS can override px values
  root.setAttribute('data-textsize', s.textSize || 'normal');
};

  // Update setting
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

  // Yellow content card
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

  const TABS = [
    { id: 'language',   icon: '🌐', label: 'Language'          },
    { id: 'appearance', icon: '🎨', label: 'Appearance'        },
    { id: 'notif',      icon: '🔔', label: 'Notifications'     },
    { id: 'security',   icon: '🛡️', label: 'Privacy & Security'},
    { id: 'account',    icon: '👤', label: 'Account'           },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Nunito, system-ui, sans-serif', backgroundColor: '#f5f0e8' }}>
      <div style={{ flex: 1, display: 'flex' }}>

        <Sidebar active="settings" navigate={navigate} onLogout={handleLogout} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Topbar chipName={chipName} />

          <div style={{ padding: '28px 32px', flex: 1 }}>

            {/* Title */}
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1e1200', marginBottom: 4, letterSpacing: '-0.4px' }}>Settings</h1>
            <p style={{ fontSize: 13, color: '#888', fontWeight: 600, marginBottom: 24 }}>
              Manage your account preferences and accessibility options
            </p>

            {/* Horizontal tabs — underline style matching screenshot */}
            <div style={{ display: 'flex', borderBottom: '2px solid #e8d5ac', marginBottom: 28, overflowX: 'auto' }}>
              {TABS.map(t => (
                <HTab key={t.id} icon={t.icon} label={t.label}
                  active={activeTab === t.id}
                  onClick={() => setActiveTab(t.id)} />
              ))}
            </div>

            {/* LANGUAGE */}
            {activeTab === 'language' && (
              <ContentCard>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#3d2a00', marginBottom: 16 }}>Portal Language</div>
                <RadioOption
                  selected={settings.language === 'si'}
                  onClick={() => updateSetting('language', 'si')}
                  label="Sinhala"
                  sub="Use the system in Sinhala"
                />
                <RadioOption
                  selected={settings.language === 'ta'}
                  onClick={() => updateSetting('language', 'ta')}
                  label="Tamil"
                  sub="Use the system in Tamil"
                />
                <RadioOption
                  selected={settings.language === 'en'}
                  onClick={() => updateSetting('language', 'en')}
                  label="English"
                  sub="Use the system in English"
                />
              </ContentCard>
            )}

            {/* APPEARANCE */}
            {activeTab === 'appearance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Theme */}
                <ContentCard>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#3d2a00', marginBottom: 16 }}>Theme</div>
                  <RadioOption
                    selected={settings.theme === 'light'}
                    onClick={() => updateSetting('theme', 'light')}
                    label="☀️  Light Mode"
                    sub="Bright and clean interface — default"
                  />
                  <RadioOption
                    selected={settings.theme === 'dark'}
                    onClick={() => updateSetting('theme', 'dark')}
                    label="🌙  Dark Mode"
                    sub="Dark background, easy on the eyes at night"
                  />

                  {/* Live preview badge */}
                  <div style={{
                    marginTop: 12, padding: '10px 16px', borderRadius: 10,
                    backgroundColor: settings.theme === 'dark' ? '#2d2d44' : '#f5f0e8',
                    border: '1.5px solid #e8d5ac',
                    fontSize: 12, fontWeight: 600,
                    color: settings.theme === 'dark' ? '#aaaacc' : '#888',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    {settings.theme === 'dark' ? '🌙' : '☀️'}
                    Currently: <strong style={{ color: settings.theme === 'dark' ? '#f0f0f0' : '#3d2a00' }}>
                      {settings.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </strong>
                    — applied to entire app immediately
                  </div>
                </ContentCard>

                {/* Text Size */}
                <ContentCard>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#3d2a00', marginBottom: 16 }}>Text Size</div>
                  <RadioOption
                    selected={settings.textSize === 'small'}
                    onClick={() => updateSetting('textSize', 'small')}
                    label="Small"
                    sub="Compact text — 14px"
                  />
                  <RadioOption
                    selected={settings.textSize === 'normal'}
                    onClick={() => updateSetting('textSize', 'normal')}
                    label="Normal"
                    sub="Default text size — 16px"
                  />
                  <RadioOption
                    selected={settings.textSize === 'large'}
                    onClick={() => updateSetting('textSize', 'large')}
                    label="Large"
                    sub="Larger text for better readability — 18px"
                  />
                </ContentCard>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === 'notif' && (
              <ContentCard>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#3d2a00', marginBottom: 20 }}>
                  Notifications
                </div>
 
                {/* Updates and Announcements */}
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: 14,
                  padding: '20px 22px',
                  marginBottom: 16,
                  boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1e1200', marginBottom: 18 }}>
                    Updates and Announcements
                  </div>
 
                  {/* Toggle rows */}
                  {[
                    { key: 'notifReminders',     label: 'Appointment reminders',  sub: 'Get notified 24 hours before your GN meeting'        },
                    { key: 'notifUpdates',        label: 'Appointment updates',    sub: 'Instant alerts when your appointments are processed'  },
                    { key: 'notifAnnouncements',  label: 'New announcements',      sub: 'Important notices and events'                        },
                  ].map((item, i, arr) => (
                    <div key={item.key} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      paddingBottom: i < arr.length - 1 ? 16 : 0,
                      marginBottom:  i < arr.length - 1 ? 16 : 0,
                      borderBottom:  i < arr.length - 1 ? '1px solid #f0ece4' : 'none',
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e1200', marginBottom: 3 }}>{item.label}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#B46A02' }}>{item.sub}</div>
                      </div>
 
                      {/* Toggle switch */}
                      <div
                        onClick={() => updateSetting(item.key, !settings[item.key])}
                        style={{
                          width: 48, height: 26, borderRadius: 999,
                          backgroundColor: settings[item.key] ? '#1e1200' : '#d0ccc4',
                          position: 'relative', cursor: 'pointer',
                          transition: 'background-color .2s',
                          flexShrink: 0,
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: 3, left: settings[item.key] ? 25 : 3,
                          width: 20, height: 20, borderRadius: '50%',
                          backgroundColor: '#fff',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                          transition: 'left .2s',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
 
                {/* Delivery Methods — multi-select */}
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: 14,
                  padding: '20px 22px',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1e1200', marginBottom: 16 }}>
                    Delivery Methods
                  </div>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    {[
                      { key: 'deliveryEmail',   label: 'Email notifications'                     },
                      { key: 'deliveryBrowser', label: 'Browser Push notifications'              },
                      { key: 'deliverySMS',     label: 'SMS notifications (message rates may apply)' },
                    ].map(item => {
                      const on = settings[item.key];
                      return (
                        <div
                          key={item.key}
                          onClick={() => updateSetting(item.key, !on)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            cursor: 'pointer', userSelect: 'none',
                          }}
                        >
                          {/* Circle checkbox — filled yellow when on, empty when off */}
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                            backgroundColor: on ? '#F5C400' : '#fff',
                            border: on ? '2px solid #d4a800' : '2px solid #ccc',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all .15s',
                          }}>
                            {on && (
                              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3d2a00' }} />
                            )}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#1e1200' }}>{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ContentCard>
            )}

            {/* SECURITY */}
            {activeTab === 'security' && (
              <SecurityTab currentUser={currentUser} userData={userData} db={db} />
            )}

            {/* ACCOUNT */}
            {activeTab === 'account' && (
              <AccountTab currentUser={currentUser} userData={userData} navigate={navigate} />
            )}

          </div>
        </div>
      </div>

      <footer style={{ backgroundColor: '#6A2301', color: '#fff', textAlign: 'center', padding: '13px 16px', fontSize: '13px', fontWeight: 600 }}>
        ©2026 Smart Grama Sewa
      </footer>

      <Toast show={showToast} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default Settings;
