import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { PageLoadingSkeleton } from '../components/skeleton';
import LanguageSwitcher from '../components/languageSwitcher';

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
  settings:     'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z',
  logout:       'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
  bell:         'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  search:       'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  calendar:     'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  download:     'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  phone:        'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  chevLeft:     'M15 18l-6-6 6-6',
  chevRight:    'M9 18l6-6-6-6',
  close:        'M18 6L6 18M6 6l12 12',
  appointment: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  announcementIcon: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  formIcon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  aiIcon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  success: 'M20 6L9 17l-5-5',
  warning: 'M12 9v4 M12 17h.01 M12 2a10 10 0 100 20 10 10 0 000-20z',
  info: 'M12 2a10 10 0 100 20A10 10 0 0012 2z M12 8v4 M12 16h.01',
  error: 'M12 8v4 M12 16h.01 M12 2a10 10 0 100 20 10 10 0 000-20z',
  checkbox: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z',
  send: 'M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z',
  emojiSmile: 'M12 2a10 10 0 100 20 10 10 0 000-20z M8 10h.01 M16 10h.01 M9 15h6',
};

// NavItem 
const NavItem = ({ iconPath, label, active, onClick }) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
    padding: '11px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
    backgroundColor: active ? 'rgba(255,255,255,0.9)' : 'transparent',
    color: '#3d2a00', fontWeight: active ? 800 : 600, fontSize: '14px',
    fontFamily: 'inherit', transition: 'all 0.15s', textAlign: 'left',
    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.12)' : 'none', marginBottom: '2px',
  }}
    onMouseOver={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.4)'; }}
    onMouseOut={e  => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
  >
    <Icon d={iconPath} size={18} color={active ? '#B46A02' : '#5a3a00'} />
    {label}
  </button>
);

// QuickCard
const QuickCard = ({ iconPath, label, onClick }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '12px 20px', backgroundColor: '#fff',
    border: '1.5px solid #e8d5ac', borderRadius: '999px',
    cursor: 'pointer', fontFamily: 'inherit',
    fontSize: '14px', fontWeight: 700, color: '#1e1200',
    transition: 'all 0.18s', textAlign: 'left',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  }}
    onMouseOver={e => { e.currentTarget.style.borderColor = '#F5C400'; e.currentTarget.style.backgroundColor = '#fff8e0'; }}
    onMouseOut={e  => { e.currentTarget.style.borderColor = '#e8d5ac'; e.currentTarget.style.backgroundColor = '#fff'; }}
  >
    <Icon d={iconPath} size={17} color="#B46A02" />
    {label}
  </button>
);

// AppointmentRow
const AppointmentRow = ({ month, day, title, time, status, last }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 0', borderBottom: last ? 'none' : '1px solid #f0e8d0' }}>
    <div style={{ width: '48px', flexShrink: 0, textAlign: 'center', backgroundColor: '#f5f0e8', borderRadius: '10px', padding: '6px 4px' }}>
      <div style={{ fontSize: '10px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{month}</div>
      <div style={{ fontSize: '22px', fontWeight: 900, color: '#1e1200', lineHeight: 1.1 }}>{day}</div>
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e1200', marginBottom: '3px' }}>{title}</div>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#888' }}>{time}</div>
    </div>
    {status && (
      <div style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, backgroundColor: status === 'Confirmed' ? '#2ecc7120' : '#f39c1220', color: status === 'Confirmed' ? '#27ae60' : '#e67e22' }}>
        {status === 'Confirmed' ? '✓ Confirmed' : 'Pending'}
      </div>
    )}
  </div>
);

// Skeletons
const AppointmentsSkeleton = () => (
  <div>{[1,2,3].map(i => (
    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 0' }}>
      <div style={{ width: '48px', height: '58px', backgroundColor: '#f0f0f0', borderRadius: '10px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: '16px', backgroundColor: '#f0f0f0', borderRadius: '4px', width: '70%', marginBottom: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: '12px', backgroundColor: '#f0f0f0', borderRadius: '4px', width: '40%', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
    </div>
  ))}</div>
);

const AnnouncementsSkeleton = () => (
  <div>
    <div style={{ height: '18px', backgroundColor: '#f0f0f0', borderRadius: '4px', width: '80%', marginBottom: '12px', animation: 'pulse 1.5s ease-in-out infinite' }} />
    <div style={{ height: '12px', backgroundColor: '#f0f0f0', borderRadius: '4px', width: '95%', marginBottom: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
    <div style={{ height: '12px', backgroundColor: '#f0f0f0', borderRadius: '4px', width: '60%', marginBottom: '16px', animation: 'pulse 1.5s ease-in-out infinite' }} />
  </div>
);

// Empty state
const EmptyState = ({ type }) => (
  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
    <div style={{ marginBottom: '12px', opacity: 0.5 }}>
      <Icon d={type === 'appointments' ? Icons.calendar : Icons.announcementIcon} size={48} color="#ccc" strokeWidth={1.2} />
    </div>
    <div style={{ fontSize: '14px', fontWeight: 600, color: '#888' }}>No {type} available</div>
    <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>Check back later for updates</div>
  </div>
);

// Default announcements
const defaultAnnouncements = [
  { id: 1, title: 'Income Certificate Service Resumed', body: "Applications are now open again. Citizens who couldn't apply during maintenance may now submit their requests.", date: '2026-04-01' },
  { id: 2, title: 'Gram Sabha Meeting — 5 April 2026',  body: 'Monthly Gram Sabha meeting at 10 AM in the Panchayat Hall. All ward citizens are requested to attend.', date: '2026-03-28' },
  { id: 3, title: 'Digital Certificates Now Available', body: 'Download your digitally signed certificates directly from the portal — no need to visit the office.', date: '2026-03-25' },
];

// List of all pages/functions for search
const PAGE_ACTIONS = [
  { name: 'Dashboard', path: '/dashboard', icon: Icons.dashboard, keywords: ['home', 'main', 'overview'] },
  { name: 'Announcements', path: '/announcements', icon: Icons.announcement, keywords: ['news', 'updates', 'notices'] },
  { name: 'Appointments', path: '/appointments', icon: Icons.appointments, keywords: ['booking', 'schedule', 'meeting'] },
  { name: 'Forms', path: '/forms', icon: Icons.forms, keywords: ['documents', 'applications', 'certificates'] },
  { name: 'AI Assistant', path: '/ai', icon: Icons.ai, keywords: ['chatbot', 'help', 'support'] },
  { name: 'Profile', path: '/profile', icon: Icons.profile, keywords: ['account', 'settings', 'my profile'] },
  { name: 'Settings', path: '/settings', icon: Icons.settings, keywords: ['preferences', 'options', 'configuration'] },
];

//  MAIN DASHBOARD
const Dashboard = () => {
  const navigate = useNavigate();
  const [activePage,   setActivePage]   = useState('dashboard');
  const [announcIdx,   setAnnouncIdx]   = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // SEARCH STATE - for page/function search
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // LANGUAGE STATE
  const [currentLanguage, setCurrentLanguage] = useState('en');

  const [appointments,          setAppointments]          = useState([]);
  const [announcements,         setAnnouncements]         = useState(defaultAnnouncements);
  const [loadingAppointments,   setLoadingAppointments]   = useState(true);
  const [loadingAnnouncements,  setLoadingAnnouncements]  = useState(false);
  const [refreshingAppointments,  setRefreshingAppointments]  = useState(false);
  const [refreshingAnnouncements, setRefreshingAnnouncements] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [userData,    setUserData]    = useState(null);
  const [gnOfficer,   setGnOfficer]   = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Handle language change
  const handleLanguageChange = (langCode) => {
    setCurrentLanguage(langCode);
    console.log('Language changed to:', langCode);
    // Your teammate can add translation logic here later
  };

  // Fetch appointments
  const fetchAppointments = async (showRefresh = false) => {
    showRefresh ? setRefreshingAppointments(true) : setLoadingAppointments(true);
    try {
      if (!currentUser) return;
      const today   = new Date().toISOString().split('T')[0];
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
          const [, m, day] = (data.date || '').split('-').map(Number);
          return {
            id: d.id, day: String(day).padStart(2, '0'),
            month: ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][(m-1)] || '',
            title: data.service || 'Appointment', time: data.slot || '',
            date: data.date || '', status: data.status || 'Pending',
          };
        })
        .filter(a => a.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 3);
      setAppointments(list);
    } catch (e) { console.error('Error fetching appointments:', e); }
    finally { setLoadingAppointments(false); setRefreshingAppointments(false); }
  };

  // Fetch announcements
  const fetchAnnouncements = async (showRefresh = false) => {
    showRefresh ? setRefreshingAnnouncements(true) : setLoadingAnnouncements(true);
    try {
      const timeout = new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 5000));
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(3));
      const snap = await Promise.race([getDocs(q), timeout]);
      if (snap.docs.length > 0) {
        setAnnouncements(snap.docs.map(d => ({
          id: d.id, title: d.data().title || 'Announcement',
          body: d.data().body || d.data().message || '',
          date: d.data().createdAt?.toDate?.().toISOString().split('T')[0] || '',
        })));
      }
    } catch (e) { console.error('Error fetching announcements:', e); }
    finally { setLoadingAnnouncements(false); setRefreshingAnnouncements(false); }
  };

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            const data = snap.data();
            setUserData(data);
            if (data.gnDiv) {
              try {
                const gnSnap = await getDoc(doc(db, 'gnOfficers', data.gnDiv));
                if (gnSnap.exists()) setGnOfficer(gnSnap.data());
                else if (data.dsDiv) {
                  const dsSnap = await getDoc(doc(db, 'gnOfficers', data.dsDiv));
                  if (dsSnap.exists()) setGnOfficer(dsSnap.data());
                }
              } catch (e) { console.warn('GN officer:', e.message); }
            }
          }
        } catch (e) { console.warn('User profile:', e.message); }
      } else { navigate('/login'); }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  // Load data on mount
  useEffect(() => { if (currentUser) fetchAppointments(false); }, [currentUser]);
  useEffect(() => { fetchAnnouncements(false); }, []);

  const handleLogout = async () => { try { await signOut(auth); navigate('/login'); } catch (e) { console.error(e); } };

  // SEARCH FUNCTION - filters pages based on search query
  const getFilteredPages = () => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return PAGE_ACTIONS.filter(page => 
      page.name.toLowerCase().includes(query) ||
      page.keywords.some(keyword => keyword.toLowerCase().includes(query))
    );
  };

  const filteredPages = getFilteredPages();

  // Hide search results when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSearchResults(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fullName  = userData?.fullName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const firstName = fullName.split(' ')[0];
  const chipName  = userData?.username || fullName;
  const gnName    = gnOfficer?.name      || `GN Officer (${userData?.gnDiv || 'N/A'})`;
  const gnAvailable = gnOfficer?.available ?? true;
  const gnDivLabel  = userData?.gnDiv    || userData?.dsDiv || '';

  if (authLoading) return <PageLoadingSkeleton />;

  const prev = () => setAnnouncIdx(i => i === 0 ? announcements.length - 1 : i - 1);
  const next = () => setAnnouncIdx(i => i === announcements.length - 1 ? 0 : i + 1);

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

  // Search Results Dropdown Component
  const SearchResultsDropdown = () => {
    if (!showSearchResults || filteredPages.length === 0) return null;
    
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
              navigate(page.path);
              setSearchQuery('');
              setShowSearchResults(false);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              border: 'none',
              backgroundColor: idx === filteredPages.length - 1 ? '#fff' : '#fff',
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

  // Shared widget components
  const AppointmentsWidget = () => (
    <div style={{ backgroundColor: '#c8a882', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
      <div style={{ padding: '16px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '15px', fontWeight: 900, color: '#fff' }}>Upcoming Appointments</div>
        <button onClick={() => fetchAppointments(true)} disabled={refreshingAppointments} style={{ background: 'none', border: 'none', cursor: refreshingAppointments ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.3s', transform: refreshingAppointments ? 'rotate(180deg)' : 'none', opacity: refreshingAppointments ? 0.7 : 1 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
            <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>
      <div style={{ backgroundColor: '#fff', borderRadius: '0 0 16px 16px', padding: '6px 20px 12px', minHeight: '180px' }}>
        {loadingAppointments ? <AppointmentsSkeleton /> :
         appointments.length === 0 ? <EmptyState type="appointments" /> :
         appointments.map((app, idx) => (
           <AppointmentRow key={app.id} month={app.month} day={app.day} title={app.title} time={app.time} status={app.status} last={idx === appointments.length - 1} />
         ))}
      </div>
    </div>
  );

  const AnnouncementsWidget = () => (
    <div style={{ backgroundColor: '#c8a882', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
      <div style={{ padding: '16px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '15px', fontWeight: 900, color: '#fff' }}>Latest Announcements</div>
        <button onClick={() => fetchAnnouncements(true)} disabled={refreshingAnnouncements} style={{ background: 'none', border: 'none', cursor: refreshingAnnouncements ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.3s', transform: refreshingAnnouncements ? 'rotate(180deg)' : 'none', opacity: refreshingAnnouncements ? 0.7 : 1 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
            <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>
      <div style={{ backgroundColor: '#fff', borderRadius: '0 0 16px 16px', padding: '16px 20px', minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {loadingAnnouncements ? <AnnouncementsSkeleton /> :
         announcements.length === 0 ? <EmptyState type="announcements" /> : (
          <>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e1200', marginBottom: '8px' }}>{announcements[announcIdx]?.title}</div>
              <p style={{ fontSize: '13px', color: '#666', fontWeight: 500, lineHeight: 1.6, margin: 0 }}>{announcements[announcIdx]?.body}</p>
            </div>
            {announcements.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                <button onClick={prev} style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1.5px solid #e8d5ac', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#F5C400'; e.currentTarget.style.background = '#fff8dc'; }}
                  onMouseOut={e  => { e.currentTarget.style.borderColor = '#e8d5ac'; e.currentTarget.style.background = '#fff'; }}
                ><Icon d={Icons.chevLeft} size={14} color="#888" /></button>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {announcements.map((_, i) => (
                    <div key={i} onClick={() => setAnnouncIdx(i)} style={{ width: i === announcIdx ? '18px' : '7px', height: '7px', borderRadius: '999px', backgroundColor: i === announcIdx ? '#F5C400' : '#ddd', cursor: 'pointer', transition: 'all 0.2s' }} />
                  ))}
                </div>
                <button onClick={next} style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1.5px solid #e8d5ac', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#F5C400'; e.currentTarget.style.background = '#fff8dc'; }}
                  onMouseOut={e  => { e.currentTarget.style.borderColor = '#e8d5ac'; e.currentTarget.style.background = '#fff'; }}
                ><Icon d={Icons.chevRight} size={14} color="#888" /></button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Nunito, system-ui, sans-serif', backgroundColor: '#f8f6f0' }}>
      <div style={{ flex: 1, display: 'flex' }}>

        {/* DESKTOP SIDEBAR */}
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
                  if (item.key === 'announcements') navigate('/announcements');
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
                  else if (item.key === 'profile') navigate('/profile');
                  else if (item.key === 'settings') navigate('/settings');
                  else setActivePage(item.key);
                }}
              />
            ))}
          </div>
        </div>

        {/* MOBILE SIDEBAR OVERLAY */}
        {mobileMenuOpen && (
          <>
            <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
            <div style={{ position: 'fixed', top: 0, left: 0, width: '250px', height: '100vh', backgroundColor: '#F5C400', zIndex: 1001, overflowY: 'auto', padding: '20px 0' }}>
              <div style={{ padding: '0 20px 20px', textAlign: 'right' }}>
                <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>✕</button>
              </div>
              {navItems.map(item => (
                <NavItem key={item.key} iconPath={item.icon} label={item.label} active={activePage === item.key}
                  onClick={() => {
                    if (item.key === 'announcements') navigate('/announcements');
                    else if (item.key === 'appointments') navigate('/appointments');
                    else setActivePage(item.key);
                    setMobileMenuOpen(false);
                  }}
                />
              ))}
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', margin: '10px 0', paddingTop: '10px' }}>
                {bottomNav.map(item => (
                  <NavItem key={item.key} iconPath={item.icon} label={item.label} active={activePage === item.key}
                    onClick={() => {
                      if (item.key === 'logout') handleLogout();
                      else if (item.key === 'profile') navigate('/profile');
                      else if (item.key === 'settings') navigate('/settings');
                      else setActivePage(item.key);
                      setMobileMenuOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* MAIN COLUMN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* DESKTOP TOPBAR */}
          <div className="desktop-topbar" style={{ height: '64px', backgroundColor: '#fff', borderBottom: '1px solid #ede8d8', display: 'flex', alignItems: 'center', padding: '0 28px', gap: '14px', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 0 #ede8d8' }}>
            <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f5f0e8', border: '1.5px solid #e8d8b0', borderRadius: '999px', padding: '9px 18px' }}
                onMouseOver={e => e.currentTarget.style.borderColor = '#F5C400'}
                onMouseOut={e  => e.currentTarget.style.borderColor = '#e8d8b0'}
              >
                <Icon d={Icons.search} size={16} color="#aaa" />
                <input
                  type="text"
                  placeholder="Search for a page or function..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
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
                  <button onClick={() => { setSearchQuery(''); setShowSearchResults(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <Icon d={Icons.close} size={14} color="#aaa" />
                  </button>
                )}
              </div>
              <SearchResultsDropdown />
            </div>
            <div style={{ flex: 1 }} />
            <LanguageSwitcher 
              currentLanguage={currentLanguage} 
              onLanguageChange={handleLanguageChange}
            />
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
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'left' }}>
              <img src="/logo2.png" alt="Smart Grama Sewa" style={{ height: '48px', width: 'auto' }} />
            </div>

            {/* LanguageSwitcher */}
            <LanguageSwitcher 
              currentLanguage={currentLanguage} 
              onLanguageChange={handleLanguageChange}
            />
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

          {/* DESKTOP CONTENT */}
          <div className="desktop-content" style={{ padding: '24px 28px', flex: 1 }}>

            {/* Welcome + GN side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', marginBottom: '22px' }}>
              <div style={{ backgroundColor: '#fff8dc', border: '1.5px solid #f0d870', borderRadius: '16px', padding: '22px 28px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '68px', height: '68px', borderRadius: '50%', backgroundColor: '#e0d8c8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid #d4c090' }}>
                  <Icon d={Icons.profile} size={32} color="#8a7060" strokeWidth={1.5} />
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#1e1200', letterSpacing: '-0.3px' }}>
                  Welcome Back, {firstName}!
                </div>
              </div>

              <div style={{ backgroundColor: '#fff', border: '1.5px solid #e8d5ac', borderRadius: '16px', padding: '18px 24px', minWidth: '190px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#888' }}>GN officer</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#1e1200' }}>{gnName}</div>
                {gnDivLabel && <div style={{ fontSize: '11px', fontWeight: 600, color: '#aaa' }}>{gnDivLabel}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: gnAvailable ? '#22c55e' : '#f87171' }}>
                    {gnAvailable ? 'Available' : 'Unavailable'}
                  </span>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: gnAvailable ? '#22c55e' : '#f87171', boxShadow: gnAvailable ? '0 0 0 3px rgba(34,197,94,0.2)' : '0 0 0 3px rgba(248,113,113,0.2)', animation: 'pulseGn 2s infinite' }} />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#1e1200', marginBottom: '14px' }}>Quick Actions</div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <QuickCard iconPath={Icons.calendar} label="Book Appointment" onClick={() => navigate('/appointments')} />
                <QuickCard iconPath={Icons.download} label="Download forms"   onClick={() => navigate('/forms')} />
                <QuickCard iconPath={Icons.ai}       label="AI assistant"     onClick={() => navigate('/ai')} />
                <QuickCard iconPath={Icons.phone}    label="Contact GN"       onClick={() => navigate('/contactGN')} />
              </div>
            </div>

            {/* Widgets */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
              <AppointmentsWidget />
              <AnnouncementsWidget />
            </div>
          </div>

          {/* MOBILE CONTENT */}
          <div className="mobile-content" style={{ flex: 1, display: 'none', backgroundColor: '#f5f0e8' }}>

            {/* Mobile Search Bar */}
            <div style={{ padding: '12px 14px 0', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: '#fff', border: '1.5px solid #e8d8b0', borderRadius: 999, padding: '10px 16px' }}>
                <Icon d={Icons.search} size={16} color="#aaa" />
                <input
                  type="text"
                  placeholder="Search for a page..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
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
                  <button onClick={() => { setSearchQuery(''); setShowSearchResults(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <Icon d={Icons.close} size={14} color="#aaa" />
                  </button>
                )}
              </div>
              {/* Search results for mobile */}
              {showSearchResults && filteredPages.length > 0 && (
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
                        navigate(page.path);
                        setSearchQuery('');
                        setShowSearchResults(false);
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
                      }}
                    >
                      <Icon d={page.icon} size={18} color="#B46A02" />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e1200' }}>{page.name}</div>
                        <div style={{ fontSize: '11px', color: '#888' }}>Click to go</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: '12px 14px', paddingBottom: '90px' }}>

              {/* Welcome card */}
              <div style={{ backgroundColor: '#fff8dc', border: '1.5px solid #f0d870', borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#e8e0d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid #d4c090' }}>
                  <Icon d={Icons.profile} size={24} color="#8a7060" strokeWidth={1.5} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#1e1200', lineHeight: 1.3 }}>
                  Welcome Back, {firstName}!
                </div>
              </div>

              {/* GN Officer card */}
              <div style={{ backgroundColor: '#fff', border: '1.5px solid #e8d5ac', borderRadius: 16, padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 2 }}>GN officer</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#1e1200' }}>{gnName}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: gnAvailable ? '#22c55e' : '#f87171' }}>
                    {gnAvailable ? 'Available' : 'Unavailable'}
                  </span>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: gnAvailable ? '#22c55e' : '#f87171', flexShrink: 0 }} />
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#1e1200', marginBottom: 12 }}>Quick Actions</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    { icon: Icons.calendar, label: 'Book Appointment', action: () => navigate('/appointments') },
                    { icon: Icons.download, label: 'Download forms',   action: () => navigate('/forms') },
                    { icon: Icons.ai,       label: 'AI assistant',     action: () => navigate('/ai') },
                    { icon: Icons.phone,    label: 'Contact GN',       action: () => navigate('/contact-gn') },
                  ].map((item, i) => (
                    <button key={i} onClick={item.action} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 18px', borderRadius: 999,
                      backgroundColor: '#fff', border: '1.5px solid #e8d5ac',
                      fontSize: 13, fontWeight: 700, color: '#1e1200',
                      cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}>
                      <Icon d={item.icon} size={16} color="#B46A02" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Widgets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <AppointmentsWidget />
                <AnnouncementsWidget />
              </div>
            </div>
          </div>

        </div>
      </div>

      <footer className="desktop-footer" style={{ backgroundColor: '#6A2301', color: '#fff', textAlign: 'center', padding: '13px 16px', fontSize: '13px', fontWeight: 600 }}>
        ©2026 Smart Grama Sewa
      </footer>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes pulseGn {
          0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
          50%       { box-shadow: 0 0 0 6px rgba(34,197,94,0.08); }
        }

        /* Desktop */
        @media (min-width: 769px) {
          .desktop-sidebar     { display: flex !important; }
          .desktop-topbar      { display: flex !important; }
          .desktop-content     { display: block !important; }
          .desktop-footer      { display: block !important; }
          .mobile-topbar       { display: none !important; }
          .mobile-content      { display: none !important; }
        }

        /* Mobile */
        @media (max-width: 768px) {
          .desktop-sidebar     { display: none !important; }
          .desktop-topbar      { display: none !important; }
          .desktop-content     { display: none !important; }
          .desktop-footer      { display: none !important; }
          .mobile-topbar       { display: flex !important; }
          .mobile-content      { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;