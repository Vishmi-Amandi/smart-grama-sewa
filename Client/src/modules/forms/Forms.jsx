import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../user/components/languageSwitcher';

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
  close: 'M18 6L6 18M6 6l12 12',
  chevLeft: 'M15 18l-6-6 6-6',
  chevRight: 'M9 18l6-6-6-6',
  chevDown: 'M6 9l6 6 6-6',
  chevUp: 'M18 15l-6-6-6 6',
  sun: 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M5.64 17.66l1.41-1.41M16.95 6.05l1.41-1.41M12 6a6 6 0 100 12 6 6 0 000-12z',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  globe: 'M12 2a10 10 0 100 20 10 10 0 000-20z M12 2c2 2 3 4.5 3 10s-1 8-3 10 M12 2c-2 2-3 4.5-3 10s1 8 3 10 M22 12h-4 M2 12H6',
  palette: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  info: 'M12 2a10 10 0 100 20 10 10 0 000-20z M12 8v4 M12 16h.01',
  check: 'M20 6L9 17l-5-5',
  alertTriangle: 'M12 9v4M12 17h.01M12 2a10 10 0 100 20 10 10 0 000-20z',
};

// NavItem for sidebar
const NavItem = ({ iconPath, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-none cursor-pointer transition-all duration-150 text-left mb-0.5 ${
    active 
      ? 'bg-white/90 dark:bg-user-primary text-user-text font-extrabold shadow-md' 
      : 'bg-transparent text-user-text font-semibold hover:bg-white/40 dark:hover:bg-white/10'
  }`}
    style={{ color: active ? '#B46A02' : '#5a3a00' }}
  >
    <Icon d={iconPath} size={18} color={active ? '#B46A02' : '#5a3a00'} />
    {label}
  </button>
);

// Desktop Sidebar
const DesktopSidebar = ({ activePage, navigate, onLogout }) => {
  const navItems = [
    { key: 'dashboard', icon: IC.dashboard, label: 'Dashboard', path: '/dashboard' },
    { key: 'announcements', icon: IC.announce, label: 'Announcements', path: '/announcements' },
    { key: 'appointments', icon: IC.appts, label: 'Appointments', path: '/appointments' },
    { key: 'forms', icon: IC.forms, label: 'Forms', path: '/forms' },
    { key: 'ai', icon: IC.ai, label: 'AI Assistant', path: '/ai' },
  ];
  const bottomNav = [
    { key: 'profile', icon: IC.profile, label: 'Profile', path: '/profile' },
    { key: 'settings', icon: IC.settings, label: 'Settings', path: '/settings' },
    { key: 'logout', icon: IC.logout, label: 'Sign out', action: 'logout' },
  ];

  return (
    <div className="desktop-sidebar w-[220px] flex-shrink-0 bg-user-primary flex flex-col sticky top-0 h-screen overflow-y-auto">
      <div className="p-5 pb-4 border-b border-black/10 flex justify-center">
        <img src="/logo2.png" alt="Smart Grama Sewa" className="h-20 w-auto" />
      </div>
      <div className="flex-1 p-3">
        {navItems.map((item) => (
          <NavItem key={item.key} iconPath={item.icon} label={item.label}
            active={activePage === item.key}
            onClick={() => navigate(item.path)} />
        ))}
      </div>
      <div className="p-3 pt-2 border-t border-black/10">
        {bottomNav.map((item) => (
          <NavItem key={item.key} iconPath={item.icon} label={item.label}
            active={activePage === item.key}
            onClick={() => item.action === 'logout' ? onLogout() : navigate(item.path)} />
        ))}
      </div>
    </div>
  );
};

// Desktop Topbar
const DesktopTopbar = ({ chipName, searchQuery, setSearchQuery, showResults, setShowResults, navigate, currentLanguage, onLanguageChange, showProfileMenu, setShowProfileMenu, handleLogout }) => (
  <div className="desktop-topbar h-16 bg-user-surface dark:bg-user-surface border-b border-user-border dark:border-user-border flex items-center px-7 gap-3.5 sticky top-0 z-40 shadow-sm">
    <div className="flex-1 max-w-[400px] relative">
      <div className="flex items-center gap-2.5 bg-user-secondary-light dark:bg-user-secondary-light border border-user-border dark:border-user-border rounded-3xl px-4 py-2 transition-colors hover:border-user-primary">
        <Icon d={IC.search} size={16} color="#aaa" />
        <input
          type="text"
          placeholder="Search for a page or function..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          className="flex-1 border-none outline-none text-sm font-medium text-user-text dark:text-user-text bg-transparent"
        />
        {searchQuery && (
          <button onClick={() => { setSearchQuery(''); setShowResults(false); }} className="bg-none border-none cursor-pointer p-1">
            <Icon d={IC.close} size={14} color="#aaa" />
          </button>
        )}
      </div>
      <SearchResultsDropdown 
        searchQuery={searchQuery}
        showResults={showResults}
        setShowResults={setShowResults}
        navigate={navigate}
      />
    </div>
    <div className="flex-1" />
    
    <LanguageSwitcher 
      currentLanguage={currentLanguage} 
      onLanguageChange={onLanguageChange}
    />
    
    <div className="w-9 h-9 rounded-full bg-user-secondary-light dark:bg-user-secondary-light border border-user-border dark:border-user-border flex items-center justify-center cursor-pointer relative transition-colors hover:border-user-primary">
      <Icon d={IC.bell} size={18} color="#5a3a00" />
      <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white" />
    </div>
    
    <div className="relative">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setShowProfileMenu(!showProfileMenu);
        }}
        className="flex items-center gap-2 py-1 pl-1.5 pr-3.5 bg-user-secondary-light dark:bg-user-secondary-light border border-user-border dark:border-user-border rounded-lg cursor-pointer transition-colors hover:border-user-primary"
      >
        <div className="w-7 h-7 rounded-full bg-user-primary flex items-center justify-center flex-shrink-0">
          <Icon d={IC.profile} size={16} color="#3d2a00" />
        </div>
        <span className="text-sm font-bold text-user-text dark:text-user-text max-w-[100px] truncate">{chipName}</span>
      </button>
      {showProfileMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-user-surface dark:bg-user-surface rounded-xl shadow-lg border border-user-border dark:border-user-border z-50 overflow-hidden">
          <button onClick={() => { navigate('/profile'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
            <Icon d={IC.profile} size={14} /> My Profile
          </button>
          <button onClick={() => { navigate('/settings'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
            <Icon d={IC.settings} size={14} /> Settings
          </button>
          <hr className="my-1 dark:border-gray-700" />
          <button onClick={() => { handleLogout(); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
            <Icon d={IC.logout} size={14} /> Logout
          </button>
        </div>
      )}
    </div>
  </div>
);

// Mobile Topbar
const MobileTopbar = ({ chipName, onMenuClick, navigate, currentLanguage, onLanguageChange }) => (
  <div className="mobile-topbar hidden h-16 bg-user-primary items-center px-4 gap-3 sticky top-0 z-40 shadow-md">
    <button onClick={onMenuClick} className="bg-none border-none cursor-pointer p-1.5 flex-shrink-0">
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#3d2a00" strokeWidth={2.2}>
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
    <div className="flex-1 flex items-center justify-start">
      <img src="/logo2.png" alt="Smart Grama Sewa" className="h-10 w-auto" />
    </div>
    <LanguageSwitcher currentLanguage={currentLanguage} onLanguageChange={onLanguageChange} />
    <div className="w-9 h-9 flex items-center justify-center relative">
      <Icon d={IC.bell} size={22} color="#1e1200" />
      <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500 border border-user-primary" />
    </div>
    <div className="w-9 h-9 rounded-full bg-white/85 flex items-center justify-center cursor-pointer" onClick={() => navigate('/profile')}>
      <Icon d={IC.profile} size={20} color="#3d2a00" />
    </div>
  </div>
);

// Mobile Sidebar Overlay
const MobileSidebar = ({ isOpen, onClose, activePage, navigate, onLogout }) => {
  const navItems = [
    { key: 'dashboard', icon: IC.dashboard, label: 'Dashboard', path: '/dashboard' },
    { key: 'announcements', icon: IC.announce, label: 'Announcements', path: '/announcements' },
    { key: 'appointments', icon: IC.appts, label: 'Appointments', path: '/appointments' },
    { key: 'forms', icon: IC.forms, label: 'Forms', path: '/forms' },
    { key: 'ai', icon: IC.ai, label: 'AI Assistant', path: '/ai' },
  ];
  const bottomNav = [
    { key: 'profile', icon: IC.profile, label: 'Profile', path: '/profile' },
    { key: 'settings', icon: IC.settings, label: 'Settings', path: '/settings' },
    { key: 'logout', icon: IC.logout, label: 'Sign out', action: 'logout' },
  ];

  if (!isOpen) return null;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/50 z-[1000]" />
      <div className="fixed top-0 left-0 w-[250px] h-screen bg-user-primary z-[1001] overflow-y-auto py-5">
        <div className="px-5 pb-5 text-right">
          <button onClick={onClose} className="bg-none border-none text-2xl cursor-pointer text-white">✕</button>
        </div>
        <div className="px-5 pb-5 border-b border-white/20 mb-2 flex justify-center">
          <img src="/logo2.png" alt="Smart Grama Sewa" className="h-12 w-auto" />
        </div>
        {navItems.map((item) => (
          <NavItem key={item.key} iconPath={item.icon} label={item.label}
            active={activePage === item.key}
            onClick={() => { navigate(item.path); onClose(); }} />
        ))}
        <div className="border-t border-white/20 my-3 pt-3">
          {bottomNav.map((item) => (
            <NavItem key={item.key} iconPath={item.icon} label={item.label}
              active={activePage === item.key}
              onClick={() => { if (item.action === 'logout') onLogout(); else navigate(item.path); onClose(); }} />
          ))}
        </div>
      </div>
    </>
  );
};

// Search Results Dropdown Component
const SearchResultsDropdown = ({ searchQuery, showResults, setShowResults, navigate }) => {
  const PAGE_ACTIONS = [
    { name: 'Dashboard', path: '/dashboard', icon: IC.dashboard },
    { name: 'Announcements', path: '/announcements', icon: IC.announce },
    { name: 'Appointments', path: '/appointments', icon: IC.appts },
    { name: 'Forms', path: '/forms', icon: IC.forms },
    { name: 'AI Assistant', path: '/ai', icon: IC.ai },
    { name: 'Profile', path: '/profile', icon: IC.profile },
    { name: 'Settings', path: '/settings', icon: IC.settings },
  ];
  
  const [filteredPages, setFilteredPages] = useState([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPages([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = PAGE_ACTIONS.filter(page =>
      page.name.toLowerCase().includes(query)
    );
    setFilteredPages(filtered);
  }, [searchQuery]);

  if (!showResults || filteredPages.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-user-surface dark:bg-user-surface rounded-xl shadow-lg border border-user-border dark:border-user-border z-[1000] overflow-hidden">
      {filteredPages.map((page, idx) => (
        <button
          key={page.path}
          onClick={() => {
            navigate(page.path);
            setShowResults(false);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-user-background dark:hover:bg-user-background ${idx !== filteredPages.length - 1 ? 'border-b border-user-border-light dark:border-user-border' : ''}`}
        >
          <Icon d={page.icon} size={18} color="#B46A02" />
          <div>
            <div className="text-sm font-bold text-user-text dark:text-user-text">{page.name}</div>
            <div className="text-[11px] text-user-text-lighter dark:text-user-text-lighter">Click to go to {page.name}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

// --- Multi-Step Dynamic Overlay Engine (Supports IDs: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11) ---
const DynamicFormModal = ({ form, onClose, inputs, setInputs, currentUser, userData, db, onSuccess }) => {
  if (!form) return null;

  const [formStep, setFormStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [hasJobIncome, setHasJobIncome] = useState(false);
  const [hasPropertyIncome, setHasPropertyIncome] = useState(false);
  const [hasBusinessIncome, setHasBusinessIncome] = useState(false);
  const [isReliefRecipient, setIsReliefRecipient] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      setSubmitting(true);
      try {
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

        // Save to Firestore
        const formSubmission = {
          formId: form.id,
          formTitle: form.title,
          userId: currentUser?.uid,
          userNic: userData?.nic,
          userName: userData?.fullName,
          userEmail: currentUser?.email,
          formData: finalPayload,
          submittedAt: serverTimestamp(),
          status: 'pending'
        };
        await addDoc(collection(db, 'form_submissions'), formSubmission);
        onSuccess?.(`${form.title} submitted successfully!`);
        onClose();
        setFormStep(1);
      } catch (error) {
        console.error('Error submitting form:', error);
        alert('Failed to submit form. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const isResidenceOrCharacter = form.id === 1 || form.id === 2;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/40 z-[1000]" />
      <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1001] w-full max-w-[760px] max-h-[90vh] bg-user-surface dark:bg-user-surface rounded-2xl shadow-2xl overflow-hidden flex flex-col`}>
        
        <div className="bg-user-secondary dark:bg-user-secondary p-5 flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="text-xl font-black text-white">{form.title}</h3>
            <p className="text-xs text-yellow-200">Official Verification Portal</p>
          </div>
          <button onClick={onClose} className="text-white text-3xl cursor-pointer leading-5">×</button>
        </div>

        {/* Step Indicators */}
        <div className="flex flex-wrap gap-2 bg-user-secondary-light dark:bg-user-secondary-light p-3 border-b border-user-border dark:border-user-border text-[11px] font-extrabold text-user-text-lighter flex-shrink-0 overflow-x-auto">
          {isResidenceOrCharacter && (
            <>
              <span className={`${formStep === 1 ? 'text-user-secondary' : ''}`}>1. Division & Applicant Info</span> &gt;
              <span className={`${formStep === 2 ? 'text-user-secondary' : ''}`}>2. Residence & Family</span> &gt;
              <span className={`${formStep === 3 ? 'text-user-secondary' : ''}`}>3. Verification & Reason</span>
            </>
          )}
          {form.id === 3 && (
            <>
              <span className={`${formStep === 1 ? 'text-user-secondary' : ''}`}>1. Personal Info</span> &gt;
              <span className={`${formStep === 2 ? 'text-user-secondary' : ''}`}>2. Income Breakdown</span> &gt;
              <span className={`${formStep === 3 ? 'text-user-secondary' : ''}`}>3. Total Summary</span> &gt;
              <span className={`${formStep === 4 ? 'text-user-secondary' : ''}`}>4. Uploads & Declarations</span>
            </>
          )}
          {form.id === 4 && (
            <>
              <span className={`${formStep === 1 ? 'text-user-secondary' : ''}`}>1. Land Identity & Location</span> &gt;
              <span className={`${formStep === 2 ? 'text-user-secondary' : ''}`}>2. Boundaries & Dimensions</span> &gt;
              <span className={`${formStep === 3 ? 'text-user-secondary' : ''}`}>3. Tenure & Uploads</span>
            </>
          )}
          {form.id === 5 && (
            <>
              <span className={`${formStep === 1 ? 'text-user-secondary' : ''}`}>1. DRP Metadata & Name Matrix</span> &gt;
              <span className={`${formStep === 2 ? 'text-user-secondary' : ''}`}>2. Status & Birth Registry</span> &gt;
              <span className={`${formStep === 3 ? 'text-user-secondary' : ''}`}>3. Residence & Affidavits</span>
            </>
          )}
          {form.id === 6 && (
            <>
              <span className={`${formStep === 1 ? 'text-user-secondary' : ''}`}>1. Region & Applicant</span> &gt;
              <span className={`${formStep === 2 ? 'text-user-secondary' : ''}`}>2. Family Details</span> &gt;
              <span className={`${formStep === 3 ? 'text-user-secondary' : ''}`}>3. Bank & Assistance</span> &gt;
              <span className={`${formStep === 4 ? 'text-user-secondary' : ''}`}>4. Upload Certification</span>
            </>
          )}
          {form.id === 7 && (
            <>
              <span className={`${formStep === 1 ? 'text-user-secondary' : ''}`}>1. Boundaries & Region</span> &gt;
              <span className={`${formStep === 2 ? 'text-user-secondary' : ''}`}>2. Purpose & Registration Core</span> &gt;
              <span className={`${formStep === 3 ? 'text-user-secondary' : ''}`}>3. Chief Occupant's Declaration</span>
            </>
          )}
          {form.id === 8 && (
            <>
              <span className={`${formStep === 1 ? 'text-user-secondary' : ''}`}>1. Applicant Meta</span> &gt;
              <span className={`${formStep === 2 ? 'text-user-secondary' : ''}`}>2. Property Location</span> &gt;
              <span className={`${formStep === 3 ? 'text-user-secondary' : ''}`}>3. Spatial Boundaries</span> &gt;
              <span className={`${formStep === 4 ? 'text-user-secondary' : ''}`}>4. Tree Logistics Matrix</span> &gt;
              <span className={`${formStep === 5 ? 'text-user-secondary' : ''}`}>5. Document Audits</span>
            </>
          )}
          {form.id === 9 && (
            <>
              <span className={`${formStep === 1 ? 'text-user-secondary' : ''}`}>1. Request Information</span> &gt;
              <span className={`${formStep === 2 ? 'text-user-secondary' : ''}`}>2. Property Profile</span> &gt;
              <span className={`${formStep === 3 ? 'text-user-secondary' : ''}`}>3. Timber Table Matrix</span> &gt;
              <span className={`${formStep === 4 ? 'text-user-secondary' : ''}`}>4. Layout & Uploads</span>
            </>
          )}
          {form.id === 10 && (
            <>
              <span className={`${formStep === 1 ? 'text-user-secondary' : ''}`}>1. Owner & Business Meta</span> &gt;
              <span className={`${formStep === 2 ? 'text-user-secondary' : ''}`}>2. Environmental & Premises Info</span> &gt;
              <span className={`${formStep === 3 ? 'text-user-secondary' : ''}`}>3. Legal Deed Uploads</span>
            </>
          )}
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4 bg-user-background dark:bg-user-background">
          
          {/* ==========================================
              MODULE A: RESIDENCE & CHARACTER CERTIFICATES 
             ========================================== */}
          {isResidenceOrCharacter && (
            <>
              {formStep === 1 && (
                <>
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">1) Administrative Divisions</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">District / Divisional Secretary's Division</label>
                        <input type="text" disabled value={userData?.dsDiv || "Colombo / Thimbirigasyaya"} className="w-full p-3 rounded-xl border border-user-border bg-user-secondary-light text-user-text-lighter text-sm" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Grama Niladhari Division &amp; Number</label>
                        <input type="text" disabled value={userData?.gnDiv || "Hunupitiya (62B)"} className="w-full p-3 rounded-xl border border-user-border bg-user-secondary-light text-user-text-lighter text-sm" />
                      </div>
                    </div>

                    <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2 pt-2">2) Information about Applicant</h4>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Full Name</label>
                      <input type="text" required onChange={e => handleInputChange('applicantName', e.target.value)} value={inputs.applicantName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none focus:border-user-primary text-sm" placeholder="Enter Full Name" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Permanent Address</label>
                      <input type="text" required onChange={e => handleInputChange('applicantAddress', e.target.value)} value={inputs.applicantAddress || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none focus:border-user-primary text-sm" placeholder="Enter Permanent Address" />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Sex</label>
                        <select required onChange={e => handleInputChange('sex', e.target.value)} value={inputs.sex || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                          <option value="">-- Select --</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Age</label>
                        <input type="number" required onChange={e => handleInputChange('age', e.target.value)} value={inputs.age || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Age" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Civil Status</label>
                        <select required onChange={e => handleInputChange('civilStatus', e.target.value)} value={inputs.civilStatus || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                          <option value="">-- Select --</option>
                          <option value="Unmarried">Unmarried</option>
                          <option value="Married">Married</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Whether Sri Lankan?</label>
                        <select required onChange={e => handleInputChange('isSriLankan', e.target.value)} value={inputs.isSriLankan || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Religion</label>
                        <input type="text" required onChange={e => handleInputChange('religion', e.target.value)} value={inputs.religion || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Religion" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Present Occupation</label>
                      <input type="text" required onChange={e => handleInputChange('occupation', e.target.value)} value={inputs.occupation || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. Student, Executive Officer" />
                    </div>
                  </div>
                </>
              )}

              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">Residence Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Period of Residence in Village</label>
                      <input type="text" required onChange={e => handleInputChange('villagePeriod', e.target.value)} value={inputs.villagePeriod || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. 5 Years" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Period of Residence in GN Division</label>
                      <input type="text" required onChange={e => handleInputChange('gnPeriod', e.target.value)} value={inputs.gnPeriod || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. 5 Years" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Nature of other evidences in proof of residence</label>
                    <input type="text" required onChange={e => handleInputChange('residenceEvidence', e.target.value)} value={inputs.residenceEvidence || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. Electoral Register, Utility Bills" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">National Identity Card (NIC) No.</label>
                      <input type="text" required onChange={e => handleInputChange('nicNumber', e.target.value)} value={inputs.nicNumber || ''} className={`w-full p-3 rounded-xl border ${errors.nicNumber ? 'border-red-500' : 'border-user-border'} bg-user-surface outline-none text-sm`} placeholder="NIC Number" />
                      {errors.nicNumber && <span className="text-red-500 text-[11px] font-bold mt-1 block">{errors.nicNumber}</span>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Electoral Register Particulars</label>
                      <input type="text" required onChange={e => handleInputChange('electoralDetails', e.target.value)} value={inputs.electoralDetails || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="List No, Serial No" />
                    </div>
                  </div>
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2 pt-2">Family Particulars</h4>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Name of the Father</label>
                    <input type="text" required onChange={e => handleInputChange('fatherName', e.target.value)} value={inputs.fatherName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Father's Full Name" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Address of the Father</label>
                    <input type="text" required onChange={e => handleInputChange('fatherAddress', e.target.value)} value={inputs.fatherAddress || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Father's Current Address" />
                  </div>
                </div>
              )}

              {formStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">Background Verification &amp; Reason</h4>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Whether convicted by a Court of Law?</label>
                    <select required onChange={e => handleInputChange('courtConviction', e.target.value)} value={inputs.courtConviction || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Interest in public activities, social service, or community work?</label>
                    <textarea rows={2} onChange={e => handleInputChange('socialService', e.target.value)} value={inputs.socialService || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none resize-none text-sm" placeholder="Describe any community contributions..." />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Purpose for which the certificate is required</label>
                    <input type="text" required onChange={e => handleInputChange('certificatePurpose', e.target.value)} value={inputs.certificatePurpose || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. Employment, Passport, Bank Loan" />
                  </div>
                  <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4">
                    <span className="text-xs font-extrabold text-user-text block mb-2">Signature Affirmation</span>
                    <input type="file" required className="text-sm" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              MODULE B: INCOME CERTIFICATE SUBMISSION
             ========================================== */}
          {form.id === 3 && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">01. Personal Details</h4>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Full Name of the Applicant</label>
                    <input type="text" required onChange={e => handleInputChange('incFullName', e.target.value)} value={inputs.incFullName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Enter Full Name" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Address</label>
                    <textarea rows={2} required onChange={e => handleInputChange('incAddress', e.target.value)} value={inputs.incAddress || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none resize-none text-sm" placeholder="Enter Permanent Address" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">NIC Number</label>
                      <input type="text" required onChange={e => handleInputChange('incNic', e.target.value)} value={inputs.incNic || ''} className={`w-full p-3 rounded-xl border ${errors.incNic ? 'border-red-500' : 'border-user-border'} bg-user-surface outline-none text-sm`} placeholder="NIC Number" />
                      {errors.incNic && <span className="text-red-500 text-[11px] font-bold mt-1 block">{errors.incNic}</span>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Purpose for requesting certificate</label>
                      <select required onChange={e => handleInputChange('incPurpose', e.target.value)} value={inputs.incPurpose || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- Select Purpose --</option>
                        <option value="University Admission">University Admission</option>
                        <option value="Bank Loan">Bank Loan</option>
                        <option value="Scholarship">Scholarship</option>
                        <option value="Other">Other External Verification</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">02. Source of Income Breakdown</h4>
                  <p className="text-xs text-user-text-lighter font-semibold">Toggle your active financial streams below to fill details:</p>

                  <div className="bg-user-surface p-4 rounded-xl border border-user-border">
                    <label className="flex items-center gap-2 text-sm font-extrabold text-user-text cursor-pointer">
                      <input type="checkbox" checked={hasJobIncome} onChange={e => setHasJobIncome(e.target.checked)} className="accent-user-secondary" />
                      1. Income From Employment / Profession
                    </label>
                    {hasJobIncome && (
                      <div className="mt-3 pt-3 border-t border-user-border">
                        <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Monthly or Annual Income (LKR)</label>
                        <input type="number" onChange={e => handleInputChange('incomeJobAmt', e.target.value)} value={inputs.incomeJobAmt || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0.00" />
                      </div>
                    )}
                  </div>

                  <div className="bg-user-surface p-4 rounded-xl border border-user-border">
                    <label className="flex items-center gap-2 text-sm font-extrabold text-user-text cursor-pointer">
                      <input type="checkbox" checked={hasPropertyIncome} onChange={e => setHasPropertyIncome(e.target.checked)} className="accent-user-secondary" />
                      2. Income From Land and Property
                    </label>
                    {hasPropertyIncome && (
                      <div className="mt-3 pt-3 border-t border-user-border space-y-3">
                        <div>
                          <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Location / Address of Land or Property</label>
                          <input type="text" onChange={e => handleInputChange('landLoc', e.target.value)} value={inputs.landLoc || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Property Location" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Deed Number &amp; Date</label>
                            <input type="text" onChange={e => handleInputChange('landDeed', e.target.value)} value={inputs.landDeed || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Deed Details" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Extent of Land (Size)</label>
                            <input type="text" onChange={e => handleInputChange('landSize', e.target.value)} value={inputs.landSize || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. 20 Perches" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Net Income received from lands/buildings (LKR)</label>
                          <input type="number" onChange={e => handleInputChange('incomeLandAmt', e.target.value)} value={inputs.incomeLandAmt || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0.00" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-user-surface p-4 rounded-xl border border-user-border">
                    <label className="flex items-center gap-2 text-sm font-extrabold text-user-text cursor-pointer">
                      <input type="checkbox" checked={hasBusinessIncome} onChange={e => setHasBusinessIncome(e.target.checked)} className="accent-user-secondary" />
                      3. Income From Businesses
                    </label>
                    {hasBusinessIncome && (
                      <div className="mt-3 pt-3 border-t border-user-border space-y-3">
                        <div>
                          <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Name of the Business</label>
                          <input type="text" onChange={e => handleInputChange('bizName', e.target.value)} value={inputs.bizName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Business Entity Name" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Business Registration Number</label>
                            <input type="text" onChange={e => handleInputChange('bizRegNo', e.target.value)} value={inputs.bizRegNo || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="BR-XXXXXX" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Annual Net Income (LKR)</label>
                            <input type="number" onChange={e => handleInputChange('incomeBizAmt', e.target.value)} value={inputs.incomeBizAmt || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0.00" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {formStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">03. Total Consolidated Income (Summary)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Annual Employment Total (LKR)</label>
                      <input type="number" onChange={e => handleInputChange('summaryEmployment', e.target.value)} value={inputs.summaryEmployment || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Annual Lands &amp; Properties (LKR)</label>
                      <input type="number" onChange={e => handleInputChange('summaryLand', e.target.value)} value={inputs.summaryLand || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0.00" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Annual Business Total (LKR)</label>
                      <input type="number" onChange={e => handleInputChange('summaryBusiness', e.target.value)} value={inputs.summaryBusiness || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Annual Income from Other Sources</label>
                      <input type="number" onChange={e => handleInputChange('summaryOther', e.target.value)} value={inputs.summaryOther || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0.00" />
                    </div>
                  </div>

                  <div className="bg-user-secondary text-white p-5 rounded-xl flex justify-between items-center mt-2">
                    <span className="text-[11px] font-extrabold uppercase text-yellow-200">Total Annual Income</span>
                    <span className="text-2xl font-black text-user-primary">Rs. {totalCalculatedIncome.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}

              {formStep === 4 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">04. Additional Financial Context &amp; Declarations</h4>
                  <div className="bg-user-surface p-4 rounded-xl border border-user-border">
                    <span className="block text-xs font-extrabold text-user-text mb-2">Are you a recipient of Samurdhi or any other public relief/allowance?</span>
                    <div className="flex gap-5 text-sm font-bold">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="reliefRadio" checked={isReliefRecipient === true} onChange={() => setIsReliefRecipient(true)} className="accent-user-secondary" /> Yes
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="reliefRadio" checked={isReliefRecipient === false} onChange={() => { setIsReliefRecipient(false); handleInputChange('reliefName', ''); }} className="accent-user-secondary" /> No
                      </label>
                    </div>
                    {isReliefRecipient && (
                      <input type="text" required onChange={e => handleInputChange('reliefName', e.target.value)} value={inputs.reliefName || ''} className="w-full mt-3 p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="State name of relief" />
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">State reasons / evidence to prove accuracy of income</label>
                    <textarea rows={2} required onChange={e => handleInputChange('incomeAccuracyEvidence', e.target.value)} value={inputs.incomeAccuracyEvidence || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none resize-none text-sm" placeholder="Provide evidence summary details..." />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">External institution to which this certificate will be submitted</label>
                    <input type="text" required onChange={e => handleInputChange('submissionTargetInstitution', e.target.value)} value={inputs.submissionTargetInstitution || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. Bank, University" />
                  </div>

                  <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2">
                    <span className="text-xs font-extrabold text-user-text">Attach Document Audits (Certified Verification Slips)</span>
                    <input type="file" required className="text-sm" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              MODULE C: VALUATION CERTIFICATE SUBMISSION
             ========================================== */}
          {form.id === 4 && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">01. Land Location &amp; Administration Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">My Ref / Ledger Number</label>
                      <input type="text" required onChange={e => handleInputChange('valRefNo', e.target.value)} value={inputs.valRefNo || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. VAL/2026/089" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Date of Request</label>
                      <input type="date" required onChange={e => handleInputChange('valRequestDate', e.target.value)} value={inputs.valRequestDate || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Divisional Secretariat division</label>
                      <input type="text" required onChange={e => handleInputChange('valDsDivision', e.target.value)} value={inputs.valDsDivision || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. Kaduwela" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Grama Niladhari Division</label>
                      <input type="text" required onChange={e => handleInputChange('valGnDivision', e.target.value)} value={inputs.valGnDivision || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. Battaramulla South" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Name of the Land / Property Title</label>
                    <input type="text" required onChange={e => handleInputChange('valLandName', e.target.value)} value={inputs.valLandName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. Kosgahawatta / Lot A" />
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">02. Property Boundaries &amp; Total Size</h4>
                  <div className="bg-user-surface p-4 rounded-xl border border-user-border space-y-3">
                    <span className="text-xs font-extrabold text-user-secondary uppercase">Four Boundaries (හතර මායිම්)</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-user-secondary mb-1">North (උතුරට)</label>
                        <input type="text" required onChange={e => handleInputChange('boundNorth', e.target.value)} value={inputs.boundNorth || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Bounded by" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-user-secondary mb-1">East (නැගෙනහිරට)</label>
                        <input type="text" required onChange={e => handleInputChange('boundEast', e.target.value)} value={inputs.boundEast || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Bounded by" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-user-secondary mb-1">South (දකුණට)</label>
                        <input type="text" required onChange={e => handleInputChange('boundSouth', e.target.value)} value={inputs.boundSouth || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Bounded by" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-user-secondary mb-1">West (බස්නාහිරට)</label>
                        <input type="text" required onChange={e => handleInputChange('boundWest', e.target.value)} value={inputs.boundWest || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Bounded by" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-user-surface p-4 rounded-xl border border-user-border">
                    <span className="block text-xs font-extrabold text-user-secondary uppercase mb-3">Total Extent of Land (මුළු විශාලත්වය)</span>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-user-secondary mb-1">Acres (අක්කර)</label>
                        <input type="number" onChange={e => handleInputChange('sizeAcres', e.target.value)} value={inputs.sizeAcres || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-user-secondary mb-1">Roods (රූඩ්)</label>
                        <input type="number" onChange={e => handleInputChange('sizeRoods', e.target.value)} value={inputs.sizeRoods || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-user-secondary mb-1">Perches (පර්චස්)</label>
                        <input type="number" onChange={e => handleInputChange('sizePerches', e.target.value)} value={inputs.sizePerches || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">03. Land Ownership &amp; Tenure Context</h4>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Classification of Land ownership</label>
                    <select required onChange={e => handleInputChange('valLandType', e.target.value)} value={inputs.valLandType || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                      <option value="">-- Select Classification --</option>
                      <option value="Government (රජයේ ඉඩමකි)">Government Land (රජයේ)</option>
                      <option value="Private (පුද්ගලික ඉඩමකි)">Private Deed Land (පුද්ගලික)</option>
                      <option value="Devalagam/Temple (විහාරදේවාලගම්)">Temple Property (විහාරදේවාලගම්)</option>
                      <option value="Other">Other Tenure Classification</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Years of continuous possession</label>
                      <input type="number" required onChange={e => handleInputChange('possessionYears', e.target.value)} value={inputs.possessionYears || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Years" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Months of continuous possession</label>
                      <input type="number" required onChange={e => handleInputChange('possessionMonths', e.target.value)} value={inputs.possessionMonths || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Months" />
                    </div>
                  </div>

                  <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2">
                    <span className="text-xs font-extrabold text-user-text">Supporting Files (Scanned Title Deeds, Survey Plan PDF)</span>
                    <input type="file" required className="text-sm" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              MODULE D: IDENTITY CARD APPLICATION (FORM B)
             ========================================== */}
          {form.id === 5 && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <div className="bg-user-surface p-4 rounded-xl border border-user-border space-y-3">
                    <span className="text-xs font-extrabold text-user-secondary uppercase">DRP Administrative Division Office Info</span>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold text-user-secondary">District</label>
                        <input type="text" disabled value={userData?.district || "Colombo"} className="w-full p-3 rounded-xl border border-user-border bg-user-secondary-light text-user-text-lighter text-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-user-secondary">D.S. Division</label>
                        <input type="text" disabled value={userData?.dsDiv || "Thimbirigasyaya"} className="w-full p-3 rounded-xl border border-user-border bg-user-secondary-light text-user-text-lighter text-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-user-secondary">G.N. Number &amp; Division</label>
                        <input type="text" disabled value={userData?.gnDiv || "62B / Hunupitiya"} className="w-full p-3 rounded-xl border border-user-border bg-user-secondary-light text-user-text-lighter text-sm" />
                      </div>
                    </div>
                  </div>

                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">01. Full Name Matrix (English Block Letters Only)</h4>
                  
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Family Name / පෙළපත් නාමය</label>
                    <input type="text" required onChange={e => handleInputChange('nicFamilyName', e.target.value.toUpperCase())} value={inputs.nicFamilyName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm tracking-wider" placeholder="E.G. NAVUNGALA JAGODAGE" />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Other Names / වෙනත් නම්</label>
                    <input type="text" required onChange={e => handleInputChange('nicOtherNames', e.target.value.toUpperCase())} value={inputs.nicOtherNames || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm tracking-wider" placeholder="E.G. SAMINDA JAYALAL" />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Surname / වාසගම</label>
                    <input type="text" required onChange={e => handleInputChange('nicSurname', e.target.value.toUpperCase())} value={inputs.nicSurname || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm tracking-wider" placeholder="E.G. SENARATHNA" />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Preferred Name to appear on Identity Card (If modified)</label>
                    <input type="text" onChange={e => handleInputChange('nicPreferredName', e.target.value.toUpperCase())} value={inputs.nicPreferredName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Leave blank if identical to birth logs" />
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">02. Status Profile &amp; Birth Registry</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Sex / ස්ත්‍රී පුරුෂ භාවය</label>
                      <select required onChange={e => handleInputChange('nicSex', e.target.value)} value={inputs.nicSex || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- Select --</option>
                        <option value="Male">Male (පුරුෂ)</option>
                        <option value="Female">Female (ස්ත්‍රී)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Civil Status / සිවිල් තත්වය</label>
                      <select required onChange={e => handleInputChange('nicCivilStatus', e.target.value)} value={inputs.nicCivilStatus || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- Select Status --</option>
                        <option value="Single">Single (අවිවාහක)</option>
                        <option value="Married">Married (විවාහක)</option>
                        <option value="Widowed">Widowed (වැන්දඹු)</option>
                        <option value="Divorced">Divorced (දික්කසාද)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Date of Birth / උපන් දිනය</label>
                      <input type="date" required onChange={e => handleInputChange('nicDob', e.target.value)} value={inputs.nicDob || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Birth Certificate No. / අංකය</label>
                      <input type="text" required onChange={e => handleInputChange('nicBirthCertNo', e.target.value)} value={inputs.nicBirthCertNo || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="E.G. MAT/2004/89" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Place of Birth / උපන් ස්ථානය</label>
                      <input type="text" required onChange={e => handleInputChange('nicBirthPlace', e.target.value)} value={inputs.nicBirthPlace || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="City / Hospital Name" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Birth District / දිස්ත්‍රික්කය</label>
                      <input type="text" required onChange={e => handleInputChange('nicBirthDistrict', e.target.value)} value={inputs.nicBirthDistrict || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="E.G. Colombo" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Profession / Occupation / රැකියාව</label>
                    <input type="text" required onChange={e => handleInputChange('nicOccupation', e.target.value)} value={inputs.nicOccupation || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="E.G. Student / Executive Officer (Verification slips must be <6 months old)" />
                  </div>
                </div>
              )}

              {formStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">03. Permanent Residence &amp; Evidentiary Uploads</h4>
                  
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Permanent Address / ස්ථිර පදිංචි ලිපිනය</label>
                    <textarea rows={2} required onChange={e => handleInputChange('nicPermAddress', e.target.value)} value={inputs.nicPermAddress || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none resize-none text-sm" placeholder="Provide permanent house name/number registry lines" />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Postal Address / තැපැල් ලිපිනය (Cage 8.2)</label>
                    <textarea rows={2} onChange={e => handleInputChange('nicPostalAddress', e.target.value)} value={inputs.nicPostalAddress || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none resize-none text-sm" placeholder="Fill only if separate from your permanent baseline registry" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Mobile Telephone Number</label>
                      <input type="text" required onChange={e => handleInputChange('nicMobilePhone', e.target.value)} value={inputs.nicMobilePhone || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="07XXXXXXXX" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">E-mail Address</label>
                      <input type="email" onChange={e => handleInputChange('nicEmail', e.target.value)} value={inputs.nicEmail || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="name@domain.com" />
                    </div>
                  </div>

                  <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2">
                    <span className="text-xs font-extrabold text-user-text">Affix Color Photograph Registry (35mm x 45mm For Scanning)</span>
                    <input type="file" required className="text-sm" />
                    <p className="text-[10px] text-user-text-lighter">* Note: Photo must reflect natural facial configuration without disguise or alterations. Any incorrect detail verification is a punishable offense under DRP statutes.</p>
                  </div>

                  <div className="flex items-start gap-2.5 bg-user-secondary-light p-3 rounded-xl">
                    <input type="checkbox" required defaultChecked className="accent-user-secondary mt-0.5" />
                    <span className="text-[11px] text-user-text font-semibold leading-tight">
                      <strong>DRP Applicant Declaration:</strong> I declare that I am a citizen of Sri Lanka. I verify that all documentation and metadata arrays attached here are accurate to the best of my knowledge.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              MODULE E: LIVING FUNDS FOR DISABLED PERSONS (FORM ID: 6)
             ========================================== */}
          {form.id === 6 && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">Step 1: Administrative Region (Header Info)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">District</label>
                      <input type="text" required onChange={e => handleInputChange('lawDistrict', e.target.value)} value={inputs.lawDistrict || userData?.district || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. Colombo" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Divisional Secretariat (D.S. Office)</label>
                      <input type="text" required onChange={e => handleInputChange('lawDsOffice', e.target.value)} value={inputs.lawDsOffice || userData?.dsDiv || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. Thimbirigasyaya" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Grama Niladhari (G.N.) Division</label>
                      <input type="text" required onChange={e => handleInputChange('lawGnDivision', e.target.value)} value={inputs.lawGnDivision || userData?.gnDiv || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. Hunupitiya (62B)" />
                    </div>
                  </div>

                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2 pt-2">Step 2: Applicant Information</h4>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Full Name</label>
                    <input type="text" required onChange={e => handleInputChange('lawFullName', e.target.value)} value={inputs.lawFullName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Enter Applicant's Full Name" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Nature of Disability</label>
                      <input type="text" required onChange={e => handleInputChange('lawDisabilityNature', e.target.value)} value={inputs.lawDisabilityNature || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Specify functional condition" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Cause of Disability</label>
                      <select required onChange={e => handleInputChange('lawDisabilityCause', e.target.value)} value={inputs.lawDisabilityCause || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- Select Cause --</option>
                        <option value="By Birth">By Birth</option>
                        <option value="Accident">Accident</option>
                        <option value="Other">Other (Please specify)</option>
                      </select>
                    </div>
                  </div>

                  {inputs.lawDisabilityCause === 'Accident' && (
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Year of Accident</label>
                      <input type="number" required onChange={e => handleInputChange('lawAccidentYear', e.target.value)} value={inputs.lawAccidentYear || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. 2025" />
                    </div>
                  )}

                  {inputs.lawDisabilityCause === 'Other' && (
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Specify Other Cause</label>
                      <input type="text" required onChange={e => handleInputChange('lawOtherCauseDetails', e.target.value)} value={inputs.lawOtherCauseDetails || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Describe cause matrix details" />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Vocational Training or Educational Status</label>
                    <input type="text" required onChange={e => handleInputChange('lawVocationalOrEducation', e.target.value)} value={inputs.lawVocationalOrEducation || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="State highest qualification or training details" />
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">Step 5: Household &amp; Family Details</h4>
                  
                  <p className="text-xs font-extrabold text-user-text">👥 Table A: Family Members with Disabilities</p>
                  {disabledMembers.map((member, idx) => (
                    <div key={`law-disabled-${idx}`} className="bg-user-surface p-4 rounded-xl border border-user-border space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" required placeholder="Full Name" value={member.name} onChange={e => { const u = [...disabledMembers]; u[idx].name = e.target.value; setDisabledMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder="Relationship" value={member.relation} onChange={e => { const u = [...disabledMembers]; u[idx].relation = e.target.value; setDisabledMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <select required value={member.gender} onChange={e => { const u = [...disabledMembers]; u[idx].gender = e.target.value; setDisabledMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                          <option value="">Gender</option><option value="Male">Male</option><option value="Female">Female</option>
                        </select>
                        <select required value={member.civilStatus} onChange={e => { const u = [...disabledMembers]; u[idx].civilStatus = e.target.value; setDisabledMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                          <option value="">Status</option><option value="Unmarried">Unmarried</option><option value="Married">Married</option>
                        </select>
                        <input type="date" required value={member.dob} onChange={e => { const u = [...disabledMembers]; u[idx].dob = e.target.value; setDisabledMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" required placeholder="NIC Number" value={member.nic} onChange={e => { const u = [...disabledMembers]; u[idx].nic = e.target.value; setDisabledMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder="Disability" value={member.nature} onChange={e => { const u = [...disabledMembers]; u[idx].nature = e.target.value; setDisabledMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setDisabledMembers([...disabledMembers, { name: '', relation: '', gender: '', civilStatus: '', dob: '', nic: '', nature: '' }])} className="self-start px-4 py-2 rounded-lg border border-user-secondary text-user-secondary bg-user-surface cursor-pointer text-xs font-bold">+ Add Row</button>

                  <p className="text-xs font-extrabold text-user-text pt-2">👥 Table B: Other Family Members</p>
                  {otherMembers.map((member, idx) => (
                    <div key={`law-other-${idx}`} className="bg-user-surface p-4 rounded-xl border border-user-border space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" required placeholder="Full Name" value={member.name} onChange={e => { const u = [...otherMembers]; u[idx].name = e.target.value; setOtherMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder="Relationship" value={member.relation} onChange={e => { const u = [...otherMembers]; u[idx].relation = e.target.value; setOtherMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <select required value={member.gender} onChange={e => { const u = [...otherMembers]; u[idx].gender = e.target.value; setOtherMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                          <option value="">Gender</option><option value="Male">Male</option><option value="Female">Female</option>
                        </select>
                        <select required value={member.civilStatus} onChange={e => { const u = [...otherMembers]; u[idx].civilStatus = e.target.value; setOtherMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                          <option value="">Status</option><option value="Unmarried">Unmarried</option><option value="Married">Married</option>
                        </select>
                        <input type="date" required value={member.dob} onChange={e => { const u = [...otherMembers]; u[idx].dob = e.target.value; setOtherMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" required placeholder="NIC Number" value={member.nic} onChange={e => { const u = [...otherMembers]; u[idx].nic = e.target.value; setOtherMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" placeholder="Income Source & Amount" value={member.incomeSourceAmt} onChange={e => { const u = [...otherMembers]; u[idx].incomeSourceAmt = e.target.value; setOtherMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setOtherMembers([...otherMembers, { name: '', relation: '', gender: '', civilStatus: '', dob: '', nic: '', incomeSourceAmt: '' }])} className="self-start px-4 py-2 rounded-lg border border-user-secondary text-user-secondary bg-user-surface cursor-pointer text-xs font-bold">+ Add Row</button>
                </div>
              )}

              {formStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">Step 3: Bank Account Details (For Direct Benefit Transfer)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input type="text" required onChange={e => handleInputChange('lawBankAccountNo', e.target.value)} value={inputs.lawBankAccountNo || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Account Number" />
                    </div>
                    <div>
                      <input type="text" required onChange={e => handleInputChange('lawBankNameBranch', e.target.value)} value={inputs.lawBankNameBranch || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Bank Name &amp; Branch" />
                    </div>
                  </div>
                </div>
              )}

              {formStep === 4 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">🛠️ Back-End &amp; Official Verification Sections</h4>
                  <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2">
                    <span className="text-xs font-extrabold text-user-secondary">🩺 Section C: Medical Officer Certification</span>
                    <input type="file" required className="text-sm" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              MODULE F: VOTER REGISTRATION & REVISION (FORM ID: 7)
             ========================================== */}
          {form.id === 7 && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">Step 1: Administrative &amp; Polling Boundaries</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Electoral District</label>
                      <input type="text" required onChange={e => handleInputChange('voterElectoralDistrict', e.target.value)} value={inputs.voterElectoralDistrict || userData?.district || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. Colombo" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Polling Division</label>
                      <input type="text" required onChange={e => handleInputChange('voterPollingDivision', e.target.value)} value={inputs.voterPollingDivision || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. Colombo Central" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Polling District Number</label>
                      <input type="text" required onChange={e => handleInputChange('voterPollingDistrictNo', e.target.value)} value={inputs.voterPollingDistrictNo || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. 14" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Grama Niladhari Division Name/Number</label>
                      <input type="text" required onChange={e => handleInputChange('voterGnDivision', e.target.value)} value={inputs.voterGnDivision || userData?.gnDiv || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. Hunupitiya (62B)" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Village / Street / Estate Name</label>
                    <input type="text" required onChange={e => handleInputChange('voterVillageStreet', e.target.value)} value={inputs.voterVillageStreet || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. Hunupitiya Cross Road" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Household / Assessment Number</label>
                    <input type="text" required onChange={e => handleInputChange('voterHouseholdNo', e.target.value)} value={inputs.voterHouseholdNo || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. 45/A" />
                  </div>

                  <div className="bg-user-surface border border-user-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <span className="block text-sm font-extrabold text-user-secondary">Check Live Electoral Register Profile</span>
                      <span className="text-[11px] text-user-text-lighter">Cross-verify registration logs instantly on ec.lk/vrd database.</span>
                    </div>
                    <a href="https://ec.lk/vrd" target="_blank" rel="noreferrer" className="bg-user-secondary text-white px-4 py-2 rounded-lg text-xs font-bold no-underline">ec.lk/vrd</a>
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">Step 2: Form Purpose Selection</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <button type="button" onClick={() => setVoterPurpose('OptionA')} className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${voterPurpose === 'OptionA' ? 'border-2 border-user-secondary bg-user-primary-light' : 'border border-user-border bg-user-surface'} font-bold text-xs`}>
                      <div className="text-user-secondary font-extrabold mb-0.5">[ Option A ]</div>
                      "I want to register a young citizen turning 18 years old" (YC Form Track)
                    </button>
                    <button type="button" onClick={() => setVoterPurpose('OptionB')} className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${voterPurpose === 'OptionB' ? 'border-2 border-user-secondary bg-user-primary-light' : 'border border-user-border bg-user-surface'} font-bold text-xs`}>
                      <div className="text-user-secondary font-extrabold mb-0.5">[ Option B ]</div>
                      "I want to update our household's general voter list" (ER Form Track)
                    </button>
                  </div>

                  {voterPurpose === 'OptionA' && (
                    <div className="border-t-2 border-dashed border-user-border pt-4 space-y-4">
                      <span className="text-xs font-extrabold text-user-secondary">Step 3-A: Young Citizen Enrollment (YC Form Logic)</span>
                      <p className="text-[11px] text-user-text-lighter font-semibold">This section collects data for citizens born between 01.02.2008 and 31.01.2010 who are turning 18.</p>
                      <div>
                        <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Applicant's Full Name (Must match NIC exactly, or Birth Certificate if NIC isn't issued yet)</label>
                        <input type="text" required onChange={e => handleInputChange('ycFullName', e.target.value)} value={inputs.ycFullName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Enter Full Name" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-extrabold text-user-secondary mb-1">National Identity Card (NIC) Number</label>
                          <input type="text" required onChange={e => handleInputChange('ycNicNo', e.target.value)} value={inputs.ycNicNo || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="NIC Number" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Date of Birth</label>
                          <input type="date" required min="2008-02-01" max="2010-01-31" onChange={e => handleInputChange('ycDob', e.target.value)} value={inputs.ycDob || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Gender</label>
                          <select required onChange={e => handleInputChange('ycGender', e.target.value)} value={inputs.ycGender || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                            <option value="">-- Select --</option><option value="Male">Male</option><option value="Female">Female</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Civil Status</label>
                          <select required onChange={e => handleInputChange('ycCivilStatus', e.target.value)} value={inputs.ycCivilStatus || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                            <option value="">-- Select --</option><option value="Unmarried">Unmarried</option><option value="Married">Married</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Relationship to Chief Occupant</label>
                          <input type="text" required onChange={e => handleInputChange('ycRelationToChief', e.target.value)} value={inputs.ycRelationToChief || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. Son, Daughter" />
                        </div>
                      </div>
                    </div>
                  )}

                  {voterPurpose === 'OptionB' && (
                    <div className="border-t-2 border-dashed border-user-border pt-4 space-y-4">
                      <span className="text-xs font-extrabold text-user-secondary">Step 3-B: Annual Electoral Register Revision (ER Form Logic)</span>
                      
                      <div className="border border-user-border p-4 rounded-xl bg-user-surface">
                        <span className="text-[11px] font-extrabold text-user-secondary block mb-2">➕ Subsection 1: Persons to be NEWLY Added (Form 2A)</span>
                        <p className="text-[10px] text-user-text-lighter mb-3">Note: Members already correctly registered in the previous year do not need to be re-entered.</p>
                        
                        {newVoters.map((voter, idx) => (
                          <div key={`newvoter-${idx}`} className="border-b border-user-border-lighter last:border-0 pb-3 mb-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input type="text" placeholder="Full Name (As on NIC)" value={voter.name} onChange={e => { const u = [...newVoters]; u[idx].name = e.target.value; setNewVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" />
                              <input type="text" placeholder="Relationship to Chief" value={voter.relation} onChange={e => { const u = [...newVoters]; u[idx].relation = e.target.value; setNewVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input type="text" placeholder="NIC Number" value={voter.nic} onChange={e => { const u = [...newVoters]; u[idx].nic = e.target.value; setNewVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" />
                              <input type="date" placeholder="Date of Birth" value={voter.dob} onChange={e => { const u = [...newVoters]; u[idx].dob = e.target.value; setNewVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" />
                              <select value={voter.gender} onChange={e => { const u = [...newVoters]; u[idx].gender = e.target.value; setNewVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs">
                                <option value="">Gender</option><option value="Male">Male</option><option value="Female">Female</option>
                              </select>
                            </div>
                            <div className="grid grid-cols-3 gap-2 bg-user-secondary-light p-2 rounded-lg">
                              <input type="text" placeholder="Previous Address Last Registered" value={voter.prevAddress} onChange={e => { const u = [...newVoters]; u[idx].prevAddress = e.target.value; setNewVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-[10px]" />
                              <input type="text" placeholder="Prev District" value={voter.prevDistrict} onChange={e => { const u = [...newVoters]; u[idx].prevDistrict = e.target.value; setNewVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-[10px]" />
                              <input type="number" placeholder="Prev Year" value={voter.prevYear} onChange={e => { const u = [...newVoters]; u[idx].prevYear = e.target.value; setNewVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-[10px]" />
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => setNewVoters([...newVoters, { name: '', nic: '', dob: '', gender: '', relation: '', prevAddress: '', prevDistrict: '', prevYear: '' }])} className="px-3 py-1.5 rounded-lg border border-user-secondary text-user-secondary bg-user-surface cursor-pointer text-[10px] font-bold">+ Add New Elector Addition Entry</button>
                      </div>

                      <div className="border border-user-border p-4 rounded-xl bg-user-surface">
                        <span className="text-[11px] font-extrabold text-user-secondary block mb-2">➖ Subsection 2: Persons to be DELETED / Removed (Form 3)</span>
                        {deletedVoters.map((voter, idx) => (
                          <div key={`delvoter-${idx}`} className="border-b border-user-border-lighter last:border-0 pb-3 mb-3 space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <input type="text" placeholder="Full Name of Elector" value={voter.name} onChange={e => { const u = [...deletedVoters]; u[idx].name = e.target.value; setDeletedVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" />
                              <input type="text" placeholder="NIC Number" value={voter.nic} onChange={e => { const u = [...deletedVoters]; u[idx].nic = e.target.value; setDeletedVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" />
                              <select value={voter.reason} onChange={e => { const u = [...deletedVoters]; u[idx].reason = e.target.value; setDeletedVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs">
                                <option value="">Reason for Removal</option>
                                <option value="Deceased">Deceased (Death)</option>
                                <option value="Moved Away">Left the Residence (Moved away)</option>
                                <option value="Other">Other Reason</option>
                              </select>
                            </div>

                            {voter.reason === 'Deceased' && (
                              <div className="bg-red-50 p-2 rounded-lg">
                                <label className="block text-[10px] font-bold text-red-600 mb-1">Conditional Field: Date of Death</label>
                                <input type="date" value={voter.deathDate} onChange={e => { const u = [...deletedVoters]; u[idx].deathDate = e.target.value; setDeletedVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" />
                              </div>
                            )}

                            {voter.reason === 'Moved Away' && (
                              <div className="grid grid-cols-2 gap-2 bg-blue-50 p-2 rounded-lg">
                                <div>
                                  <label className="block text-[10px] font-bold text-blue-700 mb-0.5">New Current Address</label>
                                  <input type="text" value={voter.newAddress} onChange={e => { const u = [...deletedVoters]; u[idx].newAddress = e.target.value; setDeletedVoters(u); }} className="w-full p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" placeholder="Enter New Address" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-blue-700 mb-0.5">New Telephone Number</label>
                                  <input type="text" value={voter.newPhone} onChange={e => { const u = [...deletedVoters]; u[idx].newPhone = e.target.value; setDeletedVoters(u); }} className="w-full p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" placeholder="New Phone" />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => setDeletedVoters([...deletedVoters, { name: '', nic: '', reason: '', deathDate: '', newAddress: '', newPhone: '' }])} className="px-3 py-1.5 rounded-lg border border-user-secondary text-user-secondary bg-user-surface cursor-pointer text-[10px] font-bold">+ Add Elector Deletion Entry</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {formStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">Step 4: Chief Occupant's Declaration &amp; Contact Info</h4>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Full Name of Chief Occupant</label>
                    <input type="text" required onChange={e => handleInputChange('voterChiefName', e.target.value)} value={inputs.voterChiefName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Enter Chief Occupant Name" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary mb-1">NIC Number of Chief Occupant</label>
                    <input type="text" required onChange={e => handleInputChange('voterChiefNic', e.target.value)} value={inputs.voterChiefNic || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Chief Occupant NIC" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Telephone Number</label>
                      <input type="text" required onChange={e => handleInputChange('voterChiefPhone', e.target.value)} value={inputs.voterChiefPhone || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. 07XXXXXXXX" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">WhatsApp Number (For Digital Updates)</label>
                      <input type="text" required onChange={e => handleInputChange('voterChiefWhatsApp', e.target.value)} value={inputs.voterChiefWhatsApp || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. 07XXXXXXXX" />
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-user-secondary-light p-3 rounded-xl">
                    <input type="checkbox" required className="accent-user-secondary mt-0.5" />
                    <span className="text-[11px] text-user-text font-semibold leading-tight">
                      <strong>Legal Acknowledgment Checkbox:</strong> I hereby declare that the particulars given above are true and accurate to the best of my knowledge and belief. I am fully aware that willfully providing false information is a punishable offence under Section 12(4) of the Registration of Electors Act, carrying penalties of a fine up to Rs. 500, up to 1 month imprisonment, or both.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              MODULE H: PERMIT FOR FELLING TREES (FORM ID: 8)
             ========================================== */}
          {form.id === 8 && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">Step 1: Core Identification &amp; Administrative Meta</h4>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-2">Applicant Status Designation</label>
                    <div className="flex gap-6 text-sm font-bold">
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="tfStatusRadio" checked={inputs.treeApplicantStatus === 'Land Owner'} onChange={() => handleInputChange('treeApplicantStatus', 'Land Owner')} className="accent-user-secondary" /> Land Owner</label>
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="tfStatusRadio" checked={inputs.treeApplicantStatus === 'Authorized Representative'} onChange={() => handleInputChange('treeApplicantStatus', 'Authorized Representative')} className="accent-user-secondary" /> Authorized Representative / Non-Owner</label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Full Name of Applicant</label>
                    <input type="text" required onChange={e => handleInputChange('treeFullName', e.target.value)} value={inputs.treeFullName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Full Name of Applicant" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">National Identity Card (NIC) Number</label>
                      <input type="text" required onChange={e => handleInputChange('treeNic', e.target.value)} value={inputs.treeNic || ''} className={`w-full p-3 rounded-xl border ${errors.treeNic ? 'border-red-500' : 'border-user-border'} bg-user-surface outline-none text-sm`} placeholder="NIC Number" />
                      {errors.treeNic && <span className="text-red-500 text-[11px] font-bold mt-1 block">{errors.treeNic}</span>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Contact Number</label>
                      <input type="text" required onChange={e => handleInputChange('treePhone', e.target.value)} value={inputs.treePhone || ''} className={`w-full p-3 rounded-xl border ${errors.treePhone ? 'border-red-500' : 'border-user-border'} bg-user-surface outline-none text-sm`} placeholder="Contact Number (10 Digits)" />
                      {errors.treePhone && <span className="text-red-500 text-[11px] font-bold mt-1 block">{errors.treePhone}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Permanent Address of Applicant</label>
                      <input type="text" required onChange={e => handleInputChange('treePermanentAddress', e.target.value)} value={inputs.treePermanentAddress || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Permanent Address of Applicant" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">WhatsApp Number (Optional)</label>
                      <input type="text" onChange={e => handleInputChange('treeWhatsApp', e.target.value)} value={inputs.treeWhatsApp || ''} className={`w-full p-3 rounded-xl border ${errors.treeWhatsApp ? 'border-red-500' : 'border-user-border'} bg-user-surface outline-none text-sm`} placeholder="WhatsApp Number" />
                      {errors.treeWhatsApp && <span className="text-red-500 text-[11px] font-bold mt-1 block">{errors.treeWhatsApp}</span>}
                    </div>
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">Step 2: Land Profile &amp; Location Identity</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Name of Land / Property Title</label>
                      <input type="text" required onChange={e => handleInputChange('treeLandName', e.target.value)} value={inputs.treeLandName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Name of Land / Property Title" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">District</label>
                      <input type="text" required onChange={e => handleInputChange('treeDistrict', e.target.value)} value={inputs.treeDistrict || userData?.district || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="District" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Divisional Secretariat Division</label>
                      <input type="text" required onChange={e => handleInputChange('treeDsDivision', e.target.value)} value={inputs.treeDsDivision || userData?.dsDiv || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Divisional Secretariat Division" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Grama Niladhari (G.N.) Division &amp; Number</label>
                      <input type="text" required onChange={e => handleInputChange('treeGnDivision', e.target.value)} value={inputs.treeGnDivision || userData?.gnDiv || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Grama Niladhari Division" />
                    </div>
                  </div>

                  <div className="bg-user-surface p-4 rounded-xl border border-user-border">
                    <span className="block text-[11px] font-extrabold text-user-secondary uppercase mb-2">Land Extent / Dimensions</span>
                    <div className="grid grid-cols-3 gap-3">
                      <input type="number" placeholder="Acres" onChange={e => handleInputChange('treeLandAcres', e.target.value)} value={inputs.treeLandAcres || ''} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      <input type="number" placeholder="Roods" onChange={e => handleInputChange('treeLandRoods', e.target.value)} value={inputs.treeLandRoods || ''} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      <input type="number" placeholder="Perches" onChange={e => handleInputChange('treeLandPerches', e.target.value)} value={inputs.treeLandPerches || ''} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Classification of Land Ownership</label>
                      <select required onChange={e => handleInputChange('treeOwnershipType', e.target.value)} value={inputs.treeOwnershipType || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- Select Dropdown --</option>
                        <option value="Private">Private</option>
                        <option value="Government / State">Government / State</option>
                        <option value="LDO Lease / Permit Land">LDO Lease / Permit Land</option>
                        <option value="Temple Property / Viharagam">Temple Property / Viharagam</option>
                        <option value="Other Tenure Matrix">Other Tenure Matrix</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Deed / Permit Number &amp; Registration Date</label>
                      <input type="text" required onChange={e => handleInputChange('treeDeedNoDate', e.target.value)} value={inputs.treeDeedNoDate || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Deed / Permit Number &amp; Date" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Is the land subject to any ongoing legal disputes or court restrictions?</label>
                    <select required onChange={e => handleInputChange('treeLegalDisputesExist', e.target.value)} value={inputs.treeLegalDisputesExist || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                      <option value="">-- Select --</option><option value="No">No</option><option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>
              )}

              {formStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">Step 3: Four Spatial Boundaries</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">North Boundary</label>
                      <input type="text" required onChange={e => handleInputChange('treeBoundNorth', e.target.value)} value={inputs.treeBoundNorth || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="North boundary bounded by" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">East Boundary</label>
                      <input type="text" required onChange={e => handleInputChange('treeBoundEast', e.target.value)} value={inputs.treeBoundEast || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="East boundary bounded by" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">South Boundary</label>
                      <input type="text" required onChange={e => handleInputChange('treeBoundSouth', e.target.value)} value={inputs.treeBoundSouth || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="South boundary bounded by" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">West Boundary</label>
                      <input type="text" required onChange={e => handleInputChange('treeBoundWest', e.target.value)} value={inputs.treeBoundWest || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="West boundary bounded by" />
                    </div>
                  </div>
                </div>
              )}

              {formStep === 4 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-user-border pb-2">
                    <span className="text-sm font-black text-user-secondary">Step 4: Specific Tree Logistics Array Grid</span>
                    <button type="button" onClick={() => setTreeLogistics([...treeLogistics, { species: '', girth: '', height: '', middleGirth: '', reason: '', proximityDanger: 'No' }])} className="px-3 py-1.5 rounded-lg border border-user-secondary text-user-secondary bg-user-surface cursor-pointer text-xs font-bold">+ Add Tree Matrix Row</button>
                  </div>
                  
                  {treeLogistics.map((tree, idx) => (
                    <div key={`tree-row-${idx}`} className="bg-user-surface p-4 rounded-xl border border-user-border space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <input type="text" required placeholder="Tree Species / Variety" value={tree.species} onChange={e => handleTreeRowChange(idx, 'species', e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder="Girth in Meters / Inches" value={tree.girth} onChange={e => handleTreeRowChange(idx, 'girth', e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder="Height in Meters" value={tree.height} onChange={e => handleTreeRowChange(idx, 'height', e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" required placeholder="Girth at Breast Height / Middle Girth" value={tree.middleGirth} onChange={e => handleTreeRowChange(idx, 'middleGirth', e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder="Specific Reason for Requesting Felling" value={tree.reason} onChange={e => handleTreeRowChange(idx, 'reason', e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-user-secondary cursor-pointer">
                          <input type="checkbox" checked={tree.proximityDanger === 'Yes'} onChange={e => handleTreeRowChange(idx, 'proximityDanger', e.target.checked ? 'Yes' : 'No')} className="accent-user-secondary" />
                          Proximity Danger Flag: Is the tree situated dangerously close to utility lines, boundary fences, or neighboring residential buildings?
                        </label>
                      </div>
                      {treeLogistics.length > 1 && (
                        <button type="button" onClick={() => handleRemoveRow('treeMatrix', idx)} className="border-none bg-none text-red-500 font-bold text-xs cursor-pointer text-right">Remove Row ×</button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {formStep === 5 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">Step 5: Required Document Upload Array</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2">
                      <span className="text-xs font-extrabold">Certified Copy of Title Deed / Lease Permit</span>
                      <input type="file" required className="text-sm" />
                    </div>
                    <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2">
                      <span className="text-xs font-extrabold">Approved Survey Plan PDF</span>
                      <input type="file" required className="text-sm" />
                    </div>
                  </div>

                  <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2">
                    <span className="text-xs font-extrabold">Photographic Evidence</span>
                    <span className="text-[10px] text-user-text-lighter block">Upload clear photos showcasing the tree profile and its structural environment context safely.</span>
                    <input type="file" required className="text-sm" />
                  </div>

                  {inputs.treeOwnershipType === 'Temple Property / Viharagam' && (
                    <div className="bg-user-surface border-2 border-dashed border-red-500 rounded-xl p-4 space-y-2">
                      <span className="text-xs font-extrabold text-red-600">Written Consent / Affidavit of Co-Owners Required</span>
                      <input type="file" required className="text-sm" />
                    </div>
                  )}

                  <div className="flex items-start gap-2.5 bg-user-secondary-light p-3 rounded-xl">
                    <input type="checkbox" required defaultChecked className="accent-user-secondary mt-0.5" />
                    <span className="text-[11px] text-user-text font-semibold leading-tight">
                      I hereby state that all the logged metrics regarding timber dimensions and land tenure classification lines correspond to legal ownership frameworks accurately.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              MODULE I: TREE TIMBER & REMOVAL PERMIT (FORM ID: 9)
             ========================================== */}
          {form.id === 9 && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">Step 1: Applicant &amp; Basic Request Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Gramasewaka (G.N.) Division</label>
                      <input type="text" required onChange={e => handleInputChange('removalGnDiv', e.target.value)} value={inputs.removalGnDiv || userData?.gnDiv || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Targeted area division" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Divisional Secretary (D.S.) Office</label>
                      <input type="text" required onChange={e => handleInputChange('removalDsOffice', e.target.value)} value={inputs.removalDsOffice || userData?.dsDiv || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. Kahawatta" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Applicant Full Name</label>
                    <input type="text" required onChange={e => handleInputChange('voterChiefName', e.target.value)} value={inputs.voterChiefName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Applicant Name" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Applicant NIC Number</label>
                      <input type="text" required onChange={e => handleInputChange('voterChiefNic', e.target.value)} value={inputs.voterChiefNic || ''} className={`w-full p-3 rounded-xl border ${errors.voterChiefNic ? 'border-red-500' : 'border-user-border'} bg-user-surface outline-none text-sm`} placeholder="NIC" />
                      {errors.voterChiefNic && <span className="text-red-500 text-[11px] font-bold mt-1 block">{errors.voterChiefNic}</span>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Contact Number</label>
                      <input type="text" required onChange={e => handleInputChange('voterChiefPhone', e.target.value)} value={inputs.voterChiefPhone || ''} className={`w-full p-3 rounded-xl border ${errors.voterChiefPhone ? 'border-red-500' : 'border-user-border'} bg-user-surface outline-none text-sm`} placeholder="10 Digits" />
                      {errors.voterChiefPhone && <span className="text-red-500 text-[11px] font-bold mt-1 block">{errors.voterChiefPhone}</span>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Landowner Name(s) (Leave blank if same as applicant)</label>
                    <input type="text" onChange={e => handleInputChange('removalLandownerName', e.target.value)} value={inputs.removalLandownerName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Landowner Title Holder Name" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Reason for cutting/removing the tree(s)</label>
                    <textarea rows={2} required onChange={e => handleInputChange('treeCuttingReason', e.target.value)} value={inputs.treeCuttingReason || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none resize-none text-sm" placeholder="e.g. Threat to property stability, development..." />
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">Step 2: Legal Land Profile &amp; Location Identity</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Name of the Land</label>
                      <input type="text" required onChange={e => handleInputChange('removalLandName', e.target.value)} value={inputs.removalLandName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Land Registry Denomination Name" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Village / Local Area</label>
                      <input type="text" required onChange={e => handleInputChange('removalVillageLocalArea', e.target.value)} value={inputs.removalVillageLocalArea || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Village Location" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary mb-2">Type of Land Ownership</label>
                    <div className="grid grid-cols-2 gap-2 text-sm font-bold">
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="remOwnershipRadio" checked={inputs.removalOwnershipType === 'Government Land'} onChange={() => handleInputChange('removalOwnershipType', 'Government Land')} className="accent-user-secondary" /> Government Land</label>
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="remOwnershipRadio" checked={inputs.removalOwnershipType === 'Private Land'} onChange={() => handleInputChange('removalOwnershipType', 'Private Land')} className="accent-user-secondary" /> Private Land</label>
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="remOwnershipRadio" checked={inputs.removalOwnershipType === 'Traditional Ownership'} onChange={() => handleInputChange('removalOwnershipType', 'Traditional Ownership')} className="accent-user-secondary" /> Traditional Ownership (Nindagam)</label>
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="remOwnershipRadio" checked={inputs.removalOwnershipType === 'Other'} onChange={() => handleInputChange('removalOwnershipType', 'Other')} className="accent-user-secondary" /> Other</label>
                    </div>
                  </div>

                  <div className="border border-user-border rounded-xl p-4 bg-user-surface">
                    <span className="block text-[11px] font-extrabold text-user-secondary uppercase mb-2">Four Spatial Boundaries</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="North" required onChange={e => handleInputChange('remBoundNorth', e.target.value)} value={inputs.remBoundNorth || ''} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      <input type="text" placeholder="East" required onChange={e => handleInputChange('remBoundEast', e.target.value)} value={inputs.remBoundEast || ''} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      <input type="text" placeholder="South" required onChange={e => handleInputChange('remBoundSouth', e.target.value)} value={inputs.remBoundSouth || ''} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      <input type="text" placeholder="West" required onChange={e => handleInputChange('remBoundWest', e.target.value)} value={inputs.remBoundWest || ''} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Land Deed / Permit / Grant Number</label>
                      <input type="text" required onChange={e => handleInputChange('removalDeedNumber', e.target.value)} value={inputs.removalDeedNumber || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Deed / Grant Number" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Date of Deed / Permit</label>
                      <input type="date" required onChange={e => handleInputChange('removalDeedDate', e.target.value)} value={inputs.removalDeedDate || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary mb-1">Is there any ongoing legal dispute or court case regarding this land?</label>
                    <select required onChange={e => handleInputChange('removalDisputeStatus', e.target.value)} value={inputs.removalDisputeStatus || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                      <option value="">-- Select --</option><option value="No">No</option><option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>
              )}

              {formStep === 3 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-user-border pb-2">
                    <span className="text-sm font-black text-user-secondary">Step 3: Specific Tree &amp; Timber Details Matrix</span>
                    <button type="button" onClick={() => setTimberGrid([...timberGrid, { species: '', girth: '', height: '', woodVol: '', firewoodVol: '', infraImpact: 'No' }])} className="px-3 py-1.5 rounded-lg border border-user-secondary text-user-secondary bg-user-surface cursor-pointer text-xs font-bold">+ Add Row</button>
                  </div>

                  <div className="space-y-3">
                    {timberGrid.map((row, idx) => (
                      <div key={`timber-row-${idx}`} className="bg-user-surface p-4 rounded-xl border border-user-border space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <input type="text" required placeholder="Species / Variety of Tree" value={row.species} onChange={e => handleTimberGridChange(idx, 'species', e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                          <input type="text" required placeholder="Girth / Circumference (M)" value={row.girth} onChange={e => handleTimberGridChange(idx, 'girth', e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                          <input type="text" required placeholder="Height (Meters)" value={row.height} onChange={e => handleTimberGridChange(idx, 'height', e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <input type="text" required placeholder="Est Wood Volume (m³)" value={row.woodVol} onChange={e => handleTimberGridChange(idx, 'woodVol', e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                          <input type="text" required placeholder="Est Firewood Vol (m³)" value={row.firewoodVol} onChange={e => handleTimberGridChange(idx, 'firewoodVol', e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                          <select value={row.infraImpact} onChange={e => handleTimberGridChange(idx, 'infraImpact', e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                            <option value="No">No Infrastructure Threat</option><option value="Yes">Yes (Danger / Impact)</option>
                          </select>
                        </div>
                        {timberGrid.length > 1 && (
                          <button type="button" onClick={() => handleRemoveRow('timberGrid', idx)} className="border-none bg-none text-red-500 font-bold text-xs cursor-pointer text-right">Remove Row ×</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formStep === 4 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">Step 4: Sketch Map &amp; Mandatory Document Upload Array</h4>
                  
                  <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2">
                    <span className="text-xs font-extrabold">Land Sketch Map / Layout Diagram *</span>
                    <span className="text-[11px] text-user-text-lighter block">Upload a hand-drawn sketch or digital map showing the location of the trees on the land plot.</span>
                    <input type="file" required className="text-sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2">
                      <span className="text-[11px] font-extrabold">Certified Copy of Title Deed, Permit, or Grant *</span>
                      <input type="file" required className="text-sm" />
                    </div>
                    <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2">
                      <span className="text-[11px] font-extrabold">Certified Copy of Land Plan Map *</span>
                      <input type="file" required className="text-sm" />
                    </div>
                  </div>

                  {inputs.removalLandownerName && inputs.removalLandownerName !== '' && (
                    <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2">
                      <span className="text-xs font-extrabold text-user-secondary">Letter of Consent from Co-owners / Shared Registry Title *</span>
                      <span className="text-[10px] text-user-text-lighter block">Mandatory field upload since the primary applicant name is separate from the deed baseline title holder lines.</span>
                      <input type="file" required className="text-sm" />
                    </div>
                  )}

                  <div className="bg-user-surface border-2 border-dashed border-user-border rounded-xl p-4 space-y-2">
                    <span className="text-[11px] font-extrabold">Any other supporting documents justifying tree removal</span>
                    <input type="file" className="text-sm" />
                  </div>

                  <div className="flex items-start gap-2.5 bg-user-secondary-light p-3 rounded-xl">
                    <input type="checkbox" required defaultChecked className="accent-user-secondary mt-0.5" />
                    <span className="text-[11px] text-user-text font-semibold leading-tight">
                      I hereby state that all property boundaries, volume projections, and infrastructure threat criteria logged here are valid and accurate to the best of my belief.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              MODULE J: BUSINESS REGISTRATION RECOMMENDATION (FORM ID: 10)
             ========================================== */}
          {form.id === 10 && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">01. Business Ownership &amp; Identity Baseline</h4>
                  
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Proposed Business Entity Name</label>
                    <input type="text" required onChange={e => handleInputChange('biz_prop_name', e.target.value)} value={inputs.biz_prop_name || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="e.g. Smart Grama Services" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Nature of Business / Category</label>
                      <select required onChange={e => handleInputChange('biz_nature_type', e.target.value)} value={inputs.biz_nature_type || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- Select Type --</option>
                        <option value="Retail Store">Retail Shop / Grocery</option>
                        <option value="IT Services">Software / Technology Services</option>
                        <option value="Manufacturing">Manufacturing / Workshop</option>
                        <option value="Other">Other Commercial Entities</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Legal Structure Type</label>
                      <select required onChange={e => handleInputChange('biz_legal_structure', e.target.value)} value={inputs.biz_legal_structure || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="Sole Proprietorship">Sole Proprietorship</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Private Limited Company">Private Limited Company</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Primary Proprietor Full Name</label>
                      <input type="text" required onChange={e => handleInputChange('biz_owner_name', e.target.value)} value={inputs.biz_owner_name || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Proprietor's Full Name" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Owner NIC Number</label>
                      <input type="text" required onChange={e => handleInputChange('biz_owner_nic', e.target.value)} value={inputs.biz_owner_nic || ''} className={`w-full p-3 rounded-xl border ${errors.biz_owner_nic ? 'border-red-500' : 'border-user-border'} bg-user-surface outline-none text-sm`} placeholder="NIC Number" />
                      {errors.biz_owner_nic && <span className="text-red-500 text-[11px] font-bold mt-1 block">{errors.biz_owner_nic}</span>}
                    </div>
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">02. Location Profile &amp; Environmental Frameworks</h4>
                  
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Physical Address of Business Premises</label>
                    <textarea rows={2} required onChange={e => handleInputChange('biz_premises_address', e.target.value)} value={inputs.biz_premises_address || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none resize-none text-sm" placeholder="Enter exact structural location details..." />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Premises Ownership Type</label>
                      <select required onChange={e => handleInputChange('biz_tenure_type', e.target.value)} value={inputs.biz_tenure_type || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- Select Status --</option>
                        <option value="Owned by Applicant">Owned by Applicant</option>
                        <option value="Rented / Leased Premises">Rented / Leased Premises</option>
                        <option value="Family-Owned">Family-Owned Property</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Estimated Initial Capital Investment (LKR)</label>
                      <input type="number" required onChange={e => handleInputChange('biz_initial_capital', e.target.value)} value={inputs.biz_initial_capital || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0.00" />
                    </div>
                  </div>

                  <div className="bg-user-surface p-4 rounded-xl border border-user-border space-y-3">
                    <span className="text-[11px] font-extrabold text-user-secondary uppercase">Environmental Protection Compliance</span>
                    <label className="flex items-center gap-2 text-xs font-bold text-user-text cursor-pointer">
                      <input type="checkbox" required defaultChecked className="accent-user-secondary" />
                      I verify that business operations cause no hazardous industrial chemical leakage, waste accumulation, or auditory disturbance violating environmental protocols.
                    </label>
                  </div>
                </div>
              )}

              {formStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">03. Verifiable Legal Deeds &amp; Documents</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2">
                      <span className="text-[11px] font-extrabold">Premises Proof (Deed / Lease Agreement Scan) *</span>
                      <input type="file" required className="text-sm" />
                    </div>
                    <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2">
                      <span className="text-[11px] font-extrabold">Proprietor Identity Copy (NIC Scan) *</span>
                      <input type="file" required className="text-sm" />
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 bg-user-secondary-light p-3 rounded-xl">
                    <input type="checkbox" required defaultChecked className="accent-user-secondary mt-0.5" />
                    <span className="text-[11px] text-user-text font-semibold leading-tight">
                      I hereby certify that all information submitted regarding company nature, ownership credentials, and commercial assets are completely truthful and valid.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Form 11: Assessments for Ownership of Lands - Simplified */}
          {form.id === 11 && (
            <div className="space-y-4">
              <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">Land Ownership Assessment</h4>
              <div>
                <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Land Name / Location</label>
                <input type="text" required onChange={e => handleInputChange('assessmentLandName', e.target.value)} value={inputs.assessmentLandName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Land name or address" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">DS Division</label>
                  <input type="text" required onChange={e => handleInputChange('assessmentDsDivision', e.target.value)} value={inputs.assessmentDsDivision || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Divisional Secretariat" />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">GN Division</label>
                  <input type="text" required onChange={e => handleInputChange('assessmentGnDivision', e.target.value)} value={inputs.assessmentGnDivision || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Grama Niladhari" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Current Owner(s) Name</label>
                <input type="text" required onChange={e => handleInputChange('assessmentCurrentOwner', e.target.value)} value={inputs.assessmentCurrentOwner || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="Legal owner names" />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">Type of Ownership</label>
                <select required onChange={e => handleInputChange('assessmentOwnershipType', e.target.value)} value={inputs.assessmentOwnershipType || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                  <option value="">-- Select --</option>
                  <option value="Deeded Land">Deeded Land (Permanent)</option>
                  <option value="Leased Land">Leased Land (Temporary Grant)</option>
                  <option value="Traditional Ownership">Traditional Ownership (Nindagam)</option>
                </select>
              </div>
              <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2">
                <span className="text-xs font-extrabold">Supporting Documents (Title Deed / Grant Copy)</span>
                <input type="file" required className="text-sm" />
              </div>
            </div>
          )}

          {/* Action Control Interface Buttons Wizard Panel Tray */}
          <div className="flex justify-between mt-4 pt-2 border-t border-user-border">
            <button 
              type="button" 
              onClick={() => { if (formStep === 1) onClose(); else setFormStep(prev => prev - 1); }} 
              className="px-6 py-2.5 rounded-full border border-user-border bg-user-surface font-bold text-user-text-lighter cursor-pointer hover:bg-user-secondary-light"
            >
              Back
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className={`px-6 py-2.5 rounded-full font-extrabold text-white transition-all ${
                submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-user-secondary hover:bg-user-secondary-dark cursor-pointer'
              }`}
            >
              {submitting ? 'Submitting...' : ((form.id === 3 && formStep === 4) || (form.id === 6 && formStep === 4) || (form.id === 7 && formStep === 3) || (form.id === 8 && formStep === 5) || (form.id === 9 && formStep === 4) || (form.id !== 3 && form.id !== 6 && form.id !== 7 && form.id !== 8 && form.id !== 9 && formStep === (form.id === 11 ? 1 : 3))) ? 'Submit' : 'Next'}
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
          <div className="md:hidden pt-3 px-3.5 relative">
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