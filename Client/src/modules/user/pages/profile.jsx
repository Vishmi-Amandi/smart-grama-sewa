import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { PageLoadingSkeleton, ProfileSkeleton } from '../components/skeleton';
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
  tick:         'M4 12l5 5L20 6',
  close:        'M18 6L6 18M6 6l12 12',
  phone:        'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  mail:         'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
  location:     'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 10a1 1 0 100-2 1 1 0 000 2z',
  calendar:     'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
};

// List of all pages/functions for search
const PAGE_ACTIONS = [
  { name: 'Dashboard', path: '/dashboard', icon: IC.dashboard },
  { name: 'Announcements', path: '/announcements', icon: IC.announcement },
  { name: 'Appointments', path: '/appointments', icon: IC.appointments },
  { name: 'Forms', path: '/forms', icon: IC.forms },
  { name: 'AI Assistant', path: '/ai', icon: IC.ai },
  { name: 'Profile', path: '/profile', icon: IC.profile },
  { name: 'Settings', path: '/settings', icon: IC.settings },
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

// NavItem
const NavItem = ({ iconPath, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-none cursor-pointer transition-all duration-150 text-left mb-0.5 ${
    active 
      ? 'bg-yellow-100 text-user-primary font-extrabold shadow-md' 
      : 'bg-transparent text-gray-700 font-semibold hover:bg-yellow-50'
  }`}
    style={{ color: active ? '#B46A02' : '#5a3a00' }}
  >
    <Icon d={iconPath} size={18} color={active ? '#B46A02' : '#5a3a00'} />
    {label}
  </button>
);

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
        className="profile-button flex items-center gap-2 py-1 pl-1.5 pr-3.5 bg-user-secondary-light border border-user-border rounded-round cursor-pointer transition-all hover:border-user-primary"
      >
        <span className="text-sm font-bold text-user-text max-w-[100px] truncate">{chipName}</span>
        <div className="w-7 h-7 rounded-full bg-user-primary flex items-center justify-center flex-shrink-0">
          <Icon d={IC.profile} size={16} color="#3d2a00" />
        </div>
      </button>
      
      {showProfileMenu && (
        <div className="profile-menu absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-user-border z-50 overflow-hidden animate-fade-in">
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

// Mobile Topbar
const MobileTopbar = ({ chipName, onMenuClick, navigate, currentLanguage, onLanguageChange }) => (
  <div className="mobile-topbar hidden h-16 bg-user-primary items-center px-4 gap-3 sticky top-0 z-40 shadow-md">
    <button onClick={onMenuClick} className="bg-none border-none cursor-pointer p-1.5 flex-shrink-0">
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#3d2a00" strokeWidth={2.2}>
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
    <div className="flex-1 flex items-center justify-start">
      <img src="/logo2.png" alt="Smart Grama Sewa" className="h-10 w-auto" />
    </div>
    <LanguageSwitcher currentLanguage={currentLanguage} onLanguageChange={onLanguageChange} />
    <div className="w-9 h-9 flex items-center justify-center relative">
      <Icon d={IC.bell} size={22} color="#1e1200" />
      <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500 border border-user-primary" />
    </div>
    <div className="w-9 h-9 rounded-full bg-white/85 flex items-center justify-center cursor-pointer" onClick={() => navigate('/profile')}>
      <Icon d={IC.profile} size={20} color="#3d2a00" />
    </div>
  </div>
);

// Mobile Sidebar Overlay
const MobileSidebar = ({ isOpen, onClose, navigate, onLogout, currentPath }) => {
  const navItems = [
    { key: 'dashboard', icon: IC.dashboard, label: 'Dashboard', path: '/dashboard' },
    { key: 'announcements', icon: IC.announcement, label: 'Announcements', path: '/announcements' },
    { key: 'appointments', icon: IC.appointments, label: 'Appointments', path: '/appointments' },
    { key: 'forms', icon: IC.forms, label: 'Forms', path: '/forms' },
    { key: 'ai', icon: IC.ai, label: 'AI assistant', path: '/ai' },
  ];
  const bottomNav = [
    { key: 'profile', icon: IC.profile, label: 'Profile', path: '/profile' },
    { key: 'settings', icon: IC.settings, label: 'Settings', path: '/settings' },
    { key: 'logout', icon: IC.logout, label: 'Sign out', action: 'logout' },
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
          <NavItem 
            key={item.key} 
            iconPath={item.icon} 
            label={item.label} 
            active={currentPath === item.path}
            onClick={() => { navigate(item.path); onClose(); }} 
          />
        ))}
        <div className="border-t border-white/20 my-3 pt-3">
          {bottomNav.map((item) => (
            <NavItem 
              key={item.key} 
              iconPath={item.icon} 
              label={item.label} 
              active={currentPath === item.path}
              onClick={() => { if (item.action === 'logout') onLogout(); else navigate(item.path); onClose(); }} 
            />
          ))}
        </div>
      </div>
    </>
  );
};

// Desktop Sidebar
const DesktopSidebar = ({ navigate, onLogout, currentPath }) => {
  const navItems = [
    { key: 'dashboard', icon: IC.dashboard, label: 'Dashboard', path: '/dashboard' },
    { key: 'announcements', icon: IC.announcement, label: 'Announcements', path: '/announcements' },
    { key: 'appointments', icon: IC.appointments, label: 'Appointments', path: '/appointments' },
    { key: 'forms', icon: IC.forms, label: 'Forms', path: '/forms' },
    { key: 'ai', icon: IC.ai, label: 'AI assistant', path: '/ai' },
  ];
  const bottomNav = [
    { key: 'profile', icon: IC.profile, label: 'Profile', path: '/profile' },
    { key: 'settings', icon: IC.settings, label: 'Settings', path: '/settings' },
    { key: 'logout', icon: IC.logout, label: 'Sign out', action: 'logout' },
  ];

  return (
    <div className="desktop-sidebar w-[220px] flex-shrink-0 bg-user-primary flex flex-col sticky top-0 h-screen overflow-y-auto">
      <div className="p-5 pb-4 border-b border-black/10">
        <img src="/logo2.png" alt="Smart Grama Sewa" className="h-20 w-auto" />
      </div>
      <div className="flex-1 p-3">
        {navItems.map((item) => (
          <NavItem 
            key={item.key} 
            iconPath={item.icon} 
            label={item.label} 
            active={currentPath === item.path}
            onClick={() => navigate(item.path)} 
          />
        ))}
      </div>
      <div className="p-3 pt-2 border-t border-black/10">
        {bottomNav.map((item) => (
          <NavItem 
            key={item.key} 
            iconPath={item.icon} 
            label={item.label} 
            active={currentPath === item.path}
            onClick={() => item.action === 'logout' ? onLogout() : navigate(item.path)} 
          />
        ))}
      </div>
    </div>
  );
};

// Info row (view mode)
const InfoRow = ({ label, value }) => (
  <div className="mb-4">
    <div className="text-xs font-extrabold text-user-warning mb-1.5">{label}</div>
    <div className="text-sm font-semibold text-user-text pb-2.5 border-b border-user-border-light">
      {value || '—'}
    </div>
  </div>
);

// Form field (edit mode)
const Field = ({ label, value, onChange, type = 'text', placeholder = '', disabled = false }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-extrabold text-user-warning">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full py-3 px-3.5 text-sm font-semibold border border-user-border rounded-lg outline-none transition-colors focus:border-user-primary ${disabled ? 'bg-user-secondary-light text-user-text-lighter' : 'bg-white text-user-text'}`}
    />
  </div>
);

const GenderSelect = ({ value, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-extrabold text-user-warning">Gender</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full py-3 px-3.5 text-sm font-semibold bg-white border border-user-border rounded-lg outline-none focus:border-user-primary"
    >
      <option value="">Select…</option>
      <option value="Male">Male</option>
      <option value="Female">Female</option>
      <option value="Other">Other</option>
    </select>
  </div>
);

// MAIN PROFILE COMPONENT
const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // SEARCH STATE
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // LANGUAGE STATE
  const [currentLanguage, setCurrentLanguage] = useState('en');
  
  // PROFILE DROPDOWN STATE
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [form, setForm] = useState({
    fullName: '', dob: '', gender: '', address: '',
    occupation: '', mobile: '', email: '', district: '', dsDiv: '', gnDiv: '',
  });

  // Handle resize for mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Click outside to close search results and profile menu
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

  // Handle language change
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
            setForm({
              fullName: data.fullName || '', dob: data.dob || '', gender: data.gender || '',
              address: data.address || '', occupation: data.occupation || '',
              mobile: data.mobile || '', email: user.email || '',
              district: data.district || '', dsDiv: data.dsDiv || '', gnDiv: data.gnDiv || '',
            });
          }
        } catch (e) { console.warn(e); }
      } else { navigate('/login'); }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  const handleLogout = async () => { await signOut(auth); navigate('/login'); };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    setSaveError('');
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        fullName: form.fullName, dob: form.dob, gender: form.gender,
        address: form.address, occupation: form.occupation, mobile: form.mobile,
      });
      setUserData(prev => ({ ...prev, ...form }));
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) { setSaveError('Failed to save changes.'); }
    finally { setSaving(false); }
  };

  const handleCancel = () => {
    if (userData) {
      setForm({
        fullName: userData.fullName || '', dob: userData.dob || '', gender: userData.gender || '',
        address: userData.address || '', occupation: userData.occupation || '',
        mobile: userData.mobile || '', email: currentUser?.email || '',
        district: userData.district || '', dsDiv: userData.dsDiv || '', gnDiv: userData.gnDiv || '',
      });
    }
    setSaveError('');
    setIsEditing(false);
  };

  const update = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const chipName = userData?.username || userData?.fullName || currentUser?.email?.split('@')[0] || 'User';
  const nicMasked = userData?.nic ? userData.nic.slice(0, 3) + 'XXXXX' : 'XXXXXXXXXXXX';

  if (authLoading) return <PageLoadingSkeleton />;

  return (
    <div className="user-module min-h-screen flex flex-col font-sans bg-user-background">
      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        {!isMobile && <DesktopSidebar navigate={navigate} onLogout={handleLogout} currentPath={currentPath} />}

        {/* Mobile Sidebar Overlay */}
        <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} navigate={navigate} onLogout={handleLogout} currentPath={currentPath} />

        {/* MAIN COLUMN */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Desktop Topbar */}
          {!isMobile && (
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
          )}

          {/* Mobile Topbar */}
          <MobileTopbar 
            chipName={chipName}
            onMenuClick={() => setMobileMenuOpen(true)}
            navigate={navigate}
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
          />

          {/* Mobile Search Bar */}
          <div className="md:hidden pt-3 px-3.5 relative">
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
              <SearchResultsDropdown 
                searchQuery={searchQuery}
                showResults={showSearchResults}
                setShowResults={setShowSearchResults}
                navigate={navigate}
              />
            )}
          </div>

          {/* DESKTOP & MOBILE CONTENT */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            {!userData && !isEditing && <ProfileSkeleton />}
            
            {!isEditing && userData && (
              <>
                <h1 className="text-2xl md:text-3xl font-black text-user-text tracking-tight">My Profile</h1>
                <p className="text-sm font-semibold text-user-text-lighter mb-6">View and manage personal information.</p>
                {saveSuccess && (
                  <div className="flex items-center gap-2 bg-user-success-light border border-user-success rounded-xl p-3 mb-4">
                    <Icon d={IC.tick} size={14} color="#1a7a3a" strokeWidth={2.5} />
                    <span className="text-sm font-semibold text-user-success">Profile updated successfully!</span>
                  </div>
                )}

                {/* Profile Header Card */}
                <div className="bg-user-surface border border-user-border rounded-xl p-5 flex flex-col md:flex-row items-center md:items-start gap-5 mb-5">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-3 border-user-text bg-user-secondary-light flex items-center justify-center">
                      <Icon d={IC.profile} size={36} color="#5a4030" />
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <div className="text-xl font-black text-user-text">{userData?.fullName || chipName}</div>
                    <div className="text-sm text-user-text-lighter font-semibold mt-1">Citizen ID : {nicMasked}</div>
                    <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                      <div className="flex items-center gap-1 text-xs text-user-success">
                        <div className="w-2 h-2 rounded-full bg-user-success" />
                        <span>Active Account</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="flex items-center justify-center gap-2 py-2.5 px-6 bg-user-primary rounded-round text-sm font-extrabold text-user-text cursor-pointer transition-all hover:bg-user-primary-dark"
                  >
                    <Icon d={IC.edit} size={15} /> Edit Profile
                  </button>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-user-surface border border-user-border rounded-xl p-5">
                    <h3 className="text-base font-extrabold text-user-text mb-4 pb-2 border-b border-user-border-light">Personal Information</h3>
                    <InfoRow label="Full Name" value={userData?.fullName} />
                    <InfoRow label="NIC Number" value={userData?.nic} />
                    <InfoRow label="Date Of Birth" value={userData?.dob} />
                    <InfoRow label="Gender" value={userData?.gender} />
                    <InfoRow label="Home Address" value={userData?.address} />
                    <InfoRow label="Occupation" value={userData?.occupation} />
                  </div>

                  <div className="bg-user-surface border border-user-border rounded-xl p-5">
                    <h3 className="text-base font-extrabold text-user-text mb-4 pb-2 border-b border-user-border-light">Contact Details</h3>
                    <InfoRow label="Mobile Number" value={userData?.mobile} />
                    <InfoRow label="Email Address" value={currentUser?.email} />
                    <InfoRow label="District" value={userData?.district} />
                    <InfoRow label="DS Division" value={userData?.dsDiv} />
                    <InfoRow label="GN Division" value={userData?.gnDiv} />
                  </div>
                </div>
              </>
            )}

            {isEditing && (
              <>
                <h1 className="text-2xl md:text-3xl font-black text-user-text tracking-tight mb-1">Edit Profile</h1>
                <p className="text-sm text-user-text-lighter font-semibold mb-7">Update your personal information and contact details.</p>

                {saveError && (
                  <div className="flex items-center gap-2 bg-user-error-light border border-user-error rounded-xl p-3 mb-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span className="text-sm font-semibold text-user-error">{saveError}</span>
                  </div>
                )}

                <div className="bg-user-surface border border-user-border rounded-xl p-5 md:p-7 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Full Name" value={form.fullName} onChange={update('fullName')} />
                    <Field label="Date Of Birth" value={form.dob} onChange={update('dob')} type="date" />
                    <Field label="Occupation" value={form.occupation} onChange={update('occupation')} />
                    <GenderSelect value={form.gender} onChange={update('gender')} />
                    <div className="md:col-span-2">
                      <Field label="Home Address" value={form.address} onChange={update('address')} />
                    </div>
                    <Field label="Mobile Number" value={form.mobile} onChange={update('mobile')} disabled={true} />
                    <Field label="Email Address" value={form.email} onChange={update('email')} disabled={true} />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button 
                    onClick={handleCancel} 
                    className="py-3 px-8 bg-user-secondary rounded-round text-sm font-extrabold text-white cursor-pointer transition-all hover:bg-user-secondary-dark"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className={`py-3 px-8 bg-user-primary rounded-round text-sm font-extrabold text-user-text cursor-pointer transition-all hover:bg-user-primary-dark ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-[#6A2301] text-white text-center py-3 px-4 text-sm font-semibold">
        © 2026 Smart Grama Sewa. All rights reserved.
      </footer>

      <style>{`
        .rounded-round {
          border-radius: 999px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (min-width: 769px) {
          .desktop-sidebar { display: flex !important; }
          .desktop-topbar { display: flex !important; }
          .mobile-topbar { display: none !important; }
        }

        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .desktop-topbar { display: none !important; }
          .mobile-topbar { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

export default Profile;