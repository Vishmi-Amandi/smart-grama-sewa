import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase'; 
// --- Added i18next Core Hook ---
import { useTranslation } from 'react-i18next'; 

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
  
  const { t, i18n } = useTranslation();
  const changeLanguage = (lngCode) => {
    i18n.changeLanguage(lngCode);
  };

  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [tab, setTab] = useState('All');
  
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
            <input type="text" placeholder={t('search_placeholder')} style={{ background: 'none', border: 'none', outline: 'none', fontSize: '14px', width: '100%' }} />
          </div>
          <div style={{ flex: 1 }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => changeLanguage('en')} style={{ background: 'none', border: 'none', fontWeight: i18n.language === 'en' ? 900 : 600, color: i18n.language === 'en' ? '#6A2301' : '#5a3a00', cursor: 'pointer', fontSize: '14px' }}>EN</button>
            <button onClick={() => changeLanguage('si')} style={{ background: 'none', border: 'none', fontWeight: i18n.language === 'si' ? 900 : 600, color: i18n.language === 'si' ? '#6A2301' : '#5a3a00', cursor: 'pointer', fontSize: '14px' }}>සිං</button>
            <button onClick={() => changeLanguage('ta')} style={{ background: 'none', border: 'none', fontWeight: i18n.language === 'ta' ? 900 : 600, color: i18n.language === 'ta' ? '#6A2301' : '#5a3a00', cursor: 'pointer', fontSize: '14px' }}>தமிழ்</button>

            <div style={{ width: '1px', height: '20px', backgroundColor: '#e8d8b0', marginLeft: '4px', marginRight: '4px' }} />
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
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1e1200' }}>{t('nav_forms')}</h1>
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
                  <div style={{ width: 56, height: 56, backgroundColor: '#f5f0e8', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={form.imgSrc} alt={form.title} style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#1e1200' }}>{form.title}</div>
                    <div style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>{form.desc}</div>
                  </div>
                </div>
                <button 
                  onClick={() => { setSelectedForm(form); setFormInputs({}); }}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: '1.5px solid #e8d5ac', backgroundColor: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                >
                  View Form
                </button>
              </div>
            ))}
          </div>

          <footer style={{ ...S.footer, borderRadius: '12px', marginTop: '20px' }}>
            © 2026 Smart Grama Sewa. All rights reserved.
          </footer>
        </div>
      </div>

      <DynamicFormModal form={selectedForm} onClose={() => setSelectedForm(null)} inputs={formInputs} setInputs={setFormInputs} currentUser={currentUser} userData={userData} db={db} />
    </div>
  );
};

// --- Multi-Step Dynamic Overlay Engine (Supports IDs: 1, 2, 3, 4, 5, 6) ---
const DynamicFormModal = ({ form, onClose, inputs, setInputs, currentUser, userData, db }) => {
  if (!form) return null;

  const [formStep, setFormStep] = useState(1);
  const [hasJobIncome, setHasJobIncome] = useState(false);
  const [hasPropertyIncome, setHasPropertyIncome] = useState(false);
  const [hasBusinessIncome, setHasBusinessIncome] = useState(false);
  const [isReliefRecipient, setIsReliefRecipient] = useState(false);
  const [isDuplicateRequest, setIsDuplicateRequest] = useState(false);
  const [isDeviceUser, setIsDeviceUser] = useState(false);

  const empAmt = Number(inputs.summaryEmployment) || 0;
  const landAmt = Number(inputs.summaryLand) || 0;
  const bizAmt = Number(inputs.summaryBusiness) || 0;
  const otherAmt = Number(inputs.summaryOther) || 0;
  const totalCalculatedIncome = empAmt + landAmt + bizAmt + otherAmt;

  const handleInputChange = (field, val) => {
    setInputs(prev => ({ ...prev, [field]: val }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    let maxSteps = 1;
    if (form.id === 1 || form.id === 2) maxSteps = 3; 
    if (form.id === 3) maxSteps = 4;                 
    if (form.id === 4) maxSteps = 3;                 
    if (form.id === 5) maxSteps = 4; 
    if (form.id === 6) maxSteps = 3; // 3 core application steps for Disability Living Funds

    if (formStep < maxSteps) {
      setFormStep(prev => prev + 1);
    } else {
      const finalPayload = form.id === 3 ? { ...inputs, totalAnnualIncome: totalCalculatedIncome } : inputs;
      alert(`Backend Submission Triggered for: ${form.title}\nData: ${JSON.stringify(finalPayload)}`);
      onClose();
      setFormStep(1);
    }
  };

  const isResidenceOrCharacter = form.id === 1 || form.id === 2;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 101, width: '100%', maxWidth: '660px', maxHeight: '90vh', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ backgroundColor: '#6A2301', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{form.title}</h3>
            <p style={{ margin: 0, fontSize: '11px', color: '#f0e4cc' }}>Official Verification Portal</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer', fontWeight: 700 }}>×</button>
        </div>

        {isResidenceOrCharacter && (
          <div style={{ display: 'flex', backgroundColor: '#f0e8d5', padding: '10px 20px', gap: '8px', borderBottom: '1px solid #e8d5ac', fontSize: '12px', fontWeight: 700, color: '#5a3a00', flexShrink: 0 }}>
            <span style={{ color: formStep === 1 ? '#6A2301' : '#888' }}>1. Division &amp; Applicant Info</span> &gt;
            <span style={{ color: formStep === 2 ? '#6A2301' : '#888' }}>2. Residence &amp; Family</span> &gt;
            <span style={{ color: formStep === 3 ? '#6A2301' : '#888' }}>3. Verification &amp; Reason</span>
          </div>
        )}

        {form.id === 3 && (
          <div style={{ display: 'flex', backgroundColor: '#f0e8d5', padding: '10px 20px', gap: '8px', borderBottom: '1px solid #e8d5ac', fontSize: '11px', fontWeight: 700, color: '#5a3a00', flexShrink: 0 }}>
            <span style={{ color: formStep === 1 ? '#6A2301' : '#888' }}>1. Personal Info</span> &gt;
            <span style={{ color: formStep === 2 ? '#6A2301' : '#888' }}>2. Income Breakdown</span> &gt;
            <span style={{ color: formStep === 3 ? '#6A2301' : '#888' }}>3. Total Summary</span> &gt;
            <span style={{ color: formStep === 4 ? '#6A2301' : '#888' }}>4. Uploads &amp; Declarations</span>
          </div>
        )}

        {form.id === 4 && (
          <div style={{ display: 'flex', backgroundColor: '#f0e8d5', padding: '10px 20px', gap: '8px', borderBottom: '1px solid #e8d5ac', fontSize: '11px', fontWeight: 700, color: '#5a3a00', flexShrink: 0 }}>
            <span style={{ color: formStep === 1 ? '#6A2301' : '#888' }}>1. Land Identity &amp; Location</span> &gt;
            <span style={{ color: formStep === 2 ? '#6A2301' : '#888' }}>2. Boundaries &amp; Dimensions</span> &gt;
            <span style={{ color: formStep === 3 ? '#6A2301' : '#888' }}>3. Tenure &amp; Uploads</span>
          </div>
        )}

        {form.id === 5 && (
          <div style={{ display: 'flex', backgroundColor: '#f0e8d5', padding: '10px 20px', gap: '8px', borderBottom: '1px solid #e8d5ac', fontSize: '11px', fontWeight: 700, color: '#5a3a00', flexShrink: 0 }}>
            <span style={{ color: formStep === 1 ? '#6A2301' : '#888' }}>1. DRP Location &amp; Name Matrix</span> &gt;
            <span style={{ color: formStep === 2 ? '#6A2301' : '#888' }}>2. Status &amp; Birth Registry</span> &gt;
            <span style={{ color: formStep === 3 ? '#6A2301' : '#888' }}>3. Purpose &amp; Duplicates</span> &gt;
            <span style={{ color: formStep === 4 ? '#6A2301' : '#888' }}>4. Address, Fees &amp; Signatures</span>
          </div>
        )}

        {/* Step Indicators: Living Funds for Disabled Persons Application */}
        {form.id === 6 && (
          <div style={{ display: 'flex', backgroundColor: '#f0e8d5', padding: '10px 20px', gap: '8px', borderBottom: '1px solid #e8d5ac', fontSize: '11px', fontWeight: 700, color: '#5a3a00', flexShrink: 0 }}>
            <span style={{ color: formStep === 1 ? '#6A2301' : '#888' }}>1. Admin &amp; Family Unit Info</span> &gt;
            <span style={{ color: formStep === 2 ? '#6A2301' : '#888' }}>2. Individual Disability Diagnostics</span> &gt;
            <span style={{ color: formStep === 3 ? '#6A2301' : '#888' }}>3. Income, Bank Logs &amp; Attestations</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} style={{ padding: '24px', backgroundColor: '#fffbe8', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* ==========================================
              MODULE A: RESIDENCE & CHARACTER CERTIFICATES 
             ========================================== */}
          {isResidenceOrCharacter && (
            <>
              {formStep === 1 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>1) Administrative Divisions</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>District / Divisional Secretary's Division</label>
                      <input type="text" disabled value={userData?.dsDiv || "Colombo / Thimbirigasyaya"} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', backgroundColor: '#eae5d8', color: '#666' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Grama Niladhari Division &amp; Number</label>
                      <input type="text" disabled value={userData?.gnDiv || "Hunupitiya (62B)"} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', backgroundColor: '#eae5d8', color: '#666' }} />
                    </div>
                  </div>

                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingTop: '8px', paddingBottom: '4px' }}>2) Information about Applicant</span>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Full Name</label>
                    <input type="text" required onChange={e => handleInputChange('applicantName', e.target.value)} value={inputs.applicantName || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Enter Full Name" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Permanent Address</label>
                    <input type="text" required onChange={e => handleInputChange('applicantAddress', e.target.value)} value={inputs.applicantAddress || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Enter Permanent Address" />
                  </div>
                </>
              )}

              {formStep === 2 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Residence Information</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Period of Residence in Village</label>
                      <input type="text" required onChange={e => handleInputChange('villagePeriod', e.target.value)} value={inputs.villagePeriod || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. 5 Years" />
                    </div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingTop: '8px', paddingBottom: '4px' }}>Family Particulars</span>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Name of the Father</label>
                    <input type="text" required onChange={e => handleInputChange('fatherName', e.target.value)} value={inputs.fatherName || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Father's Full Name" />
                  </div>
                </>
              )}

              {formStep === 3 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Background Verification &amp; Reason</span>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Purpose for which the certificate is required</label>
                    <input type="text" required onChange={e => handleInputChange('certificatePurpose', e.target.value)} value={inputs.certificatePurpose || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. Employment, Passport, Bank Loan" />
                  </div>
                </>
              )}
            </>
          )}

          {/* ==========================================
              MODULE B: INCOME CERTIFICATE SUBMISSION
             ========================================== */}
          {form.id === 3 && (
            <>
              {formStep === 1 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>01. Personal Details</span>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Full Name of the Applicant</label>
                    <input type="text" required onChange={e => handleInputChange('incFullName', e.target.value)} value={inputs.incFullName || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Enter Full Name" />
                  </div>
                </>
              )}

              {formStep === 2 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>02. Source of Income Breakdown</span>
                  <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '10px', border: '1.5px solid #e8d5ac' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 800, color: '#3d2a00', cursor: 'pointer' }}>
                      <input type="checkbox" checked={hasJobIncome} onChange={e => setHasJobIncome(e.target.checked)} style={{ accentColor: '#6A2301' }} />
                      1. Income From Employment / Profession
                    </label>
                  </div>
                </>
              )}

              {formStep === 3 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>03. Total Consolidated Income (Summary)</span>
                </>
              )}

              {formStep === 4 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>04. Additional Financial Context &amp; Declarations</span>
                </>
              )}
            </>
          )}

          {/* ==========================================
              MODULE C: VALUATION CERTIFICATE SUBMISSION
             ========================================== */}
          {form.id === 4 && (
            <>
              {formStep === 1 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>01. Land Location &amp; Administration Details</span>
                </>
              )}
              {formStep === 2 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>02. Property Boundaries &amp; Total Size</span>
                </>
              )}
              {formStep === 3 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>03. Land Ownership &amp; Tenure Context</span>
                </>
              )}
            </>
          )}

          {/* ==========================================
              MODULE D: IDENTITY CARD APPLICATION (FORM B)
             ========================================== */}
          {form.id === 5 && (
            <>
              {formStep === 1 && (
                <>
                  <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1.5px solid #e8d5ac', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#6A2301', textTransform: 'uppercase' }}>
                      DRP Form "B" / "ආ" ආකෘතිය (Registration of Persons Act No 32 of 1968)
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#B46A02' }}>District / දිස්ත්‍රික්කය</label>
                        <input type="text" disabled value={userData?.district || "Colombo"} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', backgroundColor: '#eae5d8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#B46A02' }}>D.S. Division / ප්‍රා.ලේ. කොට්ඨාසය</label>
                        <input type="text" disabled value={userData?.dsDiv || "Thimbirigasyaya"} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', backgroundColor: '#eae5d8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#B46A02' }}>G.N. Number &amp; Division / ග්‍රාම නිලධාරී වසම</label>
                        <input type="text" disabled value={userData?.gnDiv || "62B / Hunupitiya"} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', backgroundColor: '#eae5d8' }} />
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>
                    01. Name Block Tracing (Separate Box Logic As Instructed)
                  </span>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Family Name / පෙළපත් නාමය (English Capitals - One character per cage)
                    </label>
                    <input type="text" required onChange={e => handleInputChange('nicFamilyName', e.target.value.toUpperCase())} value={inputs.nicFamilyName || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none', letterSpacing: '2px', fontFamily: 'monospace' }} placeholder="NAVUNGALA JAGODAGE" />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Given Names / වෙනත් නම් (English Capital Blocks)
                    </label>
                    <input type="text" required onChange={e => handleInputChange('nicOtherNames', e.target.value.toUpperCase())} value={inputs.nicOtherNames || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none', letterSpacing: '2px', fontFamily: 'monospace' }} placeholder="SAMINDA JAYALAL" />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Surname / වාසගම (English Capital Blocks)
                    </label>
                    <input type="text" required onChange={e => handleInputChange('nicSurname', e.target.value.toUpperCase())} value={inputs.nicSurname || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none', letterSpacing: '2px', fontFamily: 'monospace' }} placeholder="SENARATHNA" />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Name to appear on the Identity Card / හැඳුනුම්පතෙහි සඳහන් විය යුතු නම
                    </label>
                    <input type="text" onChange={e => handleInputChange('nicPreferredName', e.target.value.toUpperCase())} value={inputs.nicPreferredName || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Fill only if different from cage 1 birth registration profile" />
                  </div>
                </>
              )}

              {formStep === 2 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>
                    02. Demographics Profile &amp; Birth Registry
                  </span>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Sex / ස්ත්‍රී පුරුෂ භාවය</label>
                      <select required onChange={e => handleInputChange('nicSex', e.target.value)} value={inputs.nicSex || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', backgroundColor: '#fff', outline: 'none' }}>
                        <option value="">-- Select --</option>
                        <option value="Male">Male (පුරුෂ)</option>
                        <option value="Female">Female (ස්ත්‍රී)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Civil Status / සිවිල් තත්වය</label>
                      <select required onChange={e => handleInputChange('nicCivilStatus', e.target.value)} value={inputs.nicCivilStatus || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', backgroundColor: '#fff', outline: 'none' }}>
                        <option value="">-- Select Status --</option>
                        <option value="Single">Single (අවිවාහක)</option>
                        <option value="Married">Married (විවාහක)</option>
                        <option value="Widowed">Widowed (වැන්දඹු)</option>
                        <option value="Divorced">Divorced (දික්කසාද)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Profession / Occupation / Designation</label>
                    <input type="text" required onChange={e => handleInputChange('nicOccupation', e.target.value)} value={inputs.nicOccupation || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="E.G. Software Engineer" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Date of Birth / උපන් දිනය</label>
                      <input type="date" required onChange={e => handleInputChange('nicDob', e.target.value)} value={inputs.nicDob || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Birth Certificate Number / අංකය</label>
                      <input type="text" required onChange={e => handleInputChange('nicBirthCertNo', e.target.value)} value={inputs.nicBirthCertNo || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Birth Certificate No." />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Place of Birth / උපන් ස්ථානය</label>
                      <input type="text" required onChange={e => handleInputChange('nicBirthPlace', e.target.value)} value={inputs.nicBirthPlace || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="City / Hospital" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Birth District / උපන් දිස්ත්‍රික්කය</label>
                      <input type="text" required onChange={e => handleInputChange('nicBirthDistrict', e.target.value)} value={inputs.nicBirthDistrict || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="E.G. Galle" />
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '10px', border: '1.5px solid #e8d5ac', marginTop: '4px' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#6A2301', textTransform: 'uppercase', marginBottom: '6px' }}>
                      For Applicants Born Outside Sri Lanka (Section 5(2) Citizenship Act)
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <input type="text" onChange={e => handleInputChange('nicForeignCountry', e.target.value)} value={inputs.nicForeignCountry || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none', fontSize: '12px' }} placeholder="Country of Birth / රට" />
                      <input type="text" onChange={e => handleInputChange('nicForeignCity', e.target.value)} value={inputs.nicForeignCity || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none', fontSize: '12px' }} placeholder="City / නගරය" />
                    </div>
                    <input type="text" onChange={e => handleInputChange('nicCitizenshipCertNo', e.target.value)} value={inputs.nicCitizenshipCertNo || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none', fontSize: '12px', marginTop: '8px' }} placeholder="Citizenship Certificate Number / සහතිකයේ අංකය" />
                  </div>
                </>
              )}

              {formStep === 3 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>
                    03. Purpose of Application &amp; Duplicate Tracking (Cage 10)
                  </span>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Purpose of application / අයදුම්පත් ඉල්ලුම් කරන අරමුණ
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: 700 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="radio" name="nicPurposeRadio" checked={isDuplicateRequest === false} onChange={() => { setIsDuplicateRequest(false); handleInputChange('nicPurposeType', 'New'); }} style={{ accentColor: '#6A2301' }} />
                        10.0 New Identity Card / පළමු වරට හැඳුනුම්පතක් ලබා ගැනීමට
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="radio" name="nicPurposeRadio" checked={isDuplicateRequest === true} onChange={() => { setIsDuplicateRequest(true); handleInputChange('nicPurposeType', 'Duplicate'); }} style={{ accentColor: '#6A2301' }} />
                        10.1 - 10.4 Duplicate Request (Lost / Damaged / Amending / Renewal)
                      </label>
                    </div>
                  </div>

                  {isDuplicateRequest && (
                    <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1.5px solid #e8d5ac', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#6A2301', textTransform: 'uppercase' }}>
                        Duplicate Specific Ledger Entries
                      </span>
                      <div>
                        <select required onChange={e => handleInputChange('nicDuplicateSubReason', e.target.value)} value={inputs.nicDuplicateSubReason || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none', backgroundColor: '#fff' }}>
                          <option value="">-- Select Specific Sub-Reason --</option>
                          <option value="Lost">10.1 Card is Lost / නැතිවූයේ නම්</option>
                          <option value="Amend">10.2 To Make Changes / සංශෝධනය කිරීම සඳහා</option>
                          <option value="Renew">10.3 To Renew Validity Period / වලංගු කාලය අලුත් කිරීම සඳහා</option>
                          <option value="Damaged">10.4 Card is Damaged/Defaced/Illegible / හානි වීම සඳහා</option>
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}

              {formStep === 4 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>
                    05. Addresses, Financial Stamp Auditing &amp; Legal Assent
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Permanent Address / ස්ථිර පදිංචි ලිපිනය (8.1)</label>
                      <textarea rows={2} required onChange={e => handleInputChange('nicAddressPermanent', e.target.value)} value={inputs.nicAddressPermanent || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: '12px' }} placeholder="House name or number, street, lane, city" />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ==========================================
              MODULE E: LIVING FUNDS FOR DISABLED PERSONS
             ========================================== */}
          {form.id === 6 && (
            <>
              {/* STEP 1: District Office Information Tracing Trays */}
              {formStep === 1 && (
                <>
                  <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1.5px solid #e8d5ac', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#6A2301', textTransform: 'uppercase' }}>
                      National Secretariat for Persons with Disabilities / ජාතික මහ ලේකම් කාර්යාලය
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#B46A02' }}>District / දිස්ත්‍රික්කය</label>
                        <input type="text" disabled value={userData?.district || "Colombo"} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', backgroundColor: '#eae5d8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#B46A02' }}>D.S. Office / ප්‍රා.ලේ කාර්යාලය</label>
                        <input type="text" disabled value={userData?.dsDiv || "Thimbirigasyaya"} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', backgroundColor: '#eae5d8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#B46A02' }}>G.N. Division / ග්‍රා.නි වසම</label>
                        <input type="text" disabled value={userData?.gnDiv || "62B / Hunupitiya"} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', backgroundColor: '#eae5d8' }} />
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>
                    1. Family Composition Details / පවුල පිළිබඳ විස්තර (Section 1)
                  </span>
                  
                  <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1.5px solid #e8d5ac', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase' }}>
                      1.1 Disabled Individuals In Family Unit / පවුලේ ආබාධ සහිත පුද්ගලයන්ගේ තොරතුරු
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
                      <input type="text" required onChange={e => handleInputChange('dfMemberName', e.target.value)} value={inputs.dfMemberName || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', fontSize: '12px' }} placeholder="Full Name / සහතිකයේ නම" />
                      <input type="text" required onChange={e => handleInputChange('dfRelationship', e.target.value)} value={inputs.dfRelationship || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', fontSize: '12px' }} placeholder="Relation / නෑදෑකම" />
                      <input type="text" required onChange={e => handleInputChange('dfNic', e.target.value)} value={inputs.dfNic || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', fontSize: '12px' }} placeholder="NIC No / හැඳුනුම්පත් අංකය" />
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1.5px solid #e8d5ac', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase' }}>
                      1.2 Other Dependent Members In Family Unit / පවුලේ අනෙකුත් සාමාජිකයන්
                    </span>
                    <textarea rows={2} onChange={e => handleInputChange('dfOtherFamilyDetails', e.target.value)} value={inputs.dfOtherFamilyDetails || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none', resize: 'none', fontFamily: 'inherit', fontSize: '12px' }} placeholder="Enter Name, Relationship, Age, Marital Status of remaining dependents" />
                  </div>
                </>
              )}

              {/* STEP 2: Comprehensive Diagnostic Checklist Groupings */}
              {formStep === 2 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>
                    2. Individual Disability Diagnosis &amp; Metadata / ආබාධිත තොරතුරු (Section B/E)
                  </span>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Full Name of the Disabled Person / ආබාධ සහිත තැනැත්තාගේ නම
                    </label>
                    <input type="text" required onChange={e => handleInputChange('dfFullName', e.target.value)} value={inputs.dfFullName || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Enter Full Name" />
                  </div>

                  <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1.5px solid #e8d5ac', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#6A2301', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Nature of Disability / ආබාධිත භාවයේ ස්වභාවය (Check All Applicable Cages)
                    </span>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', fontWeight: 700 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" onChange={e => handleInputChange('dis_blind', e.target.checked)} style={{ accentColor: '#6A2301' }} /> Total Blind (පූර්ණ අන්ධ)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" onChange={e => handleInputChange('dis_spinal', e.target.checked)} style={{ accentColor: '#6A2301' }} /> Spinal Injury (සුසුම්නාවට හානි වූ)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" onChange={e => handleInputChange('dis_cerebral', e.target.checked)} style={{ accentColor: '#6A2301' }} /> Cerebral Palsy (මස්තිෂ්කාඝාතයෙන් පෙලෙන)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" onChange={e => handleInputChange('dis_deaf_mute', e.target.checked)} style={{ accentColor: '#6A2301' }} /> Deaf &amp; Mute (පූර්ණ ශ්‍රවණ හා කථනාබාධ)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" onChange={e => handleInputChange('dis_limbs', e.target.checked)} style={{ accentColor: '#6A2301' }} /> Loss of Limbs (අත් හෝ දෙපා අහිමි වූ)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" onChange={e => handleInputChange('dis_autism', e.target.checked)} style={{ accentColor: '#6A2301' }} /> Autism (ඔටිසම්)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" onChange={e => handleInputChange('dis_intellectual', e.target.checked)} style={{ accentColor: '#6A2301' }} /> Intellectual (බුද්ධි ඌනතා)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="checkbox" onChange={e => handleInputChange('dis_multiple', e.target.checked)} style={{ accentColor: '#6A2301' }} /> Multiple (බහු ආබාධිත)
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Age of Onset Period / කාලය (வருடம்)</label>
                      <input type="text" required onChange={e => handleInputChange('dfOnsetPeriod', e.target.value)} value={inputs.dfOnsetPeriod || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="E.g. From Birth / Accident Year" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Vocational or Education Status</label>
                      <input type="text" required onChange={e => handleInputChange('dfEducationTraining', e.target.value)} value={inputs.dfEducationTraining || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="අධ්‍යාපන තත්වය / පුහුණුව" />
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '10px', border: '1.5px solid #e8d5ac' }}>
                    <span style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#3d2a00', marginBottom: '6px' }}>Does the disabled individual currently utilize any assistive device? / උපකරණයක් භාවිතා කරන්නේද?</span>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '13px', fontWeight: 700 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="radio" name="deviceRadio" checked={isDeviceUser === true} onChange={() => setIsDeviceUser(true)} style={{ accentColor: '#6A2301' }} /> Yes
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="radio" name="deviceRadio" checked={isDeviceUser === false} onChange={() => { setIsDeviceUser(false); handleInputChange('dfDeviceName', ''); }} style={{ accentColor: '#6A2301' }} /> No
                      </label>
                    </div>
                    {isDeviceUser && (
                      <input type="text" required onChange={e => handleInputChange('dfDeviceName', e.target.value)} value={inputs.dfDeviceName || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none', marginTop: '10px' }} placeholder="Specify device name (e.g. Wheelchair, Hearing Aid)" />
                    )}
                  </div>
                </>
              )}

              {/* STEP 3: Income Streams, Bank Passbook Sync, and Official Assents */}
              {formStep === 3 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>
                    3. Income Ledger, Bank Passbook &amp; Affirmations
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Total Family Monthly Income / මාසික ආදායම</label>
                      <input type="number" required onChange={e => handleInputChange('dfTotalMonthlyIncome', e.target.value)} value={inputs.dfTotalMonthlyIncome || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Rs. 0.00" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Current External Relief Received / ලැබෙන ආධාර</label>
                      <input type="text" onChange={e => handleInputChange('dfExistingAssistance', e.target.value)} value={inputs.dfExistingAssistance || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="State any current state or NGO allowance" />
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1.5px solid #e8d5ac', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#6A2301', textTransform: 'uppercase' }}>
                      Bank Account Particulars For Fund Transfer / ගිණුම් විස්තර (Section B.6)
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', color: '#B46A02', fontWeight: 700 }}>Bank &amp; Branch Name / බැංකුව සහ ශාඛාව</label>
                        <input type="text" required onChange={e => handleInputChange('dfBankBranch', e.target.value)} value={inputs.dfBankBranch || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} placeholder="E.g. Bank of Ceylon - Kaduwela" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', color: '#B46A02', fontWeight: 700 }}>Account Number / ගිණුම් අංකය</label>
                        <input type="text" required onChange={e => handleInputChange('dfAccountNo', e.target.value)} value={inputs.dfAccountNo || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} placeholder="Account Number Lines" />
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#fff', border: '1.5px dashed #B46A02', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#1e1200' }}>Official Government Medical Certificate Upload Registry (Section D)</span>
                    <input type="file" required style={{ fontSize: '12px' }} />
                    <span style={{ display: 'block', fontSize: '10px', color: '#666', lineHeight: 1.3 }}>
                      * Note: Application must contain diagnostic verification signatures stamped by a certified state hospital practitioner.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#eae5d8', padding: '12px', borderRadius: '10px' }}>
                    <input type="checkbox" required defaultChecked style={{ accentColor: '#6A2301', marginTop: '3px' }} />
                    <span style={{ fontSize: '11px', color: '#444', fontWeight: 600, lineHeight: 1.4 }}>
                      I certify that the diagnostic parameters and household income metrics provided match our family registry records exactly. I authorize the Grama Niladhari and Social Service officers to run structural background audits to confirm low-income dependency status.
                    </span>
                  </div>
                </>
              )}
            </>
          )}

          {/* Action Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', flexShrink: 0 }}>
            <button 
              type="button" 
              onClick={() => { if (formStep === 1) onClose(); else setFormStep(prev => prev - 1); }} 
              style={{ padding: '10px 24px', borderRadius: '999px', border: '1.5px solid #e8d5ac', backgroundColor: '#fff', fontWeight: 700, cursor: 'pointer', color: '#888' }}
            >
              {formStep === 1 ? 'Cancel' : '← Back'}
            </button>
            <button 
              type="submit" 
              style={{ padding: '10px 24px', borderRadius: '999px', border: 'none', backgroundColor: '#6A2301', color: '#fff', fontWeight: 800, cursor: 'pointer', marginLeft: 'auto' }}
            >
              {((form.id === 3 && formStep === 4) || (form.id === 5 && formStep === 4) || ((form.id === 1 || form.id === 2 || form.id === 4 || form.id === 6) && formStep === 3)) ? 'Submit Application' : 'Next Step →'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Forms;