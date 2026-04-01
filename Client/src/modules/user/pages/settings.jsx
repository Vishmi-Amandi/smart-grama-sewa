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
  check:     'M20 6L9 17l-5-5',
  globe:     'M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z M2 12h20',
  moon:      'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
  sun:       'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42 M12 17a5 5 0 100-10 5 5 0 000 10z',
  lock:      'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z M7 11V7a5 5 0 0110 0v4',
  user:      'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
};

// Shared layout
const S = {
  page:    { minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Nunito, system-ui, sans-serif', backgroundColor: '#f5f0e8' },
  shell:   { flex: 1, display: 'flex' },
  sidebar: { width: '235px', flexShrink: 0, backgroundColor: '#F5C400', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' },
  main:    { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  topbar:  { height: '64px', backgroundColor: '#fff', borderBottom: '1px solid #e8d8b0', display: 'flex', alignItems: 'center', padding: '0 28px', gap: '14px', position: 'sticky', top: 0, zIndex: 40 },
  content: { padding: '28px 32px', flex: 1 },
  footer:  { backgroundColor: '#6A2301', color: '#fff', textAlign: 'center', padding: '13px 16px', fontSize: '13px', fontWeight: 600 },
  card:    { backgroundColor: '#fff', border: '1.5px solid #e8d5ac', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
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
  <div style={S.sidebar}>
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
          onClick={() => navigate(`/${i.key}`)} />
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
  <div style={S.topbar}>
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

// Section heading
const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 16, fontWeight: 900, color: '#1e1200', marginBottom: 16, paddingBottom: 10, borderBottom: '1.5px solid #f0e8d0' }}>
    {children}
  </div>
);

// Option card (selectable)
const OptionCard = ({ selected, onClick, children }) => (
  <div onClick={onClick} style={{
    padding: '14px 18px',
    border: selected ? '2px solid #F5C400' : '1.5px solid #e8d5ac',
    borderRadius: 12,
    backgroundColor: selected ? '#fff8e0' : '#fff',
    cursor: 'pointer',
    transition: 'all .15s',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    boxShadow: selected ? '0 2px 10px rgba(245,196,0,0.2)' : 'none',
  }}
    onMouseOver={e => { if (!selected) { e.currentTarget.style.borderColor = '#B46A02'; e.currentTarget.style.backgroundColor = '#fffbe0'; } }}
    onMouseOut={e  => { if (!selected) { e.currentTarget.style.borderColor = '#e8d5ac'; e.currentTarget.style.backgroundColor = '#fff'; } }}
  >
    {children}
    {/* Checkmark */}
    {selected && (
      <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: '#F5C400', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 12 }}>
        <Icon d={IC.check} size={12} color="#3d2a00" sw={2.5} />
      </div>
    )}
  </div>
);

// Save toast
const SaveToast = ({ show }) => (
  <div style={{
    position: 'fixed', bottom: 28, right: 28, zIndex: 200,
    backgroundColor: '#1e1200', color: '#fff',
    padding: '12px 22px', borderRadius: 12,
    fontSize: 13, fontWeight: 700,
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    opacity: show ? 1 : 0,
    transform: show ? 'translateY(0)' : 'translateY(12px)',
    transition: 'all .3s ease',
    pointerEvents: 'none',
    display: 'flex', alignItems: 'center', gap: 8,
  }}>
    <Icon d={IC.check} size={15} color="#F5C400" sw={2.5} />
    Settings saved!
  </div>
);

//  MAIN COMPONENT
const Settings = () => {
  const navigate = useNavigate();

  // Auth
  const [currentUser, setCurrentUser] = useState(null);
  const [userData,    setUserData]    = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Settings tabs
  const [activeTab, setActiveTab] = useState('language');

  // Settings values
  const [settings, setSettings] = useState({
    language: 'en',
    theme:    'light',
    textSize: 'normal',
  });

  // Toast
  const [showToast, setShowToast] = useState(false);

  // Auth listener
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

  // Load saved settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        applySettings(parsed);
      } catch (e) { console.warn('Could not load settings'); }
    }
  }, []);

  // Apply settings to the DOM
  const applySettings = (s) => {
    // Theme
    if (s.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Text size
    const sizes = { small: '14px', normal: '16px', large: '18px' };
    document.documentElement.style.fontSize = sizes[s.textSize] || '16px';
  };

  // Update a single setting
  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('userSettings', JSON.stringify(newSettings));
    applySettings(newSettings);
    // Show save toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleLogout = async () => { await signOut(auth); navigate('/login'); };
  const chipName = userData?.username || userData?.fullName || currentUser?.email?.split('@')[0] || 'User';

  const SETTING_TABS = [
    { id: 'language',   icon: '🌐', label: 'Language'          },
    { id: 'appearance', icon: '🎨', label: 'Appearance'        },
    { id: 'security',   icon: '🔒', label: 'Privacy & Security'},
    { id: 'account',    icon: '👤', label: 'Account'           },
  ];

  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f0e8' }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', border: '4px solid #F5C400', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.shell}>

        <Sidebar active="settings" navigate={navigate} onLogout={handleLogout} />

        <div style={S.main}>
          <Topbar chipName={chipName} />

          <div style={S.content}>

            {/* Page title */}
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1e1200', marginBottom: 4, letterSpacing: '-0.4px' }}>Settings</h1>
            <p style={{ fontSize: 13, color: '#888', fontWeight: 600, marginBottom: 28 }}>
              Manage your account preferences and accessibility options.
            </p>

            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

              {/* Settings sidebar tabs */}
              <div style={{ ...S.card, width: 220, flexShrink: 0, padding: '12px 10px' }}>
                {SETTING_TABS.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 10, border: 'none',
                      backgroundColor: isActive ? '#fff8e0' : 'transparent',
                      color: isActive ? '#B46A02' : '#555',
                      fontWeight: isActive ? 800 : 600, fontSize: 14,
                      fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer',
                      marginBottom: 2, transition: 'all .15s',
                      borderLeft: isActive ? '3px solid #F5C400' : '3px solid transparent',
                    }}
                      onMouseOver={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#f8f4ec'; }}
                      onMouseOut={e  => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <span style={{ fontSize: 18 }}>{tab.icon}</span>
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Settings content panel */}
              <div style={{ ...S.card, flex: 1, padding: '26px 28px', minHeight: 400 }}>

                {/* LANGUAGE TAB */}
                {activeTab === 'language' && (
                  <div>
                    <SectionTitle>🌐 Language</SectionTitle>
                    <p style={{ fontSize: 13, color: '#888', fontWeight: 600, marginBottom: 20 }}>
                      Choose the language for the portal interface.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[
                        { code: 'si', flag: '🇱🇰', name: 'සිංහල', sub: 'Sinhala' },
                        { code: 'ta', flag: '🇱🇰', name: 'தமிழ்', sub: 'Tamil'   },
                        { code: 'en', flag: '🇬🇧', name: 'English', sub: 'English' },
                      ].map(lang => (
                        <OptionCard
                          key={lang.code}
                          selected={settings.language === lang.code}
                          onClick={() => updateSetting('language', lang.code)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <span style={{ fontSize: 28 }}>{lang.flag}</span>
                            <div>
                              <div style={{ fontSize: 15, fontWeight: 800, color: '#1e1200' }}>{lang.name}</div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#aaa' }}>{lang.sub}</div>
                            </div>
                          </div>
                        </OptionCard>
                      ))}
                    </div>

                    {/* Current selection note */}
                    <div style={{ marginTop: 20, padding: '12px 16px', backgroundColor: '#f5f0e8', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#888' }}>
                      ℹ️ Language changes will take effect after the next page load.
                      Currently selected: <strong style={{ color: '#3d2a00' }}>
                        {{ si: 'සිංහල (Sinhala)', ta: 'தமிழ் (Tamil)', en: 'English' }[settings.language]}
                      </strong>
                    </div>
                  </div>
                )}

                {/* APPEARANCE TAB */}
                {activeTab === 'appearance' && (
                  <div>
                    {/* Theme */}
                    <SectionTitle>🎨 Theme</SectionTitle>
                    <p style={{ fontSize: 13, color: '#888', fontWeight: 600, marginBottom: 16 }}>
                      Choose how the portal looks.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
                      {[
                        { value: 'light', icon: '☀️', label: 'Light Mode',  desc: 'Bright and clean interface' },
                        { value: 'dark',  icon: '🌙', label: 'Dark Mode',   desc: 'Easy on the eyes at night'  },
                      ].map(t => (
                        <OptionCard
                          key={t.value}
                          selected={settings.theme === t.value}
                          onClick={() => updateSetting('theme', t.value)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 28 }}>{t.icon}</span>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 800, color: '#1e1200' }}>{t.label}</div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#aaa' }}>{t.desc}</div>
                            </div>
                          </div>
                        </OptionCard>
                      ))}
                    </div>

                    {/* Text Size */}
                    <SectionTitle>🔤 Text Size</SectionTitle>
                    <p style={{ fontSize: 13, color: '#888', fontWeight: 600, marginBottom: 16 }}>
                      Adjust the text size for better readability.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      {[
                        { value: 'small',  label: 'Small',  preview: 14, desc: '14px' },
                        { value: 'normal', label: 'Normal', preview: 16, desc: '16px' },
                        { value: 'large',  label: 'Large',  preview: 20, desc: '18px' },
                      ].map(sz => (
                        <OptionCard
                          key={sz.value}
                          selected={settings.textSize === sz.value}
                          onClick={() => updateSetting('textSize', sz.value)}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                            <span style={{ fontSize: sz.preview, fontWeight: 900, color: '#1e1200', lineHeight: 1 }}>Aa</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#3d2a00' }}>{sz.label}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#aaa' }}>{sz.desc}</span>
                          </div>
                        </OptionCard>
                      ))}
                    </div>
                  </div>
                )}

                {/* SECURITY TAB (placeholder) */}
                {activeTab === 'security' && (
                  <div>
                    <SectionTitle>🔒 Privacy & Security</SectionTitle>
                    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#1e1200', marginBottom: 8 }}>
                        Security Settings
                      </div>
                      <div style={{ fontSize: 13, color: '#aaa', fontWeight: 600 }}>
                        Change password, manage sessions, and security options coming in Day 5.
                      </div>
                    </div>
                  </div>
                )}

                {/* ACCOUNT TAB (placeholder) */}
                {activeTab === 'account' && (
                  <div>
                    <SectionTitle>👤 Account</SectionTitle>
                    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#1e1200', marginBottom: 8 }}>
                        Account Settings
                      </div>
                      <div style={{ fontSize: 13, color: '#aaa', fontWeight: 600 }}>
                        Account summary, update mobile number, and danger zone coming in Day 5.
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      <footer style={S.footer}>©2026 Smart Grama Sewa</footer>

      {/* Save toast */}
      <SaveToast show={showToast} />

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default Settings;
