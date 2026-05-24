import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase'; // Adjusted path to fix the import error

// --- Icons & Styles (Consistent with teammate) ---
const Icon = ({ d, size = 20, color = 'currentColor', sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const IC = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  announce: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  appts: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2',
  forms: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  ai: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  profile: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  bell: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
};

const S = {
  page: { height: '100vh', display: 'flex', overflow: 'hidden', fontFamily: 'Nunito, sans-serif', backgroundColor: '#f5f0e8' },
  sidebar: { width: '240px', backgroundColor: '#F5C400', display: 'flex', flexDirection: 'column', height: '100vh' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' },
  topbar: { height: '64px', backgroundColor: '#fff', borderBottom: '1px solid #e8d8b0', display: 'flex', alignItems: 'center', padding: '0 28px', flexShrink: 0 },
  scrollArea: { flex: 1, overflowY: 'auto', padding: '28px 32px' },
  card: { backgroundColor: '#fff', border: '1.5px solid #e8d5ac', borderRadius: '16px', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' },
  footer: { backgroundColor: '#6A2301', color: '#fff', textAlign: 'center', padding: '13px', fontSize: '12px' }
};

const NavItem = ({ d, label, active, onClick }) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
    backgroundColor: active ? 'rgba(255,255,255,0.9)' : 'transparent', color: '#3d2a00', fontWeight: active ? 800 : 600, fontSize: '14px', marginBottom: '2px'
  }}>
    <Icon d={d} size={18} color={active ? '#B46A02' : '#5a3a00'} />
    {label}
  </button>
);

const Forms = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [tab, setTab] = useState('All');
  
  // States for interactive modals
  const [selectedForm, setSelectedForm] = useState(null); 
  const [formInputs, setFormInputs] = useState({});       

  const tabs = ['All', 'Certificates', 'Applications', 'Recommendations'];

  const formList = [
    { id: 1, title: "Residence Certificate", cat: "Certificates", imgSrc: "/icons/residence.png", desc: "Proof of residence for official use" },
    { id: 2, title: "Character Certificate", cat: "Certificates", imgSrc: "/icons/character.png", desc: "Proof of character for various purposes" },
    { id: 3, title: "Income Certificate", cat: "Certificates", imgSrc: "/icons/income.png", desc: "Proof of income for various purposes" },
    { id: 4, title: "Valuation Certificate", cat: "Certificates", imgSrc: "/icons/valuation.png", desc: "Property valuation for legal needs" },
    { id: 5, title: "Identity Card Application", cat: "Applications", imgSrc: "/icons/id-card.png", desc: "New or replacement NIC application" },
    { id: 6, title: "Living Funds for Disabled Persons", cat: "Recommendations", imgSrc: "/icons/disabled.png", desc: "Financial assistance application" },
    { id: 7, title: "Voter Registration Form", cat: "Applications", imgSrc: "/icons/voter.png", desc: "Register for the local voting list" },
    { id: 8, title: "Permit for Felling Trees", cat: "Recommendations", imgSrc: "/icons/tree.png", desc: "Approval to cut down Jack or protected trees" },
    { id: 9, title: "Permit for Timber Transportation", cat: "Recommendations", imgSrc: "/icons/timber.png", desc: "Legal permit to move timber between areas" },
    { id: 10, title: "Business Registration Recommendation", cat: "Recommendations", imgSrc: "/icons/business.png", desc: "GN approval for new business starts" },
    { id: 11, title: "Assessments for Ownership of Lands", cat: "Certificates", imgSrc: "/icons/land.png", desc: "Verify land ownership and boundaries" },
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
    });
    return () => unsub();
  }, [navigate]);

  const handleLogout = async () => { await signOut(auth); navigate('/login'); };
  const chipName = userData?.username || userData?.fullName || currentUser?.email?.split('@')[0] || 'User';

  return (
    <div style={S.page}>
      {/* 1. Sidebar */}
      <div style={S.sidebar}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <img src="/logo2.png" alt="Smart Grama Sewa" style={{ height: '70px' }} />
        </div>
        <div style={{ flex: 1, padding: '12px 10px' }}>
          <NavItem d={IC.dashboard} label="Dashboard" onClick={() => navigate('/dashboard')} />
          <NavItem d={IC.announce} label="Announcements" onClick={() => navigate('/announcements')} />
          <NavItem d={IC.appts} label="Appointments" onClick={() => navigate('/appointments')} />
          <NavItem d={IC.forms} label="Forms" active={true} />
          <NavItem d={IC.ai} label="AI assistant" onClick={() => navigate('/ai')} />
        </div>
        <div style={{ padding: '10px', borderTop: '1px solid rgba(0,0,0,0.05)', marginBottom: '10px' }}>
          <NavItem d={IC.profile} label="Profile" onClick={() => navigate('/profile')} />
          <NavItem d={IC.settings} label="Settings" onClick={() => navigate('/settings')} />
          <NavItem d={IC.logout} label="Logout" onClick={handleLogout} />
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div style={S.main}>
        {/* Fixed Topbar */}
        <div style={S.topbar}>
          <div style={{ flex: 1, maxWidth: 400, display: 'flex', alignItems: 'center', gap: 10, backgroundColor: '#f5f0e8', border: '1.5px solid #e8d8b0', borderRadius: 999, padding: '8px 16px' }}>
            <Icon d={IC.search} size={16} color="#999" />
            <input type="text" placeholder="search" style={{ background: 'none', border: 'none', outline: 'none', fontSize: '14px', width: '100%' }} />
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <span style={{ fontSize: 14, fontWeight: 800 }}>EN</span>
            <Icon d={IC.bell} size={20} color="#5a3a00" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', backgroundColor: '#f5f0e8', border: '1.5px solid #e8d8b0', borderRadius: 999 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{chipName}</span>
              <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#F5C400', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon d={IC.profile} size={14} color="#3d2a00" />
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={S.scrollArea}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1e1200' }}>Forms Library</h1>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', marginBottom: '20px' }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '10px 20px', border: 'none', background: 'none', fontSize: 15,
                fontWeight: tab === t ? 900 : 600, color: tab === t ? '#3d2a00' : '#888', cursor: 'pointer',
                borderBottom: tab === t ? '3px solid #F5C400' : '3px solid transparent', marginBottom: -2
              }}>{t}</button>
            ))}
            <button style={{ marginLeft: 'auto', backgroundColor: '#6A2301', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 32px', fontWeight: 700, cursor: 'pointer' }}>My Forms</button>
          </div>

          {/* Scrolling List of Cards */}
          <div style={{ paddingBottom: '20px' }}>
            {formList.filter(f => tab === 'All' || f.cat === tab).map(form => (
              <div key={form.id} style={S.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  
                  {/* Container for the image icon */}
                  <div style={{ width: 56, height: 56, backgroundColor: '#f5f0e8', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img 
                      src={form.imgSrc} 
                      alt={form.title} 
                      style={{ width: '42px', height: '42px', objectFit: 'contain' }} 
                    />
                  </div>
                  
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#1e1200' }}>{form.title}</div>
                    <div style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>{form.desc}</div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedForm(form);
                    setFormInputs({}); 
                  }}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: '1.5px solid #e8d5ac', backgroundColor: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                >
                  View Form
                </button>
              </div>
            ))}
          </div>

          {/* Fixed Footer placed within Scroll Container flow */}
          <footer style={{ ...S.footer, borderRadius: '12px', marginTop: '20px' }}>
            © 2026 Smart Grama Sewa. All rights reserved.
          </footer>

        </div> {/* Closes S.scrollArea */}
      </div> {/* Closes S.main */}

      {/* Dynamic Pop-up workflow trigger block overlay layer */}
      <DynamicFormModal 
        form={selectedForm} 
        onClose={() => setSelectedForm(null)}
        inputs={formInputs}
        setInputs={setFormInputs}
        currentUser={currentUser}
        userData={userData}
        db={db}
      />

    </div> /* Closes S.page */
  );
};

// --- Multi-Step Official Form Template Overlays (Form B / NIC Specification Layout) ---
const DynamicFormModal = ({ form, onClose, inputs, setInputs, currentUser, userData, db }) => {
  if (!form) return null;

  const [formStep, setFormStep] = useState(1);

  const handleInputChange = (field, val) => {
    setInputs(prev => ({ ...prev, [field]: val }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (formStep < 4) {
      setFormStep(prev => prev + 1);
    } else {
      alert(`Backend Submission Triggered for: ${form.title}\nData: ${JSON.stringify(inputs)}`);
      onClose();
      setFormStep(1);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100 }} />

      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 101, width: '100%', maxWidth: '650px', maxHeight: '90vh', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ backgroundColor: '#6A2301', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{form.title}</h3>
            <p style={{ margin: 0, fontSize: '11px', color: '#f0e4cc' }}>Official Form Registration Portal</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer', fontWeight: 700 }}>×</button>
        </div>

        <div style={{ display: 'flex', backgroundColor: '#f0e8d5', padding: '10px 20px', gap: '8px', borderBottom: '1px solid #e8d5ac', fontSize: '12px', fontWeight: 700, color: '#5a3a00', flexShrink: 0 }}>
          <span style={{ color: formStep === 1 ? '#6A2301' : '#888' }}>1. General Info</span> &gt;
          <span style={{ color: formStep === 2 ? '#6A2301' : '#888' }}>2. Birth Details</span> &gt;
          <span style={{ color: formStep === 3 ? '#6A2301' : '#888' }}>3. Address</span> &gt;
          <span style={{ color: formStep === 4 ? '#6A2301' : '#888' }}>4. Uploads</span>
        </div>

        <form onSubmit={handleFormSubmit} style={{ padding: '24px', backgroundColor: '#fffbe8', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {formStep === 1 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Family Name (Sinhala/Tamil)</label>
                  <input type="text" required onChange={e => handleInputChange('familyNameLocal', e.target.value)} value={inputs.familyNameLocal || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="පෙළපත් නාමය / குடும்பப் பெயர்" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Other Names (Sinhala/Tamil)</label>
                  <input type="text" required onChange={e => handleInputChange('otherNamesLocal', e.target.value)} value={inputs.otherNamesLocal || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="නම / பெயர்" />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Full Name (English Block Letters)</label>
                <input type="text" required onChange={e => handleInputChange('fullNameEnglish', e.target.value.toUpperCase())} value={inputs.fullNameEnglish || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="E.G. WATHSALA HETTIARACHCHI" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Sex</label>
                  <select required onChange={e => handleInputChange('sex', e.target.value)} value={inputs.sex || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', backgroundColor: '#fff', outline: 'none' }}>
                    <option value="">-- Select --</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Civil Status</label>
                  <select required onChange={e => handleInputChange('civilStatus', e.target.value)} value={inputs.civilStatus || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', backgroundColor: '#fff', outline: 'none' }}>
                    <option value="">-- Select --</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Profession / Occupation / Designation</label>
                <input type="text" required onChange={e => handleInputChange('occupation', e.target.value)} value={inputs.occupation || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. Student / Business Owner" />
              </div>
            </>
          )}

          {formStep === 2 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Date of Birth</label>
                  <input type="date" required onChange={e => handleInputChange('dob', e.target.value)} value={inputs.dob || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Birth Certificate No</label>
                  <input type="text" required onChange={e => handleInputChange('birthCertificateNo', e.target.value)} value={inputs.birthCertificateNo || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. 10452" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Place of Birth</label>
                  <input type="text" required onChange={e => handleInputChange('birthPlace', e.target.value)} value={inputs.birthPlace || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="City / Village" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Division</label>
                  <input type="text" required onChange={e => handleInputChange('birthDivision', e.target.value)} value={inputs.birthDivision || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Revenue Div" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>District</label>
                  <input type="text" required onChange={e => handleInputChange('birthDistrict', e.target.value)} value={inputs.birthDistrict || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. Colombo" />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e8d5ac', paddingTop: '12px', marginTop: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#6A2301' }}>Born Outside Sri Lanka? (Citizenship Act Section 5(2))</span>
                <input type="text" onChange={e => handleInputChange('citizenshipCertNo', e.target.value)} value={inputs.citizenshipCertNo || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', marginTop: '8px', outline: 'none' }} placeholder="Citizenship Certificate No. (Optional)" />
              </div>
            </>
          )}

          {formStep === 3 && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Permanent Address</label>
                <input type="text" required onChange={e => handleInputChange('addressLine1', e.target.value)} value={inputs.addressLine1 || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', marginBottom: '8px', outline: 'none' }} placeholder="House Name or No., Street, Lane" />
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <input type="text" required onChange={e => handleInputChange('addressCity', e.target.value)} value={inputs.addressCity || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Village / City" />
                  <input type="text" required onChange={e => handleInputChange('postalCode', e.target.value)} value={inputs.postalCode || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Postal Code" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>D.S. Division</label>
                  <input type="text" disabled value={userData?.dsDiv || "Colombo DS"} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', backgroundColor: '#eae5d8', color: '#666' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>G.N. Division &amp; Number</label>
                  <input type="text" disabled value={userData?.gnDiv || "Hunupitiya (62B)"} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', backgroundColor: '#eae5d8', color: '#666' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Mobile Telephone No</label>
                  <input type="tel" required onChange={e => handleInputChange('mobile', e.target.value)} value={inputs.mobile || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. 0771234567" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Email Address</label>
                  <input type="email" onChange={e => handleInputChange('email', e.target.value)} value={inputs.email || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="wathsala@example.com" />
                </div>
              </div>
            </>
          )}

          {formStep === 4 && (
            <>
              <div style={{ backgroundColor: '#fff', border: '1.5px dashed #B46A02', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e1200' }}>Required Supporting Attachments (authenticated copies)</span>
                
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#3d2a00', marginBottom: '4px' }}>1. Scanned Copy of Birth Certificate</label>
                  <input type="file" required style={{ fontSize: '13px' }} />
                </div>

                <div style={{ borderTop: '1px solid #f5f0e8', paddingTop: '8px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#3d2a00', marginBottom: '4px' }}>2. Colored Photographs (35mm x 45mm for scanning)</label>
                  <input type="file" required style={{ fontSize: '13px' }} />
                </div>

                <div style={{ borderTop: '1px solid #f5f0e8', paddingTop: '8px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#3d2a00', marginBottom: '4px' }}>3. Proof of Profession/Designation (Obtained within 6 months)</label>
                  <input type="file" style={{ fontSize: '13px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '4px' }}>
                <input type="checkbox" required defaultChecked style={{ accentColor: '#6A2301', marginTop: '3px' }} />
                <span style={{ fontSize: '11px', color: '#666', lineHeight: 1.4 }}>
                  I hereby declare that the particulars given above are true and accurate to the best of my knowledge and belief and furnishing of incorrect details is a punishable offence under the Act.
                </span>
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', flexShrink: 0 }}>
            <button 
              type="button" 
              onClick={() => {
                if (formStep === 1) onClose();
                else setFormStep(prev => prev - 1);
              }} 
              style={{ padding: '10px 24px', borderRadius: '999px', border: '1.5px solid #e8d5ac', backgroundColor: '#fff', fontWeight: 700, cursor: 'pointer', color: '#888' }}
            >
              {formStep === 1 ? 'Cancel' : '← Back'}
            </button>
            
            <button 
              type="submit" 
              style={{ padding: '10px 24px', borderRadius: '999px', border: 'none', backgroundColor: '#6A2301', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
            >
              {formStep === 4 ? 'Submit Application' : 'Next Step →'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Forms;