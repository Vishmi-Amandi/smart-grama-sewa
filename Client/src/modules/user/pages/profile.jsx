import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { PageLoadingSkeleton, ProfileSkeleton } from '../components/skeleton';

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
  settings:     'M12 15a3 3 0 100-6 3 3 0 000 6z',
  logout:       'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
  search:       'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  bell:         'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  edit:         'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  signout:      'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  camera:       'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z M12 17a4 4 0 100-8 4 4 0 000 8z',
  chevDown:     'M6 9l6 6 6-6',
  tick:         'M4 12l5 5L20 6',
};

// NavItem
const NavItem = ({ iconPath, label, onClick }) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
    padding: '11px 16px', borderRadius: '10px', border: 'none',
    cursor: 'pointer', fontFamily: 'inherit',
    backgroundColor: 'transparent',
    color: '#3d2a00', fontWeight: 600, fontSize: '14px',
    transition: 'all 0.15s', textAlign: 'left', marginBottom: '2px',
  }}>
    <Icon d={iconPath} size={18} color="#5a3a00" />
    {label}
  </button>
);

// Info row (view mode)
const InfoRow = ({ label, value }) => (
  <div style={{ marginBottom: '18px' }}>
    <div style={{ fontSize: '12px', fontWeight: 700, color: '#B46A02', marginBottom: '6px' }}>{label}</div>
    <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e1200', paddingBottom: '10px', borderBottom: '1px solid #f0e8d0' }}>
      {value || '—'}
    </div>
  </div>
);

// Form field (edit mode)
const Field = ({ label, value, onChange, type = 'text', placeholder = '', disabled = false }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <label style={{ fontSize: '12px', fontWeight: 700, color: '#B46A02' }}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        padding: '12px 14px', fontSize: '14px', fontWeight: 600,
        color: disabled ? '#aaa' : '#1e1200',
        backgroundColor: disabled ? '#f8f6f0' : '#fff',
        border: '1.5px solid #e8d5ac', borderRadius: '10px',
        outline: 'none', width: '100%', boxSizing: 'border-box',
      }}
    />
  </div>
);

const GenderSelect = ({ value, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <label style={{ fontSize: '12px', fontWeight: 700, color: '#B46A02' }}>Gender</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%', padding: '12px 14px', fontSize: '14px', fontWeight: 600,
        backgroundColor: '#fff', border: '1.5px solid #e8d5ac', borderRadius: '10px',
      }}
    >
      <option value="">Select…</option>
      <option value="Male">Male</option>
      <option value="Female">Female</option>
      <option value="Other">Other</option>
    </select>
  </div>
);

// Mobile Search Bar Component
const MobileSearchBar = () => (
  <div style={{
    padding: '12px 16px',
    backgroundColor: '#f8f6f0',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      backgroundColor: '#fff', border: '1.5px solid #e8d8b0',
      borderRadius: 999, padding: '12px 16px',
    }}>
      <Icon d={Icons.search} size={16} color="#aaa" />
      <span style={{ fontSize: 14, color: '#bbb', fontWeight: 600 }}>Search ...</span>
    </div>
  </div>
);

// MAIN PROFILE COMPONENT
const Profile = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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

  const chipName = userData?.fullName || currentUser?.email?.split('@')[0] || 'User';
  const nicMasked = userData?.nic ? userData.nic.slice(0, 3) + 'XXXXX' : 'XXXXXXXXXXXX';

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
    { key: 'logout', icon: Icons.logout, label: 'Sign out' },
  ];

  if (authLoading) return <PageLoadingSkeleton />;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Nunito, system-ui, sans-serif', backgroundColor: '#f8f6f0' }}>
      <div style={{ flex: 1, display: 'flex' }}>

        {/* DESKTOP SIDEBAR */}
        {!isMobile && (
          <div style={{
            width: '220px', backgroundColor: '#F5C400', display: 'flex', flexDirection: 'column',
            position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <img src="/logo2.png" alt="Logo" style={{ height: '80px', width: 'auto' }} />
            </div>
            <div style={{ flex: 1, padding: '12px 10px' }}>
              {navItems.map(item => (
                <NavItem key={item.key} iconPath={item.icon} label={item.label} onClick={() => navigate(item.path)} />
              ))}
            </div>
            <div style={{ padding: '10px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              {bottomNav.map(item => (
                <NavItem 
                  key={item.key} 
                  iconPath={item.icon} 
                  label={item.label} 
                  onClick={() => item.key === 'logout' ? handleLogout() : navigate(item.path)} 
                />
              ))}
            </div>
          </div>
        )}

        {/* MOBILE SIDEBAR OVERLAY */}
        {isMobile && mobileMenuOpen && (
          <>
            <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }} />
            <div style={{ position: 'fixed', top: 0, left: 0, width: '250px', height: '100vh', backgroundColor: '#F5C400', zIndex: 1001, overflowY: 'auto', padding: '20px 0' }}>
              <div style={{ padding: '0 20px 20px', textAlign: 'right' }}>
                <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>✕</button>
              </div>
              {navItems.map(item => (
                <NavItem key={item.key} iconPath={item.icon} label={item.label} onClick={() => { navigate(item.path); setMobileMenuOpen(false); }} />
              ))}
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', margin: '10px 0', paddingTop: '10px' }}>
                {bottomNav.map(item => (
                  <NavItem key={item.key} iconPath={item.icon} label={item.label} onClick={() => { if (item.key === 'logout') handleLogout(); else navigate(item.path); setMobileMenuOpen(false); }} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* DESKTOP TOPBAR */}
          {!isMobile && (
            <div style={{
              height: '64px', backgroundColor: '#fff', borderBottom: '1px solid #ede8d8',
              display: 'flex', alignItems: 'center', padding: '0 28px', gap: '14px',
              position: 'sticky', top: 0, zIndex: 40,
            }}>
              <div style={{ flex: 1, maxWidth: '400px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f5f0e8', border: '1.5px solid #e8d8b0', borderRadius: '999px', padding: '9px 18px' }}>
                <Icon d={Icons.search} size={16} color="#aaa" />
                <span style={{ fontSize: '14px', color: '#bbb' }}>search</span>
              </div>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#1e1200' }}>EN</span>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#f5f0e8', border: '1.5px solid #e8d8b0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Icon d={Icons.bell} size={18} color="#5a3a00" />
                <div style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#e05050' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 14px', backgroundColor: '#f5f0e8', borderRadius: '999px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e1200' }}>{chipName}</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#F5C400', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon d={Icons.profile} size={16} color="#3d2a00" />
                </div>
              </div>
            </div>
          )}

          {/* MOBILE TOPBAR */}
          {isMobile && (
            <>
              {/* Sticky Header */}
              <div style={{
                backgroundColor: '#F5C400',
                position: 'sticky',
                top: 0,
                zIndex: 100,
              }}>
                <div style={{
                  height: '64px', display: 'flex', alignItems: 'center',
                  padding: '0 16px', gap: '12px',
                }}>
                  <button onClick={() => setMobileMenuOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
                    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#3d2a00" strokeWidth={2.2}>
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                  </button>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'left' }}>
                    <img src="/logo2.png" alt="Logo" style={{ height: '48px', width: 'auto' }} />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: '#1e1200' }}>EN</span>
                  <div style={{ position: 'relative' }}>
                    <Icon d={Icons.bell} size={22} color="#1e1200" />
                    <div style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#e05050' }} />
                  </div>
                  <div onClick={() => navigate('/profile')} style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Icon d={Icons.profile} size={20} color="#3d2a00" />
                  </div>
                </div>
              </div>

              <MobileSearchBar />
            </>
          )}

          {/* CONTENT */}
          <div style={{ padding: '16px' }}>
            {!userData && !isEditing && <ProfileSkeleton />}
            
            {!isEditing && userData && (
              <>
                <h1 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '24px' }}>My Profile</h1>

                {saveSuccess && (
                  <div style={{ backgroundColor: '#e6f9ee', border: '1.5px solid #7ec07e', borderRadius: '12px', padding: '12px', marginBottom: '18px' }}>
                    <Icon d={Icons.tick} size={10} color="#3d2a00" /> Profile updated successfully!
                  </div>
                )}

                <div style={{ backgroundColor: '#fff', border: '1.5px solid #e8d5ac', borderRadius: '18px', padding: '22px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '76px', height: '76px', borderRadius: '50%', border: '3px solid #1e1200', backgroundColor: '#f0ece4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon d={Icons.profile} size={36} color="#5a4030" />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '20px', fontWeight: 900 }}>{userData?.fullName || chipName}</div>
                    <div style={{ fontSize: '14px', color: '#888' }}>Citizen ID : {nicMasked}</div>
                  </div>
                  <button onClick={() => setIsEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 22px', backgroundColor: '#F5C400', borderRadius: '999px', border: 'none', cursor: 'pointer' }}>
                    <Icon d={Icons.edit} size={15} /> Edit Profile
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                  <div style={{ backgroundColor: '#fff', border: '1.5px solid #e8d5ac', borderRadius: '18px', padding: '22px' }}>
                    <h3>Personal Info</h3>
                    <InfoRow label="Full Name" value={userData?.fullName} />
                    <InfoRow label="NIC Number" value={userData?.nic} />
                    <InfoRow label="Date Of Birth" value={userData?.dob} />
                    <InfoRow label="Gender" value={userData?.gender} />
                    <InfoRow label="Home Address" value={userData?.address} />
                    <InfoRow label="Occupation" value={userData?.occupation} />
                  </div>

                  <div style={{ backgroundColor: '#fff', border: '1.5px solid #e8d5ac', borderRadius: '18px', padding: '22px' }}>
                    <h3>Contact Details</h3>
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
                <h1 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '6px' }}>Edit Profile</h1>
                <p style={{ fontSize: '14px', color: '#888', fontWeight: 600, marginBottom: '28px' }}>
                  Update your personal information and contact details.
                </p>

                {saveError && (
                  <div style={{ backgroundColor: '#fde8e8', border: '1.5px solid #f0a0a0', borderRadius: '12px', padding: '12px 18px', marginBottom: '18px', fontSize: '14px', fontWeight: 700, color: '#8b1a1a' }}>
                    ⚠ {saveError}
                  </div>
                )}

                <div style={{ backgroundColor: '#fff', border: '1.5px solid #e8d5ac', borderRadius: '18px', padding: '28px', marginBottom: '18px' }}>
                  <div style={{ marginBottom: '16px' }}><Field label="Full Name" value={form.fullName} onChange={update('fullName')} /></div>
                  <div style={{ marginBottom: '16px' }}><Field label="Date Of Birth" value={form.dob} onChange={update('dob')} type="date" /></div>
                  <div style={{ marginBottom: '16px' }}><Field label="Occupation" value={form.occupation} onChange={update('occupation')} /></div>
                  <div style={{ marginBottom: '16px' }}><GenderSelect value={form.gender} onChange={update('gender')} /></div>
                  <div style={{ marginBottom: '16px' }}><Field label="Home Address" value={form.address} onChange={update('address')} /></div>
                  <div style={{ marginBottom: '16px' }}><Field label="Mobile Number" value={form.mobile} onChange={update('mobile')} disabled={true} /></div>
                  <div style={{ marginBottom: '16px' }}><Field label="Email Address" value={form.email} onChange={update('email')} disabled={true} /></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button onClick={handleCancel} style={{ padding: '13px 32px', backgroundColor: '#8a6040', border: 'none', borderRadius: '999px', color: '#fff', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleSave} style={{ padding: '13px 32px', backgroundColor: '#F5C400', border: 'none', borderRadius: '999px', cursor: 'pointer' }}>Save Changes</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ backgroundColor: '#6A2301', color: '#fff', textAlign: 'center', padding: '13px 16px', fontSize: '13px', fontWeight: 600 }}>
        ©2026 Smart Grama Sewa
      </footer>
    </div>
  );
};

export default Profile;