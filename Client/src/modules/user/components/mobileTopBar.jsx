// src/components/MobileTopbar.jsx
// ONE shared mobile topbar used by ALL pages — Dashboard, Profile, Appointments, etc.
//
// Usage in any page:
//   import { MobileTopbar, MobileSearchBar, MobileSidebarOverlay } from '../../../components/MobileTopbar';
//
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
//   useEffect(() => {
//     const handle = () => setIsMobile(window.innerWidth <= 768);
//     window.addEventListener('resize', handle);
//     return () => window.removeEventListener('resize', handle);
//   }, []);
//
//   Then in JSX:
//   {isMobile && <MobileTopbar onMenuOpen={() => setMobileMenuOpen(true)} />}
//   {isMobile && <MobileSearchBar />}
//   {isMobile && mobileMenuOpen && (
//     <MobileSidebarOverlay
//       activePage="dashboard"
//       onClose={() => setMobileMenuOpen(false)}
//       onNavigate={(key) => navigate(`/${key}`)}
//       onLogout={handleLogout}
//     />
//   )}

import React from 'react';

// ─── Icon helper ──────────────────────────────────────────────────
const Icon = ({ d, size = 20, color = 'currentColor', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const IC = {
  bell:    'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  profile: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  search:  'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
};

// ═══════════════════════════════════════════════════════════════════
//  1. MOBILE TOPBAR — yellow, hamburger + logo + EN + bell + avatar
// ═══════════════════════════════════════════════════════════════════
export const MobileTopbar = ({ onMenuOpen }) => (
  <div style={{
    height: '64px',
    backgroundColor: '#F5C400',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: '12px',
    position: 'sticky',
    top: 0,
    zIndex: 40,
    boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
  }}>
    {/* ── Hamburger ── */}
    <button
      onClick={onMenuOpen}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, flexShrink: 0, display: 'flex', alignItems: 'center' }}
    >
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#3d2a00" strokeWidth={2.2} strokeLinecap="round">
        <line x1="3" y1="6"  x2="21" y2="6"  />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>

    {/* ── Logo — centred ── */}
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src="/logo.jpg" alt="Smart Grama Sewa" style={{ height: '48px', width: 'auto' }} />
    </div>

    {/* ── EN ── */}
    <span style={{ fontSize: '14px', fontWeight: 900, color: '#1e1200', flexShrink: 0 }}>EN</span>

    {/* ── Bell ── */}
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <Icon d={IC.bell} size={22} color="#1e1200" />
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: '8px', height: '8px', borderRadius: '50%',
        backgroundColor: '#e05050', border: '1.5px solid #F5C400',
      }} />
    </div>

    {/* ── Avatar ── */}
    <div style={{
      width: '36px', height: '36px', borderRadius: '50%',
      backgroundColor: 'rgba(255,255,255,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon d={IC.profile} size={18} color="#3d2a00" />
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
//  2. MOBILE SEARCH BAR — white pill below yellow topbar
// ═══════════════════════════════════════════════════════════════════
export const MobileSearchBar = () => (
  <div style={{ padding: '10px 14px 0' }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      backgroundColor: '#fff',
      border: '1.5px solid #e8d8b0',
      borderRadius: 999,
      padding: '10px 16px',
    }}>
      <Icon d={IC.search} size={16} color="#aaa" />
      <span style={{ fontSize: 14, color: '#bbb', fontWeight: 600 }}>search</span>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
//  3. MOBILE SIDEBAR OVERLAY — slide-in drawer from left
// ═══════════════════════════════════════════════════════════════════
export const MobileSidebarOverlay = ({ onClose, onNavigate, onLogout, activePage = '' }) => {
  const mainNav = [
    { key: 'dashboard',     label: 'Dashboard'     },
    { key: 'announcements', label: 'Announcements' },
    { key: 'appointments',  label: 'Appointments'  },
    { key: 'forms',         label: 'Forms'         },
    { key: 'ai',            label: 'AI assistant'  },
  ];
  const bottomNav = [
    { key: 'profile',  label: 'Profile'  },
    { key: 'settings', label: 'Settings' },
    { key: 'logout',   label: 'Logout'   },
  ];

  const NavBtn = ({ navKey, label }) => (
    <button
      onClick={() => {
        if (navKey === 'logout') { onLogout(); onClose(); }
        else { onNavigate(navKey); onClose(); }
      }}
      style={{
        width: '100%', display: 'flex', alignItems: 'center',
        padding: '11px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
        backgroundColor: activePage === navKey ? 'rgba(255,255,255,0.9)' : 'transparent',
        color: '#3d2a00',
        fontWeight: activePage === navKey ? 800 : 600,
        fontSize: '14px', fontFamily: 'Nunito, system-ui, sans-serif',
        textAlign: 'left', marginBottom: '2px',
        boxShadow: activePage === navKey ? '0 2px 8px rgba(0,0,0,0.10)' : 'none',
      }}
      onMouseOver={e => { if (activePage !== navKey) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.4)'; }}
      onMouseOut={e  => { if (activePage !== navKey) e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, left: 0,
        width: '250px', height: '100vh',
        backgroundColor: '#F5C400',
        zIndex: 1001, overflowY: 'auto',
        padding: '20px 0',
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
      }}>
        {/* Logo + close */}
        <div style={{ padding: '0 16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="/logo.jpg" alt="Smart Grama Sewa" style={{ height: '48px', width: 'auto' }} />
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#3d2a00' }}>✕</button>
        </div>

        {/* Main nav */}
        <div style={{ padding: '0 8px' }}>
          {mainNav.map(i => <NavBtn key={i.key} navKey={i.key} label={i.label} />)}
        </div>

        {/* Bottom nav */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', margin: '10px 0', padding: '10px 8px 0' }}>
          {bottomNav.map(i => <NavBtn key={i.key} navKey={i.key} label={i.label} />)}
        </div>
      </div>
    </>
  );
};

export default MobileTopbar;
