import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, orderBy, getDocs, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { PageLoadingSkeleton, AnnouncementsListSkeleton } from '../components/skeleton';

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
  menu:      'M3 6h18M3 12h18M3 18h18',
  close:     'M6 18L18 6M6 6l12 12',
};

// Tag colour map
const TAG = {
  Urgent:      { border: '#e05050', chipBg: '#fde8e8', chipText: '#c0392b' },
  Important:   { border: '#f59e0b', chipBg: '#fff3dc', chipText: '#b45309' },
  Information: { border: '#3b82f6', chipBg: '#e8f0fb', chipText: '#1a4a8a' },
};
const tagCfg = (tag) => TAG[tag] || TAG.Information;

// NavItem for sidebar
const NavItem = ({ iconPath, label, active, onClick }) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
    padding: '11px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
    backgroundColor: active ? 'rgba(255,255,255,0.9)' : 'transparent',
    color: '#3d2a00', fontWeight: active ? 800 : 600, fontSize: '14px',
    fontFamily: 'inherit', textAlign: 'left', marginBottom: '2px', transition: 'background 0.15s',
    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.10)' : 'none',
  }}>
    <Icon d={iconPath} size={18} color={active ? '#B46A02' : '#5a3a00'} />
    {label}
  </button>
);

// Desktop Sidebar
const DesktopSidebar = ({ activePage, navigate, onLogout }) => {
  const navItems = [
    { key: 'dashboard', icon: IC.dashboard, label: 'Dashboard' },
    { key: 'announcements', icon: IC.announce, label: 'Announcements' },
    { key: 'appointments', icon: IC.appts, label: 'Appointments' },
    { key: 'forms', icon: IC.forms, label: 'Forms' },
    { key: 'ai', icon: IC.ai, label: 'AI assistant' },
  ];
  const bottomNav = [
    { key: 'profile', icon: IC.profile, label: 'Profile' },
    { key: 'settings', icon: IC.settings, label: 'Settings' },
    { key: 'logout', icon: IC.logout, label: 'Logout' },
  ];

  return (
    <div className="desktop-sidebar" style={{
      width: '220px', flexShrink: 0, backgroundColor: '#F5C400',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
    }}>
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <img src="/logo2.png" alt="Smart Grama Sewa" style={{ height: '80px', width: 'auto' }} />
      </div>
      <div style={{ flex: 1, padding: '12px 10px' }}>
        {navItems.map((item) => (
          <NavItem key={item.key} iconPath={item.icon} label={item.label}
            active={activePage === item.key}
            onClick={() => navigate(`/${item.key}`)} />
        ))}
      </div>
      <div style={{ padding: '10px 10px 20px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        {bottomNav.map((item) => (
          <NavItem key={item.key} iconPath={item.icon} label={item.label}
            active={activePage === item.key}
            onClick={() => item.key === 'logout' ? onLogout() : navigate(`/${item.key}`)} />
        ))}
      </div>
    </div>
  );
};

// Desktop Topbar
const DesktopTopbar = ({ chipName }) => (
  <div className="desktop-topbar" style={{
    height: '64px', backgroundColor: '#fff', borderBottom: '1px solid #ede8d8',
    display: 'flex', alignItems: 'center', padding: '0 28px', gap: '14px',
    position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 0 #ede8d8'
  }}>
    <div style={{
      flex: 1, maxWidth: 400, display: 'flex', alignItems: 'center', gap: 10,
      backgroundColor: '#f5f0e8', border: '1.5px solid #e8d8b0',
      borderRadius: 999, padding: '9px 18px'
    }}>
      <Icon d={IC.search} size={16} color="#aaa" />
      <span style={{ fontSize: 14, color: '#bbb', fontWeight: 600 }}>search</span>
    </div>
    <div style={{ flex: 1 }} />
    <span style={{ fontSize: 14, fontWeight: 800, color: '#1e1200' }}>EN</span>
    <div style={{
      width: 38, height: 38, borderRadius: '50%',
      backgroundColor: '#f5f0e8', border: '1.5px solid #e8d8b0',
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative'
    }}>
      <Icon d={IC.bell} size={18} color="#5a3a00" />
      <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', backgroundColor: '#e05050', border: '1.5px solid #fff' }} />
    </div>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px 5px 6px',
      backgroundColor: '#f5f0e8', border: '1.5px solid #e8d8b0',
      borderRadius: 999, cursor: 'pointer'
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#1e1200' }}>{chipName}</span>
      <div style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: '#F5C400', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon d={IC.profile} size={16} color="#3d2a00" />
      </div>
    </div>
  </div>
);

// Mobile Topbar with Search Below
const MobileTopbar = ({ chipName, onMenuClick }) => (
  <div className="mobile-header" style={{
    display: 'none',
    backgroundColor: '#F5C400',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', gap: '12px',
    }}>
      <button onClick={onMenuClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, flexShrink: 0 }}>
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#3d2a00" strokeWidth={2.2}>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'left' }}>
        <img src="/logo2.png" alt="Smart Grama Sewa" style={{ height: '48px', width: 'auto' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <span style={{ fontSize: '14px', fontWeight: 800, color: '#3d2a00' }}>EN</span>
        <div style={{ position: 'relative' }}>
          <Icon d={IC.bell} size={20} color="#3d2a00" />
          <div style={{ position: 'absolute', top: -2, right: -4, width: 8, height: 8, borderRadius: '50%', backgroundColor: '#e05050', border: '1.5px solid #F5C400' }} />
        </div>
        <div onClick={() => window.location.href = '/profile'} style={{
          width: 32, height: 32, borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <Icon d={IC.profile} size={18} color="#3d2a00" />
        </div>
      </div>
    </div>
    <div style={{ padding: '8px 16px 12px 16px', backgroundColor: '#f5f0e8' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        backgroundColor: '#fff', border: '1.5px solid #e8d8b0',
        borderRadius: 999, padding: '10px 16px',
      }}>
        <Icon d={IC.search} size={16} color="#aaa" />
        <span style={{ fontSize: 14, color: '#bbb', fontWeight: 600 }}>Search</span>
      </div>
    </div>
  </div>
);

// Mobile Sidebar Overlay
const MobileSidebar = ({ isOpen, onClose, activePage, navigate, onLogout }) => {
  const navItems = [
    { key: 'dashboard', icon: IC.dashboard, label: 'Dashboard' },
    { key: 'announcements', icon: IC.announce, label: 'Announcements' },
    { key: 'appointments', icon: IC.appts, label: 'Appointments' },
    { key: 'forms', icon: IC.forms, label: 'Forms' },
    { key: 'ai', icon: IC.ai, label: 'AI assistant' },
  ];
  const bottomNav = [
    { key: 'profile', icon: IC.profile, label: 'Profile' },
    { key: 'settings', icon: IC.settings, label: 'Settings' },
    { key: 'logout', icon: IC.logout, label: 'Logout' },
  ];

  if (!isOpen) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
      <div style={{ position: 'fixed', top: 0, left: 0, width: 250, height: '100vh', backgroundColor: '#F5C400', zIndex: 1001, overflowY: 'auto', padding: '20px 0' }}>
        <div style={{ padding: '0 20px 20px', textAlign: 'right' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
        </div>
        {navItems.map((item) => (
          <NavItem key={item.key} iconPath={item.icon} label={item.label}
            active={activePage === item.key}
            onClick={() => { navigate(`/${item.key}`); onClose(); }} />
        ))}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', margin: '10px 0', paddingTop: '10px' }}>
          {bottomNav.map((item) => (
            <NavItem key={item.key} iconPath={item.icon} label={item.label}
              active={activePage === item.key}
              onClick={() => { if (item.key === 'logout') onLogout(); else navigate(`/${item.key}`); onClose(); }} />
          ))}
        </div>
      </div>
    </>
  );
};

// Detail Modal
const DetailModal = ({ ann, onClose }) => {
  if (!ann) return null;
  const cfg = tagCfg(ann.tag);
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 100 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 101, width: '100%', maxWidth: 560,
        backgroundColor: '#fff', borderRadius: 20,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden',
        border: `2px solid ${cfg.border}`,
      }}>
        <div style={{ padding: '22px 24px 0' }}>
          <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800, backgroundColor: cfg.chipBg, color: cfg.chipText, border: `1.5px solid ${cfg.border}`, marginBottom: 10 }}>
            {ann.tag}
          </span>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1e1200', marginBottom: 6, lineHeight: 1.4 }}>{ann.title}</h2>
          <p style={{ fontSize: 12, color: '#aaa', fontWeight: 600, marginBottom: 14 }}>📅 {ann.dateLabel}</p>
          <p style={{ fontSize: 14, color: '#444', lineHeight: 1.8, marginBottom: 22 }}>{ann.body}</p>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid #f0e8d0', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 26px', borderRadius: 999, border: 'none', backgroundColor: '#F5C400', fontSize: 13, fontWeight: 800, color: '#3d2a00', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </>
  );
};

// Announcement Card
const AnnouncementCard = ({ ann, onClick }) => {
  const cfg = tagCfg(ann.tag);
  const preview = ann.body.length > 160 ? ann.body.slice(0, 160) + '…' : ann.body;

  return (
    <div
      onClick={() => onClick(ann)}
      style={{
        backgroundColor: '#fff',
        border: `1.5px solid ${cfg.border}`,
        borderRadius: 12,
        padding: '18px 22px',
        marginBottom: 16,
        cursor: 'pointer',
        transition: 'box-shadow .15s, transform .15s',
      }}
      onMouseOver={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseOut={e  => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ marginBottom: 8 }}>
        <span style={{
          display: 'inline-block', padding: '2px 12px', borderRadius: 999,
          fontSize: 12, fontWeight: 800,
          backgroundColor: cfg.chipBg, color: cfg.chipText,
          border: `1.5px solid ${cfg.border}`,
        }}>{ann.tag}</span>
      </div>
      <div style={{ fontSize: 17, fontWeight: 900, color: '#1a1200', marginBottom: 8 }}>
        {ann.title}
      </div>
      <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 12 }}>
        {preview}
      </div>
      <span style={{ fontSize: 13, fontWeight: 800, color: '#B46A02' }}>
        Read more →
      </span>
    </div>
  );
};

// Pagination
const Pagination = ({ total, perPage, current, onChange }) => {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  const from = (current - 1) * perPage + 1;
  const to = Math.min(current * perPage, total);

  const pgBtn = (p) => (
    <button key={p} onClick={() => onChange(p)} style={{
      width: 36, height: 36, borderRadius: '50%',
      border: current === p ? 'none' : '1.5px solid #e8d5ac',
      backgroundColor: current === p ? '#F5C400' : '#fff',
      color: current === p ? '#3d2a00' : '#888',
      fontWeight: current === p ? 900 : 600, fontSize: 14,
      cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all .15s',
    }}>{p}</button>
  );

  const buildPages = () => {
    const items = [];
    for (let p = 1; p <= Math.min(3, totalPages); p++) items.push(pgBtn(p));
    if (totalPages > 4) items.push(<span key="dots" style={{ fontSize: 14, color: '#888', padding: '0 4px', lineHeight: '36px' }}>….</span>);
    if (totalPages > 3) items.push(pgBtn(totalPages));
    return items;
  };

  const navBtn = (label, disabled, action) => (
    <button onClick={action} disabled={disabled} style={{
      padding: '8px 16px', borderRadius: 999,
      border: '1.5px solid #e8d5ac', backgroundColor: '#fff',
      fontSize: 13, fontWeight: 700, color: disabled ? '#ccc' : '#888',
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}>{label}</button>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap', gap: 10 }}>
      <span style={{ fontSize: 13, color: '#888', fontWeight: 600 }}>
        Showing {from} - {to} of {total} announcements
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {navBtn('< Previous', current === 1, () => onChange(current - 1))}
        {buildPages()}
        {navBtn('Next >', current === totalPages, () => onChange(current + 1))}
      </div>
    </div>
  );
};

const PER_PAGE = 3;

const Announcements = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [announcements, setAnnouncements] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selAnn, setSelAnn] = useState(null);

  const TABS = ['All', 'Urgent', 'Important', 'Information', 'Unread'];

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            const data = snap.data();
            setUserData(data);
            setReadIds(new Set(data.readAnnouncements || []));
          }
        } catch (e) { console.warn(e.message); }
      } else {
        navigate('/login');
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  // Sample data (same as yours)
  const SAMPLE_DATA = [
    { id: 's1', tag: 'Urgent', title: 'Water Supply Interruption — Ward 7', body: 'There will be a temporary water supply interruption in Ward 7 on 3 April 2026 from 9 AM to 5 PM.', dateLabel: '28 Mar 2026' },
    { id: 's2', tag: 'Important', title: 'Gram Sabha Meeting — April 2026', body: 'Monthly Gram Sabha meeting is scheduled for 5 April 2026 at 10 AM in the Panchayat Hall.', dateLabel: '26 Mar 2026' },
    { id: 's3', tag: 'Information', title: 'Income Certificate Service Resumed', body: 'Income Certificate applications are now open again.', dateLabel: '25 Mar 2026' },
    { id: 's4', tag: 'Urgent', title: 'Road Repair — Main Street Closure', body: 'Road repair work on Main Street will begin on 7 April 2026.', dateLabel: '24 Mar 2026' },
    { id: 's5', tag: 'Important', title: 'New GN Office Hours from April 2026', body: 'Starting from April 2026, the Grama Niladhari Office will operate Monday to Friday from 8:30 AM to 4:30 PM.', dateLabel: '22 Mar 2026' },
    { id: 's6', tag: 'Information', title: 'Digital Certificates Now Available', body: 'Download your digitally signed certificates directly from the portal.', dateLabel: '20 Mar 2026' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setAnnouncements(SAMPLE_DATA);
      setLoading(false);
      try {
        const timeout = new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 5000));
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
        const snap = await Promise.race([getDocs(q), timeout]);
        if (snap.docs.length > 0) {
          const list = snap.docs.map(d => {
            const data = d.data();
            const ts = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
            return {
              id: d.id,
              title: data.title || 'Announcement',
              body: data.body || data.message || '',
              tag: data.tag || 'Information',
              dateLabel: ts.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            };
          });
          setAnnouncements(list);
        }
      } catch (e) {
        console.warn('Firestore announcements not available, showing sample data.');
      }
    };
    fetchData();
  }, []);

  // Mark as read
  const markAsRead = async (annId) => {
    setReadIds(prev => new Set([...prev, annId]));
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        readAnnouncements: arrayUnion(annId),
      });
    } catch (e) { console.warn('Mark read error:', e.message); }
  };

  const handleLogout = async () => { await signOut(auth); navigate('/login'); };

  // Filter
  const filtered = announcements.filter(a => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Unread') return !readIds.has(a.id);
    return a.tag === activeTab;
  });

  const handleTabChange = (t) => { setActiveTab(t); setCurrentPage(1); };
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const chipName = userData?.username || userData?.fullName || currentUser?.email?.split('@')[0] || 'User';

  if (authLoading) return <PageLoadingSkeleton />;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Nunito, system-ui, sans-serif', backgroundColor: '#f5f0e8' }}>
      <div style={{ flex: 1, display: 'flex' }}>

        {/* Desktop Sidebar */}
        <DesktopSidebar activePage="announcements" navigate={navigate} onLogout={handleLogout} />

        {/* Mobile Sidebar Overlay */}
        <MobileSidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          activePage="announcements"
          navigate={navigate}
          onLogout={handleLogout}
        />

        {/* Main Column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Desktop Topbar */}
          <DesktopTopbar chipName={chipName} />

          {/* Mobile Topbar with Search Below */}
          <MobileTopbar chipName={chipName} onMenuClick={() => setMobileMenuOpen(true)} />

          {/* Content Area */}
          <div style={{ padding: '28px 32px', flex: 1 }}>

            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1e1200', marginBottom: 22, letterSpacing: '-0.4px' }}>
              Announcements
            </h1>

            {/* Mark all as read button */}
            {announcements.filter(a => !readIds.has(a.id)).length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button
                  onClick={async () => {
                    const allIds = announcements.map(a => a.id);
                    setReadIds(new Set(allIds));
                    if (currentUser) {
                      await updateDoc(doc(db, 'users', currentUser.uid), {
                        readAnnouncements: allIds,
                      });
                    }
                  }}
                  style={{
                    padding: '8px 20px', borderRadius: 999,
                    border: '1.5px solid #e8d5ac', backgroundColor: '#fff',
                    fontSize: 13, fontWeight: 800, color: '#3d2a00',
                    cursor: 'pointer', transition: 'all .15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.backgroundColor = '#fff8e0'; e.currentTarget.style.borderColor = '#F5C400'; }}
                  onMouseOut={e  => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#e8d5ac'; }}
                >
                  ✓ Mark all as read
                </button>
              </div>
            )}

            {/* Pill filter tabs */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
              {TABS.map(t => {
                const isActive = activeTab === t;
                return (
                  <button key={t} onClick={() => handleTabChange(t)} style={{
                    padding: '9px 22px', borderRadius: 999,
                    border: isActive ? 'none' : '1.5px solid #d4c9a8',
                    backgroundColor: isActive ? '#F5C400' : '#fff',
                    color: isActive ? '#3d2a00' : '#555',
                    fontSize: 14, fontWeight: isActive ? 900 : 700,
                    cursor: 'pointer', transition: 'all .15s',
                    boxShadow: isActive ? '0 2px 8px rgba(245,196,0,0.35)' : 'none',
                  }}
                    onMouseOver={e => { if (!isActive) { e.currentTarget.style.backgroundColor = '#f5f0e8'; e.currentTarget.style.borderColor = '#B46A02'; } }}
                    onMouseOut={e  => { if (!isActive) { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#d4c9a8'; } }}
                  >{t}</button>
                );
              })}
            </div>

            {loading && <AnnouncementsListSkeleton />}

            {!loading && (
              <>
                {paginated.length > 0
                  ? paginated.map(ann => (
                      <AnnouncementCard
                        key={ann.id}
                        ann={ann}
                        onClick={(a) => { setSelAnn(a); markAsRead(a.id); }}
                      />
                    ))
                  : (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa', fontSize: 15, fontWeight: 600 }}>
                      {activeTab === 'Unread' ? '✅ All caught up! No unread announcements.' : `No ${activeTab} announcements found.`}
                    </div>
                  )
                }

                <Pagination
                  total={filtered.length}
                  perPage={PER_PAGE}
                  current={currentPage}
                  onChange={setCurrentPage}
                />
              </>
            )}

          </div>
        </div>
      </div>

      {selAnn && <DetailModal ann={selAnn} onClose={() => setSelAnn(null)} />}

      <footer style={{ backgroundColor: '#6A2301', color: '#fff', textAlign: 'center', padding: '13px 16px', fontSize: '13px', fontWeight: 600 }}>
        ©2026 Smart Grama Sewa
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        
        /* Desktop */
        @media (min-width: 769px) {
          .desktop-sidebar { display: flex !important; }
          .desktop-topbar { display: flex !important; }
          .mobile-header { display: none !important; }
        }

        /* Mobile */
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .desktop-topbar { display: none !important; }
          .mobile-header { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default Announcements;