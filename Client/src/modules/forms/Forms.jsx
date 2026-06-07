import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
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
  plus: 'M12 5v14M5 12h14',
  trash: 'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
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
    { id: 6, title: "Living Funds for Disabled Persons", cat: "Recommendations", imgSrc: "/icons/disabled.png", desc: "Financial assistance application for persons with disabilities" },
    { id: 7, title: "Voter Registration Form", cat: "Applications", imgSrc: "/icons/voter.png", desc: "Register or revise names on the local voting list" },
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

      <div style={S.main}>
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
                  onClick={() => { setSelectedForm(form); setFormInputs({}); setErrors({}); setDisabledMembers([{ name: '', relation: '', gender: '', civilStatus: '', dob: '', nic: '', nature: '' }]); setOtherMembers([{ name: '', relation: '', gender: '', civilStatus: '', dob: '', nic: '', incomeSourceAmt: '' }]); setNewVoters([]); setDeletedVoters([]); setVoterPurpose(''); setTreeLogistics([{ species: '', girth: '', height: '', middleGirth: '', reason: '', proximityDanger: 'No' }]); setTimberGrid([{ species: '', girth: '', height: '', woodVol: '', firewoodVol: '', infraImpact: 'No' }]); setFormStep(1); }}
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

// --- Multi-Step Dynamic Overlay Engine (Supports IDs: 1, 2, 3, 4, 5, 6, 7, 8, 9) ---
const DynamicFormModal = ({ form, onClose, inputs, setInputs, currentUser, userData, db }) => {
  if (!form) return null;

  const [formStep, setFormStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [hasJobIncome, setHasJobIncome] = useState(false);
  const [hasPropertyIncome, setHasPropertyIncome] = useState(false);
  const [hasBusinessIncome, setHasBusinessIncome] = useState(false);
  const [isReliefRecipient, setIsReliefRecipient] = useState(false);

  // --- Living Allowance State Arrays ---
  const [disabledMembers, setDisabledMembers] = useState([{ name: '', relation: '', gender: '', civilStatus: '', dob: '', nic: '', nature: '' }]);
  const [otherMembers, setOtherMembers] = useState([{ name: '', relation: '', gender: '', civilStatus: '', dob: '', nic: '', incomeSourceAmt: '' }]);

  // --- Voter Registration Form State Arrays ---
  const [voterPurpose, setVoterPurpose] = useState('OptionA'); 
  const [newVoters, setNewVoters] = useState([{ name: '', nic: '', dob: '', gender: '', relation: '', prevAddress: '', prevDistrict: '', prevYear: '' }]);
  const [deletedVoters, setDeletedVoters] = useState([{ name: '', nic: '', reason: '', deathDate: '', newAddress: '', newPhone: '' }]);

  // --- Tree Felling Permit Form State Arrays ---
  const [treeLogistics, setTreeLogistics] = useState([{ species: '', girth: '', height: '', middleGirth: '', reason: '', proximityDanger: 'No' }]);

  // --- Tree Timber & Removal Permit Form State Arrays (Form 9) ---
  const [timberGrid, setTimberGrid] = useState([{ species: '', girth: '', height: '', woodVol: '', firewoodVol: '', infraImpact: 'No' }]);

  const empAmt = Number(inputs.summaryEmployment) || 0;
  const landAmt = Number(inputs.summaryLand) || 0;
  const bizAmt = Number(inputs.summaryBusiness) || 0;
  const otherAmt = Number(inputs.summaryOther) || 0;
  const totalCalculatedIncome = empAmt + landAmt + bizAmt + otherAmt;

  const validateValue = (key, val) => {
    let msg = '';
    const label = key.toLowerCase();

    if (label.includes('phone') || label.includes('mobile') || label.includes('tele') || label.includes('whatsapp') || label.includes('contact')) {
      if (val && !/^\d{10}$/.test(val)) {
        msg = 'Phone number must be exactly 10 digits.';
      }
    }

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

  const handleVoterTableChange = (table, index, field, val) => {
    if (table === 'Additions') {
      const updated = [...newVoters]; updated[index][field] = val; setNewVoters(updated);
      validateValue(`add_nic_${index}`, val);
    } else {
      const updated = [...deletedVoters]; updated[index][field] = val; setDeletedVoters(updated);
      validateValue(`del_nic_${index}`, val); validateValue(`del_phone_${index}`, val);
    }
  };

  const handleTreeRowChange = (index, field, val) => {
    const updated = [...treeLogistics];
    updated[index][field] = val;
    setTreeLogistics(updated);
  };

  const handleTimberGridChange = (index, field, val) => {
    const updated = [...timberGrid];
    updated[index][field] = val;
    setTimberGrid(updated);
  };

  const handleRemoveRow = (tableType, index) => {
    if (tableType === 'A') setDisabledMembers(disabledMembers.filter((_, i) => i !== index));
    if (tableType === 'B') setOtherMembers(otherMembers.filter((_, i) => i !== index));
    if (tableType === 'voterAdd') setNewVoters(newVoters.filter((_, i) => i !== index));
    if (tableType === 'voterDel') setDeletedVoters(deletedVoters.filter((_, i) => i !== index));
    if (tableType === 'treeMatrix') setTreeLogistics(treeLogistics.filter((_, i) => i !== index));
    if (tableType === 'timberGrid') setTimberGrid(timberGrid.filter((_, i) => i !== index));
  };

  const stepFieldsHaveErrors = () => {
    return Object.values(errors).some(err => err !== '');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (stepFieldsHaveErrors()) {
      alert('Please correct the validation errors highlighted in red before proceeding.');
      return;
    }

    if (form.id === 7 && formStep === 3 && voterPurpose === 'OptionA') {
      const dobTimestamp = new Date(inputs.ycDob).getTime();
      const minBound = new Date('2008-02-01').getTime();
      const maxBound = new Date('2010-01-31').getTime();
      if (!inputs.ycDob || dobTimestamp < minBound || dobTimestamp > maxBound) {
        alert('Date of Birth must strictly be between 2008-02-01 and 2010-01-31 to utilize the Young Citizen track.');
        return;
      }
    }

    let maxSteps = 3;
    if (form.id === 3 || form.id === 6 || form.id === 7 || form.id === 9) maxSteps = 4;
    if (form.id === 8) maxSteps = 5; 

    if (formStep < maxSteps) {
      setFormStep(prev => prev + 1);
    } else {
      let finalPayload = inputs;
      if (form.id === 3) {
        finalPayload = { ...inputs, totalAnnualIncome: totalCalculatedIncome };
      } else if (form.id === 6) {
        finalPayload = { ...inputs, tableAFamilyWithDisabilities: disabledMembers, tableBOtherFamilyMembers: otherMembers };
      } else if (form.id === 7) {
        finalPayload = { ...inputs, selectedPurposeMode: voterPurpose, newlyAddedVotersTable: newVoters, deletedVotersTable: deletedVoters };
        alert(`Digital Receipt Generated!\nThe enumeration form completed by ${inputs.voterChiefName || 'Occupant'} was digitally collected on ${new Date().toLocaleString()}`);
      } else if (form.id === 8) {
        finalPayload = { ...inputs, loggedTreesArray: treeLogistics };
      } else if (form.id === 9) {
        finalPayload = { ...inputs, timberGridDetails: timberGrid };
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
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 101, width: '100%', maxWidth: form.id === 6 || form.id === 7 || form.id === 8 || form.id === 9 ? '760px' : '650px', maxHeight: '90vh', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
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

        {form.id === 6 && (
          <div style={{ display: 'flex', backgroundColor: '#f0e8d5', padding: '10px 20px', gap: '8px', borderBottom: '1px solid #e8d5ac', fontSize: '11px', fontWeight: 700, color: '#5a3a00', flexShrink: 0 }}>
            <span style={{ color: formStep === 1 ? '#6A2301' : '#888' }}>1. Region &amp; Applicant</span> &gt;
            <span style={{ color: formStep === 2 ? '#6A2301' : '#888' }}>2. Family Details</span> &gt;
            <span style={{ color: formStep === 3 ? '#6A2301' : '#888' }}>3. Bank &amp; Assistance</span> &gt;
            <span style={{ color: formStep === 4 ? '#6A2301' : '#888' }}>4. Upload Certification</span>
          </div>
        )}

        {form.id === 7 && (
          <div style={{ display: 'flex', backgroundColor: '#f0e8d5', padding: '10px 20px', gap: '8px', borderBottom: '1px solid #e8d5ac', fontSize: '11px', fontWeight: 700, color: '#5a3a00', overflowX: 'auto', flexShrink: 0 }}>
            <span style={{ color: formStep === 1 ? '#6A2301' : '#888' }}>1. Boundaries &amp; Region</span> &gt;
            <span style={{ color: formStep === 2 ? '#6A2301' : '#888' }}>2. Purpose &amp; Registration Core</span> &gt;
            <span style={{ color: formStep === 3 ? '#6A2301' : '#888' }}>3. Chief Occupant's Declaration</span>
          </div>
        )}

        {form.id === 8 && (
          <div style={{ display: 'flex', backgroundColor: '#f0e8d5', padding: '10px 20px', gap: '6px', borderBottom: '1px solid #e8d5ac', fontSize: '11px', fontWeight: 700, color: '#5a3a00', overflowX: 'auto', flexShrink: 0 }}>
            <span style={{ color: formStep === 1 ? '#6A2301' : '#888' }}>1. Applicant Meta</span> &gt;
            <span style={{ color: formStep === 2 ? '#6A2301' : '#888' }}>2. Property Location</span> &gt;
            <span style={{ color: formStep === 3 ? '#6A2301' : '#888' }}>3. Spatial Boundaries</span> &gt;
            <span style={{ color: formStep === 4 ? '#6A2301' : '#888' }}>4. Tree Logistics Matrix</span> &gt;
            <span style={{ color: formStep === 5 ? '#6A2301' : '#888' }}>5. Document Audits</span>
          </div>
        )}

        {form.id === 9 && (
          <div style={{ display: 'flex', backgroundColor: '#f0e8d5', padding: '10px 20px', gap: '8px', borderBottom: '1px solid #e8d5ac', fontSize: '11px', fontWeight: 700, color: '#5a3a00', overflowX: 'auto', flexShrink: 0 }}>
            <span style={{ color: formStep === 1 ? '#6A2301' : '#888' }}>1. Request Information</span> &gt;
            <span style={{ color: formStep === 2 ? '#6A2301' : '#888' }}>2. Property Profile</span> &gt;
            <span style={{ color: formStep === 3 ? '#6A2301' : '#888' }}>3. Timber Table Matrix</span> &gt;
            <span style={{ color: formStep === 4 ? '#6A2301' : '#888' }}>4. Layout &amp; Uploads</span>
          </div>
        )}

        {form.id === 10 && (
          <div style={{ display: 'flex', backgroundColor: '#f0e8d5', padding: '10px 20px', gap: '8px', borderBottom: '1px solid #e8d5ac', fontSize: '11px', fontWeight: 700, color: '#5a3a00', overflowX: 'auto', flexShrink: 0 }}>
            <span style={{ color: formStep === 1 ? '#6A2301' : '#888' }}>1. Owner & Business Meta</span> &gt;
            <span style={{ color: formStep === 2 ? '#6A2301' : '#888' }}>2. Environmental & Premises Info</span> &gt;
            <span style={{ color: formStep === 3 ? '#6A2301' : '#888' }}>3. Legal Deed Uploads</span>
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
                      <input type="text" required onChange={e => handleInputChange('incNic', e.target.value)} value={inputs.incNic || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: errors.incNic ? '1.5px solid red' : '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="NIC Number" />
                      {errors.incNic && <span style={S.errorMsg}>{errors.incNic}</span>}
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
                            <input type="text" onChange={e => handleInputChange('landSize', e.target.value)} value={inputs.landSize || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} placeholder="e.g. 20 Perches" />
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
                            <input type="text" onChange={e => handleInputChange('bizRegNo', e.target.value)} value={inputs.bizRegNo || ''} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1.5px solid #e8d5ac', outline: 'none' }} placeholder="BR-XXXXXX" />
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>District</label>
                      <input type="text" required onChange={e => handleInputChange('lawDistrict', e.target.value)} value={inputs.lawDistrict || userData?.district || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. Colombo" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Divisional Secretariat (D.S. Office)</label>
                      <input type="text" required onChange={e => handleInputChange('lawDsOffice', e.target.value)} value={inputs.lawDsOffice || userData?.dsDiv || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. Thimbirigasyaya" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Grama Niladhari (G.N.) Division</label>
                      <input type="text" required onChange={e => handleInputChange('lawGnDivision', e.target.value)} value={inputs.lawGnDivision || userData?.gnDiv || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. Hunupitiya (62B)" />
                    </div>
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
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Cause of Disability</label>
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

              {/* STEP 2: Family Demographics Arrays */}
              {formStep === 2 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 5: Household &amp; Family Details</span>
                  
                  {/* Table A Array */}
                  <p style={{ margin: '6px 0 0 0', fontSize: '12px', fontWeight: 800, color: '#3d2a00' }}>👥 Table A: Family Members with Disabilities</p>
                  {disabledMembers.map((member, idx) => (
                    <div key={`law-disabled-${idx}`} style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '10px', border: '1.5px solid #e8d5ac', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                        <input type="text" required placeholder="Full Name" value={member.name} onChange={e => { const u = [...disabledMembers]; u[idx].name = e.target.value; setDisabledMembers(u); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} />
                        <input type="text" required placeholder="Relationship" value={member.relation} onChange={e => { const u = [...disabledMembers]; u[idx].relation = e.target.value; setDisabledMembers(u); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        <select required value={member.gender} onChange={e => { const u = [...disabledMembers]; u[idx].gender = e.target.value; setDisabledMembers(u); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none', backgroundColor: '#fff' }}>
                          <option value="">Gender</option><option value="Male">Male</option><option value="Female">Female</option>
                        </select>
                        <select required value={member.civilStatus} onChange={e => { const u = [...disabledMembers]; u[idx].civilStatus = e.target.value; setDisabledMembers(u); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none', backgroundColor: '#fff' }}>
                          <option value="">Status</option><option value="Unmarried">Unmarried</option><option value="Married">Married</option>
                        </select>
                        <input type="date" required value={member.dob} onChange={e => { const u = [...disabledMembers]; u[idx].dob = e.target.value; setDisabledMembers(u); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <input type="text" required placeholder="NIC Number" value={member.nic} onChange={e => { const u = [...disabledMembers]; u[idx].nic = e.target.value; setDisabledMembers(u); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} />
                        <input type="text" required placeholder="Disability" value={member.nature} onChange={e => { const u = [...disabledMembers]; u[idx].nature = e.target.value; setDisabledMembers(u); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setDisabledMembers([...disabledMembers, { name: '', relation: '', gender: '', civilStatus: '', dob: '', nic: '', nature: '' }])} style={{ alignSelf: 'flex-start', padding: '6px 14px', borderRadius: '6px', border: '1px solid #6A2301', color: '#6A2301', backgroundColor: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 700, marginBottom: '8px' }}>+ Add Row</button>

                  {/* Table B Array */}
                  <p style={{ margin: '6px 0 0 0', fontSize: '12px', fontWeight: 800, color: '#3d2a00' }}>👥 Table B: Other Family Members</p>
                  {otherMembers.map((member, idx) => (
                    <div key={`law-other-${idx}`} style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '10px', border: '1.5px solid #e8d5ac', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                        <input type="text" required placeholder="Full Name" value={member.name} onChange={e => { const u = [...otherMembers]; u[idx].name = e.target.value; setOtherMembers(u); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} />
                        <input type="text" required placeholder="Relationship" value={member.relation} onChange={e => { const u = [...otherMembers]; u[idx].relation = e.target.value; setOtherMembers(u); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setOtherMembers([...otherMembers, { name: '', relation: '', gender: '', civilStatus: '', dob: '', nic: '', incomeSourceAmt: '' }])} style={{ alignSelf: 'flex-start', padding: '6px 14px', borderRadius: '6px', border: '1px solid #6A2301', color: '#6A2301', backgroundColor: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>+ Add Row</button>
                </>
              )}

              {/* STEP 3: Financial Aid Indexes & Bank Transfer Routings */}
              {formStep === 3 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 3: Bank Account Details (For Direct Benefit Transfer)</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <input type="text" required onChange={e => handleInputChange('lawBankAccountNo', e.target.value)} value={inputs.lawBankAccountNo || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} placeholder="Account Number" />
                    </div>
                    <div>
                      <input type="text" required onChange={e => handleInputChange('lawBankNameBranch', e.target.value)} value={inputs.lawBankNameBranch || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac' }} placeholder="Bank Name &amp; Branch" />
                    </div>
                  </div>
                </>
              )}

              {/* STEP 4: Official Audit Logs & Document Submission Only */}
              {formStep === 4 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>🛠️ Back-End &amp; Official Verification Sections</span>
                  <div style={{ backgroundColor: '#fff', border: '1.5px dashed #B46A02', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#6A2301' }}>🩺 Section C: Medical Officer Certification</span>
                    <input type="file" required style={{ fontSize: '12px', marginTop: '4px' }} />
                  </div>
                </>
              )}
            </>
          )}

          {/* ==========================================
              MODULE F: VOTER REGISTRATION & REVISION (FORM ID: 7)
             ========================================== */}
          {form.id === 7 && (
            <>
              {/* Step 1: Boundaries & Polling Regions */}
              {formStep === 1 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 1: Administrative &amp; Polling Boundaries</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Electoral District</label>
                      <input type="text" required onChange={e => handleInputChange('voterElectoralDistrict', e.target.value)} value={inputs.voterElectoralDistrict || userData?.district || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. Colombo" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Polling Division</label>
                      <input type="text" required onChange={e => handleInputChange('voterPollingDivision', e.target.value)} value={inputs.voterPollingDivision || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. Colombo Central" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Polling District Number</label>
                      <input type="text" required onChange={e => handleInputChange('voterPollingDistrictNo', e.target.value)} value={inputs.voterPollingDistrictNo || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. 14" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Grama Niladhari Division Name/Number</label>
                      <input type="text" required onChange={e => handleInputChange('voterGnDivision', e.target.value)} value={inputs.voterGnDivision || userData?.gnDiv || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. Hunupitiya (62B)" />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Village / Street / Estate Name</label>
                    <input type="text" required onChange={e => handleInputChange('voterVillageStreet', e.target.value)} value={inputs.voterVillageStreet || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. Hunupitiya Cross Road" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Household / Assessment Number</label>
                    <input type="text" required onChange={e => handleInputChange('voterHouseholdNo', e.target.value)} value={inputs.voterHouseholdNo || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. 45/A" />
                  </div>

                  <div style={{ backgroundColor: '#fff', border: '1.5px solid #e8d5ac', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#6A2301' }}>Check Live Electoral Register Profile</span>
                      <span style={{ fontSize: '11px', color: '#666' }}>Cross-verify registration logs instantly on ec.lk/vrd database.</span>
                    </div>
                    <a href="https://ec.lk/vrd" target="_blank" rel="noreferrer" style={{ backgroundColor: '#6A2301', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', textDecoration: 'none' }}>ec.lk/vrd</a>
                  </div>
                </>
              )}

              {/* Step 2: Form Purpose Selection Selector Toggle & Form Track Renderings */}
              {formStep === 2 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 2: Form Purpose Selection</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                    <button type="button" onClick={() => setVoterPurpose('OptionA')} style={{ padding: '12px', borderRadius: '10px', border: voterPurpose === 'OptionA' ? '2.5px solid #6A2301' : '1.5px solid #e8d5ac', backgroundColor: voterPurpose === 'OptionA' ? '#fffbe8' : '#fff', fontWeight: voterPurpose === 'OptionA' ? 900 : 600, color: '#3d2a00', cursor: 'pointer', textAlign: 'left', fontSize: '12px' }}>
                      <div style={{ color: '#6A2301', fontWeight: 800, marginBottom: '2px' }}>[ Option A ]</div>
                      "I want to register a young citizen turning 18 years old" (YC Form Track)
                    </button>
                    <button type="button" onClick={() => setVoterPurpose('OptionB')} style={{ padding: '12px', borderRadius: '10px', border: voterPurpose === 'OptionB' ? '2.5px solid #6A2301' : '1.5px solid #e8d5ac', backgroundColor: voterPurpose === 'OptionB' ? '#fffbe8' : '#fff', fontWeight: voterPurpose === 'OptionB' ? 900 : 600, color: '#3d2a00', cursor: 'pointer', textAlign: 'left', fontSize: '12px' }}>
                      <div style={{ color: '#6A2301', fontWeight: 800, marginBottom: '2px' }}>[ Option B ]</div>
                      "I want to update our household's general voter list" (ER Form Track)
                    </button>
                  </div>

                  {/* SUB-TRACK A: Young Citizen Enrollment */}
                  {voterPurpose === 'OptionA' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '2px dashed #e8d5ac', paddingTop: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#6A2301' }}>Step 3-A: Young Citizen Enrollment (YC Form Logic)</span>
                      <p style={{ margin: 0, fontSize: '11px', color: '#666', lineHeight: 1.3, fontWeight: 600 }}>This section collects data for citizens born between 01.02.2008 and 31.01.2010 who are turning 18.</p>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Applicant's Full Name (Must match NIC exactly, or Birth Certificate if NIC isn't issued yet)</label>
                        <input type="text" required onChange={e => handleInputChange('ycFullName', e.target.value)} value={inputs.ycFullName || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Enter Full Name" />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>National Identity Card (NIC) Number</label>
                          <input type="text" required onChange={e => handleInputChange('ycNicNo', e.target.value)} value={inputs.ycNicNo || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="NIC Number" />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Date of Birth</label>
                          <input type="date" required min="2008-02-01" max="2010-01-31" onChange={e => handleInputChange('ycDob', e.target.value)} value={inputs.ycDob || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Gender</label>
                          <select required onChange={e => handleInputChange('ycGender', e.target.value)} value={inputs.ycGender || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', backgroundColor: '#fff', outline: 'none' }}>
                            <option value="">-- Select --</option><option value="Male">Male</option><option value="Female">Female</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Civil Status</label>
                          <select required onChange={e => handleInputChange('ycCivilStatus', e.target.value)} value={inputs.ycCivilStatus || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', backgroundColor: '#fff', outline: 'none' }}>
                            <option value="">-- Select --</option><option value="Unmarried">Unmarried</option><option value="Married">Married</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Relationship to Chief Occupant</label>
                          <input type="text" required onChange={e => handleInputChange('ycRelationToChief', e.target.value)} value={inputs.ycRelationToChief || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. Son, Daughter" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TRACK B: Annual Electoral Register Revision Tracks */}
                  {voterPurpose === 'OptionB' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '2px dashed #e8d5ac', paddingTop: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#6A2301' }}>Step 3-B: Annual Electoral Register Revision (ER Form Logic)</span>
                      
                      <div style={{ border: '1.5px solid #e8d5ac', padding: '12px', borderRadius: '12px', backgroundColor: '#fff' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#6A2301', display: 'block', marginBottom: '4px' }}>➕ Subsection 1: Persons to be NEWLY Added (Form 2A)</span>
                        <p style={{ margin: '0 0 8px 0', fontSize: '10px', color: '#888', lineHeight: 1.3 }}>Note: Members already correctly registered in the previous year do not need to be re-entered.</p>
                        
                        {newVoters.map((voter, idx) => (
                          <div key={`newvoter-${idx}`} style={{ borderBottom: idx < newVoters.length - 1 ? '1px solid #f5f0e8' : 'none', paddingBottom: '8px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                              <input type="text" placeholder="Full Name (As on NIC)" value={voter.name} onChange={e => { const u = [...newVoters]; u[idx].name = e.target.value; setNewVoters(u); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none', fontSize: '11px' }} />
                              <input type="text" placeholder="Relationship to Chief" value={voter.relation} onChange={e => { const u = [...newVoters]; u[idx].relation = e.target.value; setNewVoters(u); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none', fontSize: '11px' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                              <input type="text" placeholder="NIC Number" value={voter.nic} onChange={e => { const u = [...newVoters]; u[idx].nic = e.target.value; setNewVoters(u); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none', fontSize: '11px' }} />
                              <input type="date" placeholder="Date of Birth" value={voter.dob} onChange={e => { const u = [...newVoters]; u[idx].dob = e.target.value; setNewVoters(u); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none', fontSize: '11px' }} />
                              <select value={voter.gender} onChange={e => { const u = [...newVoters]; u[idx].gender = e.target.value; setNewVoters(u); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none', backgroundColor: '#fff', fontSize: '11px' }}>
                                <option value="">Gender</option><option value="Male">Male</option><option value="Female">Female</option>
                              </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px', backgroundColor: '#fdfbef', padding: '6px', borderRadius: '6px' }}>
                              <input type="text" placeholder="Previous Address Last Registered" value={voter.prevAddress} onChange={e => { const u = [...newVoters]; u[idx].prevAddress = e.target.value; setNewVoters(u); }} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e8d5ac', outline: 'none', fontSize: '10px' }} />
                              <input type="text" placeholder="Prev District" value={voter.prevDistrict} onChange={e => { const u = [...newVoters]; u[idx].prevDistrict = e.target.value; setNewVoters(u); }} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e8d5ac', outline: 'none', fontSize: '10px' }} />
                              <input type="number" placeholder="Prev Year" value={voter.prevYear} onChange={e => { const u = [...newVoters]; u[idx].prevYear = e.target.value; setNewVoters(u); }} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e8d5ac', outline: 'none', fontSize: '10px' }} />
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => setNewVoters([...newVoters, { name: '', nic: '', dob: '', gender: '', relation: '', prevAddress: '', prevDistrict: '', prevYear: '' }])} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #6A2301', color: '#6A2301', backgroundColor: '#fff', cursor: 'pointer', fontSize: '10px', fontWeight: 700 }}>+ Add New Elector Addition Entry</button>
                      </div>

                      {/* Subsection 2: Deletions */}
                      <div style={{ border: '1.5px solid #e8d5ac', padding: '12px', borderRadius: '12px', backgroundColor: '#fff' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#6A2301', display: 'block', marginBottom: '6px' }}>➖ Subsection 2: Persons to be DELETED / Removed (Form 3)</span>
                        {deletedVoters.map((voter, idx) => (
                          <div key={`delvoter-${idx}`} style={{ borderBottom: idx < deletedVoters.length - 1 ? '1px solid #f5f0e8' : 'none', paddingBottom: '8px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                              <input type="text" placeholder="Full Name of Elector" value={voter.name} onChange={e => { const u = [...deletedVoters]; u[idx].name = e.target.value; setDeletedVoters(u); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none', fontSize: '11px' }} />
                              <input type="text" placeholder="NIC Number" value={voter.nic} onChange={e => { const u = [...deletedVoters]; u[idx].nic = e.target.value; setDeletedVoters(u); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none', fontSize: '11px' }} />
                              <select value={voter.reason} onChange={e => { const u = [...deletedVoters]; u[idx].reason = e.target.value; setDeletedVoters(u); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none', backgroundColor: '#fff', fontSize: '11px' }}>
                                <option value="">Reason for Removal</option>
                                <option value="Deceased">Deceased (Death)</option>
                                <option value="Moved Away">Left the Residence (Moved away)</option>
                                <option value="Other">Other Reason</option>
                              </select>
                            </div>

                            {voter.reason === 'Deceased' && (
                              <div style={{ backgroundColor: '#fff5f5', padding: '6px', borderRadius: '6px' }}>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#c53030', marginBottom: '2px' }}>Conditional Field: Date of Death</label>
                                <input type="date" value={voter.deathDate} onChange={e => { const u = [...deletedVoters]; u[idx].deathDate = e.target.value; setDeletedVoters(u); }} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e8d5ac', outline: 'none', fontSize: '11px' }} />
                              </div>
                            )}

                            {voter.reason === 'Moved Away' && (
                              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', backgroundColor: '#f7fafc', padding: '6px', borderRadius: '6px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#4a5568', marginBottom: '2px' }}>Conditional Field: New Current Address</label>
                                  <input type="text" value={voter.newAddress} onChange={e => { const u = [...deletedVoters]; u[idx].newAddress = e.target.value; setDeletedVoters(u); }} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e8d5ac', boxSizing: 'border-box', outline: 'none', fontSize: '11px' }} placeholder="Enter New Address" />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#4a5568', marginBottom: '2px' }}>New Telephone Number</label>
                                  <input type="text" value={voter.newPhone} onChange={e => { const u = [...deletedVoters]; u[idx].newPhone = e.target.value; setDeletedVoters(u); }} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e8d5ac', boxSizing: 'border-box', outline: 'none', fontSize: '11px' }} placeholder="New Phone" />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => setDeletedVoters([...deletedVoters, { name: '', nic: '', reason: '', deathDate: '', newAddress: '', newPhone: '' }])} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #6A2301', color: '#6A2301', backgroundColor: '#fff', cursor: 'pointer', fontSize: '10px', fontWeight: 700 }}>+ Add Elector Deletion Entry</button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Step 3: Chief Occupant Signatures & Legal Affirmation */}
              {formStep === 3 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 4: Chief Occupant's Declaration &amp; Contact Info</span>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Full Name of Chief Occupant</label>
                    <input type="text" required onChange={e => handleInputChange('voterChiefName', e.target.value)} value={inputs.voterChiefName || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Enter Chief Occupant Name" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>NIC Number of Chief Occupant</label>
                    <input type="text" required onChange={e => handleInputChange('voterChiefNic', e.target.value)} value={inputs.voterChiefNic || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Chief Occupant NIC" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Telephone Number</label>
                      <input type="text" required onChange={e => handleInputChange('voterChiefPhone', e.target.value)} value={inputs.voterChiefPhone || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. 07XXXXXXXX" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>WhatsApp Number (For Digital Updates)</label>
                      <input type="text" required onChange={e => handleInputChange('voterChiefWhatsApp', e.target.value)} value={inputs.voterChiefWhatsApp || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. 07XXXXXXXX" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#eae5d8', padding: '12px', borderRadius: '10px', marginTop: '6px' }}>
                    <input type="checkbox" required style={{ accentColor: '#6A2301', marginTop: '3px' }} />
                    <span style={{ fontSize: '11px', color: '#3d2a00', fontWeight: 600, lineHeight: 1.4 }}>
                      <strong>Legal Acknowledgment Checkbox:</strong> I hereby declare that the particulars given above are true and accurate to the best of my knowledge and belief. I am fully aware that willfully providing false information is a punishable offence under Section 12(4) of the Registration of Electors Act, carrying penalties of a fine up to Rs. 500, up to 1 month imprisonment, or both.
                    </span>
                  </div>
                </>
              )}
            </>
          )}

          {/* ==========================================
              MODULE H: PERMIT FOR FELLING TREES (FORM ID: 8)
             ========================================== */}
          {form.id === 8 && (
            <>
              {/* STEP 1: Applicant Designation Specs */}
              {formStep === 1 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 1: Core Identification &amp; Administrative Meta</span>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '6px' }}>Applicant Status Designation</label>
                    <div style={{ display: 'flex', gap: '24px', fontSize: '13px', fontWeight: 700 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="radio" name="tfStatusRadio" checked={inputs.treeApplicantStatus === 'Land Owner'} onChange={() => handleInputChange('treeApplicantStatus', 'Land Owner')} style={{ accentColor: '#6A2301' }} /> Land Owner
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <input type="radio" name="tfStatusRadio" checked={inputs.treeApplicantStatus === 'Authorized Representative'} onChange={() => handleInputChange('treeApplicantStatus', 'Authorized Representative')} style={{ accentColor: '#6A2301' }} /> Authorized Representative / Non-Owner
                      </label>
                    </div>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Full Name of Applicant</label>
                    <input type="text" required onChange={e => handleInputChange('treeFullName', e.target.value)} value={inputs.treeFullName || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Full Name of Applicant" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>National Identity Card (NIC) Number</label>
                      <input type="text" required onChange={e => handleInputChange('treeNic', e.target.value)} value={inputs.treeNic || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: errors.treeNic ? '1.5px solid red' : '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="NIC Number" />
                      {errors.treeNic && <span style={S.errorMsg}>{errors.treeNic}</span>}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Contact Number</label>
                      <input type="text" required onChange={e => handleInputChange('treePhone', e.target.value)} value={inputs.treePhone || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: errors.treePhone ? '1.5px solid red' : '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Contact Number (10 Digits)" />
                      {errors.treePhone && <span style={S.errorMsg}>{errors.treePhone}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginTop: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Permanent Address of Applicant</label>
                      <input type="text" required onChange={e => handleInputChange('treePermanentAddress', e.target.value)} value={inputs.treePermanentAddress || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Permanent Address of Applicant" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>WhatsApp Number (Optional)</label>
                      <input type="text" onChange={e => handleInputChange('treeWhatsApp', e.target.value)} value={inputs.treeWhatsApp || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: errors.treeWhatsApp ? '1.5px solid red' : '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="WhatsApp Number" />
                      {errors.treeWhatsApp && <span style={S.errorMsg}>{errors.treeWhatsApp}</span>}
                    </div>
                  </div>
                </>
              )}

              {/* STEP 2: Land Profile & Location Identity */}
              {formStep === 2 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 2: Land Profile &amp; Location Identity</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginTop: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Name of Land / Property Title</label>
                      <input type="text" required onChange={e => handleInputChange('treeLandName', e.target.value)} value={inputs.treeLandName || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Name of Land / Property Title" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>District</label>
                      <input type="text" required onChange={e => handleInputChange('treeDistrict', e.target.value)} value={inputs.treeDistrict || userData?.district || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="District" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Divisional Secretariat Division</label>
                      <input type="text" required onChange={e => handleInputChange('treeDsDivision', e.target.value)} value={inputs.treeDsDivision || userData?.dsDiv || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Divisional Secretariat Division" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Grama Niladhari (G.N.) Division &amp; Number</label>
                      <input type="text" required onChange={e => handleInputChange('treeGnDivision', e.target.value)} value={inputs.treeGnDivision || userData?.gnDiv || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Grama Niladhari Division" />
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '10px', border: '1.5px solid #e8d5ac', marginTop: '10px' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#6A2301', textTransform: 'uppercase', marginBottom: '6px' }}>Land Extent / Dimensions</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <input type="number" placeholder="Acres" onChange={e => handleInputChange('treeLandAcres', e.target.value)} value={inputs.treeLandAcres || ''} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} />
                      <input type="number" placeholder="Roods" onChange={e => handleInputChange('treeLandRoods', e.target.value)} value={inputs.treeLandRoods || ''} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} />
                      <input type="number" placeholder="Perches" onChange={e => handleInputChange('treeLandPerches', e.target.value)} value={inputs.treeLandPerches || ''} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', outline: 'none' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Classification of Land Ownership</label>
                      <select required onChange={e => handleInputChange('treeOwnershipType', e.target.value)} value={inputs.treeOwnershipType || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', backgroundColor: '#fff', outline: 'none' }}>
                        <option value="">-- Select Dropdown --</option>
                        <option value="Private">Private</option>
                        <option value="Government / State">Government / State</option>
                        <option value="LDO Lease / Permit Land">LDO Lease / Permit Land</option>
                        <option value="Temple Property / Viharagam">Temple Property / Viharagam</option>
                        <option value="Other Tenure Matrix">Other Tenure Matrix</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Deed / Permit Number &amp; Registration Date</label>
                      <input type="text" required onChange={e => handleInputChange('treeDeedNoDate', e.target.value)} value={inputs.treeDeedNoDate || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Deed / Permit Number &amp; Date" />
                    </div>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Is the land subject to any ongoing legal disputes or court restrictions?</label>
                    <select required onChange={e => handleInputChange('treeLegalDisputesExist', e.target.value)} value={inputs.treeLegalDisputesExist || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', backgroundColor: '#fff', outline: 'none' }}>
                      <option value="">-- Select --</option><option value="No">No</option><option value="Yes">Yes</option>
                    </select>
                  </div>
                </>
              )}

              {/* STEP 3: Boundary Matrix Configuration fields */}
              {formStep === 3 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 3: Four Spatial Boundaries</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>North Boundary</label>
                      <input type="text" required onChange={e => handleInputChange('treeBoundNorth', e.target.value)} value={inputs.treeBoundNorth || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="North boundary bounded by" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>East Boundary</label>
                      <input type="text" required onChange={e => handleInputChange('treeBoundEast', e.target.value)} value={inputs.treeBoundEast || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="East boundary bounded by" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>South Boundary</label>
                      <input type="text" required onChange={e => handleInputChange('treeBoundSouth', e.target.value)} value={inputs.treeBoundSouth || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="South boundary bounded by" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>West Boundary</label>
                      <input type="text" required onChange={e => handleInputChange('treeBoundWest', e.target.value)} value={inputs.treeBoundWest || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="West boundary bounded by" />
                    </div>
                  </div>
                </>
              )}

              {/* STEP 4: Tree Logistics Repeatable Grid Component */}
              {formStep === 4 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301' }}>Step 4: Specific Tree Logistics Array Grid</span>
                    <button type="button" onClick={() => setTreeLogistics([...treeLogistics, { species: '', girth: '', height: '', middleGirth: '', reason: '', proximityDanger: 'No' }])} style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #6A2301', color: '#6A2301', backgroundColor: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>+ Add Tree Matrix Row</button>
                  </div>
                  
                  {treeLogistics.map((tree, idx) => (
                    <div key={`tree-row-${idx}`} style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1.5px solid #e8d5ac', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
                        <input type="text" required placeholder="Tree Species / Variety" value={tree.species} onChange={e => handleTreeRowChange(idx, 'species', e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', fontSize: '12px' }} />
                        <input type="text" required placeholder="Girth in Meters / Inches" value={tree.girth} onChange={e => handleTreeRowChange(idx, 'girth', e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', fontSize: '12px' }} />
                        <input type="text" required placeholder="Height in Meters" value={tree.height} onChange={e => handleTreeRowChange(idx, 'height', e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', fontSize: '12px' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                        <input type="text" required placeholder="Girth at Breast Height / Middle Girth" value={tree.middleGirth} onChange={e => handleTreeRowChange(idx, 'middleGirth', e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', fontSize: '12px' }} />
                        <input type="text" required placeholder="Specific Reason for Requesting Felling" value={tree.reason} onChange={e => handleTreeRowChange(idx, 'reason', e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', fontSize: '12px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', color: '#B46A02', cursor: 'pointer' }}>
                          <input type="checkbox" checked={tree.proximityDanger === 'Yes'} onChange={e => handleTreeRowChange(idx, 'proximityDanger', e.target.checked ? 'Yes' : 'No')} style={{ accentColor: '#6A2301' }} />
                          Proximity Danger Flag: Is the tree situated dangerously close to utility lines, boundary fences, or neighboring residential buildings?
                        </label>
                      </div>
                      {treeLogistics.length > 1 && (
                        <button type="button" onClick={() => handleRemoveRow('treeMatrix', idx)} style={{ border: 'none', background: 'none', color: '#d32f2f', fontWeight: 700, fontSize: '11px', cursor: 'pointer', textAlign: 'right' }}>Remove Row ×</button>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* STEP 5: Required Document Verification Streams */}
              {formStep === 5 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 5: Required Document Upload Array</span>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                    <div style={{ backgroundColor: '#fff', border: '1.5px dashed #B46A02', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800 }}>Certified Copy of Title Deed / Lease Permit</span>
                      <input type="file" required style={{ fontSize: '11px' }} />
                    </div>
                    <div style={{ backgroundColor: '#fff', border: '1.5px dashed #B46A02', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800 }}>Approved Survey Plan PDF</span>
                      <input type="file" required style={{ fontSize: '11px' }} />
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#fff', border: '1.5px dashed #B46A02', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800 }}>Photographic Evidence</span>
                    <span style={{ fontSize: '10px', color: '#666' }}>Upload clear photos showcasing the tree profile and its structural environment context safely.</span>
                    <input type="file" required style={{ fontSize: '12px', marginTop: '2px' }} />
                  </div>

                  {inputs.treeOwnershipType === 'Temple Property / Viharagam' && (
                    <div style={{ backgroundColor: '#fff', border: '1.5px dashed #B46A02', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px', animation: 'fadeIn 0.2s ease', marginTop: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#d32f2f' }}>Written Consent / Affidavit of Co-Owners Required</span>
                      <input type="file" required style={{ fontSize: '11px' }} />
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#eae5d8', padding: '12px', borderRadius: '10px', marginTop: '10px' }}>
                    <input type="checkbox" required defaultChecked style={{ accentColor: '#6A2301', marginTop: '3px' }} />
                    <span style={{ fontSize: '11px', color: '#333', fontWeight: 600, lineHeight: 1.4 }}>
                      I hereby state that all the logged metrics regarding timber dimensions and land tenure classification lines correspond to legal ownership frameworks accurately.
                    </span>
                  </div>
                </>
              )}
            </>
          )}

          {/* ==========================================
              MODULE I: TREE TIMBER & REMOVAL PERMIT (FORM ID: 9)
             ========================================== */}
          {form.id === 9 && (
            <>
              {/* Step 1: Applicant & Basic Request Information */}
              {formStep === 1 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 1: Applicant &amp; Basic Request Information</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Gramasewaka (G.N.) Division</label>
                      <input type="text" required onChange={e => handleInputChange('removalGnDiv', e.target.value)} value={inputs.removalGnDiv || userData?.gnDiv || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', outline: 'none' }} placeholder="Targeted area division" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Divisional Secretary (D.S.) Office</label>
                      <input type="text" required onChange={e => handleInputChange('removalDsOffice', e.target.value)} value={inputs.removalDsOffice || userData?.dsDiv || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', outline: 'none' }} placeholder="e.g. Kahawatta" />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Applicant Full Name</label>
                    <input type="text" required onChange={e => handleInputChange('voterChiefName', e.target.value)} value={inputs.voterChiefName || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', outline: 'none' }} placeholder="Applicant Name" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Applicant NIC Number</label>
                      <input type="text" required onChange={e => handleInputChange('voterChiefNic', e.target.value)} value={inputs.voterChiefNic || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: errors.voterChiefNic ? '1.5px solid red' : '1.5px solid #e8d5ac', outline: 'none' }} placeholder="NIC" />
                      {errors.voterChiefNic && <span style={S.errorMsg}>{errors.voterChiefNic}</span>}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Contact Number</label>
                      <input type="text" required onChange={e => handleInputChange('voterChiefPhone', e.target.value)} value={inputs.voterChiefPhone || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: errors.voterChiefPhone ? '1.5px solid red' : '1.5px solid #e8d5ac', outline: 'none' }} placeholder="10 Digits" />
                      {errors.voterChiefPhone && <span style={S.errorMsg}>{errors.voterChiefPhone}</span>}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Landowner Name(s) (Leave blank if same as applicant)</label>
                    <input type="text" onChange={e => handleInputChange('removalLandownerName', e.target.value)} value={inputs.removalLandownerName || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', outline: 'none' }} placeholder="Landowner Title Holder Name" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Reason for cutting/removing the tree(s)</label>
                    <textarea rows={2} required onChange={e => handleInputChange('treeCuttingReason', e.target.value)} value={inputs.treeCuttingReason || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', outline: 'none', resize: 'none', fontFamily: 'inherit' }} placeholder="e.g. Threat to property stability, development..." />
                  </div>
                </>
              )}

              {/* Step 2: Land Profile & Location Identity */}
              {formStep === 2 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 2: Legal Land Profile &amp; Location Identity</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Name of the Land</label>
                      <input type="text" required onChange={e => handleInputChange('removalLandName', e.target.value)} value={inputs.removalLandName || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', outline: 'none' }} placeholder="Land Registry Denomination Name" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Village / Local Area</label>
                      <input type="text" required onChange={e => handleInputChange('removalVillageLocalArea', e.target.value)} value={inputs.removalVillageLocalArea || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', outline: 'none' }} placeholder="Village Location" />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Type of Land Ownership</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', fontWeight: 700, padding: '4px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="radio" name="remOwnershipRadio" checked={inputs.removalOwnershipType === 'Government Land'} onChange={() => handleInputChange('removalOwnershipType', 'Government Land')} style={{ accentColor: '#6A2301' }} /> Government Land</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="radio" name="remOwnershipRadio" checked={inputs.removalOwnershipType === 'Private Land'} onChange={() => handleInputChange('removalOwnershipType', 'Private Land')} style={{ accentColor: '#6A2301' }} /> Private Land</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="radio" name="remOwnershipRadio" checked={inputs.removalOwnershipType === 'Traditional Ownership'} onChange={() => handleInputChange('removalOwnershipType', 'Traditional Ownership')} style={{ accentColor: '#6A2301' }} /> Traditional Ownership (Nindagam)</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="radio" name="remOwnershipRadio" checked={inputs.removalOwnershipType === 'Other'} onChange={() => handleInputChange('removalOwnershipType', 'Other')} style={{ accentColor: '#6A2301' }} /> Other</label>
                    </div>
                  </div>

                  <div style={{ border: '1.5px solid #e8d5ac', borderRadius: '12px', padding: '12px', backgroundColor: '#fff' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#6A2301', textTransform: 'uppercase', marginBottom: '6px' }}>Four Spatial Boundaries</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <input type="text" placeholder="North" required onChange={e => handleInputChange('remBoundNorth', e.target.value)} value={inputs.remBoundNorth || ''} style={{ padding: '8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #e8d5ac' }} />
                      <input type="text" placeholder="East" required onChange={e => handleInputChange('remBoundEast', e.target.value)} value={inputs.remBoundEast || ''} style={{ padding: '8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #e8d5ac' }} />
                      <input type="text" placeholder="South" required onChange={e => handleInputChange('remBoundSouth', e.target.value)} value={inputs.remBoundSouth || ''} style={{ padding: '8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #e8d5ac' }} />
                      <input type="text" placeholder="West" required onChange={e => handleInputChange('remBoundWest', e.target.value)} value={inputs.remBoundWest || ''} style={{ padding: '8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #e8d5ac' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Land Deed / Permit / Grant Number</label>
                      <input type="text" required onChange={e => handleInputChange('removalDeedNumber', e.target.value)} value={inputs.removalDeedNumber || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', outline: 'none' }} placeholder="Deed / Grant Number" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Date of Deed / Permit</label>
                      <input type="date" required onChange={e => handleInputChange('removalDeedDate', e.target.value)} value={inputs.removalDeedDate || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', outline: 'none' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', marginBottom: '4px' }}>Is there any ongoing legal dispute or court case regarding this land?</label>
                    <select required onChange={e => handleInputChange('removalDisputeStatus', e.target.value)} value={inputs.removalDisputeStatus || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', backgroundColor: '#fff', outline: 'none' }}>
                      <option value="">-- Select --</option><option value="No">No</option><option value="Yes">Yes</option>
                    </select>
                  </div>
                </>
              )}

              {/* Step 3: Tree & Timber Table Array Matrix */}
              {formStep === 3 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301' }}>Step 3: Specific Tree &amp; Timber Details Matrix</span>
                    <button type="button" onClick={() => setTimberGrid([...timberGrid, { species: '', girth: '', height: '', woodVol: '', firewoodVol: '', infraImpact: 'No' }])} style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #6A2301', color: '#6A2301', backgroundColor: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>+ Add Row</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {timberGrid.map((row, idx) => (
                      <div key={`timber-row-${idx}`} style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1.5px solid #e8d5ac', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
                          <input type="text" required placeholder="Species / Variety of Tree" value={row.species} onChange={e => handleTimberGridChange(idx, 'species', e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', fontSize: '12px' }} />
                          <input type="text" required placeholder="Girth / Circumference (M)" value={row.girth} onChange={e => handleTimberGridChange(idx, 'girth', e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', fontSize: '12px' }} />
                          <input type="text" required placeholder="Height (Meters)" value={row.height} onChange={e => handleTimberGridChange(idx, 'height', e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', fontSize: '12px' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                          <input type="text" required placeholder="Est Wood Volume (m³)" value={row.woodVol} onChange={e => handleTimberGridChange(idx, 'woodVol', e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', fontSize: '12px' }} />
                          <input type="text" required placeholder="Est Firewood Vol (m³)" value={row.firewoodVol} onChange={e => handleTimberGridChange(idx, 'firewoodVol', e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', fontSize: '12px' }} />
                          <select value={row.infraImpact} onChange={e => handleTimberGridChange(idx, 'infraImpact', e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e8d5ac', fontSize: '12px', backgroundColor: '#fff' }}>
                            <option value="No">No Infrastructure Threat</option><option value="Yes">Yes (Danger / Impact)</option>
                          </select>
                        </div>
                        {timberGrid.length > 1 && (
                          <button type="button" onClick={() => handleRemoveRow('timberGrid', idx)} style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: '#d32f2f', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>Remove Row ×</button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Step 4: Visual Sketch Map Layout Diagrams & Mandatory Document Upload Slots */}
              {formStep === 4 && (
                <>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>Step 4: Sketch Map &amp; Mandatory Document Upload Array</span>
                  
                  <div style={{ backgroundColor: '#fff', border: '1.5px dashed #B46A02', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800 }}>Land Sketch Map / Layout Diagram *</span>
                    <span style={{ fontSize: '11px', color: '#666' }}>Upload a hand-drawn sketch or digital map showing the location of the trees on the land plot.</span>
                    <input type="file" required style={{ fontSize: '11px', marginTop: '4px' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ backgroundColor: '#fff', border: '1.5px dashed #e8d5ac', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800 }}>Certified Copy of Title Deed, Permit, or Grant *</span>
                      <input type="file" required style={{ fontSize: '11px' }} />
                    </div>
                    <div style={{ backgroundColor: '#fff', border: '1.5px dashed #e8d5ac', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800 }}>Certified Copy of Land Plan Map *</span>
                      <input type="file" required style={{ fontSize: '11px' }} />
                    </div>
                  </div>

                  {inputs.removalLandownerName && inputs.removalLandownerName !== '' && (
                    <div style={{ backgroundColor: '#fff', border: '1.5px dashed #B46A02', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', animation: 'fadeIn 0.2s ease' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#6A2301' }}>Letter of Consent from Co-owners / Shared Registry Title *</span>
                      <span style={{ fontSize: '10px', color: '#666' }}>Mandatory field upload since the primary applicant name is separate from the deed baseline title holder lines.</span>
                      <input type="file" required style={{ fontSize: '11px', marginTop: '4px' }} />
                    </div>
                  )}

                  <div style={{ backgroundColor: '#fff', border: '1.5px dashed #e8d5ac', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800 }}>Any other supporting documents justifying tree removal</span>
                    <input type="file" style={{ fontSize: '11px' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', backgroundColor: '#eae5d8', padding: '12px', borderRadius: '10px' }}>
                    <input type="checkbox" required defaultChecked style={{ accentColor: '#6A2301', marginTop: '2px' }} />
                    <span style={{ fontSize: '11px', color: '#333', fontWeight: 600, lineHeight: 1.4 }}>
                      I hereby state that all property boundaries, volume projections, and infrastructure threat criteria logged here are valid and accurate to the best of my belief.
                    </span>
                  </div>
                </>
                
              )}
            </>
          )}

{/* ==========================================
    MODULE J: BUSINESS REGISTRATION RECOMMENDATION (FORM ID: 10)
    ========================================== */}
{form.id === 10 && (
  <>
    {/* STEP 1: Owner Profile & Business Baseline Meta */}
    {formStep === 1 && (
      <>
        <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>01. Business Ownership &amp; Identity Baseline</span>
        
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Proposed Business Entity Name</label>
          <input type="text" required onChange={e => handleInputChange('biz_prop_name', e.target.value)} value={inputs.biz_prop_name || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="e.g. Smart Grama Services" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Nature of Business / Category</label>
            <select required onChange={e => handleInputChange('biz_nature_type', e.target.value)} value={inputs.biz_nature_type || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', backgroundColor: '#fff', outline: 'none' }}>
              <option value="">-- Select Type --</option>
              <option value="Retail Store">Retail Shop / Grocery</option>
              <option value="IT Services">Software / Technology Services</option>
              <option value="Manufacturing">Manufacturing / Workshop</option>
              <option value="Other">Other Commercial Entities</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Legal Structure Type</label>
            <select required onChange={e => handleInputChange('biz_legal_structure', e.target.value)} value={inputs.biz_legal_structure || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', backgroundColor: '#fff', outline: 'none' }}>
              <option value="Sole Proprietorship">Sole Proprietorship</option>
              <option value="Partnership">Partnership</option>
              <option value="Private Limited Company">Private Limited Company</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Primary Proprietor Full Name</label>
            <input type="text" required onChange={e => handleInputChange('biz_owner_name', e.target.value)} value={inputs.biz_owner_name || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="Proprietor's Full Name" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Owner NIC Number</label>
            <input type="text" required onChange={e => handleInputChange('biz_owner_nic', e.target.value)} value={inputs.biz_owner_nic || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: errors.biz_owner_nic ? '1.5px solid red' : '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="NIC Number" />
            {errors.biz_owner_nic && <span style={S.errorMsg}>{errors.biz_owner_nic}</span>}
          </div>
        </div>
      </>
    )}

    {/* STEP 2: Environmental Compliance Criteria & Premises Tenure Info */}
    {formStep === 2 && (
      <>
        <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>02. Location Profile &amp; Environmental Frameworks</span>
        
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Physical Address of Business Premises</label>
          <textarea rows={2} required onChange={e => handleInputChange('biz_premises_address', e.target.value)} value={inputs.biz_premises_address || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none', resize: 'none', fontFamily: 'inherit' }} placeholder="Enter exact structural location details..." />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Premises Ownership Type</label>
            <select required onChange={e => handleInputChange('biz_tenure_type', e.target.value)} value={inputs.biz_tenure_type || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', backgroundColor: '#fff', outline: 'none' }}>
              <option value="">-- Select Status --</option>
              <option value="Owned by Applicant">Owned by Applicant</option>
              <option value="Rented / Leased Premises">Rented / Leased Premises</option>
              <option value="Family-Owned">Family-Owned Property</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#B46A02', textTransform: 'uppercase', marginBottom: '4px' }}>Estimated Initial Capital Investment (LKR)</label>
            <input type="number" required onChange={e => handleInputChange('biz_initial_capital', e.target.value)} value={inputs.biz_initial_capital || ''} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e8d5ac', boxSizing: 'border-box', outline: 'none' }} placeholder="0.00" />
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '12px', border: '1.5px solid #e8d5ac', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#6A2301', textTransform: 'uppercase' }}>Environmental Protection Compliance</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: '#3d2a00', cursor: 'pointer' }}>
            <input type="checkbox" required defaultChecked style={{ accentColor: '#6A2301' }} />
            I verify that business operations cause no hazardous industrial chemical leakage, waste accumulation, or auditory disturbance violating environmental protocols.
          </label>
        </div>
      </>
    )}

    {/* STEP 3: Document Uploads */}
    {formStep === 3 && (
      <>
        <span style={{ fontSize: '13px', fontWeight: 800, color: '#6A2301', borderBottom: '1px dashed #e8d5ac', paddingBottom: '4px' }}>03. Verifiable Legal Deeds &amp; Documents</span>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ backgroundColor: '#fff', border: '1.5px dashed #B46A02', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800 }}>Premises Proof (Deed / Lease Agreement Scan) *</span>
            <input type="file" required style={{ fontSize: '11px' }} />
          </div>
          <div style={{ backgroundColor: '#fff', border: '1.5px dashed #B46A02', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800 }}>Proprietor Identity Copy (NIC Scan) *</span>
            <input type="file" required style={{ fontSize: '11px' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', backgroundColor: '#eae5d8', padding: '12px', borderRadius: '10px', marginTop: '6px' }}>
          <input type="checkbox" required defaultChecked style={{ accentColor: '#6A2301', marginTop: '2px' }} />
          <span style={{ fontSize: '11px', color: '#333', fontWeight: 600, lineHeight: 1.4 }}>
            I hereby certify that all information submitted regarding company nature, ownership credentials, and commercial assets are completely truthful and valid.
          </span>
        </div>
      </>
    )}
  </>
)}


          {/* Action Control Interface Buttons Wizard Panel Tray */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', flexShrink: 0 }}>
            <button 
              type="button" 
              onClick={() => { if (formStep === 1) onClose(); else setFormStep(prev => prev - 1); }} 
              style={{ padding: '10px 24px', borderRadius: '999px', border: '1.5px solid #e8d5ac', backgroundColor: '#fff', fontWeight: 700, cursor: 'pointer', color: '#888' }}
            >
              Back
            </button>
            <button 
              type="submit" 
              disabled={form.id === 7 && formStep === 2 && voterPurpose === ''}
              style={{ padding: '10px 24px', borderRadius: '999px', border: 'none', backgroundColor: (form.id === 7 && formStep === 2 && voterPurpose === '') ? '#ccc' : '#6A2301', color: '#fff', fontWeight: 800, cursor: (form.id === 7 && formStep === 2 && voterPurpose === '') ? 'not-allowed' : 'pointer', marginLeft: 'auto' }}
            >
              {((form.id === 3 && formStep === 4) || (form.id === 6 && formStep === 4) || (form.id === 7 && formStep === 4) || (form.id === 8 && formStep === 5) || (form.id === 9 && formStep === 4) || (form.id !== 3 && form.id !== 6 && form.id !== 7 && form.id !== 8 && form.id !== 9 && formStep === 3)) ? 'Submit' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

// MAIN FORMS COMPONENT
const Forms = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState('All');
  const [selectedForm, setSelectedForm] = useState(null);
  const [formInputs, setFormInputs] = useState({});
  const [toast, setToast] = useState(null);

  const tabs = ['All', 'Certificates', 'Applications', 'Recommendations'];

  const formList = [
    { id: 1, title: "Residence Certificate", cat: "Certificates", imgSrc: "/icons/residence.png", desc: "Proof of residence for official use" },
    { id: 2, title: "Character Certificate", cat: "Certificates", imgSrc: "/icons/character.png", desc: "Proof of character for various purposes" },
    { id: 3, title: "Income Certificate", cat: "Certificates", imgSrc: "/icons/income.png", desc: "Proof of income for various purposes" },
    { id: 4, title: "Valuation Certificate", cat: "Certificates", imgSrc: "/icons/valuation.png", desc: "Property valuation for legal needs" },
    { id: 5, title: "Identity Card Application", cat: "Applications", imgSrc: "/icons/id-card.png", desc: "New or replacement NIC application" },
    { id: 6, title: "Living Funds for Disabled Persons", cat: "Recommendations", imgSrc: "/icons/disabled.png", desc: "Financial assistance application for persons with disabilities" },
    { id: 7, title: "Voter Registration Form", cat: "Applications", imgSrc: "/icons/voter.png", desc: "Register or revise names on the local voting list" },
    { id: 8, title: "Permit for Felling Trees", cat: "Recommendations", imgSrc: "/icons/tree.png", desc: "Approval to cut down Jack or protected trees" },
    { id: 9, title: "Permit for Timber Transportation", cat: "Recommendations", imgSrc: "/icons/timber.png", desc: "Legal permit to move timber between areas" },
    { id: 10, title: "Business Registration Recommendation", cat: "Recommendations", imgSrc: "/icons/business.png", desc: "GN approval for new business starts" },
    { id: 11, title: "Assessments for Ownership of Lands", cat: "Certificates", imgSrc: "/icons/land.png", desc: "Verify land ownership and boundaries" },
  ];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Read theme from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch(e) {}
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) setUserData(snap.data());
        } catch (e) { console.warn(e); }
      } else {
        navigate('/login');
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  const handleLogout = async () => { await signOut(auth); navigate('/login'); };
  const chipName = userData?.username || userData?.fullName || currentUser?.email?.split('@')[0] || 'User';

  const handleLanguageChange = (langCode) => {
    setCurrentLanguage(langCode);
    i18n.changeLanguage(langCode);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setShowSearchResults(false);
      setShowProfileMenu(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-user-background dark:bg-user-background">
      <div className="w-11 h-11 rounded-full border-4 border-user-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="user-module min-h-screen flex flex-col font-sans bg-user-background dark:bg-user-background">
      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        {!isMobile && <DesktopSidebar activePage="forms" navigate={navigate} onLogout={handleLogout} />}

        {/* Mobile Sidebar Overlay */}
        <MobileSidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          activePage="forms"
          navigate={navigate}
          onLogout={handleLogout}
        />

        {/* Main Column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Desktop Topbar */}
          {!isMobile && (
            <DesktopTopbar 
              chipName={chipName}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              showResults={showSearchResults}
              setShowResults={setShowSearchResults}
              navigate={navigate}
              currentLanguage={currentLanguage}
              onLanguageChange={handleLanguageChange}
              showProfileMenu={showProfileMenu}
              setShowProfileMenu={setShowProfileMenu}
              handleLogout={handleLogout}
            />
          )}

          {/* Mobile Topbar */}
          <MobileTopbar 
            chipName={chipName}
            onMenuClick={() => setMobileMenuOpen(true)}
            navigate={navigate}
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
          />

          {/* Mobile Search Bar */}
          <div className="pt-3 px-3.5 relative">
              <div className="flex items-center gap-2.5 bg-white border border-user-border rounded-3xl px-4 py-2.5">
                <Icon d={IC.search} size={16} color="#aaa" />
                <input
                  type="text"
                  placeholder="Search for a page..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  className="flex-1 border-none outline-none text-sm font-medium text-user-text bg-transparent"
                />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setShowSearchResults(false); }} className="bg-none border-none cursor-pointer p-1">
                  <Icon d={IC.close} size={14} color="#aaa" />
                </button>
              )}
            </div>
            <SearchResultsDropdown 
              searchQuery={searchQuery}
              showResults={showSearchResults}
              setShowResults={setShowSearchResults}
              navigate={navigate}
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h1 className="text-2xl md:text-3xl font-black text-user-text dark:text-user-text tracking-tight">Forms</h1>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-5 border-b-2 border-user-border dark:border-user-border">
              {tabs.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`py-2.5 px-5 border-none bg-transparent text-sm font-semibold cursor-pointer transition-all ${
                    tab === t ? 'text-user-primary font-extrabold border-b-2 border-user-primary' : 'text-user-text-lighter hover:text-user-text'
                  }`}
                >
                  {t}
                </button>
              ))}
              <button className="ml-auto py-2.5 px-5 bg-user-primary hover:bg-user-primary-dark text-white rounded-full text-sm font-bold cursor-pointer transition-all">
                My Forms
              </button>
            </div>

            {/* Form Cards */}
            <div className="grid grid-cols-1 gap-3 pb-5">
              {formList.filter(f => tab === 'All' || f.cat === tab).map(form => (
                <div key={form.id} className="bg-user-surface dark:bg-user-surface border border-user-border dark:border-user-border rounded-xl p-5 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-user-secondary-light dark:bg-user-secondary-light rounded-xl flex items-center justify-center flex-shrink-0">
                      <img src={form.imgSrc} alt={form.title} className="w-10 h-10 object-contain" />
                    </div>
                    <div>
                      <div className="text-base font-extrabold text-user-text dark:text-user-text">{form.title}</div>
                      <div className="text-xs font-semibold text-user-text-lighter dark:text-user-text-lighter">{form.desc}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setSelectedForm(form); setFormInputs({}); }}
                    className="py-2 px-5 rounded-lg border border-user-border dark:border-user-border bg-user-surface dark:bg-user-surface text-sm font-extrabold text-user-text dark:text-user-text cursor-pointer transition-all hover:border-user-primary"
                  >
                    View Form
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#6A2301] text-white text-center py-3 px-4 text-sm font-semibold">
        © 2026 Smart Grama Sewa. All rights reserved.
      </footer>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[1100] animate-slide-up">
          <div className={`flex items-center gap-4 py-3 px-6 rounded-xl shadow-lg ${toast.type === 'success' ? 'bg-user-success' : 'bg-user-error'} text-white`}>
            <Icon d={toast.type === 'success' ? IC.check : IC.alertTriangle} size={18} color="#fff" sw={2.5} />
            <span className="text-sm font-semibold">{toast.message}</span>
            <button onClick={() => setToast(null)} className="bg-none border-none cursor-pointer text-white text-xl leading-5 p-0">×</button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <DynamicFormModal 
        form={selectedForm} 
        onClose={() => setSelectedForm(null)} 
        inputs={formInputs} 
        setInputs={setFormInputs} 
        currentUser={currentUser} 
        userData={userData} 
        db={db}
        onSuccess={showToast}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slide-up {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease; }
        .rounded-full { border-radius: 999px; }

        @media (min-width: 769px) {
          .desktop-sidebar { display: flex !important; }
          .desktop-topbar { display: flex !important; }
          .mobile-topbar { display: none !important; }
        }

        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .desktop-topbar { display: none !important; }
          .mobile-topbar { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

export default Forms;