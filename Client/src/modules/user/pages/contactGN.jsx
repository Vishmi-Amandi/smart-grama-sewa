import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  announcement: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  appointments: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  forms: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  ai: 'M12 2a10 10 0 100 20A10 10 0 0012 2z M12 8v4l3 3',
  profile: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
  bell: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  phone: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  chevLeft: 'M15 18l-6-6 6-6',
  chevRight: 'M9 18l6-6-6-6',
  close: 'M18 6L6 18M6 6l12 12',
  location: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 10a1 1 0 100-2 1 1 0 000 2z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0',
  mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
};

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

const SearchResultsDropdown = ({ searchQuery, showResults, setShowResults, navigate }) => {
  const PAGE_ACTIONS = [
    { name: 'Dashboard', path: '/dashboard', icon: IC.dashboard },
    { name: 'Announcements', path: '/announcements', icon: IC.announcement },
    { name: 'Appointments', path: '/appointments', icon: IC.appointments },
    { name: 'Forms', path: '/forms', icon: IC.forms },
    { name: 'AI Assistant', path: '/ai', icon: IC.ai },
    { name: 'Profile', path: '/profile', icon: IC.profile },
    { name: 'Settings', path: '/settings', icon: IC.settings },
  ];
  
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
          className="w-full flex items-center gap-3 px-4 py-3 border-none cursor-pointer text-left transition-colors hover:bg-user-background"
          style={{ borderBottom: idx === filteredPages.length - 1 ? 'none' : '1px solid #f0e8d0' }}
        >
          <Icon d={page.icon} size={18} color="#B46A02" />
          <div>
            <div className="text-sm font-bold text-user-text">{page.name}</div>
            <div className="text-xs text-user-text-lighter">Click to go to {page.name}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

const ContactGN = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [gnOfficer, setGnOfficer] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setShowSearchResults(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode) => {
    setCurrentLanguage(langCode);
    console.log('Language changed to:', langCode);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userSnap = await getDoc(doc(db, 'users', user.uid));
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserData(data);
            await fetchGNOfficer(data.gnDiv || data.dsDiv);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        navigate('/login');
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  const fetchGNOfficer = async (gnDivision) => {
    if (!gnDivision) {
      setGnOfficer(null);
      return;
    }
    try {
      const gnDoc = await getDoc(doc(db, 'gnOfficers', gnDivision));
      if (gnDoc.exists()) {
        setGnOfficer(gnDoc.data());
      } else {
        const q = query(collection(db, 'users'), where('role', '==', 'gnOfficer'), where('gnDiv', '==', gnDivision));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setGnOfficer(querySnapshot.docs[0].data());
        } else {
          setGnOfficer({
            name: 'Grama Niladhari Officer',
            designation: 'Grama Niladhari',
            mobile: '+94 77 123 4567',
            officePhone: '+94 11 234 5678',
            email: 'gn@gramasewa.gov.lk',
            officeHours: '9:00 AM - 4:00 PM (Monday - Friday)',
            officeAddress: 'Grama Niladhari Office, Divisional Secretariat',
            emergencyContact: '+94 71 234 5678',
            available: true,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching GN officer:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const handleCall = () => {
    const number = gnOfficer?.mobile?.replace(/[^0-9+]/g, '');
    if (number) window.location.href = `tel:${number}`;
  };

  const handleEmail = () => {
    if (gnOfficer?.email) window.location.href = `mailto:${gnOfficer.email}`;
  };

  const handleCopyMobile = () => {
    if (gnOfficer?.mobile) {
      navigator.clipboard.writeText(gnOfficer.mobile);
      alert('Mobile number copied!');
    }
  };

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

  const chipName = userData?.username || userData?.fullName || currentUser?.email?.split('@')[0] || 'User';

  if (authLoading) return <PageLoadingSkeleton />;

  return (
    <div className="user-module min-h-screen flex flex-col font-sans bg-user-background">
      <div className="flex-1 flex">
        {/* DESKTOP SIDEBAR */}
        <div className="desktop-sidebar w-[220px] flex-shrink-0 bg-user-primary flex flex-col sticky top-0 h-screen overflow-y-auto">
          <div className="p-5 pb-4 border-b border-black/10">
            <img src="/logo2.png" alt="Smart Grama Sewa" className="h-20 w-auto" />
          </div>
          <div className="flex-1 p-3">
            {navItems.map(item => (
              <NavItem key={item.key} iconPath={item.icon} label={item.label} active={false}
                onClick={() => navigate(item.path)}
              />
            ))}
          </div>
          <div className="p-3 pt-2 border-t border-black/10">
            {bottomNav.map(item => (
              <NavItem key={item.key} iconPath={item.icon} label={item.label} active={false}
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
                <NavItem key={item.key} iconPath={item.icon} label={item.label} active={false}
                  onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                />
              ))}
              <div className="border-t border-white/20 my-3 pt-3">
                {bottomNav.map(item => (
                  <NavItem key={item.key} iconPath={item.icon} label={item.label} active={false}
                    onClick={() => { 
                      if (item.action === 'logout') handleLogout();
                      else navigate(item.path);
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
              <div className="flex items-center gap-2.5 bg-user-secondary-light border border-user-border rounded-3xl px-4 py-2">
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
            <div className="w-9 h-9 rounded-full bg-user-secondary-light border border-user-border flex items-center justify-center cursor-pointer relative">
              <Icon d={IC.bell} size={18} color="#5a3a00" />
              <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white" />
            </div>
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileMenu(!showProfileMenu);
                }}
                className="flex items-center gap-2 py-1 pl-1.5 pr-3.5 bg-user-secondary-light border border-user-border rounded-3xl cursor-pointer transition-all hover:border-user-primary"
              >
                <span className="text-sm font-bold text-user-text max-w-[100px] truncate">{chipName}</span>
                <div className="w-7 h-7 rounded-full bg-user-primary flex items-center justify-center flex-shrink-0">
                  <Icon d={IC.profile} size={16} color="#3d2a00" />
                </div>
              </button>
              
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-user-border z-50 overflow-hidden animate-fade-in">
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
              <img src="/logo2.png" alt="Smart Grama Sewa" className="h-12 w-auto" />
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

          {/* PAGE CONTENT */}
          <div className={`p-4 md:p-6 xl:p-7 flex-1 animate-fade-in`}>
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-extrabold text-user-text tracking-tight mb-1">
                Contact GN Officer
              </h1>
              <p className="text-sm text-user-text-lighter font-semibold">
                Get in touch with your Grama Niladhari officer
              </p>
            </div>

            {/* GN Officer Card - Desktop View */}
            {!isMobile ? (
              <div className="bg-user-surface rounded-xl border border-user-border p-6 mb-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="w-[70px] h-[70px] rounded-full bg-user-primary flex items-center justify-center">
                    <Icon d={IC.profile} size={36} color="#3d2a00" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-user-text mb-1">
                      {gnOfficer?.name || 'Grama Niladhari'}
                    </h2>
                    <p className="text-sm text-user-warning font-semibold mb-1">
                      {gnOfficer?.designation || 'Grama Niladhari Officer'}
                    </p>
                    <p className="text-xs text-user-text-lighter">
                      {userData?.gnDiv || userData?.dsDiv || 'Your GN Division'}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={handleCall} 
                    className="flex items-center gap-2.5 py-3 px-6 bg-user-info-light border-none rounded-round cursor-pointer transition-all hover:bg-user-info/20"
                  >
                    <Icon d={IC.phone} size={18} color="#3b82f6" strokeWidth={2} />
                    <span className="text-sm font-bold text-user-text">Call</span>
                  </button>

                  <button 
                    onClick={handleEmail} 
                    className="flex items-center gap-2.5 py-3 px-6 bg-user-warning-light border-none rounded-round cursor-pointer transition-all hover:bg-user-warning/20"
                  >
                    <Icon d={IC.mail} size={18} color="#d97706" strokeWidth={2} />
                    <span className="text-sm font-bold text-user-text">Email</span>
                  </button>
                </div>
              </div>
            ) : (
              // Mobile View
              <div className="bg-user-surface rounded-xl border border-user-border p-6 mb-6 text-center">
                <div className="w-20 h-20 rounded-full bg-user-primary flex items-center justify-center mx-auto mb-4">
                  <Icon d={IC.profile} size={40} color="#3d2a00" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-extrabold text-user-text mb-1">
                  {gnOfficer?.name || 'Grama Niladhari'}
                </h2>
                <p className="text-sm text-user-warning font-semibold mb-2">
                  {gnOfficer?.designation || 'Grama Niladhari Officer'}
                </p>
                <p className="text-xs text-user-text-lighter mb-5">
                  {userData?.gnDiv || userData?.dsDiv || 'Your GN Division'}
                </p>
                <div className="flex gap-3">
                  <button onClick={handleCall} className="flex-1 flex items-center justify-center gap-2 py-3 bg-user-info-light border-none rounded-xl cursor-pointer">
                    <Icon d={IC.phone} size={18} color="#3b82f6" strokeWidth={2} />
                    <span className="text-sm font-bold text-user-text">Call</span>
                  </button>
                  <button onClick={handleEmail} className="flex-1 flex items-center justify-center gap-2 py-3 bg-user-warning-light border-none rounded-xl cursor-pointer">
                    <Icon d={IC.mail} size={18} color="#d97706" strokeWidth={2} />
                    <span className="text-sm font-bold text-user-text">Email</span>
                  </button>
                </div>
              </div>
            )}

            {/* Contact Details Card */}
            <div className="bg-user-surface rounded-xl border border-user-border p-5 md:p-6 mb-5">
              <h3 className="text-base font-extrabold text-user-text mb-4 flex items-center gap-2">
                <Icon d={IC.phone} size={18} color="#B46A02" />
                Contact Information
              </h3>
              
              <div className="mb-4 pb-3 border-b border-user-border-light">
                <div className="text-xs text-user-text-lighter font-semibold mb-1">Mobile Number</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm md:text-base font-bold text-user-text">{gnOfficer?.mobile || 'Not available'}</span>
                  {gnOfficer?.mobile && (
                    <button onClick={handleCopyMobile} className="py-1.5 px-4 bg-user-secondary-light border border-user-border rounded-round text-xs font-semibold cursor-pointer transition-colors hover:bg-user-border-light">
                      Copy
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-4 pb-3 border-b border-user-border-light">
                <div className="text-xs text-user-text-lighter font-semibold mb-1">Office Phone</div>
                <span className="text-sm md:text-base font-bold text-user-text">{gnOfficer?.officePhone || 'Not available'}</span>
              </div>

              <div className="mb-4 pb-3 border-b border-user-border-light">
                <div className="text-xs text-user-text-lighter font-semibold mb-1">Email Address</div>
                <span className="text-sm md:text-base font-bold text-user-text">{gnOfficer?.email || 'Not available'}</span>
              </div>

              <div>
                <div className="text-xs text-user-text-lighter font-semibold mb-1">Emergency Contact (24/7)</div>
                <span className="text-sm md:text-base font-bold text-user-error">{gnOfficer?.emergencyContact || '+94 71 234 5678'}</span>
              </div>
            </div>

            {/* Office Information Card */}
            <div className="bg-user-surface rounded-xl border border-user-border p-5 md:p-6 mb-6">
              <h3 className="text-base font-extrabold text-user-text mb-4 flex items-center gap-2">
                <Icon d={IC.location} size={18} color="#B46A02" />
                Office Information
              </h3>
              
              <div className="mb-4 flex gap-3">
                <Icon d={IC.clock} size={20} color="#d97706" />
                <div>
                  <div className="text-xs text-user-text-lighter font-semibold mb-0.5">Office Hours</div>
                  <span className="text-sm md:text-base font-semibold text-user-text">{gnOfficer?.officeHours || '9:00 AM - 4:00 PM (Mon-Fri)'}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Icon d={IC.location} size={20} color="#d97706" />
                <div className="flex-1">
                  <div className="text-xs text-user-text-lighter font-semibold mb-0.5">Office Address</div>
                  <span className="text-sm md:text-base font-semibold text-user-text leading-relaxed">
                    {gnOfficer?.officeAddress || 'Grama Niladhari Office, Divisional Secretariat'}
                  </span>
                </div>
              </div>
            </div>

            {/* Book Appointment Button */}
            <button
              onClick={() => navigate('/appointments')}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 md:py-4 bg-user-primary border-none rounded-lg text-base md:text-lg font-extrabold text-user-text cursor-pointer transition-all hover:bg-user-primary-dark hover:-translate-y-0.5 active:translate-y-0"
            >
              <Icon d={IC.calendar} size={20} color="#3d2a00" />
              Book an Appointment
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="desktop-footer bg-[#6A2301] text-white text-center py-3 px-4 text-sm font-semibold">
        ©2026 Smart Grama Sewa
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease;
        }

        @media (min-width: 769px) {
          .desktop-sidebar { display: flex !important; }
          .desktop-topbar { display: flex !important; }
          .desktop-footer { display: block !important; }
          .mobile-topbar { display: none !important; }
        }

        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .desktop-topbar { display: none !important; }
          .desktop-footer { display: none !important; }
          .mobile-topbar { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

export default ContactGN;
