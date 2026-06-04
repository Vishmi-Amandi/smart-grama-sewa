import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase'; 
import { useTranslation } from 'react-i18next'; 

// --- Icons & Styles ---
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
  plus: 'M12 5v14M5 12h14',
  trash: 'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2 2H5a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
};

const S = {
  page: { height: '100vh', display: 'flex', overflow: 'hidden', fontFamily: 'Nunito, sans-serif', backgroundColor: '#f5f0e8' },
  sidebar: { width: '240px', backgroundColor: '#F5C400', display: 'flex', flexDirection: 'column', height: '100vh' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' },
  topbar: { height: '64px', backgroundColor: '#fff', borderBottom: '1px solid #e8d8b0', display: 'flex', alignItems: 'center', padding: '0 28px', flexShrink: 0 },
  scrollArea: { flex: 1, overflowY: 'auto', padding: '28px 32px' },
  card: { backgroundColor: '#fff', border: '1.5px solid #e8d5ac', borderRadius: '16px', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' },
  footer: { backgroundColor: '#6A2301', color: '#fff', textAlign: 'center', padding: '13px', fontSize: '12px' },
  errorMsg: { color: '#d32f2f', fontSize: '11px', fontWeight: 'bold', marginTop: '4px', display: 'block' },
  th: { backgroundColor: '#6A2301', color: '#fff', padding: '10px', fontSize: '12px', fontWeight: 'bold', textAlign: 'left' }
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
  const changeLanguage = (lngCode) => { i18n.changeLanguage(lngCode); };

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
      {/* Sidebar */}
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

      {/* Main Content Area */}
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

        <div style={S.scrollArea}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1e1200' }}>{t('nav_forms')}</h1>
          </div>

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
                  onClick={() => { setSelectedForm(form); setFormInputs({}); setErrors({}); setTableA([]); setTableB([]); setFormStep(1); }}
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

// --- Multi-Step Dynamic Engine Component (Supports Form IDs 1 to 6) ---
const DynamicFormModal = ({ form, onClose, inputs, setInputs, currentUser, userData, db }) => {
  if (!form) return null;

  const [formStep, setFormStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [hasJobIncome, setHasJobIncome] = useState(false);
  const [hasPropertyIncome, setHasPropertyIncome] = useState(false);
  const [hasBusinessIncome, setHasBusinessIncome] = useState(false);
  const [isReliefRecipient, setIsReliefRecipient] = useState(false);
  const [isDuplicateRequest, setIsDuplicateRequest] = useState(false);
  const [isDeviceUser, setIsDeviceUser] = useState(false);

  // Form 6 Aggregation Dynamic Arrays
  const [tableA, setTableA] = useState([]);
  const [tableB, setTableB] = useState([]);

  const empAmt = Number(inputs.summaryEmployment) || 0;
  const landAmt = Number(inputs.summaryLand) || 0;
  const bizAmt = Number(inputs.summaryBusiness) || 0;
  const otherAmt = Number(inputs.summaryOther) || 0;
  const totalCalculatedIncome = empAmt + landAmt + bizAmt + otherAmt;

  // Strict local logic validation rule engine
  const validateValue = (key, val) => {
    let msg = '';
    const label = key.toLowerCase();

    // Rule 1: Phone numbers must contain exactly 10 digits
    if (label.includes('phone') || label.includes('mobile') || label.includes('tele')) {
      if (val && !/^\d{10}$/.test(val)) {
        msg = 'Phone number must be exactly 10 digits.';
      }
    }

    // Rule 2: National Identity Card format checks (12 numbers or legacy 9 digits + trailing V letter)
    if (label.includes('nic') || label.includes('identity')) {
      if (val && !/^(\d{12}|\d{9}[vV])$/.test(val)) {
        msg = 'NIC must be 12 numbers or 9 numbers followed by a V.';
      }
    }

    setErrors(prev => ({ ...prev, [key]: msg }));
    return msg === '';
  };

  const handleInputChange = (field, val) => {
    setInputs(prev => ({ ...prev, [field]: val }));
    validateValue(field, val);
  };

  const handleTableRowChange = (tableType, index, field, val) => {
    if (tableType === 'A') {
      const updated = [...tableA];
      updated[index][field] = val;
      setTableA(updated);
      validateValue(`tableA_${index}_${field}`, val);
    } else {
      const updated = [...tableB];
      updated[index][field] = val;
      setTableB(updated);
      validateValue(`tableB_${index}_${field}`, val);
    }
  };

  const handleAddRow = (tableType) => {
    if (tableType === 'A') {
      setTableA([...tableA, { fullName: '', relationship: '', gender: '', maritalStatus: '', dob: '', nic: '', natureOfDisability: '' }]);
    } else {
      setTableB([...tableB, { fullName: '', relationship: '', gender: '', maritalStatus: '', dob: '', nic: '', incomeSourceAmount: '' }]);
    }
  };

  const handleRemoveRow = (tableType, index) => {
    if (tableType === 'A') {
      setTableA(tableA.filter((_, i) => i !== index));
      setErrors(prev => { const n = { ...prev }; delete n[`tableA_${index}_nic`]; return n; });
    } else {
      setTableB(tableB.filter((_, i) => i !== index));
      setErrors(prev => { const n = { ...prev }; delete n[`tableB_${index}_nic`]; return n; });
    }
  };

  const stepFieldsHaveErrors = () => {
    let hasErr = false;
    Object.keys(errors).forEach(k => {
      if (errors[k] && errors[k] !== '') hasErr = true;
    });
    return hasErr;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (stepFieldsHaveErrors()) {
      alert('Please correct the validation errors highlighted in red before proceeding.');
      return;
    }

    let maxSteps = 1;
    if (form.id === 1 || form.id === 2) maxSteps = 3; 
    if (form.id === 3) maxSteps = 4;                 
    if (form.id === 4) maxSteps = 3;                 
    if (form.id === 5) maxSteps = 4; 
    if (form.id === 6) maxSteps = 4; // Configured to 4 steps following the structured layout timeline

    if (formStep < maxSteps) {
      setFormStep(prev => prev + 1);
    } else {
      const finalPayload = {
        ...inputs,
        formId: form.id,
        title: form.title,
        ...(form.id === 3 && { totalAnnualIncome: totalCalculatedIncome }),
        ...(form.id === 6 && { disabledFamilyMembers: tableA, otherHouseholdMembers: tableB })
      };
      alert(`Backend Submission Triggered for: ${form.title}\nData: ${JSON.stringify(finalPayload)}`);
      onClose();
      setFormStep(1);
      setTableA([]);
      setTableB([]);
    }
  };

  const isResidenceOrCharacter = form.id === 1 || form.id === 2;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 101, width: '100%', maxWidth: form.id === 6 ? '780px' : '650px', maxHeight: '90vh', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ backgroundColor: '#6A2301', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{form.title}</h3>
            <p style={{ margin: 0, fontSize: '11px', color: '#f0e4cc' }}>Official Verification Portal</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer', fontWeight: 700 }}>×</button>
        </div>

        {/* Form Indicator Steppers */}
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

        {form.id === 6 && (
          <div style={{ display: 'flex', backgroundColor: '#f0e8d5', padding: '10px 20px', gap: '8px', borderBottom: '1px solid #e8d5ac', fontSize: '11px', fontWeight: 700, color: '#5a3a00', overflowX: 'auto', flexShrink: 0 }}>
            <span style={{ color: formStep === 1 ? '#6A2301' : '#888' }}>1. Region &amp; Personal Info</span> &gt;
            <span style={{ color: formStep === 2 ? '#6A2301' : '#888' }}>2. Bank, Income &amp; Aid Details</span> &gt;
            <span style={{ color: formStep === 3 ? '#6A2301' : '#888' }}>3. Household Family Composition</span> &gt;
            <span style={{ color: formStep === 4 ? '#6A2301' : '#888' }}>4. Medical Records &amp; Official Certifications</span>
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
                      <input type="text" required onChange={e => handleInputChange('nicNumber', e.target.value)} value={inputs.nicNumber || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: errors.nicNumber ? '1.5px solid red' : '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="NIC Number" />
                      {errors.nicNumber && <span style={S.errorMsg}>{errors.nicNumber}</span>}
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
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#6A2301', textTransform: 'uppercase', marginBottom: '4px' }}>Purpose for which the certificate is required</label>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>NIC Number</label>
                      <input type="text" required onChange={e => handleInputChange('incNic', e.target.value)} value={inputs.incNic || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: errors.incNic ? '1.5px solid red' : '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="NIC Number" />
                      {errors.incNic && <span style={S.errorMsg}>{errors.incNic}</span>}
                    </div>
                  </div>
                </>
              )}
              {/* Other inner conditional steps default fallback handling maps cleanly */}
              {formStep > 1 && <span style={{ fontSize: '13px' }}>Income configuration dashboard track active.</span>}
            </>
          )}

          {/* ==========================================
              MODULE C: VALUATION CERTIFICATE SUBMISSION
             ========================================== */}
          {form.id === 4 && (
            <>
              <span style={{ fontSize: '13px' }}>Property Title Valuation Form Module Active. Step: {formStep}</span>
            </>
          )}

          {/* ==========================================
              MODULE D: IDENTITY CARD APPLICATION (FORM B)
             ========================================== */}
          {form.id === 5 && (
            <>
              {formStep === 1 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>01. Full Name Matrix (English Block Letters Only)</span>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Surname</label>
                    <input type="text" required onChange={e => handleInputChange('nicSurname', e.target.value.toUpperCase())} value={inputs.nicSurname || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none', letterSpacing: '1px' }} placeholder="E.G. SENARATHNA" />
                  </div>
                </>
              )}
              {formStep === 3 && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', color: '#B46A02', fontWeight: 700 }}>Mobile Number</label>
                    <input type="text" required onChange={e => handleInputChange('nicMobileNo', e.target.value)} value={inputs.nicMobileNo || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: errors.nicMobileNo ? '1.5px solid red' : '1.5px solid #e8d5ac', outline: 'none' }} placeholder="07XXXXXXXX" />
                    {errors.nicMobileNo && <span style={S.errorMsg}>{errors.nicMobileNo}</span>}
                  </div>
                </>
              )}
              {formStep !== 1 && formStep !== 3 && <span style={{ fontSize: '13px' }}>Identity tracking validation steps profile active.</span>}
            </>
          )}

          {/* ==========================================
              MODULE E: RECONSTRUCTED ALLOWANCE FOR PERSONS WITH DISABILITIES
             ========================================== */}
          {form.id === 6 && (
            <>
              {/* STEP 1: Administrative Header Region & Personal Base Details */}
              {formStep === 1 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 1: Administrative Region (Header Info)</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>District</label>
                      <input type="text" required onChange={e => handleInputChange('district', e.target.value)} value={inputs.district || userData?.district || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} placeholder="District" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Divisional Secretariat (D.S. Office)</label>
                      <input type="text" required onChange={e => handleInputChange('dsOffice', e.target.value)} value={inputs.dsOffice || userData?.dsDiv || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} placeholder="D.S. Office" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Grama Niladhari (G.N.) Division</label>
                      <input type="text" required onChange={e => handleInputChange('gnDivision', e.target.value)} value={inputs.gnDivision || userData?.gnDiv || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} placeholder="G.N. Division" />
                    </div>
                  </div>

                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingTop: '8px', paddingBottom: '4px' }}>Step 2: Applicant Information</span>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Full Name</label>
                    <input type="text" required onChange={e => handleInputChange('applicantFullName', e.target.value)} value={inputs.applicantFullName || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} placeholder="Enter Full Name" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Nature of Disability</label>
                      <input type="text" required onChange={e => handleInputChange('natureOfDisability', e.target.value)} value={inputs.natureOfDisability || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} placeholder="E.g. Blindness, Amputation" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Cause of Disability</label>
                      <select required onChange={e => handleInputChange('causeOfDisability', e.target.value)} value={inputs.causeOfDisability || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', backgroundColor: '#fff' }}>
                        <option value="">-- Select Cause --</option>
                        <option value="By Birth">By Birth</option>
                        <option value="Accident">Accident</option>
                        <option value="Other">Other (Please specify)</option>
                      </select>
                    </div>
                  </div>

                  {/* Dynamic Selection Conditional Inputs Rendering */}
                  {inputs.causeOfDisability === 'Accident' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Year of Accident</label>
                      <input type="number" required onChange={e => handleInputChange('yearOfAccident', e.target.value)} value={inputs.yearOfAccident || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} placeholder="Enter Year (e.g. 2023)" />
                    </div>
                  )}

                  {inputs.causeOfDisability === 'Other' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Please specify cause description</label>
                      <input type="text" required onChange={e => handleInputChange('customCauseDescription', e.target.value)} value={inputs.customCauseDescription || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} placeholder="Specify health conditions" />
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Vocational Training or Educational Status</label>
                    <input type="text" required onChange={e => handleInputChange('vocationalOrEducationStatus', e.target.value)} value={inputs.vocationalOrEducationStatus || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} placeholder="State training records or school level" />
                  </div>
                </>
              )}

              {/* STEP 2: Banking Coordinates & Existing Financial Aid Influx */}
              {formStep === 2 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 3: Bank Account Details (For Direct Benefit Transfer)</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Applicant's Bank Account Number</label>
                      <input type="text" required onChange={e => handleInputChange('bankAccountNumber', e.target.value)} value={inputs.bankAccountNumber || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} placeholder="Account Number" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Bank Name and Branch</label>
                      <input type="text" required onChange={e => handleInputChange('bankNameBranch', e.target.value)} value={inputs.bankNameBranch || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} placeholder="E.g. Bank of Ceylon, Kaduwela" />
                    </div>
                  </div>

                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingTop: '8px', paddingBottom: '4px' }}>Step 4: Existing Financial Assistance</span>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Details of Assistance Currently Received (From State or NGOs in cash or goods)</label>
                    <textarea rows={2} required onChange={e => handleInputChange('existingAssistanceDetails', e.target.value)} value={inputs.existingAssistanceDetails || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', outline: 'none', resize: 'none', fontFamily: 'inherit' }} placeholder="Describe any public grants or goods received monthly..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Current Monthly Income / Value of Assistance (LKR)</label>
                    <input type="number" required onChange={e => handleInputChange('monthlyIncomeOrAssistanceValue', e.target.value)} value={inputs.monthlyIncomeOrAssistanceValue || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} placeholder="LKR" />
                  </div>
                </>
              )}

              {/* STEP 3: Multi-Tabular Family Breakdown Registries */}
              {formStep === 3 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 5: Household &amp; Family Details</span>
                  
                  {/* INTERACTIVE COMPONENT: TABLE A (DISABLED UNIT DEPENDENTS) */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#6A2301' }}>Table A: Family Members with Disabilities</span>
                      <button type="button" onClick={() => handleAddRow('A')} style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#6A2301', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                        <Icon d={IC.plus} size={12} /> Add Row
                      </button>
                    </div>
                    
                    <div style={{ overflowX: 'auto', border: '1.5px solid #e8d5ac', borderRadius: '8px', backgroundColor: '#fff' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
                        <thead>
                          <tr>
                            <th style={S.th}>Full Name</th>
                            <th style={S.th}>Relationship</th>
                            <th style={S.th}>Gender</th>
                            <th style={S.th}>Marital Status</th>
                            <th style={S.th}>Date of Birth</th>
                            <th style={S.th}>NIC Number</th>
                            <th style={S.th}>Nature of Disability</th>
                            <th style={{ ...S.th, width: '40px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableA.map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f5f0e8' }}>
                              <td style={{ padding: '4px' }}><input type="text" required value={row.fullName} onChange={e => handleTableRowChange('A', idx, 'fullName', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e8d5ac', fontSize: '12px' }} /></td>
                              <td style={{ padding: '4px' }}><input type="text" required value={row.relationship} onChange={e => handleTableRowChange('A', idx, 'relationship', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e8d5ac', fontSize: '12px' }} /></td>
                              <td style={{ padding: '4px' }}>
                                <select value={row.gender} onChange={e => handleTableRowChange('A', idx, 'gender', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e8d5ac', fontSize: '12px' }}>
                                  <option value="">--</option><option value="Male">Male</option><option value="Female">Female</option>
                                </select>
                              </td>
                              <td style={{ padding: '4px' }}>
                                <select value={row.maritalStatus} onChange={e => handleTableRowChange('A', idx, 'maritalStatus', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e8d5ac', fontSize: '12px' }}>
                                  <option value="">--</option><option value="Unmarried">Unmarried</option><option value="Married">Married</option>
                                </select>
                              </td>
                              <td style={{ padding: '4px' }}><input type="date" required value={row.dob} onChange={e => handleTableRowChange('A', idx, 'dob', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e8d5ac', fontSize: '12px' }} /></td>
                              <td style={{ padding: '4px' }}>
                                <input type="text" required value={row.nic} onChange={e => handleTableRowChange('A', idx, 'nic', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: errors[`tableA_${idx}_nic`] ? '1px solid red' : '1px solid #e8d5ac', fontSize: '12px' }} />
                                {errors[`tableA_${idx}_nic`] && <span style={{ color: 'red', fontSize: '9px', display: 'block' }}>Format Error</span>}
                              </td>
                              <td style={{ padding: '4px' }}><input type="text" required value={row.natureOfDisability} onChange={e => handleTableRowChange('A', idx, 'natureOfDisability', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e8d5ac', fontSize: '12px' }} /></td>
                              <td style={{ padding: '4px', textAlign: 'center' }}><button type="button" onClick={() => handleRemoveRow('A', idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f' }}><Icon d={IC.trash} size={14} /></button></td>
                            </tr>
                          ))}
                          {tableA.length === 0 && <tr><td colSpan={8} style={{ padding: '12px', textAlign: 'center', color: '#888', fontSize: '12px', fontStyle: 'italic' }}>No family members with disabilities reported under Table A.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* INTERACTIVE COMPONENT: TABLE B (OTHER COMPOSITION HOUSEHOLD DEPENDENTS) */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#6A2301' }}>Table B: Other Family Members</span>
                      <button type="button" onClick={() => handleAddRow('B')} style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#6A2301', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                        <Icon d={IC.plus} size={12} /> Add Row
                      </button>
                    </div>
                    
                    <div style={{ overflowX: 'auto', border: '1.5px solid #e8d5ac', borderRadius: '8px', backgroundColor: '#fff' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
                        <thead>
                          <tr>
                            <th style={S.th}>Full Name</th>
                            <th style={S.th}>Relationship</th>
                            <th style={S.th}>Gender</th>
                            <th style={S.th}>Marital Status</th>
                            <th style={S.th}>Date of Birth</th>
                            <th style={S.th}>NIC Number</th>
                            <th style={S.th}>Monthly Income Source &amp; Amount</th>
                            <th style={{ ...S.th, width: '40px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableB.map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f5f0e8' }}>
                              <td style={{ padding: '4px' }}><input type="text" required value={row.fullName} onChange={e => handleTableRowChange('B', idx, 'fullName', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e8d5ac', fontSize: '12px' }} /></td>
                              <td style={{ padding: '4px' }}><input type="text" required value={row.relationship} onChange={e => handleTableRowChange('B', idx, 'relationship', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e8d5ac', fontSize: '12px' }} /></td>
                              <td style={{ padding: '4px' }}>
                                <select value={row.gender} onChange={e => handleTableRowChange('B', idx, 'gender', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e8d5ac', fontSize: '12px' }}>
                                  <option value="">--</option><option value="Male">Male</option><option value="Female">Female</option>
                                </select>
                              </td>
                              <td style={{ padding: '4px' }}>
                                <select value={row.maritalStatus} onChange={e => handleTableRowChange('B', idx, 'maritalStatus', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e8d5ac', fontSize: '12px' }}>
                                  <option value="">--</option><option value="Unmarried">Unmarried</option><option value="Married">Married</option>
                                </select>
                              </td>
                              <td style={{ padding: '4px' }}><input type="date" required value={row.dob} onChange={e => handleTableRowChange('B', idx, 'dob', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e8d5ac', fontSize: '12px' }} /></td>
                              <td style={{ padding: '4px' }}>
                                <input type="text" required value={row.nic} onChange={e => handleTableRowChange('B', idx, 'nic', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: errors[`tableB_${idx}_nic`] ? '1px solid red' : '1px solid #e8d5ac', fontSize: '12px' }} />
                                {errors[`tableB_${idx}_nic`] && <span style={{ color: 'red', fontSize: '9px', display: 'block' }}>Format Error</span>}
                              </td>
                              <td style={{ padding: '4px' }}><input type="text" required value={row.incomeSourceAmount} onChange={e => handleTableRowChange('B', idx, 'incomeSourceAmount', e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e8d5ac', fontSize: '12px' }} placeholder="E.g. Business - Rs. 45,000" /></td>
                              <td style={{ padding: '4px', textAlign: 'center' }}><button type="button" onClick={() => handleRemoveRow('B', idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f' }}><Icon d={IC.trash} size={14} /></button></td>
                            </tr>
                          ))}
                          {tableB.length === 0 && <tr><td colSpan={8} style={{ padding: '12px', textAlign: 'center', color: '#888', fontSize: '12px', fontStyle: 'italic' }}>No other household family dependents reported under Table B.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* STEP 4: Restricted Administrative Certifications & Checklist Assents */}
              {formStep === 4 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>🛠️ Back-End &amp; Official Verification Sections</span>
                  <p style={{ margin: 0, fontSize: '12px', color: '#666', fontWeight: 600 }}>Note: These segments are preserved as document audit uploads for standard applicants or authorized officer view profiles.</p>

                  <div style={{ backgroundColor: '#fff', border: '1.5px dashed #B46A02', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#1e1200' }}>🩺 Section C: Medical Officer Certification</span>
                    <span style={{ fontSize: '11px', color: '#555' }}>Attach the certification containing Patient Name, Doctor Recommendations, and Hospital Stamps.</span>
                    <input type="file" required style={{ fontSize: '12px', marginTop: '4px' }} />
                  </div>

                  <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1.5px solid #e8d5ac', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#6A2301' }}>🔍 Section D: Grama Niladhari (G.N.) Recommendation</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#B46A02' }}>Total Monthly Family Income</label>
                        <input type="number" required onChange={e => handleInputChange('gnTotalFamilyIncome', e.target.value)} value={inputs.gnTotalFamilyIncome || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac' }} placeholder="Rs. 0.00" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#B46A02' }}>Is applicant engaged in a livelihood?</label>
                        <select required onChange={e => handleInputChange('gnLivelihoodEngagement', e.target.value)} value={inputs.gnLivelihoodEngagement || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', backgroundColor: '#fff' }}>
                          <option value="">-- Select --</option><option value="Yes">Yes</option><option value="No">No</option>
                        </select>
                      </div>
                    </div>
                    {inputs.gnLivelihoodEngagement === 'Yes' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#B46A02' }}>Livelihood Monthly Income</label>
                        <input type="number" required onChange={e => handleInputChange('gnLivelihoodIncome', e.target.value)} value={inputs.gnLivelihoodIncome || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac' }} placeholder="Rs. 0.00" />
                      </div>
                    )}
                  </div>

                  <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1.5px solid #e8d5ac', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#6A2301' }}>📋 Section E: Social Services / Development Officer Verification</span>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#B46A02' }}>Disability Verification Checklist:</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', fontWeight: 700 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={inputs.dis_blind || false} onChange={e => handleInputChange('dis_blind', e.target.checked)} /> Totally Blind</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={inputs.dis_spinal || false} onChange={e => handleInputChange('dis_spinal', e.target.checked)} /> Spinal Cord Injured</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={inputs.dis_cerebral || false} onChange={e => handleInputChange('dis_cerebral', e.target.checked)} /> Cerebral Palsy</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={inputs.dis_deaf_mute || false} onChange={e => handleInputChange('dis_deaf_mute', e.target.checked)} /> Completely Hearing/Speech Impaired</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={inputs.dis_limbs || false} onChange={e => handleInputChange('dis_limbs', e.target.checked)} /> Loss of Limbs</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={inputs.dis_autism || false} onChange={e => handleInputChange('dis_autism', e.target.checked)} /> Autism</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={inputs.dis_intellectual || false} onChange={e => handleInputChange('dis_intellectual', e.target.checked)} /> Intellectual Disability</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={inputs.dis_multiple || false} onChange={e => handleInputChange('dis_multiple', e.target.checked)} /> Multiple Disabilities</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={inputs.dis_epilepsy || false} onChange={e => handleInputChange('dis_epilepsy', e.target.checked)} /> Severe Epilepsy</label>
                    </div>
                    <div style={{ marginTop: '6px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#B46A02' }}>Does applicant use any assistive devices/equipment?</label>
                      <input type="text" onChange={e => handleInputChange('dfAssistiveEquipmentUsed', e.target.value)} value={inputs.dfAssistiveEquipmentUsed || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac' }} placeholder="E.g. Wheelchair, Crutches model..." />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#eae5d8', padding: '12px', borderRadius: '10px' }}>
                    <input type="checkbox" required defaultChecked style={{ accentColor: '#6A2301', marginTop: '3px' }} />
                    <span style={{ fontSize: '11px', color: '#444', fontWeight: 600, lineHeight: 1.4 }}>
                      I certify that all dynamic entries provided across Step 1 to Step 4 are valid. I assent to Section F Divisional Secretariat final validation rules for allowance distribution.
                    </span>
                  </div>
                </>
              )}
            </>
          )}

          {/* Action Control Interface Buttons Tray */}
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
              {((form.id === 3 && formStep === 4) || (form.id === 5 && formStep === 4) || (form.id === 6 && formStep === 4) || ((form.id === 1 || form.id === 2 || form.id === 4) && formStep === 3)) ? 'Submit Application' : 'Next Step →'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Forms;