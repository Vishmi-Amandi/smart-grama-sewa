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
  trash: 'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2H5a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
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
                  onClick={() => { setSelectedForm(form); setFormInputs({}); setErrors({}); setTableA([]); setTableB([]); setVoterAdditions([]); setVoterDeletions([]); setVoterPurpose(''); setFormStep(1); }}
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

// --- Multi-Step Dynamic Engine Component (Supports Form IDs 1 to 7) ---
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

  // Form 7 Dynamic Worksheets State Hooks
  const [voterPurpose, setVoterPurpose] = useState(''); // Holds 'YC' or 'ER'
  const [voterAdditions, setVoterAdditions] = useState([]);
  const [voterDeletions, setVoterDeletions] = useState([]);

  const empAmt = Number(inputs.summaryEmployment) || 0;
  const landAmt = Number(inputs.summaryLand) || 0;
  const bizAmt = Number(inputs.summaryBusiness) || 0;
  const otherAmt = Number(inputs.summaryOther) || 0;
  const totalCalculatedIncome = empAmt + landAmt + bizAmt + otherAmt;

  const validateValue = (key, val) => {
    let msg = '';
    const label = key.toLowerCase();

    // Rule 1: Phone numbers must contain exactly 10 digits
    if (label.includes('phone') || label.includes('mobile') || label.includes('tele') || label.includes('whatsapp')) {
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
    } else if (tableType === 'B') {
      const updated = [...tableB];
      updated[index][field] = val;
      setTableB(updated);
      validateValue(`tableB_${index}_${field}`, val);
    } else if (tableType === 'voterAdd') {
      const updated = [...voterAdditions];
      updated[index][field] = val;
      setVoterAdditions(updated);
      validateValue(`voterAdd_${index}_${field}`, val);
    } else if (tableType === 'voterDel') {
      const updated = [...voterDeletions];
      updated[index][field] = val;
      setVoterDeletions(updated);
      validateValue(`voterDel_${index}_${field}`, val);
    }
  };

  const handleAddRow = (tableType) => {
    if (tableType === 'A') {
      setTableA([...tableA, { fullName: '', relationship: '', gender: '', maritalStatus: '', dob: '', nic: '', natureOfDisability: '' }]);
    } else if (tableType === 'B') {
      setTableB([...tableB, { fullName: '', relationship: '', gender: '', maritalStatus: '', dob: '', nic: '', incomeSourceAmount: '' }]);
    } else if (tableType === 'voterAdd') {
      setVoterAdditions([...voterAdditions, { fullName: '', nic: '', dob: '', gender: '', relationship: '', prevAddress: '', prevDistrict: '', prevYear: '' }]);
    } else if (tableType === 'voterDel') {
      setVoterDeletions([...voterDeletions, { fullName: '', nic: '', removalReason: '', details: '', newAddr: '' }]);
    }
  };

  const handleRemoveRow = (tableType, index) => {
    if (tableType === 'A') {
      setTableA(tableA.filter((_, i) => i !== index));
    } else if (tableType === 'B') {
      setTableB(tableB.filter((_, i) => i !== index));
    } else if (tableType === 'voterAdd') {
      setVoterAdditions(voterAdditions.filter((_, i) => i !== index));
    } else if (tableType === 'voterDel') {
      setVoterDeletions(voterDeletions.filter((_, i) => i !== index));
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

    // Step-Specific Target Boundary Conditions for Young Citizen (Form 7 Track 3-A)
    if (form.id === 7 && formStep === 3 && voterPurpose === 'YC') {
      const dobTimestamp = new Date(inputs.ycDob).getTime();
      const minBound = new Date('2008-02-01').getTime();
      const maxBound = new Date('2010-01-31').getTime();

      if (!inputs.ycDob || dobTimestamp < minBound || dobTimestamp > maxBound) {
        alert('Date of Birth must strictly be between 2008-02-01 and 2010-01-31 to use the Young Citizen track. For general revisions, please use Option B.');
        return;
      }
    }

    let maxSteps = 1;
    if (form.id === 1 || form.id === 2) maxSteps = 3; 
    if (form.id === 3) maxSteps = 4;                 
    if (form.id === 4) maxSteps = 3;                 
    if (form.id === 5) maxSteps = 4; 
    if (form.id === 6) maxSteps = 4;
    if (form.id === 7) maxSteps = 4; 

    if (formStep < maxSteps) {
      setFormStep(prev => prev + 1);
    } else {
      const finalPayload = {
        ...inputs,
        formId: form.id,
        title: form.title,
        timestamp: new Date().toISOString(),
        ...(form.id === 3 && { totalAnnualIncome: totalCalculatedIncome }),
        ...(form.id === 6 && { disabledFamilyMembers: tableA, otherHouseholdMembers: tableB }),
        ...(form.id === 7 && { voterTrackPurposeType: voterPurpose, additionsList: voterAdditions, deletionsList: voterDeletions })
      };
      
      // Digital Receipt Generator Output display trigger for Form 7
      if (form.id === 7) {
        alert(`Receipt Generated Successfully!\nThe enumeration form completed by ${inputs.chiefOccupantName || 'Occupant'} was digitally collected on ${new Date().toLocaleString()}`);
      } else {
        alert(`Backend Submission Triggered for: ${form.title}\nData: ${JSON.stringify(finalPayload)}`);
      }
      
      onClose();
      setFormStep(1);
      setTableA([]);
      setTableB([]);
      setVoterAdditions([]);
      setVoterDeletions([]);
      setVoterPurpose('');
    }
  };

  const isResidenceOrCharacter = form.id === 1 || form.id === 2;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 101, width: '100%', maxWidth: form.id === 6 || form.id === 7 ? '780px' : '650px', maxHeight: '90vh', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ backgroundColor: '#6A2301', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{form.title}</h3>
            <p style={{ margin: 0, fontSize: '11px', color: '#f0e4cc' }}>Official Verification Portal</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer', fontWeight: 700 }}>×</button>
        </div>

        {/* Dynamic Stepper Bar Allocations */}
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

        {form.id === 7 && (
          <div style={{ display: 'flex', backgroundColor: '#f0e8d5', padding: '10px 20px', gap: '8px', borderBottom: '1px solid #e8d5ac', fontSize: '11px', fontWeight: 700, color: '#5a3a00', overflowX: 'auto', flexShrink: 0 }}>
            <span style={{ color: formStep === 1 ? '#6A2301' : '#888' }}>1. Boundaries</span> &gt;
            <span style={{ color: formStep === 2 ? '#6A2301' : '#888' }}>2. Track Selection</span> &gt;
            <span style={{ color: formStep === 3 ? '#6A2301' : '#888' }}>3. Elector Profiles</span> &gt;
            <span style={{ color: formStep === 4 ? '#6A2301' : '#888' }}>4. Signoff Declaration</span>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>NIC Number</label>
                      <input type="text" required onChange={e => handleInputChange('incNic', e.target.value)} value={inputs.incNic || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: errors.incNic ? '1.5px solid red' : '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="NIC Number" />
                      {errors.incNic && <span style={S.errorMsg}>{errors.incNic}</span>}
                    </div>
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
            </>
          )}

          {/* ==========================================
              MODULE E: RECONSTRUCTED ALLOWANCE FOR PERSONS WITH DISABILITIES
             ========================================== */}
          {form.id === 6 && (
            <>
              {formStep === 1 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 1: Administrative Region (Header Info)</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>District</label>
                      <input type="text" required onChange={e => handleInputChange('district', e.target.value)} value={inputs.district || userData?.district || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} placeholder="District" />
                    </div>
                  </div>
                </>
              )}
              {formStep === 3 && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#6A2301' }}>Table A: Family Members with Disabilities</span>
                      <button type="button" onClick={() => handleAddRow('A')} style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#6A2301', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                        <Icon d={IC.plus} size={12} /> Add Row
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ==========================================
              MODULE G: VOTER REGISTRATION & REVISION FORM (FORM ID 7)
             ========================================== */}
          {form.id === 7 && (
            <>
              {/* STEP 1: Boundaries & Polling Region Coordinates */}
              {formStep === 1 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 1: Administrative &amp; Polling Boundaries</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Electoral District</label>
                      <input type="text" required onChange={e => handleInputChange('electoralDistrict', e.target.value)} value={inputs.electoralDistrict || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} placeholder="E.g. Colombo" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Polling Division</label>
                      <input type="text" required onChange={e => handleInputChange('pollingDivision', e.target.value)} value={inputs.pollingDivision || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} placeholder="E.g. Thimbirigasyaya" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Polling District Number</label>
                      <input type="text" required onChange={e => handleInputChange('pollingDistrictNumber', e.target.value)} value={inputs.pollingDistrictNumber || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} placeholder="E.g. 12" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Grama Niladhari Division Name/Number</label>
                      <input type="text" required onChange={e => handleInputChange('voterGnDivision', e.target.value)} value={inputs.voterGnDivision || userData?.gnDiv || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} placeholder="E.g. Hunupitiya 62B" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Village / Street / Estate Name</label>
                      <input type="text" required onChange={e => handleInputChange('streetEstateName', e.target.value)} value={inputs.streetEstateName || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} placeholder="Street Name" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Household / Assessment Number</label>
                      <input type="text" required onChange={e => handleInputChange('householdAssessmentNumber', e.target.value)} value={inputs.householdAssessmentNumber || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} placeholder="E.g. 24/B" />
                    </div>
                  </div>

                  {/* Scannable Verification Redirection Block Component */}
                  <div style={{ backgroundColor: '#fff', border: '1.5px solid #e8d5ac', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#6A2301' }}>Check Live Electoral Status Instantly</span>
                      <span style={{ fontSize: '11px', color: '#666' }}>Cross-verify your household records using the official database.</span>
                    </div>
                    <a href="https://ec.lk/vrd" target="_blank" rel="noreferrer" style={{ backgroundColor: '#6A2301', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', textDecoration: 'none' }}>ec.lk/vrd</a>
                  </div>
                </>
              )}

              {/* STEP 2: Functional Track Selector Platform View */}
              {formStep === 2 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 2: Form Purpose Selection</span>
                  <p style={{ margin: 0, fontSize: '13px', color: '#555', fontWeight: 600 }}>Please pick your application track method to open custom configuration blocks:</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
                    <div 
                      onClick={() => setVoterPurpose('YC')}
                      style={{ padding: '16px', borderRadius: '12px', border: voterPurpose === 'YC' ? '2.5px solid #6A2301' : '1.5px solid #e8d5ac', backgroundColor: voterPurpose === 'YC' ? '#fffbe0' : '#fff', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#1e1200', display: 'block' }}>[ Option A ] "I want to register a young citizen turning 18 years old"</span>
                      <span style={{ fontSize: '11px', color: '#666', marginTop: '2px', display: 'block' }}>Enrolls candidates turning 18 born between 01.02.2008 and 31.01.2010.</span>
                    </div>

                    <div 
                      onClick={() => setVoterPurpose('ER')}
                      style={{ padding: '16px', borderRadius: '12px', border: voterPurpose === 'ER' ? '2.5px solid #6A2301' : '1.5px solid #e8d5ac', backgroundColor: voterPurpose === 'ER' ? '#fffbe0' : '#fff', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#1e1200', display: 'block' }}>[ Option B ] "I want to update our household's general voter list"</span>
                      <span style={{ fontSize: '11px', color: '#666', marginTop: '2px', display: 'block' }}>Loads dynamic modification worksheets for newly added electors (Form 2A) or removal parameters (Form 3).</span>
                    </div>
                  </div>
                </>
              )}

              {/* STEP 3-A: Young Citizen Data Fields Matrix */}
              {formStep === 3 && voterPurpose === 'YC' && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 3-A: Young Citizen Enrollment (YC Form Logic)</span>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Applicant's Full Name (Must match NIC exactly, or Birth Certificate)</label>
                    <input type="text" required onChange={e => handleInputChange('ycFullName', e.target.value)} value={inputs.ycFullName || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} placeholder="Full Name" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>National Identity Card (NIC) Number</label>
                      <input type="text" required onChange={e => handleInputChange('ycNic', e.target.value)} value={inputs.ycNic || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: errors.ycNic ? '1.5px solid red' : '1.5px solid #e8d5ac' }} placeholder="NIC Number" />
                      {errors.ycNic && <span style={S.errorMsg}>{errors.ycNic}</span>}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Date of Birth</label>
                      <input type="date" required onChange={e => handleInputChange('ycDob', e.target.value)} value={inputs.ycDob || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Gender</label>
                      <select required onChange={e => handleInputChange('ycGender', e.target.value)} value={inputs.ycGender || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', backgroundColor: '#fff' }}>
                        <option value="">--</option><option value="Male">Male</option><option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Civil Status</label>
                      <select required onChange={e => handleInputChange('ycCivilStatus', e.target.value)} value={inputs.ycCivilStatus || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', backgroundColor: '#fff' }}>
                        <option value="">--</option><option value="Unmarried">Unmarried</option><option value="Married">Married</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Relationship to Chief Occupant</label>
                      <input type="text" required onChange={e => handleInputChange('ycRelationship', e.target.value)} value={inputs.ycRelationship || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} placeholder="E.g. Son, Daughter" />
                    </div>
                  </div>
                </>
              )}

              {/* STEP 3-B: Annual Revision Dynamic Worksheets (Additions & Deletions) */}
              {formStep === 3 && voterPurpose === 'ER' && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 3-B: Annual Electoral Register Revision (ER Form Logic)</span>
                  
                  {/* SUBSECTION 1: ADDITIONS MATRIX WORKSHEET */}
                  <div style={{ border: '1px solid #e8d5ac', padding: '14px', borderRadius: '12px', backgroundColor: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#6A2301' }}>➕ Subsection 1: Persons to be NEWLY Added (Form 2A)</span>
                      <button type="button" onClick={() => handleAddRow('voterAdd')} style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#6A2301', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                        <Icon d={IC.plus} size={12} /> Add Elector
                      </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                        <thead>
                          <tr>
                            <th style={S.th}>Full Name (NIC matching)</th>
                            <th style={S.th}>NIC Number</th>
                            <th style={S.th}>Date of Birth &amp; Gender</th>
                            <th style={S.th}>Relation</th>
                            <th style={S.th}>Previous Registration Metrics (Address, District, Year)</th>
                            <th style={{ ...S.th, width: '40px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {voterAdditions.map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f5f0e8' }}>
                              <td style={{ padding: '4px' }}><input type="text" required value={row.fullName} onChange={e => handleVoterTableChange('Additions', idx, 'fullName', e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #e8d5ac' }} /></td>
                              <td style={{ padding: '4px' }}>
                                <input type="text" required value={row.nic} onChange={e => handleVoterTableChange('Additions', idx, 'nic', e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '12px', borderRadius: '4px', border: errors[`voterAdd_${idx}_nic`] ? '1px solid red' : '1px solid #e8d5ac' }} />
                                {errors[`voterAdd_${idx}_nic`] && <span style={{ color: 'red', fontSize: '9px', display: 'block' }}>Format Error</span>}
                              </td>
                              <td style={{ padding: '4px' }}>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <input type="date" required value={row.dob} onChange={e => handleVoterTableChange('Additions', idx, 'dob', e.target.value)} style={{ padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #e8d5ac' }} />
                                  <select value={row.gender} onChange={e => handleVoterTableChange('Additions', idx, 'gender', e.target.value)} style={{ padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #e8d5ac' }}>
                                    <option value="">--</option><option value="Male">M</option><option value="Female">F</option>
                                  </select>
                                </div>
                              </td>
                              <td style={{ padding: '4px' }}><input type="text" required value={row.relationship} onChange={e => handleVoterTableChange('Additions', idx, 'relationship', e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #e8d5ac' }} /></td>
                              <td style={{ padding: '4px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '4px' }}>
                                  <input type="text" required value={row.prevAddress} onChange={e => handleVoterTableChange('Additions', idx, 'prevAddress', e.target.value)} style={{ padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #e8d5ac' }} placeholder="Prev Address" />
                                  <input type="text" required value={row.prevDistrict} onChange={e => handleVoterTableChange('Additions', idx, 'prevDistrict', e.target.value)} style={{ padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #e8d5ac' }} placeholder="District" />
                                  <input type="number" required value={row.prevYear} onChange={e => handleVoterTableChange('Additions', idx, 'prevYear', e.target.value)} style={{ padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #e8d5ac' }} placeholder="Year" />
                                </div>
                              </td>
                              <td style={{ padding: '4px', textAlign: 'center' }}><button type="button" onClick={() => handleRemoveRow('voterAdd', idx)} style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer' }}><Icon d={IC.trash} size={14} /></button></td>
                            </tr>
                          ))}
                          {voterAdditions.length === 0 && <tr><td colSpan={6} style={{ padding: '12px', textAlign: 'center', color: '#888', fontSize: '12px' }}>No pending addition entries added to Form 2A worksheets.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SUBSECTION 2: DELETIONS MATRIX WORKSHEET */}
                  <div style={{ border: '1px solid #e8d5ac', padding: '14px', borderRadius: '12px', backgroundColor: '#fff', marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#6A2301' }}>➖ Subsection 2: Persons to be DELETED / Removed (Form 3)</span>
                      <button type="button" onClick={() => handleAddRow('voterDel')} style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#6A2301', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                        <Icon d={IC.plus} size={12} /> Add Row
                      </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                        <thead>
                          <tr>
                            <th style={S.th}>Full Name of Elector</th>
                            <th style={S.th}>NIC Number</th>
                            <th style={S.th}>Reason for Removal</th>
                            <th style={S.th}>Conditional Tracking Dynamic Form Parameters Fields</th>
                            <th style={{ ...S.th, width: '40px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {voterDeletions.map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f5f0e8' }}>
                              <td style={{ padding: '4px' }}><input type="text" required value={row.fullName} onChange={e => handleVoterTableChange('Deletions', idx, 'fullName', e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #e8d5ac' }} /></td>
                              <td style={{ padding: '4px' }}>
                                <input type="text" required value={row.nic} onChange={e => handleVoterTableChange('Deletions', idx, 'nic', e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '12px', borderRadius: '4px', border: errors[`voterDel_${idx}_nic`] ? '1px solid red' : '1px solid #e8d5ac' }} />
                                {errors[`voterDel_${idx}_nic`] && <span style={{ color: 'red', fontSize: '9px', display: 'block' }}>Format Error</span>}
                              </td>
                              <td style={{ padding: '4px' }}>
                                <select required value={row.removalReason} onChange={e => handleVoterTableChange('Deletions', idx, 'removalReason', e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #e8d5ac', backgroundColor: '#fff' }}>
                                  <option value="">-- Select Reason --</option>
                                  <option value="Deceased">Deceased (Death)</option>
                                  <option value="Left Residence">Left the Residence (Moved away)</option>
                                  <option value="Other">Other Reason</option>
                                </select>
                              </td>
                              <td style={{ padding: '4px' }}>
                                {row.removalReason === 'Deceased' && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#B46A02' }}>Date of Death:</span>
                                    <input type="date" required onChange={e => handleVoterTableChange('Deletions', idx, 'details', e.target.value)} style={{ padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #e8d5ac' }} />
                                  </div>
                                )}
                                {row.removalReason === 'Left Residence' && (
                                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '4px' }}>
                                    <input type="text" required onChange={e => handleVoterTableChange('Deletions', idx, 'newAddr', e.target.value)} style={{ padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #e8d5ac' }} placeholder="New Address" />
                                    <input type="text" required onChange={e => handleVoterTableChange('Deletions', idx, 'details', e.target.value)} style={{ padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #e8d5ac' }} placeholder="New Telephone" />
                                  </div>
                                )}
                                {row.removalReason === 'Other' && <input type="text" required onChange={e => handleVoterTableChange('Deletions', idx, 'details', e.target.value)} style={{ width: '100%', padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #e8d5ac' }} placeholder="Specify custom reason fields" />}
                              </td>
                              <td style={{ padding: '4px', textAlign: 'center' }}><button type="button" onClick={() => handleRemoveRow('voterDel', idx)} style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer' }}><Icon d={IC.trash} size={14} /></button></td>
                            </tr>
                          ))}
                          {voterDeletions.length === 0 && <tr><td colSpan={5} style={{ padding: '12px', textAlign: 'center', color: '#888', fontSize: '12px' }}>No deletion registry logs requested under Form 3 revision sheets.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* STEP 4: Chief Occupant Multi-Affirmation Declarations & Receipts */}
              {formStep === 4 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 4: Chief Occupant's Declaration &amp; Contact Info</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Full Name of Chief Occupant</label>
                      <input type="text" required onChange={e => handleInputChange('chiefOccupantName', e.target.value)} value={inputs.chiefOccupantName || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} placeholder="Chief Occupant Name" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>NIC Number of Chief Occupant</label>
                      <input type="text" required onChange={e => handleInputChange('chiefOccupantNic', e.target.value)} value={inputs.chiefOccupantNic || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: errors.chiefOccupantNic ? '1.5px solid red' : '1.5px solid #e8d5ac' }} placeholder="NIC No" />
                      {errors.chiefOccupantNic && <span style={S.errorMsg}>{errors.chiefOccupantNic}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Telephone Number</label>
                      <input type="text" required onChange={e => handleInputChange('chiefOccupantPhone', e.target.value)} value={inputs.chiefOccupantPhone || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: errors.chiefOccupantPhone ? '1.5px solid red' : '1.5px solid #e8d5ac' }} placeholder="07XXXXXXXX" />
                      {errors.chiefOccupantPhone && <span style={S.errorMsg}>{errors.chiefOccupantPhone}</span>}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>WhatsApp Number (For Digital Updates)</label>
                      <input type="text" required onChange={e => handleInputChange('chiefOccupantWhatsApp', e.target.value)} value={inputs.chiefOccupantWhatsApp || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: errors.chiefOccupantWhatsApp ? '1.5px solid red' : '1.5px solid #e8d5ac' }} placeholder="07XXXXXXXX" />
                      {errors.chiefOccupantWhatsApp && <span style={S.errorMsg}>{errors.chiefOccupantWhatsApp}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#eae5d8', padding: '14px', borderRadius: '12px' }}>
                    <input type="checkbox" required defaultChecked style={{ accentColor: '#6A2301', marginTop: '3px' }} />
                    <span style={{ fontSize: '11px', color: '#333', fontWeight: 600, lineHeight: 1.5 }}>
                      * <strong>Chief Occupant Assent:</strong> I hereby declare that the particulars given above are true and accurate... I am fully aware that willfully providing false information is a punishable offence under Section 12(4) of the Registration of Electors Act, carrying penalties of a fine up to Rs. 500, up to 1 month imprisonment, or both.
                    </span>
                  </div>

                  {/* RESTRICTED FIELD: AUTOMATED OFFICER PORTAL VIEWS */}
                  <div style={{ backgroundColor: '#fff', border: '1.5px solid #e8d5ac', borderRadius: '12px', padding: '14px' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#6A2301', textTransform: 'uppercase', marginBottom: '6px' }}>🛠️ Back-End &amp; Official Role Fields (G.N. / Special Enumerator View Only)</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><input type="checkbox" disabled checked style={{ accentColor: '#6A2301' }} /> Document Verification Checkbox (NIC/Birth Certificate match verified check)</label>
                      <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid #f5f0e8', paddingTop: '6px', marginTop: '4px' }}>
                        <span>Automated Revision Dashboard Summary Payout:</span>
                        <span style={{ color: '#00875a' }}>Additions Total: {voterPurpose === 'YC' ? 1 : voterAdditions.length}</span>
                        <span style={{ color: '#de350b' }}>Deletions Total: {voterPurpose === 'YC' ? 0 : voterDeletions.length}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Action Interface Controls Layout Trays */}
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
              disabled={form.id === 7 && formStep === 2 && voterPurpose === ''}
              style={{ padding: '10px 24px', borderRadius: '999px', border: 'none', backgroundColor: (form.id === 7 && formStep === 2 && voterPurpose === '') ? '#ccc' : '#6A2301', color: '#fff', fontWeight: 800, cursor: (form.id === 7 && formStep === 2 && voterPurpose === '') ? 'not-allowed' : 'pointer', marginLeft: 'auto' }}
            >
              {((form.id === 3 && formStep === 4) || (form.id === 5 && formStep === 4) || (form.id === 7 && formStep === 4) || ((form.id === 1 || form.id === 2 || form.id === 4 || form.id === 6) && formStep === 3)) ? 'Submit Application' : 'Next Step →'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Forms;