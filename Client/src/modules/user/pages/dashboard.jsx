import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
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

// Quick action card 
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

// Enhanced AppointmentRow with status badge
const AppointmentRow = ({ month, day, title, time, status, last }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 0',
    borderBottom: last ? 'none' : '1px solid #f0e8d0',
  }}>
    <div style={{
      width: '48px',
      flexShrink: 0,
      textAlign: 'center',
      backgroundColor: '#f5f0e8',
      borderRadius: '10px',
      padding: '6px 4px',
    }}>
      <div style={{ fontSize: '10px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {month}
      </div>
      <div style={{ fontSize: '22px', fontWeight: 900, color: '#1e1200', lineHeight: 1.1 }}>
        {day}
      </div>
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e1200', marginBottom: '3px' }}>{title}</div>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#888' }}>{time}</div>
    </div>
    {status && (
      <div style={{
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '10px',
        fontWeight: 700,
        backgroundColor: status === 'confirmed' ? '#2ecc7120' : '#f39c1220',
        color: status === 'confirmed' ? '#27ae60' : '#e67e22',
      }}>
        {status === 'confirmed' ? '✓ Confirmed' : 'Pending'}
      </div>
    )}
  </div>
);

// Loading Skeleton for Appointments
const AppointmentsSkeleton = () => (
  <div>
    {[1, 2, 3].map(i => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 0' }}>
        <div style={{
          width: '48px',
          height: '58px',
          backgroundColor: '#f0f0f0',
          borderRadius: '10px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
        <div style={{ flex: 1 }}>
          <div style={{
            height: '16px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            width: '70%',
            marginBottom: '8px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          <div style={{
            height: '12px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            width: '40%',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        </div>
      </div>
    ))}
  </div>
);

// Loading Skeleton for Announcements
const AnnouncementsSkeleton = () => (
  <div>
    <div style={{
      height: '18px',
      backgroundColor: '#f0f0f0',
      borderRadius: '4px',
      width: '80%',
      marginBottom: '12px',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
    <div style={{
      height: '12px',
      backgroundColor: '#f0f0f0',
      borderRadius: '4px',
      width: '95%',
      marginBottom: '8px',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
    <div style={{
      height: '12px',
      backgroundColor: '#f0f0f0',
      borderRadius: '4px',
      width: '60%',
      marginBottom: '16px',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '20px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: '#f0f0f0',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  </div>
);

// Empty State Component
const EmptyState = ({ type }) => (
  <div style={{
    textAlign: 'center',
    padding: '40px 20px',
  }}>
    <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}>
      {type === 'appointments' ? '📅' : '📭'}
    </div>
    <div style={{ fontSize: '14px', fontWeight: 600, color: '#888' }}>
      No {type} available
    </div>
    <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
      Check back later for updates
    </div>
  </div>
);

// Announcement card data
const defaultAnnouncements = [
  {
    id: 1,
    title: 'Income Certificate Service Resumed',
    body: 'Applications are now open again. Citizens who couldn\'t apply during maintenance may now submit their requests.',
    date: '2026-04-01',
  },
  {
    id: 2,
    title: 'Gram Sabha Meeting — 5 April 2026',
    body: 'Monthly Gram Sabha meeting at 10 AM in the Panchayat Hall. All ward citizens are requested to attend.',
    date: '2026-03-28',
  },
  {
    id: 3,
    title: 'Digital Certificates Now Available',
    body: 'Download your digitally signed certificates directly from the portal — no need to visit the office.',
    date: '2026-03-25',
  },
];

// Main Dashboard
const Dashboard = () => {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('dashboard');
  const [announcIdx, setAnnouncIdx] = useState(0);
  
  // NEW: Loading and data states for enhanced widgets
  const [appointments, setAppointments] = useState([]);
  const [announcements, setAnnouncements] = useState(defaultAnnouncements);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [refreshingAppointments, setRefreshingAppointments] = useState(false);
  const [refreshingAnnouncements, setRefreshingAnnouncements] = useState(false);

  // Firebase auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [gnOfficer, setGnOfficer] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Fetch appointments from Firebase
  const fetchAppointments = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshingAppointments(true);
    } else {
      setLoadingAppointments(true);
    }
    
    try {
      if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
    const timeout = new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 5000));
    const q = query(
      collection(db, 'appointments'),
      where('uid', '==', currentUser.uid),
      where('status', 'in', ['Pending', 'Confirmed']),
    );
    const snap = await Promise.race([getDocs(q), timeout]);
    const list = snap.docs
      .map(d => {
        const data = d.data();
        const [y, m, day] = (data.date || '').split('-').map(Number);
        return {
          id:     d.id,
          day:    String(day).padStart(2, '0'),
          month:  ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][(m - 1)] || '',
          title:  data.service || 'Appointment',
          time:   data.slot    || '',
          date:   data.date    || '',
          status: data.status  || 'Pending',
        };
      })
      .filter(a => a.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
    setAppointments(list);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoadingAppointments(false);
      setRefreshingAppointments(false);
    }
  };

  // Fetch announcements from Firebase
  const fetchAnnouncements = async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshingAnnouncements(true);
    } else {
      setLoadingAnnouncements(true);
    }
    
    try {
      const timeout = new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 5000));
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(3));
    const snap = await Promise.race([getDocs(q), timeout]);
    if (snap.docs.length > 0) {
      setAnnouncements(snap.docs.map(d => ({
        id:    d.id,
        title: d.data().title || 'Announcement',
        body:  d.data().body  || d.data().message || '',
        date:  d.data().createdAt?.toDate?.().toISOString().split('T')[0] || '',
      })));
    }
    // If 0 docs → keep defaultAnnouncements showing
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoadingAnnouncements(false);
      setRefreshingAnnouncements(false);
    }
  };

  // Refresh handlers
  const handleRefreshAppointments = () => {
    fetchAppointments(true);
  };

  const handleRefreshAnnouncements = () => {
    fetchAnnouncements(true);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userSnap = await getDoc(doc(db, 'users', user.uid));
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserData(data);
            if (data.gnDiv) {
              try {
                const gnSnap = await getDoc(doc(db, 'gnOfficers', data.gnDiv));
                if (gnSnap.exists()) {
                  setGnOfficer(gnSnap.data());
                } else {
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
        navigate('/login');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  // Load appointments when currentUser is available
  useEffect(() => {
    if (currentUser) {
      fetchAppointments(false);
    }
  }, [currentUser]);  // ← depends on currentUser so it runs after login

  const [gnContact, setGnContact] = useState(null);
  const [loadingContact, setLoadingContact] = useState(false);

  const fetchGNContact = async () => {
    setLoadingContact(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      
      const userDoc = await getDoc(doc(db, 'users', userId));
      const gnDivision = userDoc.data()?.gnDiv;
      
      if (!gnDivision) return;
      
      const gnDoc = await getDoc(doc(db, 'gnOfficers', gnDivision));
      if (gnDoc.exists()) {
        setGnContact(gnDoc.data().phone || gnDoc.data().contactNo);
      }
    } catch (error) {
      console.error('Error fetching GN contact:', error);
    } finally {
      setLoadingContact(false);
    }
  };

  useEffect(() => {
    fetchGNContact();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err.message);
    }
  };

  const fullName = userData?.fullName
    || currentUser?.displayName
    || currentUser?.email?.split('@')[0]
    || 'User';

  const firstName = fullName.split(' ')[0];
  const chipName = userData?.username || fullName;
  const gnName = gnOfficer?.name || `GN Officer (${userData?.gnDiv || 'N/A'})`;
  const gnAvailable = gnOfficer?.available ?? true;
  const gnDivLabel = userData?.gnDiv || userData?.dsDiv || '';

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
          <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <img src="/logo2.png" alt="Smart Grama Sewa" style={{ height: '80px', width: 'auto' }} />
          </div>
          <div style={{ flex: 1, padding: '12px 10px' }}>
            {navItems.map((item) => (
              <NavItem
                key={item.key}
                iconPath={item.icon}
                label={item.label}
                active={activePage === item.key}
                onClick={() => {
                  if (item.key === 'announcements') navigate('/announcements');
                  else if (item.key === 'appointments') navigate('/appointments');
                  else if (item.key === 'settings') navigate('/settings');
                  else setActivePage(item.key);
                }}
              />
            ))}
          </div>
          <div style={{ padding: '10px 10px 20px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            {bottomNav.map((item) => (
              <NavItem
                key={item.key}
                iconPath={item.icon}
                label={item.label}
                active={activePage === item.key}
                onClick={() => {
                  if (item.key === 'logout') handleLogout();
                  else if (item.key === 'profile') navigate('/profile');
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
              onMouseOut={(e) => (e.currentTarget.style.borderColor = '#e8d8b0')}
            >
              <Icon d={Icons.search} size={16} color="#aaa" />
              <span style={{ fontSize: '14px', color: '#bbb', fontWeight: 600 }}>search</span>
            </div>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#1e1200', cursor: 'pointer' }}>EN</span>
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%',
              backgroundColor: '#f5f0e8', border: '1.5px solid #e8d8b0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative',
              transition: 'border-color 0.15s',
            }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = '#F5C400')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = '#e8d8b0')}
            >
              <Icon d={Icons.bell} size={18} color="#5a3a00" />
              <div style={{
                position: 'absolute', top: '4px', right: '4px',
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: '#e05050',
                border: '1.5px solid #fff',
              }} />
            </div>
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
              onMouseOut={(e) => (e.currentTarget.style.borderColor = '#e8d8b0')}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e1200' }}>
                {chipName}
              </span>
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

            {/* Welcome banner - UNCHANGED */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '16px',
              marginBottom: '26px',
            }}>
              <div style={{
                backgroundColor: '#fff8dc',
                border: '1.5px solid #f0d870',
                borderRadius: '18px',
                padding: '22px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
              }}>
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

            {/* Quick Actions - UNCHANGED */}
            <div style={{ marginBottom: '26px' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#1e1200', marginBottom: '14px' }}>
                Quick Actions
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <QuickCard iconPath={Icons.calendar} label="Book Appointment" onClick={() => navigate('/appointments')} />
                <QuickCard iconPath={Icons.download} label="Download forms" onClick={() => navigate('/forms')} />
                <QuickCard iconPath={Icons.ai} label="AI assistant" onClick={() => navigate('/ai')} />
                <QuickCard iconPath={Icons.phone} label="Contact GN" onClick={() => window.location.href = 'tel:+94...'} />
              </div>
            </div>

            {/* ENHANCED: Appointments & Announcements with Loading States */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>

              {/* Upcoming Appointments - WITH LOADING AND EMPTY STATES */}
              <div style={{
                backgroundColor: '#c8a882',
                borderRadius: '18px',
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              }}>
                <div style={{
                  padding: '16px 20px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#fff' }}>
                    Upcoming Appointments
                  </div>
                  {/* Refresh button */}
                  <button
                    onClick={handleRefreshAppointments}
                    disabled={refreshingAppointments}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: refreshingAppointments ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      color: '#fff',
                      transition: 'transform 0.3s',
                      transform: refreshingAppointments ? 'rotate(180deg)' : 'none',
                      opacity: refreshingAppointments ? 0.7 : 1,
                    }}
                  >
                    🔄
                  </button>
                </div>
                <div style={{
                  backgroundColor: '#fff',
                  margin: '0 0 0 0',
                  borderRadius: '0 0 16px 16px',
                  padding: '6px 20px 12px',
                  minHeight: '220px',
                }}>
                  {loadingAppointments ? (
                    <AppointmentsSkeleton />
                  ) : appointments.length === 0 ? (
                    <EmptyState type="appointments" />
                  ) : (
                    appointments.map((app, idx) => (
                      <AppointmentRow
                        key={app.id}
                        month={app.month}
                        day={app.day}
                        title={app.title}
                        time={app.time}
                        status={app.status}
                        last={idx === appointments.length - 1}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Latest Announcements - WITH LOADING AND EMPTY STATES */}
              <div style={{
                backgroundColor: '#c8a882',
                borderRadius: '18px',
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              }}>
                <div style={{
                  padding: '16px 20px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#fff' }}>
                    Latest Announcements
                  </div>
                  {/* Refresh button */}
                  <button
                    onClick={handleRefreshAnnouncements}
                    disabled={refreshingAnnouncements}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: refreshingAnnouncements ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      color: '#fff',
                      transition: 'transform 0.3s',
                      transform: refreshingAnnouncements ? 'rotate(180deg)' : 'none',
                      opacity: refreshingAnnouncements ? 0.7 : 1,
                    }}
                  >
                    🔄
                  </button>
                </div>
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: '0 0 16px 16px',
                  padding: '16px 20px',
                  minHeight: '220px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}>
                  {loadingAnnouncements ? (
                    <AnnouncementsSkeleton />
                  ) : announcements.length === 0 ? (
                    <EmptyState type="announcements" />
                  ) : (
                    <>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e1200', marginBottom: '8px' }}>
                          {announcements[announcIdx]?.title}
                        </div>
                        <p style={{ fontSize: '13px', color: '#666', fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
                          {announcements[announcIdx]?.body}
                        </p>
                      </div>
                      {announcements.length > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                          <button onClick={prev} style={{
                            width: '30px', height: '30px', borderRadius: '50%',
                            border: '1.5px solid #e8d5ac', background: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.15s',
                          }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#F5C400'; e.currentTarget.style.background = '#fff8dc'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e8d5ac'; e.currentTarget.style.background = '#fff'; }}
                          >
                            <Icon d={Icons.chevLeft} size={14} color="#888" />
                          </button>
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
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e8d5ac'; e.currentTarget.style.background = '#fff'; }}
                          >
                            <Icon d={Icons.chevRight} size={14} color="#888" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
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

      {/* Updated styles with pulse animation for skeletons */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes pulse-gn {
          0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
          50% { box-shadow: 0 0 0 6px rgba(34,197,94,0.08); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;