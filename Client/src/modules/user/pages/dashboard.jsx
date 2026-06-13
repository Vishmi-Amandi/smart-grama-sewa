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

const IC = {
  dashboard:    'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  announcement: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  appointments: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2',
  forms:        'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  ai:           'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
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
  appointment:  'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
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
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  bolt: 'M13 10V3L4 14h7v7l9-11h-7z',
  wave: 'M2 12c3.5-4 8.5-4 12 0s8.5 4 12 0 M4 16c3-3 9-3 12 0s9 3 12 0',
  sun: 'M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M5.64 17.66l1.41-1.41 M16.95 6.05l1.41-1.41 M12 6a6 6 0 100 12 6 6 0 000-12z',
};

// NavItem 
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

// QuickCard
const QuickCard = ({ iconPath, label, onClick, tooltip }) => (
  <div className="relative group w-full">
    <button 
      onClick={onClick} 
      className="flex flex-col items-center justify-center gap-2 w-full py-4 px-3 bg-user-surface border border-user-border rounded-lg cursor-pointer font-sans text-xs sm:text-sm font-bold text-user-text transition-all duration-200 shadow-sm hover:border-user-primary hover:bg-user-primary-light hover:-translate-y-0.5"
    >
      <Icon d={iconPath} size={20} color="#B46A02" />
      <span className="text-center whitespace-nowrap">{label}</span>
    </button>
    {tooltip && (
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
        {tooltip}
      </span>
    )}
  </div>
);

// AppointmentRow
const AppointmentRow = ({ month, day, title, time, status, last }) => (
  <div className={`flex items-center gap-3.5 py-3 ${!last ? 'border-b border-user-border-light' : ''}`}>
    <div className="w-12 flex-shrink-0 text-center bg-user-secondary-light rounded-lg py-1.5 px-1">
      <div className="text-[10px] font-extrabold text-user-warning uppercase tracking-wide">{month}</div>
      <div className="text-[22px] font-black text-user-text leading-tight">{day}</div>
    </div>
    <div className="flex-1">
      <div className="text-sm font-extrabold text-user-text mb-0.5">{title}</div>
      <div className="text-xs font-semibold text-user-text-lighter">{time}</div>
    </div>
    {status && (
      <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${status === 'Confirmed' ? 'bg-user-success-light text-user-success' : 'bg-user-warning-light text-user-warning'}`}>
        <Icon d={status === 'Confirmed' ? IC.success : IC.warning} size={8} color="currentColor" strokeWidth={2.5} />
        {status === 'Confirmed' ? 'Confirmed' : 'Pending'}
      </div>
    )}
  </div>
);

// Enhanced Skeleton Components
const AppointmentsSkeleton = () => (
  <div>
    {[1,2,3].map(i => (
      <div key={i} className="flex items-center gap-3.5 py-3">
        <div className="w-12 h-[58px] bg-gray-200 rounded-lg skeleton-shimmer" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded-md w-3/4 mb-2 skeleton-shimmer" />
          <div className="h-3 bg-gray-200 rounded-md w-2/5 skeleton-shimmer" />
        </div>
      </div>
    ))}
  </div>
);

const AnnouncementsSkeleton = () => (
  <div>
    <div className="h-[18px] bg-gray-200 rounded-md w-4/5 mb-3 skeleton-shimmer" />
    <div className="h-3 bg-gray-200 rounded-md w-[95%] mb-2 skeleton-shimmer" />
    <div className="h-3 bg-gray-200 rounded-md w-3/5 skeleton-shimmer" />
  </div>
);

// Empty State Component
const EmptyState = ({ type, onAction }) => {
  const config = {
    appointments: {
      icon: IC.calendar,
      title: 'No Upcoming Appointments',
      description: 'Book your first appointment with your GN Officer',
      buttonText: 'Book Appointment'
    },
    announcements: {
      icon: IC.announcementIcon,
      title: 'No Announcements Yet',
      description: 'Check back later for updates from your GN Officer',
      buttonText: 'Refresh'
    }
  };
  
  const data = config[type];
  
  return (
    <div className="text-center py-12 px-6">
      <div className="w-20 h-20 rounded-full bg-user-secondary-light flex items-center justify-center mx-auto mb-4">
        <Icon d={data.icon} size={40} color="#ccc" strokeWidth={1.2} />
      </div>
      <h3 className="text-base font-extrabold text-user-text mb-2">{data.title}</h3>
      <p className="text-sm text-user-text-lighter mb-5">{data.description}</p>
      <button
        onClick={onAction}
        className="px-5 py-2 bg-user-primary border-none rounded-lg text-sm font-bold text-user-text cursor-pointer transition-all hover:bg-user-primary-dark"
      >
        {data.buttonText}
      </button>
    </div>
  );
};

// Time-based greeting with icon
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', icon: IC.sun };
  if (hour < 18) return { text: 'Good Afternoon', icon: IC.sun };
  return { text: 'Good Evening', icon: IC.wave };
};

// List of all pages/functions for search
const PAGE_ACTIONS = [
  { name: 'Dashboard', path: '/dashboard', icon: IC.dashboard, keywords: ['home', 'main', 'overview'] },
  { name: 'Announcements', path: '/announcements', icon: IC.announcement, keywords: ['news', 'updates', 'notices'] },
  { name: 'Appointments', path: '/appointments', icon: IC.appointments, keywords: ['booking', 'schedule', 'meeting'] },
  { name: 'Forms', path: '/forms', icon: IC.forms, keywords: ['documents', 'applications', 'certificates'] },
  { name: 'AI Assistant', path: null, icon: IC.ai, keywords: ['chatbot', 'help', 'support'] },
  { name: 'Profile', path: '/profile', icon: IC.profile, keywords: ['account', 'settings', 'my profile'] },
  { name: 'Settings', path: '/settings', icon: IC.settings, keywords: ['preferences', 'options', 'configuration'] },
];

// Default announcements
const defaultAnnouncements = [
  { id: 1, title: 'Income Certificate Service Resumed', body: "Applications are now open again. Citizens who couldn't apply during maintenance may now submit their requests.", date: '2026-04-01' },
  { id: 2, title: 'Gram Sabha Meeting — 5 April 2026',  body: 'Monthly Gram Sabha meeting at 10 AM in the Panchayat Hall. All ward citizens are requested to attend.', date: '2026-03-28' },
  { id: 3, title: 'Digital Certificates Now Available', body: 'Download your digitally signed certificates directly from the portal — no need to visit the office.', date: '2026-03-25' },
];

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
      page.name.toLowerCase().includes(query) ||
      page.keywords.some(keyword => keyword.toLowerCase().includes(query))
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
            <div className="text-[11px] text-user-text-lighter">Click to go to {page.name}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

// MAIN DASHBOARD
const Dashboard = () => {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('dashboard');
  const [announcIdx, setAnnouncIdx] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [toast, setToast] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const [appointments, setAppointments] = useState([]);
  const [announcements, setAnnouncements] = useState(defaultAnnouncements);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [refreshingAppointments, setRefreshingAppointments] = useState(false);
  const [refreshingAnnouncements, setRefreshingAnnouncements] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [gnOfficer, setGnOfficer] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Handle language change
  const handleLanguageChange = (langCode) => {
    setCurrentLanguage(langCode);
    console.log('Language changed to:', langCode);
  };

  // Fetch appointments
  const fetchAppointments = async (showRefresh = false) => {
    showRefresh ? setRefreshingAppointments(true) : setLoadingAppointments(true);
    try {
      if (!currentUser) return;
      const today = new Date().toISOString().split('T')[0];
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
    } catch (e) { 
      console.error('Error fetching appointments:', e);
      showToast('Failed to load appointments', 'error');
    } finally { 
      setLoadingAppointments(false); 
      setRefreshingAppointments(false); 
    }
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
          body: d.data().body || d.data().description || '',
          date: d.data().createdAt?.toDate?.().toISOString().split('T')[0] || '',
        })));
      } else {
        setAnnouncements(defaultAnnouncements);
      }
    } catch (e) { 
      console.error('Error fetching announcements:', e);
      showToast('Failed to load announcements', 'error');
    } finally { 
      setLoadingAnnouncements(false); 
      setRefreshingAnnouncements(false); 
    }
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
                // Query by gnDiv field (which matches your GN officer document)
                const q = query(collection(db, 'gn_officers'), where('gnDiv', '==', data.gnDiv));
                const querySnap = await getDocs(q);
                
                if (!querySnap.empty) {
                  const gnData = querySnap.docs[0].data();
                  console.log("✅ Found GN Officer:", gnData.fullName, "Status:", gnData.availability);
                  setGnOfficer(gnData);
                } else {
                  console.log("❌ No GN officer found for division:", data.gnDiv);
                }
              } catch (e) { 
                console.warn('GN officer fetch error:', e.message);
              }
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

  const handleLogout = async () => { 
    try { 
      await signOut(auth); 
      showToast('Logged out successfully', 'success');
      navigate('/login'); 
    } catch (e) { 
      console.error(e);
      showToast('Failed to logout', 'error');
    } 
  };

  // Search function
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
    const handleClickOutside = (event) => {
      const profileButton = document.querySelector('.profile-button');
      const profileMenu = document.querySelector('.profile-menu');
      
      // Don't close if clicking on profile button or menu
      if (profileButton?.contains(event.target) || profileMenu?.contains(event.target)) {
        return;
      }
      
      setShowSearchResults(false);
      setShowProfileMenu(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fullName = userData?.fullName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const firstName = fullName.split(' ')[0];
  const chipName = userData?.username || fullName;
  const gnName = gnOfficer?.fullName || gnOfficer?.name || `GN Officer (${userData?.gnDiv || 'N/A'})`;  const gnAvailable = gnOfficer?.available ?? true;
  const gnDivLabel = userData?.gnDiv || userData?.dsDiv || '';
  const greeting = getTimeBasedGreeting();

  if (authLoading) return <PageLoadingSkeleton />;

  const prev = () => setAnnouncIdx(i => i === 0 ? announcements.length - 1 : i - 1);
  const next = () => setAnnouncIdx(i => i === announcements.length - 1 ? 0 : i + 1);

  const navItems = [
    { key: 'dashboard', icon: IC.dashboard, label: 'Dashboard', path: '/dashboard' },
    { key: 'announcements', icon: IC.announcement, label: 'Announcements', path: '/announcements' },
    { key: 'appointments', icon: IC.appointments, label: 'Appointments', path: '/appointments' },
    { key: 'forms', icon: IC.forms, label: 'Forms', path: '/forms' },
    { key: 'ai', icon: IC.ai, label: 'AI Assistant', path: null },
  ];
  const bottomNav = [
    { key: 'profile', icon: IC.profile, label: 'Profile', path: '/profile' },
    { key: 'settings', icon: IC.settings, label: 'Settings', path: '/settings' },
    { key: 'logout', icon: IC.logout, label: 'Sign out', action: 'logout' },
  ];

  // Shared widget components
  const AppointmentsWidget = () => (
    <div className="bg-[#c8a882] rounded-xl overflow-hidden shadow-md">
      <div className="flex justify-between items-center px-5 py-4">
        <div className="text-[15px] font-black text-white">Upcoming Appointments</div>
        <button 
          onClick={() => fetchAppointments(true)} 
          disabled={refreshingAppointments} 
          className="bg-none border-none cursor-pointer flex items-center justify-center transition-transform duration-300 disabled:opacity-70"
          style={{ transform: refreshingAppointments ? 'rotate(180deg)' : 'none' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
            <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>
      <div className="bg-user-surface px-5 py-2 pb-3 min-h-[180px]">
        {loadingAppointments ? <AppointmentsSkeleton /> :
         appointments.length === 0 ? 
           <EmptyState type="appointments" onAction={() => navigate('/appointments')} /> :
           appointments.map((app, idx) => (
             <AppointmentRow key={app.id} {...app} last={idx === appointments.length - 1} />
           ))
        }
      </div>
      {appointments.length > 0 && (
        <div className="text-center py-2 border-t border-user-border-light">
          <button 
            onClick={() => navigate('/appointments')}
            className="text-sm text-white font-semibold hover:underline"
          >
            View All Appointments →
          </button>
        </div>
      )}
    </div>
  );

  const AnnouncementsWidget = () => (
    <div className="bg-[#c8a882] rounded-xl overflow-hidden shadow-md">
      <div className="flex justify-between items-center px-5 py-4">
        <div className="text-[15px] font-black text-white">Latest Announcements</div>
        <button 
          onClick={() => fetchAnnouncements(true)} 
          disabled={refreshingAnnouncements} 
          className="bg-none border-none cursor-pointer flex items-center justify-center transition-transform duration-300 disabled:opacity-70"
          style={{ transform: refreshingAnnouncements ? 'rotate(180deg)' : 'none' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
            <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>
      <div className="bg-user-surface px-5 py-4 min-h-[265px] flex flex-col justify-between">
        {loadingAnnouncements ? <AnnouncementsSkeleton /> :
         announcements.length === 0 ? 
           <EmptyState type="announcements" onAction={() => fetchAnnouncements(false)} /> :
           <>
            <div>
              <div className="text-sm font-extrabold text-user-text mb-2">{announcements[announcIdx]?.title}</div>
              <p className="text-sm text-user-text-light font-medium leading-relaxed m-0">{announcements[announcIdx]?.body}</p>
            </div>
            {announcements.length > 1 && (
              <div className="flex justify-between items-center mt-3.5">
                <button onClick={prev} className="w-[30px] h-[30px] rounded-full border border-user-border bg-white flex items-center justify-center cursor-pointer transition-all hover:border-user-primary hover:bg-user-primary-light">
                  <Icon d={IC.chevLeft} size={14} color="#888" />
                </button>
                <div className="flex gap-1.5">
                  {announcements.map((_, i) => (
                    <div key={i} onClick={() => setAnnouncIdx(i)} 
                      className={`cursor-pointer transition-all ${i === announcIdx ? 'w-[18px] h-1.5 bg-user-primary' : 'w-1.5 h-1.5 bg-gray-300'} rounded-full`} />
                  ))}
                </div>
                <button onClick={next} className="w-[30px] h-[30px] rounded-full border border-user-border bg-white flex items-center justify-center cursor-pointer transition-all hover:border-user-primary hover:bg-user-primary-light">
                  <Icon d={IC.chevRight} size={14} color="#888" />
                </button>
              </div>
            )}
           </>
        }
      </div>
    </div>
  );

  return (
    <div className="user-module min-h-screen flex flex-col font-sans bg-user-background">
      <div className="flex-1 flex">
        {/* DESKTOP SIDEBAR */}
        <div className="desktop-sidebar w-[220px] flex-shrink-0 bg-user-primary flex flex-col sticky top-0 h-screen overflow-y-auto">
          <div className="p-5 pb-4 border-b border-black/10 flex justify-center">
            <img src="/logo2.png" alt="Smart Grama Sewa" className="h-16 w-auto" />
          </div>
          <div className="flex-1 p-3">
            {navItems.map(item => (
              <NavItem key={item.key} iconPath={item.icon} label={item.label} active={activePage === item.key}
                onClick={() => {
                  if (item.path === null) { window.openChatbot?.(); return; }
                  navigate(item.path);
                  setActivePage(item.key);
                }}
              />
            ))}
          </div>
          <div className="p-3 pt-2 border-t border-black/10">
            {bottomNav.map(item => (
              <NavItem key={item.key} iconPath={item.icon} label={item.label} active={activePage === item.key}
                onClick={() => item.action === 'logout' ? handleLogout() : navigate(item.path)}
              />
            ))}
          </div>
        </div>

        {/* MOBILE SIDEBAR OVERLAY */}
        {mobileMenuOpen && (
          <>
            <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 z-[1000]" />
            <div className="fixed top-0 left-0 w-[250px] h-screen bg-user-primary z-[1001] overflow-y-auto py-5">
              <div className="px-5 pb-5 text-right">
                <button onClick={() => setMobileMenuOpen(false)} className="bg-none border-none text-2xl cursor-pointer text-white">✕</button>
              </div>
              <div className="px-5 pb-5 border-b border-white/20 mb-2 flex justify-center">
                <img src="/logo2.png" alt="Smart Grama Sewa" className="h-12 w-auto" />
              </div>
              {navItems.map(item => (
                <NavItem key={item.key} iconPath={item.icon} label={item.label} active={activePage === item.key}
                  onClick={() => {
                    if (item.path === null) { window.openChatbot?.(); setMobileMenuOpen(false); return; }
                    navigate(item.path); setActivePage(item.key); setMobileMenuOpen(false);
                  }}
                />
              ))}
              <div className="border-t border-white/20 my-3 pt-3">
                {bottomNav.map(item => (
                  <NavItem key={item.key} iconPath={item.icon} label={item.label} active={activePage === item.key}
                    onClick={() => { 
                      if (item.action === 'logout') handleLogout();
                      else navigate(item.path);
                      setActivePage(item.key);
                      setMobileMenuOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* MAIN COLUMN */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* DESKTOP TOPBAR */}
          <div className="desktop-topbar h-16 bg-white border-b border-user-border-light flex items-center px-7 gap-3.5 sticky top-0 z-40 shadow-sm">
            <div className="flex-1 max-w-[400px] relative">
              <div className="flex items-center gap-2.5 bg-user-secondary-light border border-user-border rounded-3xl px-4 py-2 transition-colors hover:border-user-primary">
                <Icon d={IC.search} size={16} color="#aaa" />
                <input
                  type="text"
                  placeholder="Search for a page or function..."
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
              <SearchResultsDropdown 
                searchQuery={searchQuery}
                showResults={showSearchResults}
                setShowResults={setShowSearchResults}
                navigate={navigate}
              />
            </div>
            <div className="flex-1" />
            <LanguageSwitcher 
              currentLanguage={currentLanguage} 
              onLanguageChange={handleLanguageChange}
            />
            <div className="w-9 h-9 rounded-full bg-user-secondary-light border border-user-border flex items-center justify-center cursor-pointer relative transition-colors hover:border-user-primary">
              <Icon d={IC.bell} size={18} color="#5a3a00" />
              <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white" />
            </div>

            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileMenu(!showProfileMenu);
                }}
                className="profile-button flex items-center gap-2 py-1 pl-1.5 pr-3.5 bg-user-secondary-light border border-user-border rounded-3xl cursor-pointer transition-all hover:border-user-primary"
              >
                <span className="text-sm font-bold text-user-text max-w-[100px] truncate">{chipName}</span>
                <div className="w-7 h-7 rounded-full bg-user-primary flex items-center justify-center flex-shrink-0">
                  <Icon d={IC.profile} size={16} color="#3d2a00" />
                </div>
              </button>
              {showProfileMenu && (
                <div className="profile-menu absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-user-border z-50 overflow-hidden">
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

          {/* MOBILE TOPBAR */}
          <div className="mobile-topbar hidden h-16 bg-user-primary items-center px-4 gap-3 sticky top-0 z-40 shadow-md">
            <button onClick={() => setMobileMenuOpen(true)} className="bg-none border-none cursor-pointer p-1.5 flex-shrink-0">
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#3d2a00" strokeWidth={2.2}>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="flex-1 flex items-center justify-start">
              <img src="/logo2.png" alt="Smart Grama Sewa" className="h-10 w-auto" />
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

          {/* DESKTOP CONTENT */}
          <div className="desktop-content p-6 md:p-7 flex-1">
            {/* Welcome + GN side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 mb-5">
              <div className="bg-user-primary-light border border-user-warning rounded-xl p-5 md:p-6 flex items-center gap-5">
                <div className="w-[60px] h-[60px] md:w-[68px] md:h-[68px] rounded-full bg-[#e0d8c8] flex items-center justify-center flex-shrink-0 border-2 border-[#d4c090]">
                  <Icon d={IC.profile} size={28} color="#8a7060" strokeWidth={1.5} />
                </div>
                <div className="flex items-center gap-2 text-xl md:text-2xl font-black text-user-text tracking-tight">
                  <Icon d={greeting.icon} size={24} color="#B46A02" />
                  {greeting.text}, {firstName}!
                </div>
              </div>

              <div className="bg-user-surface border border-user-border rounded-xl p-4 md:p-5 min-w-[190px] flex flex-col justify-center gap-1">
                <div className="text-xs font-bold text-user-text-lighter">GN officer</div>
                <div className="text-base md:text-base font-black text-user-text">{gnName}</div>
                {gnDivLabel && <div className="text-[11px] font-semibold text-user-text-lighter">{gnDivLabel}</div>}
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-sm font-bold ${
                    gnOfficer?.availability === 'Available' ? 'text-green-600' :
                    gnOfficer?.availability === 'In Meeting' ? 'text-orange-500' :
                    gnOfficer?.availability === 'On Field' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {gnOfficer?.availability || 'Available'}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${
                    gnOfficer?.availability === 'Available' ? 'bg-green-500' :
                    gnOfficer?.availability === 'In Meeting' ? 'bg-orange-500' :
                    gnOfficer?.availability === 'On Field' ? 'bg-red-500' : 'bg-gray-400'
                  } animate-pulse-gn`} />
                </div>
                {/* Optional: Add status message */}
                {gnOfficer?.availability === 'In Meeting' && (
                  <div className="text-[10px] text-orange-500 mt-1">Currently in a meeting</div>
                )}
                {gnOfficer?.availability === 'On Field' && (
                  <div className="text-[10px] text-red-500 mt-1">Out on field duty</div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-5">
              <div className="flex items-center gap-2 text-[15px] font-extrabold text-user-text mb-3.5">
                <Icon d={IC.bolt} size={16} color="#B46A02" />
                Quick Actions
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <QuickCard iconPath={IC.calendar} label="Book Appointment" onClick={() => navigate('/appointments')} tooltip="Schedule a meeting with GN officer" />
                <QuickCard iconPath={IC.download} label="Download Forms" onClick={() => navigate('/forms')} tooltip="Download application forms" />
                <QuickCard iconPath={IC.ai} label="AI Assistant" onClick={() => window.openChatbot?.()} tooltip="Get help from our AI assistant" />
                <QuickCard iconPath={IC.phone} label="Contact GN" onClick={() => navigate('/contact-gn')} tooltip="Contact your GN officer" />
              </div>
            </div>

            {/* Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <AppointmentsWidget />
              <AnnouncementsWidget />
            </div>
          </div>

          {/* MOBILE CONTENT */}
          <div className="mobile-content hidden flex-1 bg-user-secondary-light">
            {/* Mobile Search Bar */}
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

            <div className="p-3.5 pb-[90px]">
              {/* Welcome card */}
              <div className="bg-user-primary-light border border-user-warning rounded-xl p-4 flex items-center gap-3.5 mb-3">
                <div className="w-12 h-12 rounded-full bg-[#e0d8c8] flex items-center justify-center flex-shrink-0 border-2 border-[#d4c090]">
                  <Icon d={IC.profile} size={24} color="#8a7060" strokeWidth={1.5} />
                </div>
                <div className="flex items-center gap-2 text-xl font-black text-user-text leading-tight">
                  <Icon d={greeting.icon} size={20} color="#B46A02" />
                  Welcome Back, {firstName}!
                </div>
              </div>

              {/* GN Officer card */}
              <div className="bg-user-surface border border-user-border rounded-xl p-3.5 mb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-user-text-lighter mb-0.5">GN officer</div>
                    <div className="text-base font-black text-user-text">{gnName}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-bold ${
                      gnOfficer?.availability === 'Available' ? 'text-green-600' :
                      gnOfficer?.availability === 'In Meeting' ? 'text-orange-500' :
                      gnOfficer?.availability === 'On Field' ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {gnOfficer?.availability || 'Available'}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${
                      gnOfficer?.availability === 'Available' ? 'bg-green-500' :
                      gnOfficer?.availability === 'In Meeting' ? 'bg-orange-500' :
                      gnOfficer?.availability === 'On Field' ? 'bg-red-500' : 'bg-gray-400'
                    } flex-shrink-0`} />
                  </div>
                </div>
                {gnOfficer?.availability === 'In Meeting' && (
                  <div className="text-[10px] text-orange-500 mt-2">Currently in a meeting</div>
                )}
                {gnOfficer?.availability === 'On Field' && (
                  <div className="text-[10px] text-red-500 mt-2">Out on field duty</div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="mb-5">
                <div className="text-base font-extrabold text-user-text mb-3">Quick Actions</div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: IC.calendar, label: 'Book Appointment', action: () => navigate('/appointments') },
                    { icon: IC.download, label: 'Download Forms', action: () => navigate('/forms') },
                    { icon: IC.ai, label: 'AI Assistant', action: () => window.openChatbot?.() },
                    { icon: IC.phone, label: 'Contact GN', action: () => navigate('/contact-gn') },
                  ].map((item, i) => (
                    <button key={i} onClick={item.action} className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-white border border-user-border text-xs font-bold text-user-text cursor-pointer shadow-sm transition-all hover:border-user-primary hover:bg-user-primary-light min-h-[85px]">
                      <Icon d={item.icon} size={22} color="#B46A02" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Widgets */}
              <div className="flex flex-col gap-4">
                <AppointmentsWidget />
                <AnnouncementsWidget />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-[#6A2301] text-white text-center py-3 px-4 text-sm font-semibold">
        © 2026 Smart Grama Sewa. All rights reserved.
      </footer>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[1100] animate-slide-up">
          <div className={`flex items-center gap-4 py-3 px-6 rounded-xl shadow-lg border ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
            <Icon d={toast.type === 'success' ? IC.success : IC.error} size={18} color="#fff" strokeWidth={2.5} />
            <span className="text-sm font-semibold">{toast.message}</span>
            <button onClick={() => setToast(null)} className="bg-none border-none cursor-pointer text-white text-xl leading-5 p-0">×</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes slide-up {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        
        .skeleton-shimmer {
          background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease;
        }
        
        @keyframes pulse-gn {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.2); }
          50% { box-shadow: 0 0 0 6px rgba(34,197,94,0.08); }
        }
        
        .animate-pulse-gn {
          animation: pulse-gn 2s infinite;
        }

        /* Desktop */
        @media (min-width: 769px) {
          .desktop-sidebar { display: flex !important; }
          .desktop-topbar { display: flex !important; }
          .desktop-content { display: block !important; }
          .mobile-topbar { display: none !important; }
          .mobile-content { display: none !important; }
        }

        /* Mobile */
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .desktop-topbar { display: none !important; }
          .desktop-content { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .mobile-content { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;