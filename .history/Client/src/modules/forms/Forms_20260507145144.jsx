import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';

// --- Shared Components from Teammate ---
const Icon = ({ d, size = 20, color = 'currentColor', sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const IC = {
  dashboard:    'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  announce:     'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  appts:        'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2',
  forms:        'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  ai:           'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  profile:      'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  settings:     'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
  logout:       'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
  search:       'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  bell:         'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
};

const S = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Nunito, system-ui, sans-serif', backgroundColor: '#f5f0e8' },
  shell: { flex: 1, display: 'flex' },
  sidebar: { width: '240px', flexShrink: 0, backgroundColor: '#F5C400', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  topbar: { height: '64px', backgroundColor: '#fff', borderBottom: '1px solid #e8d8b0', display: 'flex', alignItems: 'center', padding: '0 28px', gap: '14px', position: 'sticky', top: 0, zIndex: 40 },
  content: { padding: '28px 32px', flex: 1 },
  footer: { backgroundColor: '#6A2301', color: '#fff', textAlign: 'center', padding: '13px 16px', fontSize: '13px', fontWeight: 600 },
  card: { backgroundColor: '#fff', border: '1.5px solid #e8d5ac', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
};

const NavItem = ({ d, label, active, onClick }) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
    padding: '11px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
    backgroundColor: active ? 'rgba(255,255,255,0.9)' : 'transparent',
    color: '#3d2a00', fontWeight: active ? 800 : 600, fontSize: '14px',
    fontFamily: 'inherit', textAlign: 'left', marginBottom: '2px',
    transition: 'background 0.15s',
    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.10)' : 'none',
  }}
    onMouseOver={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.4)'; }}
    onMouseOut={e  => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
  >
    <Icon d={d} size={18} color={active ? '#B46A02' : '#5a3a00'} />
    {label}
  </button>
);

// --- Forms Content ---
const Forms = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState('All');

  const tabs = ['All', 'Certificates', 'Applications', 'Recommendations'];

  const formList = [
    { id: 1, title: "Residence Certificate", cat: "Certificates", desc: "Proof of residence for official use" },
    { id: 2, title: "Character Certificate", cat: "Certificates", desc: "Proof of character for various purposes" },
    { id: 3, title: "Income Certificate", cat: "Certificates", desc: "Proof of income for various purposes" },
    { id: 4, title: "Valuation Certificate", cat: "Certificates", desc: "Property valuation for legal needs" },
    { id: 5, title: "Identity Card Application", cat: "Applications", desc: "New or replacement NIC application" },
    { id: 6, title: "Living Funds for Disabled Persons", cat: "Recommendations", desc: "Financial assistance application" },
  ];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) setUserData(snap.data());
      } else {
        navigate('/login');
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  const handleLogout = async () => { await signOut(auth); navigate('/login'); };
  const chipName = userData?.username || userData?.fullName || currentUser?.email?.split('@')[0] || 'User';

  if (authLoading) return null;

  return (
    <div style={S.page}>
      <div style={S.shell}>
        {/* Sidebar */}
        <div style={S.sidebar}>
          <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <img src="/logo2.png" alt="Smart Grama Sewa" style={{ height: '80px', width: 'auto' }} />
          </div>
          <div style={{ flex: 1, padding: '12px 10px' }}>
            <NavItem d={IC.dashboard} label="Dashboard" active={false} onClick={() => navigate('/dashboard')} />
            <NavItem d={IC.announce} label="Announcements" active={false} onClick={() => navigate('/announcements')} />
            <NavItem d={IC.appts} label="Appointments" active={false} onClick={() => navigate('/appointments')} />
            <NavItem d={IC.forms} label="Forms" active={true} onClick={() => navigate('/forms')} />
            <NavItem d={IC.ai} label="AI assistant" active={false} onClick={() => navigate('/ai')} />
          </div>
          <div style={{ padding: '10px 10px 20px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            <NavItem d={IC.profile} label="Profile" active={false} onClick={() => navigate('/profile')} />
            <NavItem d={IC.settings} label="Settings" active={false} onClick={() => navigate('/settings')} />
            <NavItem d={IC.logout} label="Logout" active={false} onClick={handleLogout} />
          </div>
        </div>

        {/* Main Content */}
        <div style={S.main}>
          {/* Topbar */}
          <div style={S.topbar}>
            <div style={{ flex: 1, maxWidth: 420, display: 'flex', alignItems: 'center', gap: 10, backgroundColor: '#f5f0e8', border: '1.5px solid #e8d8b0', borderRadius: 999, padding: '9px 18px' }}>
              <Icon d={IC.search} size={16} color="#aaa" />
              <span style={{ fontSize: 14, color: '#bbb', fontWeight: 600 }}>search forms</span>
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

          <div style={S.content}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1e1200', marginBottom: 4 }}>Forms Library</h1>
            <p style={{ fontSize: 13, color: '#888', fontWeight: 600, marginBottom: 24 }}>Browse and download essential Grama Niladhari service forms.</p>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '2px solid #e8d5ac', marginBottom: 20 }}>
              {tabs.map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: '10px 20px', border: 'none', background: 'none',
                  fontSize: 15, fontWeight: tab === t ? 900 : 600,
                  color: tab === t ? '#3d2a00' : '#888', cursor: 'pointer',
                  borderBottom: tab === t ? '3px solid #F5C400' : '3px solid transparent',
                  marginBottom: -2, fontFamily: 'inherit', transition: 'all .15s',
                }}>{t}</button>
              ))}
              <button style={{ marginLeft: 'auto', backgroundColor: '#8a6040', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 16px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>My Forms</button>
            </div>

            {/* Form List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {formList.filter(f => tab === 'All' || f.cat === tab).map(form => (
                <div key={form.id} style={{ ...S.card, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, backgroundColor: '#f5f0e8', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon d={IC.forms} size={24} color="#8a6040" />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#1e1200' }}>{form.title}</div>
                      <div style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>{form.desc}</div>
                    </div>
                  </div>
                  <button style={{
                    padding: '8px 20px', borderRadius: 999, border: '1.5px solid #e8d5ac',
                    backgroundColor: '#fff', fontSize: 13, fontWeight: 800, color: '#3d2a00', cursor: 'pointer'
                  }}>View Form</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <footer style={S.footer}>©2026 Smart Grama Sewa</footer>
    </div>
  );
};

export default Forms;