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
  location:     'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 10a1 1 0 100-2 1 1 0 000 2z',
  clock:        'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0',
  mail:         'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
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

// Search Results Dropdown
const SearchResultsDropdown = ({ searchQuery, showResults, setShowResults, navigate }) => {
  const PAGE_ACTIONS = [
    { name: 'Dashboard', path: '/dashboard', icon: Icons.dashboard },
    { name: 'Announcements', path: '/announcements', icon: Icons.announcement },
    { name: 'Appointments', path: '/appointments', icon: Icons.appointments },
    { name: 'Forms', path: '/forms', icon: Icons.forms },
    { name: 'AI Assistant', path: '/ai', icon: Icons.ai },
    { name: 'Profile', path: '/profile', icon: Icons.profile },
    { name: 'Settings', path: '/settings', icon: Icons.settings },
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
            setShowResults(false);
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

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowSearchResults(false);
    };
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
    { key: 'dashboard', icon: Icons.dashboard, label: 'Dashboard', path: '/dashboard' },
    { key: 'announcements', icon: Icons.announcement, label: 'Announcements', path: '/announcements' },
    { key: 'appointments', icon: Icons.appointments, label: 'Appointments', path: '/appointments' },
    { key: 'forms', icon: Icons.forms, label: 'Forms', path: '/forms' },
    { key: 'ai', icon: Icons.ai, label: 'AI assistant', path: '/ai' },
  ];
  const bottomNav = [
    { key: 'profile', icon: Icons.profile, label: 'Profile', path: '/profile' },
    { key: 'settings', icon: Icons.settings, label: 'Settings', path: '/settings' },
    { key: 'logout', icon: Icons.logout, label: 'Sign out', action: 'logout' },
  ];

  const chipName = userData?.username || userData?.fullName || currentUser?.email?.split('@')[0] || 'User';

  if (authLoading) return <PageLoadingSkeleton />;

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
              <NavItem key={item.key} iconPath={item.icon} label={item.label} active={false}
                onClick={() => navigate(item.path)}
              />
            ))}
          </div>
          <div style={{ padding: '10px 10px 20px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
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
            <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
            <div style={{ position: 'fixed', top: 0, left: 0, width: '250px', height: '100vh', backgroundColor: '#F5C400', zIndex: 1001, overflowY: 'auto', padding: '20px 0' }}>
              <div style={{ padding: '0 20px 20px', textAlign: 'right' }}>
                <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>✕</button>
              </div>
              {navItems.map(item => (
                <NavItem key={item.key} iconPath={item.icon} label={item.label} active={false}
                  onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                />
              ))}
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', margin: '10px 0', paddingTop: '10px' }}>
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
              <SearchResultsDropdown 
                searchQuery={searchQuery}
                showResults={showSearchResults}
                setShowResults={setShowSearchResults}
                navigate={navigate}
              />
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
              onClick={() => navigate('/profile')}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e1200', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chipName}</span>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#F5C400', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon d={Icons.profile} size={16} color="#3d2a00" />
              </div>
            </div>
          </div>

          {/* MOBILE TOPBAR */}
          <div className="mobile-topbar" style={{
            display: 'none',
            height: '64px', backgroundColor: '#F5C400',
            alignItems: 'center', padding: '0 16px', gap: '12px',
            position: 'sticky', top: 0, zIndex: 40,
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          }}>
            <button onClick={() => setMobileMenuOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, flexShrink: 0 }}>
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#3d2a00" strokeWidth={2.2}>
                <line x1="3" y1="6"  x2="21" y2="6"  />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'left' }}>
              <img src="/logo2.png" alt="Smart Grama Sewa" style={{ height: '48px', width: 'auto' }} />
            </div>
            <LanguageSwitcher 
              currentLanguage={currentLanguage} 
              onLanguageChange={handleLanguageChange}
            />
            <div style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <Icon d={Icons.bell} size={22} color="#1e1200" />
              <div style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#e05050', border: '1.5px solid #F5C400' }} />
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              onClick={() => navigate('/profile')}
            >
              <Icon d={Icons.profile} size={20} color="#3d2a00" />
            </div>
          </div>

          {/* PAGE CONTENT */}
          <div style={{ padding: isMobile ? '16px' : '24px 28px', flex: 1 }}>
            
            {/* Page Header */}
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1e1200', letterSpacing: '-0.4px', marginBottom: 4 }}>
                Contact GN Officer
              </h1>
              <p style={{ fontSize: 13, color: '#888', fontWeight: 600 }}>
                Get in touch with your Grama Niladhari officer
              </p>
            </div>

            {/* GN Officer Card with Call & Email Buttons Next to Name - Desktop */}
            {!isMobile ? (
              // DESKTOP VIEW - Buttons next to name
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '20px',
                padding: '24px 28px',
                marginBottom: '24px',
                border: '1px solid #e8d5ac',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    backgroundColor: '#F5C400',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon d={Icons.profile} size={36} color="#3d2a00" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e1200', marginBottom: '4px' }}>
                      {gnOfficer?.name || 'Grama Niladhari'}
                    </h2>
                    <p style={{ fontSize: '13px', color: '#d97706', fontWeight: 600, marginBottom: '4px' }}>
                      {gnOfficer?.designation || 'Grama Niladhari Officer'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>
                      {userData?.gnDiv || userData?.dsDiv || 'Your GN Division'}
                    </p>
                  </div>
                </div>
                
                {/* Action Buttons - Next to Name */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleCall} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 24px',
                    backgroundColor: '#eff6ff',
                    border: 'none',
                    borderRadius: '40px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#dbeafe'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = '#eff6ff'}>
                    <Icon d={Icons.phone} size={18} color="#3b82f6" strokeWidth={2} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Call</span>
                  </button>

                  <button onClick={handleEmail} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 24px',
                    backgroundColor: '#fef3c7',
                    border: 'none',
                    borderRadius: '40px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#fde68a'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = '#fef3c7'}>
                    <Icon d={Icons.mail} size={18} color="#d97706" strokeWidth={2} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Email</span>
                  </button>
                </div>
              </div>
            ) : (
              // MOBILE VIEW - Stacked layout
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '20px',
                padding: '24px',
                marginBottom: '24px',
                border: '1px solid #e8d5ac',
                textAlign: 'center',
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#F5C400',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <Icon d={Icons.profile} size={40} color="#3d2a00" strokeWidth={1.5} />
                </div>
                
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e1200', marginBottom: '4px' }}>
                  {gnOfficer?.name || 'Grama Niladhari'}
                </h2>
                <p style={{ fontSize: '13px', color: '#d97706', fontWeight: 600, marginBottom: '8px' }}>
                  {gnOfficer?.designation || 'Grama Niladhari Officer'}
                </p>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
                  {userData?.gnDiv || userData?.dsDiv || 'Your GN Division'}
                </p>
                
                {/* Mobile Action Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleCall} style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    backgroundColor: '#eff6ff',
                    border: 'none',
                    borderRadius: '40px',
                    cursor: 'pointer',
                  }}>
                    <Icon d={Icons.phone} size={18} color="#3b82f6" strokeWidth={2} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Call</span>
                  </button>

                  <button onClick={handleEmail} style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    backgroundColor: '#fef3c7',
                    border: 'none',
                    borderRadius: '40px',
                    cursor: 'pointer',
                  }}>
                    <Icon d={Icons.mail} size={18} color="#d97706" strokeWidth={2} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Email</span>
                  </button>
                </div>
              </div>
            )}

            {/* Contact Details Card */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '20px',
              padding: isMobile ? '20px' : '24px',
              marginBottom: '20px',
              border: '1px solid #e8d5ac',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e1200', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon d={Icons.phone} size={18} color="#B46A02" />
                Contact Information
              </h3>
              
              <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f0e8d0' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px', fontWeight: 600 }}>Mobile Number</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#1e1200' }}>{gnOfficer?.mobile || 'Not available'}</span>
                  {gnOfficer?.mobile && (
                    <button onClick={handleCopyMobile} style={{
                      padding: '6px 16px',
                      backgroundColor: '#f5f0e8',
                      border: '1px solid #e8d5ac',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#e8e0d0'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = '#f5f0e8'}>
                      Copy
                    </button>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f0e8d0' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px', fontWeight: 600 }}>Office Phone</div>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#1e1200' }}>{gnOfficer?.officePhone || 'Not available'}</span>
              </div>

              <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f0e8d0' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px', fontWeight: 600 }}>Email Address</div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e1200' }}>{gnOfficer?.email || 'Not available'}</span>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px', fontWeight: 600 }}>Emergency Contact (24/7)</div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626' }}>{gnOfficer?.emergencyContact || '+94 71 234 5678'}</span>
              </div>
            </div>

            {/* Office Information Card */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '20px',
              padding: isMobile ? '20px' : '24px',
              marginBottom: '24px',
              border: '1px solid #e8d5ac',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e1200', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon d={Icons.location} size={18} color="#B46A02" />
                Office Information
              </h3>
              
              <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
                <Icon d={Icons.clock} size={20} color="#d97706" />
                <div>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px', fontWeight: 600 }}>Office Hours</div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e1200' }}>{gnOfficer?.officeHours || '9:00 AM - 4:00 PM (Mon-Fri)'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Icon d={Icons.location} size={20} color="#d97706" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '2px', fontWeight: 600 }}>Office Address</div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e1200', lineHeight: 1.5 }}>
                    {gnOfficer?.officeAddress || 'Grama Niladhari Office, Divisional Secretariat'}
                  </span>
                </div>
              </div>
            </div>

            {/* Book Appointment Button */}
            <button
              onClick={() => navigate('/appointments')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: isMobile ? '14px' : '16px',
                backgroundColor: '#F5C400',
                border: 'none',
                borderRadius: '40px',
                fontSize: isMobile ? '15px' : '16px',
                fontWeight: 800,
                color: '#3d2a00',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => {
                e.currentTarget.style.backgroundColor = '#d4a800';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.backgroundColor = '#F5C400';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Icon d={Icons.calendar} size={20} color="#3d2a00" />
              Book an Appointment
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="desktop-footer" style={{ backgroundColor: '#6A2301', color: '#fff', textAlign: 'center', padding: '13px 16px', fontSize: '13px', fontWeight: 600 }}>
        ©2026 Smart Grama Sewa
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

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