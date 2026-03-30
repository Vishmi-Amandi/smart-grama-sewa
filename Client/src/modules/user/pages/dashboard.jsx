import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';

// Icons 
const Icon = ({ d, size = 20, color = 'currentColor', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const Icons = {
  dashboard:     'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  announcement:  'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  appointments:  'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  forms:         'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  ai:            'M12 2a10 10 0 100 20A10 10 0 0012 2z M12 8v4l3 3',
  profile:       'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  settings:      'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z',
  logout:        'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
  bell:          'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  search:        'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  calendar:      'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  download:      'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  phone:         'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  chevLeft:      'M15 18l-6-6 6-6',
  chevRight:     'M9 18l6-6-6-6',
};

// Nav item 
const NavItem = ({ iconPath, label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '11px 16px',
      borderRadius: '10px',
      border: 'none',
      cursor: 'pointer',
      backgroundColor: active ? 'rgba(255,255,255,0.9)' : 'transparent',
      color: active ? '#3d2a00' : '#3d2a00',
      fontWeight: active ? 800 : 600,
      fontSize: '14px',
      fontFamily: 'inherit',
      transition: 'all 0.15s',
      textAlign: 'left',
      boxShadow: active ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
      marginBottom: '2px',
    }}
    onMouseOver={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.4)'; }}
    onMouseOut={(e)  => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
  >
    <Icon d={iconPath} size={18} color={active ? '#B46A02' : '#5a3a00'} />
    {label}
  </button>
);

//  Quick action card 
const QuickCard = ({ iconPath, label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1,
      minWidth: '140px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '16px 18px',
      backgroundColor: '#fff',
      border: '1.5px solid #e8d5ac',
      borderRadius: '14px',
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontSize: '14px',
      fontWeight: 700,
      color: '#1e1200',
      transition: 'all 0.18s',
      textAlign: 'left',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.borderColor = '#F5C400';
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 6px 18px rgba(245,196,0,0.2)';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.borderColor = '#e8d5ac';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
    }}
  >
    <div style={{
      width: '36px', height: '36px', borderRadius: '10px',
      backgroundColor: '#fff8e0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon d={iconPath} size={18} color="#B46A02" />
    </div>
    {label}
  </button>
);

// Appointment row
const AppointmentRow = ({ month, day, title, time, last }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '14px 0',
    borderBottom: last ? 'none' : '1px solid #f0e8d0',
  }}>
    <div style={{
      width: '48px', flexShrink: 0, textAlign: 'center',
      backgroundColor: '#f5f0e8', borderRadius: '10px', padding: '6px 4px',
    }}>
      <div style={{ fontSize: '10px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {month}
      </div>
      <div style={{ fontSize: '22px', fontWeight: 900, color: '#1e1200', lineHeight: 1.1 }}>
        {day}
      </div>
    </div>
    <div>
      <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e1200', marginBottom: '3px' }}>{title}</div>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#888' }}>{time}</div>
    </div>
  </div>
);

// Announcement card (carousel) 
const announcements = [
  {
    title: 'Income Certificate Service Resumed',
    body: 'Applications are now open again. Citizens who couldn\'t apply during maintenance may now submit their requests.',
  },
  {
    title: 'Gram Sabha Meeting — 5 April 2026',
    body: 'Monthly Gram Sabha meeting at 10 AM in the Panchayat Hall. All ward citizens are requested to attend.',
  },
  {
    title: 'Digital Certificates Now Available',
    body: 'Download your digitally signed certificates directly from the portal — no need to visit the office.',
  },
];

// Main Dashboard
const Dashboard = () => {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('dashboard');
  const [announcIdx, setAnnouncIdx] = useState(0);

  // Firebase auth state
  const [currentUser, setCurrentUser] = useState(null);  // Firebase Auth user
  const [userData,    setUserData]    = useState(null);  // Firestore /users/{uid}
  const [gnOfficer,   setGnOfficer]   = useState(null);  // Firestore /gnOfficers/{gnDiv}
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);

        try {
          // 1. Fetch this user's profile from Firestore
          const userSnap = await getDoc(doc(db, 'users', user.uid));
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserData(data);

            // 2. Fetch their assigned GN officer using their gnDiv field
            //    Firestore collection: gnOfficers / document ID = gnDiv name
            //    e.g. /gnOfficers/Colombo → { name: "Mr. Perera", available: true }
            if (data.gnDiv) {
              try {
                const gnSnap = await getDoc(doc(db, 'gnOfficers', data.gnDiv));
                if (gnSnap.exists()) {
                  setGnOfficer(gnSnap.data());
                } else {
                  // Fallback: try matching by dsDiv if gnDiv doc not found
                  if (data.dsDiv) {
                    const dsSnap = await getDoc(doc(db, 'gnOfficers', data.dsDiv));
                    if (dsSnap.exists()) setGnOfficer(dsSnap.data());
                  }
                }
              } catch (gnErr) {
                console.warn('Could not load GN officer:', gnErr.message);
              }
            }
          }
        } catch (err) {
          console.warn('Could not load user profile:', err.message);
        }
      } else {
        // Not logged in → redirect to login
        navigate('/login');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Logout handler 
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err.message);
    }
  };

  // Derived display values
  // Priority: Firestore fullName → Auth displayName → email prefix → 'User'
  const fullName  = userData?.fullName
                 || currentUser?.displayName
                 || currentUser?.email?.split('@')[0]
                 || 'User';

  // First name only for the welcome greeting
  const firstName = fullName.split(' ')[0];

  // Topbar chip — show username if set, otherwise full name
  const chipName  = userData?.username || fullName;

  // GN officer — from Firestore gnOfficers collection, fallback to user's gnDiv name
  const gnName      = gnOfficer?.name        || `GN Officer (${userData?.gnDiv || 'N/A'})`;
  const gnAvailable = gnOfficer?.available   ?? true;   // default to true if field missing
  const gnDivLabel  = userData?.gnDiv        || userData?.dsDiv || '';

  // Show loading screen while auth resolves
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#f8f6f0', fontFamily: 'Nunito, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            border: '4px solid #F5C400', borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#888' }}>Loading…</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const prev = () => setAnnouncIdx((i) => (i === 0 ? announcements.length - 1 : i - 1));
  const next = () => setAnnouncIdx((i) => (i === announcements.length - 1 ? 0 : i + 1));

  const navItems = [
    { key: 'dashboard',    icon: Icons.dashboard,    label: 'Dashboard'    },
    { key: 'announcements',icon: Icons.announcement, label: 'Announcements'},
    { key: 'appointments', icon: Icons.appointments, label: 'Appointments' },
    { key: 'forms',        icon: Icons.forms,        label: 'Forms'        },
    { key: 'ai',           icon: Icons.ai,           label: 'AI assistant' },
  ];

  const bottomNav = [
    { key: 'profile',  icon: Icons.profile,  label: 'Profile'  },
    { key: 'settings', icon: Icons.settings, label: 'Settings' },
    { key: 'logout',   icon: Icons.logout,   label: 'Logout'   },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Nunito, system-ui, sans-serif',
      backgroundColor: '#f8f6f0',
    }}>

      {/* Shell */}
      <div style={{ flex: 1, display: 'flex' }}>

        {/* SIDEBAR */}
        <div style={{
          width: '220px',
          flexShrink: 0,
          backgroundColor: '#F5C400',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
        }}>

          {/* Logo */}
          <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <img src="/logo2.png" alt="Smart Grama Sewa" style={{ height: '80px', width: 'auto' }} />
          </div>

          {/* Main nav */}
          <div style={{ flex: 1, padding: '12px 10px' }}>
            {navItems.map((item) => (
              <NavItem
                key={item.key}
                iconPath={item.icon}
                label={item.label}
                active={activePage === item.key}
                onClick={() => {
                  if (item.key === 'announcements')  navigate('/announcements');
                  else if (item.key === 'appointments')  navigate('/appointments');
                  else setActivePage(item.key);
                }}
              />
            ))}
          </div>

          {/* Bottom nav */}
          <div style={{ padding: '10px 10px 20px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            {bottomNav.map((item) => (
              <NavItem
                key={item.key}
                iconPath={item.icon}
                label={item.label}
                active={activePage === item.key}
                onClick={() => {
                  if (item.key === 'logout') handleLogout();
                  else if (item.key === 'profile')  navigate('/profile');
                  else setActivePage(item.key);
                }}
              />
            ))}
          </div>
        </div>

        {/* MAIN COLUMN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Top bar */}
          <div style={{
            height: '64px',
            backgroundColor: '#fff',
            borderBottom: '1px solid #ede8d8',
            display: 'flex',
            alignItems: 'center',
            padding: '0 28px',
            gap: '14px',
            position: 'sticky',
            top: 0,
            zIndex: 40,
            boxShadow: '0 1px 0 #ede8d8',
          }}>

            {/* Search */}
            <div style={{
              flex: 1,
              maxWidth: '400px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#f5f0e8',
              border: '1.5px solid #e8d8b0',
              borderRadius: '999px',
              padding: '9px 18px',
              cursor: 'text',
              transition: 'border-color 0.15s',
            }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = '#F5C400')}
              onMouseOut={(e)  => (e.currentTarget.style.borderColor = '#e8d8b0')}
            >
              <Icon d={Icons.search} size={16} color="#aaa" />
              <span style={{ fontSize: '14px', color: '#bbb', fontWeight: 600 }}>search</span>
            </div>

            <div style={{ flex: 1 }} />

            {/* Language */}
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#1e1200', cursor: 'pointer' }}>EN</span>

            {/* Bell */}
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%',
              backgroundColor: '#f5f0e8', border: '1.5px solid #e8d8b0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative',
              transition: 'border-color 0.15s',
            }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = '#F5C400')}
              onMouseOut={(e)  => (e.currentTarget.style.borderColor = '#e8d8b0')}
            >
              <Icon d={Icons.bell} size={18} color="#5a3a00" />
              {/* Red dot */}
              <div style={{
                position: 'absolute', top: '4px', right: '4px',
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: '#e05050',
                border: '1.5px solid #fff',
              }} />
            </div>

            {/* User chip */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '5px 14px 5px 6px',
              backgroundColor: '#f5f0e8',
              border: '1.5px solid #e8d8b0',
              borderRadius: '999px',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = '#F5C400')}
              onMouseOut={(e)  => (e.currentTarget.style.borderColor = '#e8d8b0')}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e1200' }}>
                {chipName}
              </span>
              {/* Avatar circle */}
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%',
                backgroundColor: '#F5C400',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon d={Icons.profile} size={16} color="#3d2a00" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '28px 30px', flex: 1 }}>

            {/* Welcome banner */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '16px',
              marginBottom: '26px',
            }}>
              {/* Welcome card */}
              <div style={{
                backgroundColor: '#fff8dc',
                border: '1.5px solid #f0d870',
                borderRadius: '18px',
                padding: '22px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
              }}>
                {/* Avatar */}
                <div style={{
                  width: '62px', height: '62px', borderRadius: '50%',
                  backgroundColor: '#e8e0d0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  border: '2px solid #d4c090',
                }}>
                  <Icon d={Icons.profile} size={28} color="#8a7060" strokeWidth={1.5} />
                </div>
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#1e1200', letterSpacing: '-0.3px' }}>
                    Welcome Back, {firstName}!
                  </div>
                </div>
              </div>

              {/* GN Officer card */}
              <div style={{
                backgroundColor: '#fff',
                border: '1.5px solid #e8d5ac',
                borderRadius: '18px',
                padding: '18px 22px',
                minWidth: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#888', marginBottom: '4px' }}>
                  GN officer
                </div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#1e1200', marginBottom: '4px' }}>
                  {gnName}
                </div>
                {gnDivLabel && (
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#aaa', marginBottom: '8px' }}>
                    {gnDivLabel}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{
                    width: '9px', height: '9px', borderRadius: '50%',
                    backgroundColor: gnAvailable ? '#22c55e' : '#f87171',
                    boxShadow: gnAvailable
                      ? '0 0 0 3px rgba(34,197,94,0.2)'
                      : '0 0 0 3px rgba(248,113,113,0.2)',
                    animation: 'pulse 2s infinite',
                  }} />
                  <span style={{
                    fontSize: '14px', fontWeight: 700,
                    color: gnAvailable ? '#22c55e' : '#f87171',
                  }}>
                    {gnAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: '26px' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#1e1200', marginBottom: '14px' }}>
                Quick Actions
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <QuickCard iconPath={Icons.calendar} label="Book Appointment" onClick={() => navigate('/appointments')} />                <QuickCard iconPath={Icons.download}  label="Download forms"   />
                <QuickCard iconPath={Icons.ai}        label="AI assistant"     />
                <QuickCard iconPath={Icons.phone}     label="Contact GN"       />
              </div>
            </div>

            {/* Appointments & Announcements */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>

              {/* Upcoming Appointments */}
              <div style={{
                backgroundColor: '#c8a882',
                borderRadius: '18px',
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              }}>
                <div style={{ padding: '16px 20px 12px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#fff' }}>
                    Upcoming Appointments
                  </div>
                </div>
                <div style={{ backgroundColor: '#fff', margin: '0 0 0 0', borderRadius: '0 0 16px 16px', padding: '6px 20px 12px' }}>
                  <AppointmentRow month="APR" day="02" title="Cutting jack trees"                    time="11.30 AM"           />
                  <AppointmentRow month="APR" day="07" title="Recommendations for electricity & water" time="10.20 AM" last />
                </div>
              </div>

              {/* Latest Announcements */}
              <div style={{
                backgroundColor: '#c8a882',
                borderRadius: '18px',
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              }}>
                <div style={{ padding: '16px 20px 12px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#fff' }}>
                    Latest Announcements
                  </div>
                </div>
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: '0 0 16px 16px',
                  padding: '16px 20px',
                  minHeight: '130px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}>
                  {/* Text */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e1200', marginBottom: '8px' }}>
                      {announcements[announcIdx].title}
                    </div>
                    <p style={{ fontSize: '13px', color: '#666', fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
                      {announcements[announcIdx].body}
                    </p>
                  </div>

                  {/* Prev / Next arrows */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                    <button onClick={prev} style={{
                      width: '30px', height: '30px', borderRadius: '50%',
                      border: '1.5px solid #e8d5ac', background: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = '#F5C400'; e.currentTarget.style.background = '#fff8dc'; }}
                      onMouseOut={(e)  => { e.currentTarget.style.borderColor = '#e8d5ac'; e.currentTarget.style.background = '#fff'; }}
                    >
                      <Icon d={Icons.chevLeft} size={14} color="#888" />
                    </button>

                    {/* Dot indicators */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {announcements.map((_, i) => (
                        <div key={i} onClick={() => setAnnouncIdx(i)} style={{
                          width: i === announcIdx ? '18px' : '7px',
                          height: '7px',
                          borderRadius: '999px',
                          backgroundColor: i === announcIdx ? '#F5C400' : '#ddd',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }} />
                      ))}
                    </div>

                    <button onClick={next} style={{
                      width: '30px', height: '30px', borderRadius: '50%',
                      border: '1.5px solid #e8d5ac', background: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = '#F5C400'; e.currentTarget.style.background = '#fff8dc'; }}
                      onMouseOut={(e)  => { e.currentTarget.style.borderColor = '#e8d5ac'; e.currentTarget.style.background = '#fff'; }}
                    >
                      <Icon d={Icons.chevRight} size={14} color="#888" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#6A2301',
        color: '#fff',
        textAlign: 'center',
        padding: '13px 16px',
        fontSize: '13px',
        fontWeight: 600,
      }}>
        ©2026 Smart Grama Sewa
      </footer>

      {/* Pulse animation for GN dot */}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
          50%       { box-shadow: 0 0 0 6px rgba(34,197,94,0.08); }
        }
      `}</style>

    </div>
  );
};

export default Dashboard;
