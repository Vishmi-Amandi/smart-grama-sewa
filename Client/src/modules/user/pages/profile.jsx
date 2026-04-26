import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut, updateEmail } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase'; // ← adjust path if needed
import { PageLoadingSkeleton, ProfileSkeleton } from '../components/skeleton';

// Icons
const Icon = ({ d, size = 20, color = 'currentColor', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const Icons = {
  dashboard:    'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  announcement: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  appointments: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  forms:        'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  ai:           'M12 2a10 10 0 100 20A10 10 0 0012 2z M12 8v4l3 3',
  profile:      'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  settings:     'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
  logout:       'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
  search:       'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  bell:         'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  edit:         'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  signout:      'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  camera:       'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z M12 17a4 4 0 100-8 4 4 0 000 8z',
  chevDown:     'M6 9l6 6 6-6',
};

// Shared sidebar nav item
const NavItem = ({ iconPath, label, active, onClick }) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
    padding: '11px 16px', borderRadius: '10px', border: 'none',
    cursor: 'pointer', fontFamily: 'inherit',
    backgroundColor: active ? 'rgba(255,255,255,0.9)' : 'transparent',
    color: '#3d2a00', fontWeight: active ? 800 : 600, fontSize: '14px',
    transition: 'all 0.15s', textAlign: 'left', marginBottom: '2px',
    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
  }}
    onMouseOver={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.4)'; }}
    onMouseOut={(e)  => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
  >
    <Icon d={iconPath} size={18} color={active ? '#B46A02' : '#5a3a00'} />
    {label}
  </button>
);

// Info row (view mode)
const InfoRow = ({ label, value }) => (
  <div style={{ marginBottom: '18px' }}>
    <div style={{ fontSize: '12px', fontWeight: 700, color: '#B46A02', marginBottom: '6px' }}>
      {label}
    </div>
    <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e1200', paddingBottom: '10px', borderBottom: '1px solid #f0e8d0' }}>
      {value || '—'}
    </div>
  </div>
);

// Form field (edit mode)
const Field = ({ label, value, onChange, type = 'text', placeholder = '', disabled = false }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <label style={{ fontSize: '12px', fontWeight: 700, color: '#B46A02' }}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        padding: '12px 14px', fontSize: '14px', fontWeight: 600,
        color: disabled ? '#aaa' : '#1e1200',
        backgroundColor: disabled ? '#f8f6f0' : '#fff',
        border: '1.5px solid #e8d5ac', borderRadius: '10px',
        outline: 'none', width: '100%', boxSizing: 'border-box',
        transition: 'border-color 0.15s',
        cursor: disabled ? 'not-allowed' : 'text',
      }}
      onFocus={(e) => { if (!disabled) e.target.style.borderColor = '#F5C400'; }}
      onBlur={(e)  => { if (!disabled) e.target.style.borderColor = '#e8d5ac'; }}
    />
  </div>
);

// Gender select
const GenderSelect = ({ value, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <label style={{ fontSize: '12px', fontWeight: 700, color: '#B46A02' }}>Gender</label>
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', padding: '12px 36px 12px 14px',
          fontSize: '14px', fontWeight: 600, color: '#1e1200',
          backgroundColor: '#fff', border: '1.5px solid #e8d5ac',
          borderRadius: '10px', outline: 'none', appearance: 'none',
          cursor: 'pointer', boxSizing: 'border-box', transition: 'border-color 0.15s',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#F5C400')}
        onBlur={(e)  => (e.target.style.borderColor = '#e8d5ac')}
      >
        <option value="">Select…</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
        <option value="Prefer not to say">Prefer not to say</option>
      </select>
      <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <Icon d={Icons.chevDown} size={16} color="#888" />
      </div>
    </div>
  </div>
);

// Shared Sidebar 
const Sidebar = ({ activePage, onNavigate, onLogout }) => {
  const navItems = [
    { key: 'dashboard',     icon: Icons.dashboard,    label: 'Dashboard'     },
    { key: 'announcements', icon: Icons.announcement, label: 'Announcements' },
    { key: 'appointments',  icon: Icons.appointments, label: 'Appointments'  },
    { key: 'forms',         icon: Icons.forms,        label: 'Forms'         },
    { key: 'ai',            icon: Icons.ai,           label: 'AI assistant'  },
  ];
  const bottomNav = [
    { key: 'profile',  icon: Icons.profile,  label: 'Profile'  },
    { key: 'settings', icon: Icons.settings, label: 'Settings' },
    { key: 'logout',   icon: Icons.logout,   label: 'Sign out'   },
  ];
  return (
    <div className="desktop-sidebar" style={{
      width: '220px', flexShrink: 0, backgroundColor: '#F5C400',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
    }}>
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <img src="/logo2.png" alt="Smart Grama Sewa" style={{ height: '64px', width: 'auto' }} />
      </div>
      <div style={{ flex: 1, padding: '12px 10px' }}>
        {navItems.map((item) => (
          <NavItem key={item.key} iconPath={item.icon} label={item.label}
            active={activePage === item.key} onClick={() => onNavigate(item.key)} />
        ))}
      </div>
      <div style={{ padding: '10px 10px 20px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        {bottomNav.map((item) => (
          <NavItem key={item.key} iconPath={item.icon} label={item.label}
            active={activePage === item.key}
            onClick={() => item.key === 'logout' ? onLogout() : onNavigate(item.key)} />
        ))}
      </div>
    </div>
  );
};

//  MAIN PROFILE COMPONENT
const Profile = () => {
  const navigate = useNavigate();

  // Auth + Firestore state 
  const [currentUser, setCurrentUser] = useState(null);
  const [userData,    setUserData]    = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // UI state 
  const [isEditing,   setIsEditing]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit form state (pre-filled from Firestore)
  const [form, setForm] = useState({
    fullName: '', dob: '', gender: '', address: '',
    occupation: '', mobile: '', email: '',
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Load auth, Firestore on mount
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            const data = snap.data();
            setUserData(data);
            // Pre-fill edit form
            setForm({
              fullName:   data.fullName   || '',
              dob:        data.dob        || '',
              gender:     data.gender     || '',
              address:    data.address    || '',
              occupation: data.occupation || '',
              mobile:     data.mobile     || '',
              email:      user.email      || '',
              district:   data.district  || '',
              dsDiv:      data.dsDiv     || '',
              gnDiv:      data.gnDiv     || '',
            });
          }
        } catch (e) {
          console.warn('Profile load error:', e.message);
        }
      } else {
        navigate('/login');
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  // Logout 
  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  //  Save changes to Firestore 
  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      // Update Firestore user document
      await updateDoc(doc(db, 'users', currentUser.uid), {
        fullName:   form.fullName,
        dob:        form.dob,
        gender:     form.gender,
        address:    form.address,
        occupation: form.occupation,
        mobile:     form.mobile,
      });

      // Update local userData state so view reflects changes immediately
      setUserData((prev) => ({ ...prev, ...form }));
      setSaveSuccess(true);
      setIsEditing(false);

      // Clear success message after 3s
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (e) {
      console.error('Save error:', e.message);
      setSaveError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Cancel edit — reset form to current userData 
  const handleCancel = () => {
    if (userData) {
      setForm({
        fullName:   userData.fullName   || '',
        dob:        userData.dob        || '',
        gender:     userData.gender     || '',
        address:    userData.address    || '',
        occupation: userData.occupation || '',
        mobile:     userData.mobile     || '',
        email:      currentUser?.email  || '',
        district:   userData.district  || '',
        dsDiv:      userData.dsDiv     || '',
        gnDiv:      userData.gnDiv     || '',
      });
    }
    setSaveError('');
    setIsEditing(false);
  };

  const update = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  // Derived
  const chipName = userData?.username || userData?.fullName || currentUser?.email?.split('@')[0] || 'User';
  const nicMasked = userData?.nic
    ? userData.nic.slice(0, 3) + 'X'.repeat(Math.max(0, userData.nic.length - 3))
    : 'XXXXXXXXXXXX';

    const navItems = [
    { key: 'dashboard',     icon: Icons.dashboard,    label: 'Dashboard'     },
    { key: 'announcements', icon: Icons.announcement, label: 'Announcements' },
    { key: 'appointments',  icon: Icons.appointments, label: 'Appointments'  },
    { key: 'forms',         icon: Icons.forms,        label: 'Forms'         },
    { key: 'ai',            icon: Icons.ai,           label: 'AI assistant'  },
  ];

  const bottomNav = [
    { key: 'profile',  icon: Icons.profile,  label: 'Profile'  },
    { key: 'settings', icon: Icons.settings, label: 'Settings' },
    { key: 'logout',   icon: Icons.logout,   label: 'Sign out'   },
  ];

  // Loading 
  if (authLoading) return <PageLoadingSkeleton />;

  //  RENDER
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Nunito, system-ui, sans-serif', backgroundColor: '#f8f6f0' }}>

      <div style={{ flex: 1, display: 'flex' }}>

        <div className="desktop-sidebar" style={{
          width: '220px', flexShrink: 0, backgroundColor: '#F5C400',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
        }}>
          <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <img src="/logo2.png" alt="Smart Grama Sewa" style={{ height: '80px', width: 'auto' }} />
          </div>
          <div style={{ flex: 1, padding: '12px 10px' }}>
            {navItems.map(item => (
              <NavItem key={item.key} iconPath={item.icon} label={item.label} active={activePage === item.key}
                onClick={() => {
                  if (item.key === 'dashboard') navigate('/dashboard');
                  else if (item.key === 'announcements') navigate('/announcements');
                  else if (item.key === 'appointments') navigate('/appointments');
                  else if (item.key === 'settings') navigate('/settings');
                  else setActivePage(item.key);
                }}
              />
            ))}
          </div>
          <div style={{ padding: '10px 10px 20px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            {bottomNav.map(item => (
              <NavItem key={item.key} iconPath={item.icon} label={item.label} active={activePage === item.key}
                onClick={() => {
                  if (item.key === 'logout') handleLogout();
                  else if (item.key === 'settings') navigate('/settings');
                  else setActivePage(item.key);
                }}
              />
            ))}
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <>
            <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
            <div style={{ position: 'fixed', top: 0, left: 0, width: '250px', height: '100vh', backgroundColor: '#F5C400', zIndex: 1001, overflowY: 'auto', padding: '20px 0' }}>
              <div style={{ padding: '0 20px 20px', textAlign: 'right' }}>
                <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>✕</button>
              </div>
              {[
                { key: 'dashboard',     icon: Icons.dashboard,    label: 'Dashboard'     },
                { key: 'announcements', icon: Icons.announcement, label: 'Announcements' },
                { key: 'appointments',  icon: Icons.appointments, label: 'Appointments'  },
                { key: 'forms',         icon: Icons.forms,        label: 'Forms'         },
                { key: 'ai',            icon: Icons.ai,           label: 'AI assistant'  },
              ].map(item => (
                <NavItem key={item.key} iconPath={item.icon} label={item.label}
                  active={item.key === 'profile'}
                  onClick={() => { navigate(`/${item.key}`); setMobileMenuOpen(false); }}
                />
              ))}
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', margin: '10px 0', paddingTop: '10px' }}>
                {[
                  { key: 'profile',  icon: Icons.profile,  label: 'Profile'  },
                  { key: 'settings', icon: Icons.settings, label: 'Settings' },
                  { key: 'logout',   icon: Icons.logout,   label: 'Logout'   },
                ].map(item => (
                  <NavItem key={item.key} iconPath={item.icon} label={item.label}
                    active={item.key === 'profile'}
                    onClick={() => {
                      if (item.key === 'logout') handleLogout();
                      else navigate(`/${item.key}`);
                      setMobileMenuOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          <div className="desktop-topbar" style={{ height: '64px', backgroundColor: '#fff', borderBottom: '1px solid #ede8d8', display: 'flex', alignItems: 'center', padding: '0 28px', gap: '14px', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 0 #ede8d8' }}>
            <div style={{ flex: 1, maxWidth: '400px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f5f0e8', border: '1.5px solid #e8d8b0', borderRadius: '999px', padding: '9px 18px', cursor: 'text' }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#F5C400'}
              onMouseOut={e  => e.currentTarget.style.borderColor = '#e8d8b0'}
            >
              <Icon d={Icons.search} size={16} color="#aaa" />
              <span style={{ fontSize: '14px', color: '#bbb', fontWeight: 600 }}>search</span>
            </div>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#1e1200' }}>EN</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#f5f0e8', border: '1.5px solid #e8d8b0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#F5C400'}
              onMouseOut={e  => e.currentTarget.style.borderColor = '#e8d8b0'}
            >
              <Icon d={Icons.bell} size={18} color="#5a3a00" />
              <div style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#e05050', border: '1.5px solid #fff' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 14px 5px 6px', backgroundColor: '#f5f0e8', border: '1.5px solid #e8d8b0', borderRadius: '999px', cursor: 'pointer' }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#F5C400'}
              onMouseOut={e  => e.currentTarget.style.borderColor = '#e8d8b0'}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e1200', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chipName}</span>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#F5C400', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon d={Icons.profile} size={16} color="#3d2a00" />
              </div>
            </div>
          </div>

          {/* MOBILE TOPBAR */}
          <div className="mobile-topbar" style={{
            display: 'none', /* shown via media query */
            height: '64px', backgroundColor: '#F5C400',
            alignItems: 'center', padding: '0 16px', gap: '12px',
            position: 'sticky', top: 0, zIndex: 40,
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          }}>
            {/* Hamburger */}
            <button onClick={() => setMobileMenuOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#3d2a00" strokeWidth={2.2} strokeLinecap="round">
                <line x1="3" y1="6"  x2="21" y2="6"  />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Logo — centred */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo2.png" alt="Smart Grama Sewa" style={{ height: '48px', width: 'auto' }} />
            </div>

            {/* EN */}
            <span style={{ fontSize: '14px', fontWeight: 900, color: '#1e1200', flexShrink: 0 }}>EN</span>

            {/* Bell */}
            <div style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
              <Icon d={Icons.bell} size={22} color="#1e1200" />
              <div style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#e05050', border: '1.5px solid #F5C400' }} />
            </div>

            {/* Avatar */}
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
              onClick={() => navigate('/profile')}
            >
              <Icon d={Icons.profile} size={20} color="#3d2a00" />
            </div>
          </div>


          <div style={{ padding: '16px', flex: 1, maxWidth: '100%', boxSizing: 'border-box' }}>
 
            {!userData && !isEditing && <ProfileSkeleton />}
            
            {/* VIEW MODE */}
            {!isEditing && userData && (
              <>
                <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#1e1200', marginBottom: '24px', letterSpacing: '-0.4px' }}>
                  My Profile
                </h1>

                {/* Success banner */}
                {saveSuccess && (
                  <div style={{
                    backgroundColor: '#e6f9ee', border: '1.5px solid #7ec07e',
                    borderRadius: '12px', padding: '12px 18px', marginBottom: '18px',
                    fontSize: '14px', fontWeight: 700, color: '#1a5c1a',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    ✅ Profile updated successfully!
                  </div>
                )}

                {/* Profile header card */}
                <div style={{
                  backgroundColor: '#fff', border: '1.5px solid #e8d5ac',
                  borderRadius: '18px', padding: '22px 26px',
                  display: 'flex', alignItems: 'center', gap: '20px',
                  marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                }}>
                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: '76px', height: '76px', borderRadius: '50%',
                      border: '3px solid #1e1200',
                      backgroundColor: '#f0ece4',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon d={Icons.profile} size={36} color="#5a4030" strokeWidth={1.5} />
                    </div>
                    {/* Camera edit bubble */}
                    <div style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: '24px', height: '24px', borderRadius: '50%',
                      backgroundColor: '#F5C400', border: '2px solid #fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                    }}>
                      <Icon d={Icons.camera} size={12} color="#3d2a00" />
                    </div>
                  </div>

                  {/* Name, NIC */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#1e1200', marginBottom: '4px' }}>
                      {userData?.fullName || chipName}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#888' }}>
                      Citizen ID : {nicMasked}
                    </div>
                  </div>

                  {/* Edit Profile button */}
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '11px 22px',
                      backgroundColor: '#F5C400', border: '1.5px solid #d4a800',
                      borderRadius: '999px', fontSize: '14px', fontWeight: 800,
                      color: '#3d2a00', cursor: 'pointer', transition: 'all 0.15s',
                      flexShrink: 0,
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#d4a800'; }}
                    onMouseOut={(e)  => { e.currentTarget.style.backgroundColor = '#F5C400'; }}
                  >
                    <Icon d={Icons.edit} size={15} color="#3d2a00" />
                    Edit Profile
                  </button>
                </div>

                {/* Info cards row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '20px' }}>

                  {/* Personal Info */}
                  <div style={{
                    backgroundColor: '#fff', border: '1.5px solid #e8d5ac',
                    borderRadius: '18px', padding: '22px 24px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                  }}>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#1e1200', marginBottom: '20px' }}>
                      Personal Info
                    </div>
                    <InfoRow label="Full Name"    value={userData?.fullName}   />
                    <InfoRow label="Username"     value={userData?.username}  />
                    <InfoRow label="NIC Number"   value={userData?.nic}       />                    
                    <InfoRow label="Date Of Birth" value={userData?.dob}       />
                    <InfoRow label="Gender"        value={userData?.gender}    />
                    <InfoRow label="Home Address"  value={userData?.address}   />
                    <InfoRow label="Occupation"  value={userData?.occupation}   />                  </div>

                  {/* Contact & Location Details */}
                  <div style={{
                    backgroundColor: '#fff', border: '1.5px solid #e8d5ac',
                    borderRadius: '18px', padding: '22px 24px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                  }}>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#1e1200', marginBottom: '20px' }}>
                      Contact Details
                    </div>
                    <InfoRow label="Mobile Number" value={userData?.mobile}         />
                    <InfoRow label="Email Address" value={currentUser?.email}       />
                    <InfoRow label="District"       value={userData?.district}     />
                    <InfoRow label="DS Division"    value={userData?.dsDiv}        />
                    <InfoRow label="GN Division"    value={userData?.gnDiv}        />
                  </div>
                </div>

                {/* Sign out button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '9px',
                      padding: '13px 26px',
                      backgroundColor: '#3d2a00', border: 'none',
                      borderRadius: '999px', fontSize: '14px', fontWeight: 800,
                      color: '#fff', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#5a3a10'; }}
                    onMouseOut={(e)  => { e.currentTarget.style.backgroundColor = '#3d2a00'; }}
                  >
                    <Icon d={Icons.signout} size={16} color="#fff" />
                    Sign out
                  </button>
                </div>
              </>
            )}

            {/* EDIT MODE */}
            {isEditing && (
              <>
                <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#1e1200', marginBottom: '6px', letterSpacing: '-0.4px' }}>
                  Edit Profile
                </h1>
                <p style={{ fontSize: '14px', color: '#888', fontWeight: 600, marginBottom: '28px' }}>
                  Update your personal information and contact details.
                </p>

                {/* Error banner */}
                {saveError && (
                  <div style={{
                    backgroundColor: '#fde8e8', border: '1.5px solid #f0a0a0',
                    borderRadius: '12px', padding: '12px 18px', marginBottom: '18px',
                    fontSize: '14px', fontWeight: 700, color: '#8b1a1a',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    ⚠ {saveError}
                  </div>
                )}

                <div style={{
                  backgroundColor: '#fff', border: '1.5px solid #e8d5ac',
                  borderRadius: '18px', padding: '28px 28px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: '18px',
                }}>

                  {/* Personal Info section */}
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#1e1200', marginBottom: '20px' }}>
                    Personal Info
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <Field label="Full Name" value={form.fullName} onChange={update('fullName')} placeholder="Your full name" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                    <Field  label="Date Of Birth" value={form.dob}        onChange={update('dob')}        type="date" />
                    <Field  label="Occupation"    value={form.occupation}  onChange={update('occupation')} placeholder="e.g. Teacher" />
                    <GenderSelect value={form.gender} onChange={update('gender')} />
                  </div>

                  {/* Home Address */}
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#1e1200', marginBottom: '14px' }}>
                    Home Address
                  </div>
                  <div style={{ marginBottom: '24px' }}>
                    <textarea
                      value={form.address}
                      onChange={(e) => update('address')(e.target.value)}
                      rows={3}
                      style={{
                        width: '100%', padding: '12px 14px',
                        fontSize: '14px', fontWeight: 600, color: '#1e1200',
                        backgroundColor: '#fff', border: '1.5px solid #e8d5ac',
                        borderRadius: '10px', outline: 'none', resize: 'vertical',
                        boxSizing: 'border-box', fontFamily: 'inherit',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#F5C400')}
                      onBlur={(e)  => (e.target.style.borderColor = '#e8d5ac')}
                    />
                  </div>

                  {/* Contact Details */}
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#1e1200', marginBottom: '14px' }}>
                    Contact Details
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <Field label="Mobile Number" value={form.mobile} onChange={update('mobile')} placeholder="+94 77 XXX XXXX" disabled={true} />
                    <Field label="Email Address" value={form.email}  onChange={update('email')}  type="email" disabled={true} />
                  </div>
                  <p style={{ fontSize: '12px', color: '#aaa', fontWeight: 600, marginTop: '8px' }}>
                    * Mobile number & Email address cannot be changed here for security reasons.
                  </p>

                  {/* Location — read only */}
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#1e1200', margin: '22px 0 14px' }}>
                    Location
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#aaa', marginLeft: '8px' }}>
                      (set during sign up — contact support to change)
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
                    <Field label="District"    value={form.district} onChange={() => {}} disabled={true} />
                    <Field label="DS Division" value={form.dsDiv}    onChange={() => {}} disabled={true} />
                    <Field label="GN Division" value={form.gnDiv}    onChange={() => {}} disabled={true} />
                  </div>
                </div>

                {/* Cancel, Save buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    style={{
                      padding: '13px 32px', backgroundColor: '#8a6040',
                      border: 'none', borderRadius: '999px',
                      fontSize: '15px', fontWeight: 800, color: '#fff',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.6 : 1, transition: 'all 0.15s',
                    }}
                    onMouseOver={(e) => { if (!saving) e.currentTarget.style.backgroundColor = '#6a4020'; }}
                    onMouseOut={(e)  => { if (!saving) e.currentTarget.style.backgroundColor = '#8a6040'; }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      padding: '13px 32px', backgroundColor: saving ? '#d4a800' : '#F5C400',
                      border: '1.5px solid #d4a800', borderRadius: '999px',
                      fontSize: '15px', fontWeight: 800, color: '#3d2a00',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      transition: 'all 0.15s',
                    }}
                    onMouseOver={(e) => { if (!saving) e.currentTarget.style.backgroundColor = '#d4a800'; }}
                    onMouseOut={(e)  => { if (!saving) e.currentTarget.style.backgroundColor = '#F5C400'; }}
                  >
                    {saving ? (
                      <>
                        <div style={{ width: '16px', height: '16px', border: '2px solid #3d2a00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        Saving…
                      </>
                    ) : 'Save Changes'}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#6A2301', color: '#fff',
        textAlign: 'center', padding: '13px 16px',
        fontSize: '13px', fontWeight: 600,
      }}>
        ©2026 Smart Grama Sewa
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }
          
        /* Desktop */
        @media (min-width: 769px) {
          .desktop-sidebar     { display: flex !important; }
          .desktop-topbar      { display: flex !important; }
          .mobile-topbar       { display: none !important; }
        }

        /* Mobile */
        @media (max-width: 768px) {
          .desktop-sidebar     { display: none !important; }
          .desktop-topbar      { display: none !important; }
          .mobile-topbar       { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

export default Profile;