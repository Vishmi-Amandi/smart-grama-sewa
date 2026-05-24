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
  
  // --- Active Core Translation Hooks ---
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
    { id: 6, title: "Living Funds for Disabled Persons", cat: "Recommendations", imgSrc: "/icons/disabled.png", desc: "Financial assistance application for persons with disabilities" },
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

  // --- Living Allowance State Arrays ---
  const [disabledMembers, setDisabledMembers] = useState([{ name: '', relation: '', gender: '', civilStatus: '', dob: '', nic: '', nature: '' }]);
  const [otherMembers, setOtherMembers] = useState([{ name: '', relation: '', gender: '', civilStatus: '', dob: '', nic: '', incomeSourceAmt: '' }]);

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
    if (form.id === 5) maxSteps = 3; 
    if (form.id === 6) maxSteps = 4; // Adjusted to 4 Steps to cleanly fit your expanded verification data matrix

    if (formStep < maxSteps) {
      setFormStep(prev => prev + 1);
    } else {
      let finalPayload = inputs;
      if (form.id === 3) {
        finalPayload = { ...inputs, totalAnnualIncome: totalCalculatedIncome };
      } else if (form.id === 6) {
        finalPayload = { ...inputs, tableAFamilyWithDisabilities: disabledMembers, tableBOtherFamilyMembers: otherMembers };
      }
      alert(`Backend Submission Triggered for: ${form.title}\nData: ${JSON.stringify(finalPayload)}`);
      onClose();
      setFormStep(1);
    }
  };

  const isResidenceOrCharacter = form.id === 1 || form.id === 2;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 101, width: '100%', maxWidth: '650px', maxHeight: '90vh', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
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
            <span style={{ color: formStep === 1 ? '#6A2301' : '#888' }}>1. DRP Metadata &amp; Name Matrix</span> &gt;
            <span style={{ color: formStep === 2 ? '#6A2301' : '#888' }}>2. Status &amp; Birth Registry</span> &gt;
            <span style={{ color: formStep === 3 ? '#6A2301' : '#888' }}>3. Residence &amp; Affidavits</span>
          </div>
        )}

        {/* Step Indicators: Living Allowance Application (Form ID: 6) */}
        {form.id === 6 && (
          <div style={{ display: 'flex', backgroundColor: '#f0e8d5', padding: '10px 20px', gap: '8px', borderBottom: '1px solid #e8d5ac', fontSize: '11px', fontWeight: 700, color: '#5a3a00', flexShrink: 0 }}>
            <span style={{ color: formStep === 1 ? '#6A2301' : '#888' }}>1. Region &amp; Applicant</span> &gt;
            <span style={{ color: formStep === 2 ? '#6A2301' : '#888' }}>2. Family Details</span> &gt;
            <span style={{ color: formStep === 3 ? '#6A2301' : '#888' }}>3. Bank &amp; Assistance</span> &gt;
            <span style={{ color: formStep === 4 ? '#6A2301' : '#888' }}>4. Official Audits</span>
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Sex</label>
                      <select required onChange={e => handleInputChange('sex', e.target.value)} value={inputs.sex || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', backgroundColor: '#fff', outline: 'none' }}>
                        <option value="">-- Select --</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Age</label>
                      <input type="number" required onChange={e => handleInputChange('age', e.target.value)} value={inputs.age || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Age" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Civil Status</label>
                      <select required onChange={e => handleInputChange('civilStatus', e.target.value)} value={inputs.civilStatus || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', backgroundColor: '#fff', outline: 'none' }}>
                        <option value="">-- Select --</option>
                        <option value="Unmarried">Unmarried</option>
                        <option value="Married">Married</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Whether Sri Lankan?</label>
                      <select required onChange={e => handleInputChange('isSriLankan', e.target.value)} value={inputs.isSriLankan || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', backgroundColor: '#fff', outline: 'none' }}>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Religion</label>
                      <input type="text" required onChange={e => handleInputChange('religion', e.target.value)} value={inputs.religion || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Religion" />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Present Occupation</label>
                    <input type="text" required onChange={e => handleInputChange('occupation', e.target.value)} value={inputs.occupation || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. Student, Executive Officer" />
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
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Period of Residence in GN Division</label>
                      <input type="text" required onChange={e => handleInputChange('gnPeriod', e.target.value)} value={inputs.gnPeriod || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. 5 Years" />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Nature of other evidences in proof of residence</label>
                    <input type="text" required onChange={e => handleInputChange('residenceEvidence', e.target.value)} value={inputs.residenceEvidence || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. Electoral Register, Utility Bills" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>National Identity Card (NIC) No.</label>
                      <input type="text" required onChange={e => handleInputChange('nicNumber', e.target.value)} value={inputs.nicNumber || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="NIC Number" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Electoral Register Particulars</label>
                      <input type="text" required onChange={e => handleInputChange('electoralDetails', e.target.value)} value={inputs.electoralDetails || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="List No, Serial No" />
                    </div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingTop: '8px', paddingBottom: '4px' }}>Family Particulars</span>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Name of the Father</label>
                    <input type="text" required onChange={e => handleInputChange('fatherName', e.target.value)} value={inputs.fatherName || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Father's Full Name" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Address of the Father</label>
                    <input type="text" required onChange={e => handleInputChange('fatherAddress', e.target.value)} value={inputs.fatherAddress || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Father's Current Address" />
                  </div>
                </>
              )}

              {formStep === 3 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Background Verification &amp; Reason</span>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Whether convicted by a Court of Law?</label>
                    <select required onChange={e => handleInputChange('courtConviction', e.target.value)} value={inputs.courtConviction || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', backgroundColor: '#fff', outline: 'none' }}>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Interest in public activities, social service, or community work?</label>
                    <textarea rows={2} onChange={e => handleInputChange('socialService', e.target.value)} value={inputs.socialService || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none', resize: 'none', fontFamily: 'inherit' }} placeholder="Describe any community contributions..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Purpose for which the certificate is required</label>
                    <input type="text" required onChange={e => handleInputChange('certificatePurpose', e.target.value)} value={inputs.certificatePurpose || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. Employment, Passport, Bank Loan" />
                  </div>
                  <div style={{ backgroundColor: '#fff', border: '1.5px dashed #B46A02', borderRadius: '12px', padding: '14px', marginTop: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#3d2a00', display: 'block', marginBottom: '6px' }}>Signature Affirmation</span>
                    <input type="file" required style={{ fontSize: '13px' }} />
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
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Address</label>
                    <textarea rows={2} required onChange={e => handleInputChange('incAddress', e.target.value)} value={inputs.incAddress || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none', resize: 'none', fontFamily: 'inherit' }} placeholder="Enter Permanent Address" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>NIC Number</label>
                      <input type="text" required onChange={e => handleInputChange('incNic', e.target.value)} value={inputs.incNic || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="NIC Number" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Purpose for requesting certificate</label>
                      <select required onChange={e => handleInputChange('incPurpose', e.target.value)} value={inputs.incPurpose || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', backgroundColor: '#fff', outline: 'none' }}>
                        <option value="">-- Select Purpose --</option>
                        <option value="University Admission">University Admission</option>
                        <option value="Bank Loan">Bank Loan</option>
                        <option value="Scholarship">Scholarship</option>
                        <option value="Other">Other External Verification</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {formStep === 2 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>02. Source of Income Breakdown</span>
                  <p style={{ margin: 0, fontSize: '12px', color: '#666', fontWeight: 600 }}>Toggle your active financial streams below to fill details:</p>

                  <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '10px', border: '1.5px solid #e8d5ac' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 800, color: '#3d2a00', cursor: 'pointer' }}>
                      <input type="checkbox" checked={hasJobIncome} onChange={e => setHasJobIncome(e.target.checked)} style={{ accentColor: '#6A2301' }} />
                      1. Income From Employment / Profession
                    </label>
                    {hasJobIncome && (
                      <div style={{ marginTop: '12px', borderTop: '1px solid #f5f0e8', paddingTop: '10px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Monthly or Annual Income (LKR)</label>
                        <input type="number" onChange={e => handleInputChange('incomeJobAmt', e.target.value)} value={inputs.incomeJobAmt || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1.5px solid #e8d5ac', outline: 'none' }} placeholder="0.00" />
                      </div>
                    )}
                  </div>

                  <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '10px', border: '1.5px solid #e8d5ac' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 800, color: '#3d2a00', cursor: 'pointer' }}>
                      <input type="checkbox" checked={hasPropertyIncome} onChange={e => setHasPropertyIncome(e.target.checked)} style={{ accentColor: '#6A2301' }} />
                      2. Income From Land and Property
                    </label>
                    {hasPropertyIncome && (
                      <div style={{ marginTop: '12px', borderTop: '1px solid #f5f0e8', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Location / Address of Land or Property</label>
                          <input type="text" onChange={e => handleInputChange('landLoc', e.target.value)} value={inputs.landLoc || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1.5px solid #e8d5ac', outline: 'none' }} placeholder="Property Location" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Deed Number &amp; Date</label>
                            <input type="text" onChange={e => handleInputChange('landDeed', e.target.value)} value={inputs.landDeed || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} placeholder="Deed Details" />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Extent of Land (Size)</label>
                            <input type="text" onChange={e => handleInputChange('landSize', e.target.value)} value={inputs.landSize || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1.5px solid #e8d5ac', outline: 'none' }} placeholder="e.g. 20 Perches" />
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Net Income received from lands/buildings (LKR)</label>
                          <input type="number" onChange={e => handleInputChange('incomeLandAmt', e.target.value)} value={inputs.incomeLandAmt || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1.5px solid #e8d5ac', outline: 'none' }} placeholder="0.00" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '10px', border: '1.5px solid #e8d5ac' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 800, color: '#3d2a00', cursor: 'pointer' }}>
                      <input type="checkbox" checked={hasBusinessIncome} onChange={e => setHasBusinessIncome(e.target.checked)} style={{ accentColor: '#6A2301' }} />
                      3. Income From Businesses
                    </label>
                    {hasBusinessIncome && (
                      <div style={{ marginTop: '12px', borderTop: '1px solid #f5f0e8', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Name of the Business</label>
                          <input type="text" onChange={e => handleInputChange('bizName', e.target.value)} value={inputs.bizName || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1.5px solid #e8d5ac', outline: 'none' }} placeholder="Business Entity Name" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Business Registration Number</label>
                            <input type="text" onChange={e => handleInputChange('bizRegNo', e.target.value)} value={inputs.bizRegNo || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} placeholder="BR-XXXXXX" />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Annual Net Income (LKR)</label>
                            <input type="number" onChange={e => handleInputChange('incomeBizAmt', e.target.value)} value={inputs.incomeBizAmt || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1.5px solid #e8d5ac', outline: 'none' }} placeholder="0.00" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {formStep === 3 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>03. Total Consolidated Income (Summary)</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Annual Employment Total (LKR)</label>
                      <input type="number" onChange={e => handleInputChange('summaryEmployment', e.target.value)} value={inputs.summaryEmployment || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="0.00" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Annual Lands &amp; Properties (LKR)</label>
                      <input type="number" onChange={e => handleInputChange('summaryLand', e.target.value)} value={inputs.summaryLand || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="0.00" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Annual Business Total (LKR)</label>
                      <input type="number" onChange={e => handleInputChange('summaryBusiness', e.target.value)} value={inputs.summaryBusiness || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="0.00" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Annual Income from Other Sources</label>
                      <input type="number" onChange={e => handleInputChange('summaryOther', e.target.value)} value={inputs.summaryOther || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="0.00" />
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#6A2301', color: '#fff', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#f0e4cc', display: 'block' }}>Total Annual Income</span>
                    </div>
                    <span style={{ fontSize: '24px', fontWeight: 900, color: '#F5C400' }}>Rs. {totalCalculatedIncome.toLocaleString('.2')}</span>
                  </div>
                </>
              )}

              {formStep === 4 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>04. Additional Financial Context &amp; Declarations</span>
                  <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '10px', border: '1.5px solid #e8d5ac' }}>
                    <span style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#3d2a00', marginBottom: '6px' }}>Are you a recipient of Samurdhi or any other public relief/allowance?</span>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '13px', fontWeight: 700 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="radio" name="reliefRadio" checked={isReliefRecipient === true} onChange={() => setIsReliefRecipient(true)} style={{ accentColor: '#6A2301' }} /> Yes
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="radio" name="reliefRadio" checked={isReliefRecipient === false} onChange={() => { setIsReliefRecipient(false); handleInputChange('reliefName', ''); }} style={{ accentColor: '#6A2301' }} /> No
                      </label>
                    </div>
                    {isReliefRecipient && (
                      <input type="text" required onChange={e => handleInputChange('reliefName', e.target.value)} value={inputs.reliefName || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none', marginTop: '10px' }} placeholder="State name of relief" />
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>State reasons / evidence to prove accuracy of income</label>
                    <textarea rows={2} required onChange={e => handleInputChange('incomeAccuracyEvidence', e.target.value)} value={inputs.incomeAccuracyEvidence || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none', resize: 'none', fontFamily: 'inherit' }} placeholder="Provide evidence summary details..." />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>External institution to which this certificate will be submitted</label>
                    <input type="text" required onChange={e => handleInputChange('submissionTargetInstitution', e.target.value)} value={inputs.submissionTargetInstitution || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. Bank, University" />
                  </div>

                  <div style={{ backgroundColor: '#fff', border: '1.5px dashed #B46A02', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#1e1200' }}>Attach Document Audits (Certified Verification Slips)</span>
                    <input type="file" required style={{ fontSize: '12px' }} />
                  </div>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>My Ref / Ledger Number</label>
                      <input type="text" required onChange={e => handleInputChange('valRefNo', e.target.value)} value={inputs.valRefNo || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. VAL/2026/089" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Date of Request</label>
                      <input type="date" required onChange={e => handleInputChange('valRequestDate', e.target.value)} value={inputs.valRequestDate || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Divisional Secretariat division</label>
                      <input type="text" required onChange={e => handleInputChange('valDsDivision', e.target.value)} value={inputs.valDsDivision || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. Kaduwela" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Grama Niladhari Division</label>
                      <input type="text" required onChange={e => handleInputChange('valGnDivision', e.target.value)} value={inputs.valGnDivision || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. Battaramulla South" />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Name of the Land / Property Title</label>
                    <input type="text" required onChange={e => handleInputChange('valLandName', e.target.value)} value={inputs.valLandName || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. Kosgahawatta / Lot A" />
                  </div>
                </>
              )}

              {formStep === 2 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>02. Property Boundaries &amp; Total Size</span>
                  <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1.5px solid #e8d5ac', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#6A2301', textTransform: 'uppercase' }}>Four Boundaries (හතර මායිම්)</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#B46A02', marginBottom: '2px' }}>North (උතුරට)</label>
                        <input type="text" required onChange={e => handleInputChange('boundNorth', e.target.value)} value={inputs.boundNorth || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} placeholder="Bounded by" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#B46A02', marginBottom: '2px' }}>East (නැගෙනහිරට)</label>
                        <input type="text" required onChange={e => handleInputChange('boundEast', e.target.value)} value={inputs.boundEast || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} placeholder="Bounded by" />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#B46A02', marginBottom: '2px' }}>South (දකුණට)</label>
                        <input type="text" required onChange={e => handleInputChange('boundSouth', e.target.value)} value={inputs.boundSouth || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} placeholder="Bounded by" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#B46A02', marginBottom: '2px' }}>West (බස්නාහිරට)</label>
                        <input type="text" required onChange={e => handleInputChange('boundWest', e.target.value)} value={inputs.boundWest || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} placeholder="Bounded by" />
                      </div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1.5px solid #e8d5ac' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#6A2301', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Total Extent of Land (මුළු විශාලත්වය)</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#B46A02', marginBottom: '2px' }}>Acres (අක්කර)</label>
                        <input type="number" onChange={e => handleInputChange('sizeAcres', e.target.value)} value={inputs.sizeAcres || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} placeholder="0" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#B46A02', marginBottom: '2px' }}>Roods (රූඩ්)</label>
                        <input type="number" onChange={e => handleInputChange('sizeRoods', e.target.value)} value={inputs.sizeRoods || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} placeholder="0" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#B46A02', marginBottom: '2px' }}>Perches (පර්චස්)</label>
                        <input type="number" onChange={e => handleInputChange('sizePerches', e.target.value)} value={inputs.sizePerches || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} placeholder="0" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {formStep === 3 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>03. Land Ownership &amp; Tenure Context</span>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Classification of Land ownership</label>
                    <select required onChange={e => handleInputChange('valLandType', e.target.value)} value={inputs.valLandType || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', backgroundColor: '#fff', outline: 'none' }}>
                      <option value="">-- Select Classification --</option>
                      <option value="Government (රජයේ ඉඩමකි)">Government Land (රජයේ)</option>
                      <option value="Private (පුද්ගලික ඉඩමකි)">Private Deed Land (පුද්ගලික)</option>
                      <option value="Devalagam/Temple (විහාරදේවාලගම්)">Temple Property (විහාරදේවාලගම්)</option>
                      <option value="Other">Other Tenure Classification</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Years of continuous possession</label>
                      <input type="number" required onChange={e => handleInputChange('possessionYears', e.target.value)} value={inputs.possessionYears || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Years" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Months of continuous possession</label>
                      <input type="number" required onChange={e => handleInputChange('possessionMonths', e.target.value)} value={inputs.possessionMonths || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Months" />
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#fff', border: '1.5px dashed #B46A02', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#1e1200' }}>Supporting Files (Scanned Title Deeds, Survey Plan PDF)</span>
                    <input type="file" required style={{ fontSize: '12px' }} />
                  </div>
                </>
              )}
            </>
          )}

          {/* ==========================================
              MODULE D: IDENTITY CARD APPLICATION (FORM B)
             ========================================== */}
          {form.id === 5 && (
            <>
              {/* STEP 1: DRP Metadata Headers & Name Tracing Grid */}
              {formStep === 1 && (
                <>
                  <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1.5px solid #e8d5ac', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#6A2301', textTransform: 'uppercase' }}>DRP Administrative Division Office Info</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#B46A02' }}>District</label>
                        <input type="text" disabled value={userData?.district || "Colombo"} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', backgroundColor: '#eae5d8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#B46A02' }}>D.S. Division</label>
                        <input type="text" disabled value={userData?.dsDiv || "Thimbirigasyaya"} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', backgroundColor: '#eae5d8' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#B46A02' }}>G.N. Number &amp; Division</label>
                        <input type="text" disabled value={userData?.gnDiv || "62B / Hunupitiya"} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', backgroundColor: '#eae5d8' }} />
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>01. Full Name Matrix (English Block Letters Only)</span>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Family Name / පෙළපත් නාමය</label>
                    <input type="text" required onChange={e => handleInputChange('nicFamilyName', e.target.value.toUpperCase())} value={inputs.nicFamilyName || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none', letterSpacing: '1px' }} placeholder="E.G. NAVUNGALA JAGODAGE" />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Other Names / වෙනත් නම්</label>
                    <input type="text" required onChange={e => handleInputChange('nicOtherNames', e.target.value.toUpperCase())} value={inputs.nicOtherNames || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none', letterSpacing: '1px' }} placeholder="E.G. SAMINDA JAYALAL" />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Surname / වාසගම</label>
                    <input type="text" required onChange={e => handleInputChange('nicSurname', e.target.value.toUpperCase())} value={inputs.nicSurname || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none', letterSpacing: '1px' }} placeholder="E.G. SENARATHNA" />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Preferred Name to appear on Identity Card (If modified)</label>
                    <input type="text" onChange={e => handleInputChange('nicPreferredName', e.target.value.toUpperCase())} value={inputs.nicPreferredName || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Leave blank if identical to birth logs" />
                  </div>
                </>
              )}

              {/* STEP 2: Demographics status & birth record fields */}
              {formStep === 2 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>02. Status Profile &amp; Birth Registry</span>
                  
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Date of Birth / උපන් දිනය</label>
                      <input type="date" required onChange={e => handleInputChange('nicDob', e.target.value)} value={inputs.nicDob || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Birth Certificate No. / අංකය</label>
                      <input type="text" required onChange={e => handleInputChange('nicBirthCertNo', e.target.value)} value={inputs.nicBirthCertNo || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="E.G. MAT/2004/89" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Place of Birth / උපන් ස්ථානය</label>
                      <input type="text" required onChange={e => handleInputChange('nicBirthPlace', e.target.value)} value={inputs.nicBirthPlace || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="City / Hospital Name" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Birth District / දිස්ත්‍රික්කය</label>
                      <input type="text" required onChange={e => handleInputChange('nicBirthDistrict', e.target.value)} value={inputs.nicBirthDistrict || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="E.G. Colombo" />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Profession / Occupation / රැකියාව</label>
                    <input type="text" required onChange={e => handleInputChange('nicOccupation', e.target.value)} value={inputs.nicOccupation || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="E.G. Student / Executive Officer (Verification slips must be &lt;6 months old)" />
                  </div>
                </>
              )}

              {/* STEP 3: Separated addresses & biometric photo index */}
              {formStep === 3 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>03. Permanent Residence &amp; Evidentiary Uploads</span>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Permanent Address / ස්ථිර පදිංචි ලිපිනය</label>
                    <textarea rows={2} required onChange={e => handleInputChange('nicPermAddress', e.target.value)} value={inputs.nicPermAddress || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none', resize: 'none', fontFamily: 'inherit' }} placeholder="Provide permanent house name/number registry lines" />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Postal Address / තැපැල් ලිපිනය (Cage 8.2)</label>
                    <textarea rows={2} onChange={e => handleInputChange('nicPostalAddress', e.target.value)} value={inputs.nicPostalAddress || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none', resize: 'none', fontFamily: 'inherit' }} placeholder="Fill only if separate from your permanent baseline registry" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Mobile Telephone Number</label>
                      <input type="text" required onChange={e => handleInputChange('nicMobilePhone', e.target.value)} value={inputs.nicMobilePhone || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="07XXXXXXXX" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>E-mail Address</label>
                      <input type="email" onChange={e => handleInputChange('nicEmail', e.target.value)} value={inputs.nicEmail || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="name@domain.com" />
                    </div>
                  </div>

                  {/* Standardized DRP scanning color photo upload block */}
                  <div style={{ backgroundColor: '#fff', border: '1.5px dashed #B46A02', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#1e1200' }}>Affix Color Photograph Registry (35mm x 45mm For Scanning)</span>
                    <input type="file" required style={{ fontSize: '12px' }} />
                    <span style={{ display: 'block', fontSize: '10px', color: '#666', lineHeight: 1.3 }}>
                      * Note: Photo must reflect natural facial configuration without disguise or alterations. Any incorrect detail verification is a punishable offense under DRP statutes.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#eae5d8', padding: '12px', borderRadius: '10px', marginTop: '4px' }}>
                    <input type="checkbox" required defaultChecked style={{ accentColor: '#6A2301', marginTop: '3px' }} />
                    <span style={{ fontSize: '11px', color: '#444', fontWeight: 600, lineHeight: 1.4 }}>
                      <strong>DRP Applicant Declaration:</strong> I declare that I am a citizen of Sri Lanka. I verify that all documentation and metadata arrays attached here are accurate to the best of my knowledge.
                    </span>
                  </div>
                </>
              )}
            </>
          )}

          {/* ==========================================
              MODULE E: LIVING FUNDS FOR DISABLED PERSONS (FORM ID: 6)
             ========================================== */}
          {form.id === 6 && (
            <>
              {/* STEP 1: Regional Bounds & Primary Applicant Details */}
              {formStep === 1 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 1: Administrative Region (Header Info)</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>District</label>
                      <input type="text" required onChange={e => handleInputChange('lawDistrict', e.target.value)} value={inputs.lawDistrict || userData?.district || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. Colombo" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Divisional Secretariat (D.S. Office)</label>
                      <input type="text" required onChange={e => handleInputChange('lawDsOffice', e.target.value)} value={inputs.lawDsOffice || userData?.dsDiv || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. Thimbirigasyaya" />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Grama Niladhari (G.N.) Division</label>
                    <input type="text" required onChange={e => handleInputChange('lawGnDivision', e.target.value)} value={inputs.lawGnDivision || userData?.gnDiv || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. Hunupitiya (62B)" />
                  </div>

                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingTop: '10px', paddingBottom: '4px' }}>Step 2: Applicant Information</span>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Full Name</label>
                    <input type="text" required onChange={e => handleInputChange('lawFullName', e.target.value)} value={inputs.lawFullName || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Enter Applicant's Full Name" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Nature of Disability</label>
                      <input type="text" required onChange={e => handleInputChange('lawDisabilityNature', e.target.value)} value={inputs.lawDisabilityNature || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Specify functional condition" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Cause of Disability (Dynamic Selection)</label>
                      <select required onChange={e => handleInputChange('lawDisabilityCause', e.target.value)} value={inputs.lawDisabilityCause || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', backgroundColor: '#fff', outline: 'none' }}>
                        <option value="">-- Select Cause --</option>
                        <option value="By Birth">By Birth</option>
                        <option value="Accident">Accident</option>
                        <option value="Other">Other (Please specify)</option>
                      </select>
                    </div>
                  </div>

                  {inputs.lawDisabilityCause === 'Accident' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Year of Accident</label>
                      <input type="number" required onChange={e => handleInputChange('lawAccidentYear', e.target.value)} value={inputs.lawAccidentYear || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. 2025" />
                    </div>
                  )}

                  {inputs.lawDisabilityCause === 'Other' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Specify Other Cause</label>
                      <input type="text" required onChange={e => handleInputChange('lawOtherCauseDetails', e.target.value)} value={inputs.lawOtherCauseDetails || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Describe cause matrix details" />
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Vocational Training or Educational Status</label>
                    <input type="text" required onChange={e => handleInputChange('lawVocationalOrEducation', e.target.value)} value={inputs.lawVocationalOrEducation || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="State highest qualification or training details" />
                  </div>
                </>
              )}

              {/* STEP 2: Trilingual Family Demographics Arrays */}
              {formStep === 2 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 5: Household &amp; Family Details</span>
                  
                  {/* Table A Array */}
                  <p style={{ margin: '6px 0 0 0', fontSize: '12px', fontWeight: 800, color: '#3d2a00' }}>👥 Table A: Family Members with Disabilities</p>
                  {disabledMembers.map((member, idx) => (
                    <div key={`law-disabled-${idx}`} style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '10px', border: '1.5px solid #e8d5ac', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                        <input type="text" required placeholder="Full Name" value={member.name} onChange={e => {
                          const updated = [...disabledMembers]; updated[idx].name = e.target.value; setDisabledMembers(updated);
                        }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} />
                        <input type="text" required placeholder="Relationship to Head" value={member.relation} onChange={e => {
                          const updated = [...disabledMembers]; updated[idx].relation = e.target.value; setDisabledMembers(updated);
                        }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        <select required value={member.gender} onChange={e => {
                          const updated = [...disabledMembers]; updated[idx].gender = e.target.value; setDisabledMembers(updated);
                        }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none', backgroundColor: '#fff' }}>
                          <option value="">Gender</option><option value="Male">Male</option><option value="Female">Female</option>
                        </select>
                        <select required value={member.civilStatus} onChange={e => {
                          const updated = [...disabledMembers]; updated[idx].civilStatus = e.target.value; setDisabledMembers(updated);
                        }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none', backgroundColor: '#fff' }}>
                          <option value="">Marital Status</option><option value="Unmarried">Unmarried</option><option value="Married">Married</option>
                        </select>
                        <input type="date" required value={member.dob} onChange={e => {
                          const updated = [...disabledMembers]; updated[idx].dob = e.target.value; setDisabledMembers(updated);
                        }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <input type="text" required placeholder="National Identity Card (NIC) Number" value={member.nic} onChange={e => {
                          const updated = [...disabledMembers]; updated[idx].nic = e.target.value; setDisabledMembers(updated);
                        }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} />
                        <input type="text" required placeholder="Nature of Disability" value={member.nature} onChange={e => {
                          const updated = [...disabledMembers]; updated[idx].nature = e.target.value; setDisabledMembers(updated);
                        }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setDisabledMembers([...disabledMembers, { name: '', relation: '', gender: '', civilStatus: '', dob: '', nic: '', nature: '' }])} style={{ alignSelf: 'flex-start', padding: '6px 14px', borderRadius: '6px', border: '1px solid #6A2301', color: '#6A2301', backgroundColor: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 700, marginBottom: '8px' }}>+ Add Disabled Household Member</button>

                  {/* Table B Array */}
                  <p style={{ margin: '6px 0 0 0', fontSize: '12px', fontWeight: 800, color: '#3d2a00' }}>👥 Table B: Other Family Members</p>
                  {otherMembers.map((member, idx) => (
                    <div key={`law-other-${idx}`} style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '10px', border: '1.5px solid #e8d5ac', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                        <input type="text" required placeholder="Full Name" value={member.name} onChange={e => {
                          const updated = [...otherMembers]; updated[idx].name = e.target.value; setOtherMembers(updated);
                        }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} />
                        <input type="text" required placeholder="Relationship to Head" value={member.relation} onChange={e => {
                          const updated = [...otherMembers]; updated[idx].relation = e.target.value; setOtherMembers(updated);
                        }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        <select required value={member.gender} onChange={e => {
                          const updated = [...otherMembers]; updated[idx].gender = e.target.value; setOtherMembers(updated);
                        }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none', backgroundColor: '#fff' }}>
                          <option value="">Gender</option><option value="Male">Male</option><option value="Female">Female</option>
                        </select>
                        <select required value={member.civilStatus} onChange={e => {
                          const updated = [...otherMembers]; updated[idx].civilStatus = e.target.value; setOtherMembers(updated);
                        }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none', backgroundColor: '#fff' }}>
                          <option value="">Marital Status</option><option value="Unmarried">Unmarried</option><option value="Married">Married</option>
                        </select>
                        <input type="date" required value={member.dob} onChange={e => {
                          const updated = [...otherMembers]; updated[idx].dob = e.target.value; setOtherMembers(updated);
                        }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <input type="text" required placeholder="National Identity Card (NIC) Number" value={member.nic} onChange={e => {
                          const updated = [...otherMembers]; updated[idx].nic = e.target.value; setOtherMembers(updated);
                        }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} />
                        <input type="text" required placeholder="Monthly Income Source &amp; Amount" value={member.incomeSourceAmt} onChange={e => {
                          const updated = [...otherMembers]; updated[idx].incomeSourceAmt = e.target.value; setOtherMembers(updated);
                        }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setOtherMembers([...otherMembers, { name: '', relation: '', gender: '', civilStatus: '', dob: '', nic: '', incomeSourceAmt: '' }])} style={{ alignSelf: 'flex-start', padding: '6px 14px', borderRadius: '6px', border: '1px solid #6A2301', color: '#6A2301', backgroundColor: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>+ Add General Family Member</button>
                </>
              )}

              {/* STEP 3: Financial Aid Indexes & Bank Transfer Routings */}
              {formStep === 3 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 3: Bank Account Details (For Direct Benefit Transfer)</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Applicant's Bank Account Number</label>
                      <input type="text" required onChange={e => handleInputChange('lawBankAccountNo', e.target.value)} value={inputs.lawBankAccountNo || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Enter Account Number" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Bank Name and Branch</label>
                      <input type="text" required onChange={e => handleInputChange('lawBankNameBranch', e.target.value)} value={inputs.lawBankNameBranch || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. Peoples Bank, Kandy" />
                    </div>
                  </div>

                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingTop: '10px', paddingBottom: '4px' }}>Step 4: Existing Financial Assistance</span>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Details of Assistance Currently Received (From State or NGOs in cash or goods)</label>
                    <textarea rows={2} required onChange={e => handleInputChange('lawAssistanceDetails', e.target.value)} value={inputs.lawAssistanceDetails || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none', resize: 'none', fontFamily: 'inherit' }} placeholder="Describe current cash or material assistance streams received..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Current Monthly Income / Value of Assistance (LKR)</label>
                    <input type="number" required onChange={e => handleInputChange('lawAssistanceValue', e.target.value)} value={inputs.lawAssistanceValue || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="0.00" />
                  </div>
                </>
              )}

              {/* STEP 4: Official Audit Logs & Document Verification Pipeline */}
              {formStep === 4 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>🛠️ Back-End &amp; Official Verification Sections</span>
                  
                  {/* Section C Doc Upload */}
                  <div style={{ backgroundColor: '#fff', border: '1.5px dashed #B46A02', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#6A2301' }}>🩺 Section C: Medical Officer Certification</span>
                    <label style={{ display: 'block', fontSize: '11px', color: '#555' }}>Upload Certified Medical Report / Section C (Filled by Government Hospital Doctor with Patient Name, Disability Nature, Recommendation &amp; Official Stamp)</label>
                    <input type="file" required style={{ fontSize: '12px', marginTop: '4px' }} />
                  </div>

                  {/* Section D Preview Logs */}
                  <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1.5px solid #e8d5ac', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#6A2301' }}>🔍 Section D: Grama Niladhari (G.N.) Recommendation Outline</span>
                    <span style={{ fontSize: '11px', color: '#666', lineHeight: 1.4 }}>
                      The assigned G.N. official will verify your <strong>Total Monthly Family Income</strong>, check if you are engaged in a <strong>Livelihood</strong> (and record livelihood income), and sign the official mandate matching the low-income evaluation rules.
                    </span>
                  </div>

                  {/* Section E Checklist Preview */}
                  <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1.5px solid #e8d5ac', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#6A2301' }}>📋 Section E: Social Services / Development Officer Verification Checklist Preview</span>
                    <span style={{ fontSize: '11px', color: '#666', lineHeight: 1.4 }}>
                      Officers will physically cross-examine medical registries mapping to clinical checklists: <em>Totally Blind, Spinal Cord Injured, Cerebral Palsy, Completely Hearing and Speech Impaired, Loss of Limbs, Autism, Intellectual Disability, Multiple Disabilities, or Severe Epilepsy</em> and log the use of any assistive devices.
                    </span>
                  </div>

                  {/* Section F Preview */}
                  <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1.5px solid #e8d5ac', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#6A2301' }}>🏛️ Section F: Divisional Secretary's Approval Info</span>
                    <span style={{ fontSize: '11px', color: '#666', lineHeight: 1.4 }}>
                      Final approval processing pipeline structure to authorize or reject the monthly allowance payments starting from the certified statutory operational date.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#eae5d8', padding: '12px', borderRadius: '10px', marginTop: '4px' }}>
                    <input type="checkbox" required style={{ accentColor: '#6A2301', marginTop: '3px' }} />
                    <span style={{ fontSize: '11px', color: '#444', fontWeight: 600, lineHeight: 1.4 }}>
                      <strong>Submission Affirmation:</strong> I certify that all family profiles and account transfer configurations uploaded here are true. I understand these entries will trigger verification cycles across D.S. and G.N. operational networks.
                    </span>
                  </div>
                </>
              )}
            </>
          )}

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
              {((form.id === 3 && formStep === 4) || (form.id === 6 && formStep === 4) || (form.id !== 3 && form.id !== 6 && formStep === 3)) ? 'Submit Application' : 'Next Step →'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Forms;