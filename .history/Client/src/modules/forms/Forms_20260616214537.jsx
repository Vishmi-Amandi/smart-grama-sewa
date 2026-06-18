// ------------------- START OF Forms.js -------------------
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../user/components/languageSwitcher';
import { PageLoadingSkeleton } from '../user/components/skeleton';
import NotificationBell from '../user/components/NotificationBell';

// --- Icons & Styles (unchanged) ---
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
  download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  fileText: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
};

// --------------------------------------------------------------
// Helper to get translation keys for nav items
// --------------------------------------------------------------
const getNavItems = (t) => [
  { key: 'dashboard', icon: IC.dashboard, label: t('nav.dashboard'), path: '/dashboard' },
  { key: 'announcements', icon: IC.announce, label: t('nav.announcements'), path: '/announcements' },
  { key: 'appointments', icon: IC.appts, label: t('nav.appointments'), path: '/appointments' },
  { key: 'forms', icon: IC.forms, label: t('nav.forms'), path: '/forms' },
  { key: 'ai', icon: IC.ai, label: t('nav.aiAssistant'), path: '/ai' },
];

const getBottomNav = (t) => [
  { key: 'profile', icon: IC.profile, label: t('nav.profile'), path: '/profile' },
  { key: 'settings', icon: IC.settings, label: t('nav.settings'), path: '/settings' },
  { key: 'logout', icon: IC.logout, label: t('nav.signOut'), action: 'logout' },
];

// NavItem
const NavItem = ({ iconPath, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-none cursor-pointer transition-all duration-150 text-left mb-0.5 ${
    active
      ? 'bg-user-background text-white font-extrabold shadow-md'
      : 'bg-transparent text-gray-700 font-semibold hover:bg-yellow-100'
  }`}
    style={{ color: active ? '#B46A02' : '#5a3a00' }}
  >
    <Icon d={iconPath} size={18} color={active ? '#B46A02' : '#5a3a00'} />
    {label}
  </button>
);

// Desktop Sidebar
const DesktopSidebar = ({ activePage, navigate, onLogout, t }) => {
  const navItems = getNavItems(t);
  const bottomNav = getBottomNav(t);

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
const DesktopTopbar = ({ chipName, searchQuery, setSearchQuery, showResults, setShowResults, navigate, currentLanguage, onLanguageChange, showProfileMenu, setShowProfileMenu, handleLogout, userData, currentUser, t }) => (
  <div className="desktop-topbar h-16 bg-white border-b border-user-border-light flex items-center px-7 gap-3.5 sticky top-0 z-40 shadow-sm">
    <div className="flex-1 max-w-[400px] relative">
      <div className="flex items-center gap-2.5 bg-user-secondary-light border border-user-border rounded-3xl px-4 py-2 transition-colors hover:border-user-primary">
        <Icon d={IC.search} size={16} color="#aaa" />
        <input
          type="text"
          placeholder={t('search.placeholder')}
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
          className="flex-1 border-none outline-none text-sm font-medium text-user-text bg-transparent"
        />
        {searchQuery && (
          <button onClick={() => { setSearchQuery(''); setShowResults(false); }} className="bg-none border-none cursor-pointer p-1">
            <Icon d={IC.close} size={14} color="#aaa" />
          </button>
        )}
      </div>
      <SearchResultsDropdown searchQuery={searchQuery} showResults={showResults} setShowResults={setShowResults} navigate={navigate} t={t} />
    </div>
    <div className="flex-1" />
    <LanguageSwitcher currentLanguage={currentLanguage} onLanguageChange={onLanguageChange} />
    <NotificationBell />
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setShowProfileMenu(!showProfileMenu); }}
        className="flex items-center gap-2 py-1 pl-1.5 pr-3.5 bg-user-secondary-light border border-user-border rounded-3xl cursor-pointer transition-all hover:border-user-primary"
      >
        <span className="text-sm font-bold text-user-text max-w-[100px] truncate">{chipName}</span>
        <div className="w-7 h-7 rounded-full bg-user-primary flex items-center justify-center flex-shrink-0">
          <Icon d={IC.profile} size={16} color="#3d2a00" />
        </div>
      </button>
      {showProfileMenu && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-user-border z-50 overflow-hidden animate-fade-in">
          <div className="p-3 border-b border-user-border-light">
            <p className="text-sm font-bold text-user-text">{userData?.fullName || currentUser?.displayName || t('profile.user')}</p>
            <p className="text-xs text-user-text-lighter mt-1">{currentUser?.email}</p>
          </div>
          <button onClick={() => { navigate('/profile'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-user-text hover:bg-user-background transition-colors">
            <Icon d={IC.profile} size={16} color="#B46A02" /> {t('profile.myProfile')}
          </button>
          <button onClick={() => { navigate('/settings'); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-user-text hover:bg-user-background transition-colors">
            <Icon d={IC.settings} size={16} color="#B46A02" /> {t('profile.settings')}
          </button>
          <div className="border-t border-user-border-light my-1"></div>
          <button onClick={() => { handleLogout(); setShowProfileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors">
            <Icon d={IC.logout} size={16} color="#ef4444" /> {t('profile.signOut')}
          </button>
        </div>
      )}
    </div>
  </div>
);

// Mobile Topbar
const MobileTopbar = ({ chipName, onMenuClick, navigate, currentLanguage, onLanguageChange, t }) => (
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
    <NotificationBell />
    <div className="w-9 h-9 rounded-full bg-white/85 flex items-center justify-center cursor-pointer" onClick={() => navigate('/profile')}>
      <Icon d={IC.profile} size={20} color="#3d2a00" />
    </div>
  </div>
);

// Mobile Sidebar Overlay
const MobileSidebar = ({ isOpen, onClose, activePage, navigate, onLogout, t }) => {
  const navItems = getNavItems(t);
  const bottomNav = getBottomNav(t);

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
            onClick={() => { if (item.key === 'ai') { window.openChatbot?.(); onClose(); return; } navigate(item.path); onClose(); }} />
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

// Search Results Dropdown
const SearchResultsDropdown = ({ searchQuery, showResults, setShowResults, navigate, t }) => {
  const PAGE_ACTIONS = [
    { name: t('nav.dashboard'), path: '/dashboard', icon: IC.dashboard },
    { name: t('nav.announcements'), path: '/announcements', icon: IC.announce },
    { name: t('nav.appointments'), path: '/appointments', icon: IC.appts },
    { name: t('nav.forms'), path: '/forms', icon: IC.forms },
    { name: t('nav.aiAssistant'), path: null, icon: IC.ai },
    { name: t('nav.profile'), path: '/profile', icon: IC.profile },
    { name: t('nav.settings'), path: '/settings', icon: IC.settings },
  ];
  const [filteredPages, setFilteredPages] = useState([]);

  useEffect(() => {
    if (!searchQuery.trim()) { setFilteredPages([]); return; }
    const query = searchQuery.toLowerCase();
    setFilteredPages(PAGE_ACTIONS.filter(page => page.name.toLowerCase().includes(query)));
  }, [searchQuery]);

  if (!showResults || filteredPages.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-user-surface dark:bg-user-surface rounded-xl shadow-lg border border-user-border dark:border-user-border z-[1000] overflow-hidden">
      {filteredPages.map((page, idx) => (
        <button
          key={page.path}
          onClick={() => { if (page.path === null) { window.openChatbot?.(); setShowResults(false); return; } navigate(page.path); setShowResults(false); }}
          className={`w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-user-background dark:hover:bg-user-background ${idx !== filteredPages.length - 1 ? 'border-b border-user-border-light dark:border-user-border' : ''}`}
        >
          <Icon d={page.icon} size={18} color="#B46A02" />
          <div>
            <div className="text-sm font-bold text-user-text dark:text-user-text">{page.name}</div>
            <div className="text-[11px] text-user-text-lighter dark:text-user-text-lighter">{t('search.clickToGo', { name: page.name })}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

// ============================================================
// SIMPLE PDF GENERATION (unchanged, no translations needed)
// ============================================================

const generateFormPDF = async ({ form, inputs, userData, currentUser, disabledMembers, otherMembers, newVoters, deletedVoters, treeLogistics, timberGrid }) => {
  // ... (keep exactly as in your original code)
  // I'm omitting this to keep message length manageable – it's identical to yours.
  // Just copy your existing generateFormPDF function here.
};

// ============================================================
// DYNAMIC FORM MODAL – fully translated
// ============================================================

const DynamicFormModal = ({ form, onClose, inputs, setInputs, currentUser, userData, onSuccess }) => {
  const { t } = useTranslation();
  if (!form) return null;

  const [formStep, setFormStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [hasJobIncome, setHasJobIncome] = useState(false);
  const [hasPropertyIncome, setHasPropertyIncome] = useState(false);
  const [hasBusinessIncome, setHasBusinessIncome] = useState(false);
  const [isReliefRecipient, setIsReliefRecipient] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [disabledMembers, setDisabledMembers] = useState([{ name: '', relation: '', gender: '', civilStatus: '', dob: '', nic: '', nature: '' }]);
  const [otherMembers, setOtherMembers] = useState([{ name: '', relation: '', gender: '', civilStatus: '', dob: '', nic: '', incomeSourceAmt: '' }]);
  const [voterPurpose, setVoterPurpose] = useState('OptionA');
  const [newVoters, setNewVoters] = useState([{ name: '', nic: '', dob: '', gender: '', relation: '', prevAddress: '', prevDistrict: '', prevYear: '' }]);
  const [deletedVoters, setDeletedVoters] = useState([{ name: '', nic: '', reason: '', deathDate: '', newAddress: '', newPhone: '' }]);
  const [treeLogistics, setTreeLogistics] = useState([{ species: '', girth: '', height: '', middleGirth: '', reason: '', proximityDanger: 'No' }]);
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
      if (val && !/^\d{10}$/.test(val)) msg = t('validation.phone');
    }
    if (label.includes('nic') || label.includes('identity')) {
      if (val && !/^(\d{12}|\d{9}[vV])$/.test(val)) msg = t('validation.nic');
    }
    setErrors(prev => ({ ...prev, [key]: msg }));
    return msg === '';
  };

  const handleInputChange = (field, val) => {
    setInputs(prev => ({ ...prev, [field]: val }));
    validateValue(field, val);
  };

  const handleRemoveRow = (tableType, index) => {
    if (tableType === 'A') setDisabledMembers(disabledMembers.filter((_, i) => i !== index));
    if (tableType === 'B') setOtherMembers(otherMembers.filter((_, i) => i !== index));
    if (tableType === 'voterAdd') setNewVoters(newVoters.filter((_, i) => i !== index));
    if (tableType === 'voterDel') setDeletedVoters(deletedVoters.filter((_, i) => i !== index));
    if (tableType === 'treeMatrix') setTreeLogistics(treeLogistics.filter((_, i) => i !== index));
    if (tableType === 'timberGrid') setTimberGrid(timberGrid.filter((_, i) => i !== index));
  };

  const handleTreeRowChange = (index, field, val) => {
    const updated = [...treeLogistics]; updated[index][field] = val; setTreeLogistics(updated);
  };
  const handleTimberGridChange = (index, field, val) => {
    const updated = [...timberGrid]; updated[index][field] = val; setTimberGrid(updated);
  };

  const stepFieldsHaveErrors = () => Object.values(errors).some(err => err !== '');

  let maxSteps = 3;
  if (form.id === 3 || form.id === 6 || form.id === 7 || form.id === 9) maxSteps = 4;
  if (form.id === 8) maxSteps = 5;
  if (form.id === 11) maxSteps = 1;

  const isLastStep = formStep === maxSteps;

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (stepFieldsHaveErrors()) {
      alert(t('modal.validationError'));
      return;
    }
    if (form.id === 7 && formStep === 3 && voterPurpose === 'OptionA') {
      const dobTimestamp = new Date(inputs.ycDob).getTime();
      const minBound = new Date('2008-02-01').getTime();
      const maxBound = new Date('2010-01-31').getTime();
      if (!inputs.ycDob || dobTimestamp < minBound || dobTimestamp > maxBound) {
        alert(t('modal.ycDobError'));
        return;
      }
    }

    if (!isLastStep) {
      setFormStep(prev => prev + 1);
    } else {
      setGenerating(true);
      try {
        let finalInputs = { ...inputs };
        if (form.id === 3) finalInputs.totalAnnualIncome = `Rs. ${totalCalculatedIncome.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
        if (form.id === 7) finalInputs.selectedPurposeMode = voterPurpose;

        await generateFormPDF({
          form,
          inputs: finalInputs,
          userData,
          currentUser,
          disabledMembers,
          otherMembers,
          newVoters,
          deletedVoters,
          treeLogistics,
          timberGrid,
        });
        onSuccess?.(t('modal.pdfSuccess', { title: form.title }));
        onClose();
        setFormStep(1);
      } catch (err) {
        console.error('PDF generation error:', err);
        alert(t('modal.pdfError'));
      } finally {
        setGenerating(false);
      }
    }
  };

  const isResidenceOrCharacter = form.id === 1 || form.id === 2;

  // We'll use helper to get translated labels (but we'll just inline t() in JSX)

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/40 z-[1000]" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1001] w-full max-w-[760px] max-h-[90vh] bg-user-surface dark:bg-user-surface rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        <div className="bg-user-secondary dark:bg-user-secondary p-5 flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="text-xl font-black text-white">{form.title}</h3>
            <p className="text-xs text-yellow-200">{t('modal.officialPortal')}</p>
          </div>
          <button onClick={onClose} className="text-white text-3xl cursor-pointer leading-5">×</button>
        </div>

        {/* Step Indicators */}
        <div className="flex flex-wrap gap-2 bg-user-secondary-light dark:bg-user-secondary-light p-3 border-b border-user-border dark:border-user-border text-[11px] font-extrabold text-user-text-lighter flex-shrink-0 overflow-x-auto">
          {isResidenceOrCharacter && (
            <>
              <span className={`${formStep===1?'text-user-secondary':''}`}>{t('modal.step1.residence')}</span> &gt; 
              <span className={`${formStep===2?'text-user-secondary':''}`}>{t('modal.step2.residence')}</span> &gt; 
              <span className={`${formStep===3?'text-user-secondary':''}`}>{t('modal.step3.residence')}</span>
            </>
          )}
          {form.id===3 && (
            <>
              <span className={`${formStep===1?'text-user-secondary':''}`}>{t('modal.step1.income')}</span> &gt; 
              <span className={`${formStep===2?'text-user-secondary':''}`}>{t('modal.step2.income')}</span> &gt; 
              <span className={`${formStep===3?'text-user-secondary':''}`}>{t('modal.step3.income')}</span> &gt; 
              <span className={`${formStep===4?'text-user-secondary':''}`}>{t('modal.step4.income')}</span>
            </>
          )}
          {form.id===4 && (
            <>
              <span className={`${formStep===1?'text-user-secondary':''}`}>{t('modal.step1.valuation')}</span> &gt; 
              <span className={`${formStep===2?'text-user-secondary':''}`}>{t('modal.step2.valuation')}</span> &gt; 
              <span className={`${formStep===3?'text-user-secondary':''}`}>{t('modal.step3.valuation')}</span>
            </>
          )}
          {form.id===5 && (
            <>
              <span className={`${formStep===1?'text-user-secondary':''}`}>{t('modal.step1.nic')}</span> &gt; 
              <span className={`${formStep===2?'text-user-secondary':''}`}>{t('modal.step2.nic')}</span> &gt; 
              <span className={`${formStep===3?'text-user-secondary':''}`}>{t('modal.step3.nic')}</span>
            </>
          )}
          {form.id===6 && (
            <>
              <span className={`${formStep===1?'text-user-secondary':''}`}>{t('modal.step1.disabled')}</span> &gt; 
              <span className={`${formStep===2?'text-user-secondary':''}`}>{t('modal.step2.disabled')}</span> &gt; 
              <span className={`${formStep===3?'text-user-secondary':''}`}>{t('modal.step3.disabled')}</span> &gt; 
              <span className={`${formStep===4?'text-user-secondary':''}`}>{t('modal.step4.disabled')}</span>
            </>
          )}
          {form.id===7 && (
            <>
              <span className={`${formStep===1?'text-user-secondary':''}`}>{t('modal.step1.voter')}</span> &gt; 
              <span className={`${formStep===2?'text-user-secondary':''}`}>{t('modal.step2.voter')}</span> &gt; 
              <span className={`${formStep===3?'text-user-secondary':''}`}>{t('modal.step3.voter')}</span>
            </>
          )}
          {form.id===8 && (
            <>
              <span className={`${formStep===1?'text-user-secondary':''}`}>{t('modal.step1.tree')}</span> &gt; 
              <span className={`${formStep===2?'text-user-secondary':''}`}>{t('modal.step2.tree')}</span> &gt; 
              <span className={`${formStep===3?'text-user-secondary':''}`}>{t('modal.step3.tree')}</span> &gt; 
              <span className={`${formStep===4?'text-user-secondary':''}`}>{t('modal.step4.tree')}</span> &gt; 
              <span className={`${formStep===5?'text-user-secondary':''}`}>{t('modal.step5.tree')}</span>
            </>
          )}
          {form.id===9 && (
            <>
              <span className={`${formStep===1?'text-user-secondary':''}`}>{t('modal.step1.timber')}</span> &gt; 
              <span className={`${formStep===2?'text-user-secondary':''}`}>{t('modal.step2.timber')}</span> &gt; 
              <span className={`${formStep===3?'text-user-secondary':''}`}>{t('modal.step3.timber')}</span> &gt; 
              <span className={`${formStep===4?'text-user-secondary':''}`}>{t('modal.step4.timber')}</span>
            </>
          )}
          {form.id===10 && (
            <>
              <span className={`${formStep===1?'text-user-secondary':''}`}>{t('modal.step1.business')}</span> &gt; 
              <span className={`${formStep===2?'text-user-secondary':''}`}>{t('modal.step2.business')}</span> &gt; 
              <span className={`${formStep===3?'text-user-secondary':''}`}>{t('modal.step3.business')}</span>
            </>
          )}
          {form.id===11 && (
            <span className="text-user-secondary">{t('modal.step1.assessment')}</span>
          )}
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4 bg-user-background dark:bg-user-background">

          {/* ==========================================
              MODULE A: RESIDENCE & CHARACTER CERTIFICATES
             ========================================== */}
          {isResidenceOrCharacter && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.residence.step1.title')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.residence.dsDivision')}</label>
                      <input type="text" disabled value={userData?.dsDiv || "Colombo / Thimbirigasyaya"} className="w-full p-3 rounded-xl border border-user-border bg-user-secondary-light text-user-text-lighter text-sm" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.residence.gnDivision')}</label>
                      <input type="text" disabled value={userData?.gnDiv || "Hunupitiya (62B)"} className="w-full p-3 rounded-xl border border-user-border bg-user-secondary-light text-user-text-lighter text-sm" />
                    </div>
                  </div>
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2 pt-2">{t('modal.residence.applicantInfo')}</h4>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.fields.fullName')}</label>
                    <input type="text" required onChange={e => handleInputChange('applicantName', e.target.value)} value={inputs.applicantName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none focus:border-user-primary text-sm" placeholder={t('modal.placeholder.fullName')} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.fields.permanentAddress')}</label>
                    <input type="text" required onChange={e => handleInputChange('applicantAddress', e.target.value)} value={inputs.applicantAddress || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none focus:border-user-primary text-sm" placeholder={t('modal.placeholder.permanentAddress')} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.fields.sex')}</label>
                      <select required onChange={e => handleInputChange('sex', e.target.value)} value={inputs.sex || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- {t('modal.select')} --</option><option value="Male">{t('modal.male')}</option><option value="Female">{t('modal.female')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.fields.age')}</label>
                      <input type="number" required onChange={e => handleInputChange('age', e.target.value)} value={inputs.age || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.placeholder.age')} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.fields.civilStatus')}</label>
                      <select required onChange={e => handleInputChange('civilStatus', e.target.value)} value={inputs.civilStatus || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- {t('modal.select')} --</option><option value="Unmarried">{t('modal.unmarried')}</option><option value="Married">{t('modal.married')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.fields.isSriLankan')}</label>
                      <select required onChange={e => handleInputChange('isSriLankan', e.target.value)} value={inputs.isSriLankan || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="Yes">{t('modal.yes')}</option><option value="No">{t('modal.no')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.fields.religion')}</label>
                      <input type="text" required onChange={e => handleInputChange('religion', e.target.value)} value={inputs.religion || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.placeholder.religion')} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.fields.occupation')}</label>
                    <input type="text" required onChange={e => handleInputChange('occupation', e.target.value)} value={inputs.occupation || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.placeholder.occupation')} />
                  </div>
                </div>
              )}
              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.residence.step2.title')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.residence.villagePeriod')}</label>
                      <input type="text" required onChange={e => handleInputChange('villagePeriod', e.target.value)} value={inputs.villagePeriod || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.placeholder.villagePeriod')} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.residence.gnPeriod')}</label>
                      <input type="text" required onChange={e => handleInputChange('gnPeriod', e.target.value)} value={inputs.gnPeriod || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.placeholder.gnPeriod')} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.residence.residenceEvidence')}</label>
                    <input type="text" required onChange={e => handleInputChange('residenceEvidence', e.target.value)} value={inputs.residenceEvidence || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.placeholder.residenceEvidence')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.fields.nic')}</label>
                      <input type="text" required onChange={e => handleInputChange('nicNumber', e.target.value)} value={inputs.nicNumber || ''} className={`w-full p-3 rounded-xl border ${errors.nicNumber ? 'border-red-500' : 'border-user-border'} bg-user-surface outline-none text-sm`} placeholder={t('modal.placeholder.nic')} />
                      {errors.nicNumber && <span className="text-red-500 text-[11px] font-bold mt-1 block">{errors.nicNumber}</span>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.residence.electoralDetails')}</label>
                      <input type="text" required onChange={e => handleInputChange('electoralDetails', e.target.value)} value={inputs.electoralDetails || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.placeholder.electoralDetails')} />
                    </div>
                  </div>
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2 pt-2">{t('modal.residence.familyParticulars')}</h4>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.fields.fatherName')}</label>
                    <input type="text" required onChange={e => handleInputChange('fatherName', e.target.value)} value={inputs.fatherName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.placeholder.fatherName')} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.fields.fatherAddress')}</label>
                    <input type="text" required onChange={e => handleInputChange('fatherAddress', e.target.value)} value={inputs.fatherAddress || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.placeholder.fatherAddress')} />
                  </div>
                </div>
              )}
              {formStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.residence.step3.title')}</h4>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.residence.courtConviction')}</label>
                    <select required onChange={e => handleInputChange('courtConviction', e.target.value)} value={inputs.courtConviction || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                      <option value="No">{t('modal.no')}</option><option value="Yes">{t('modal.yes')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.residence.socialService')}</label>
                    <textarea rows={2} onChange={e => handleInputChange('socialService', e.target.value)} value={inputs.socialService || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none resize-none text-sm" placeholder={t('modal.placeholder.socialService')} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.residence.certificatePurpose')}</label>
                    <input type="text" required onChange={e => handleInputChange('certificatePurpose', e.target.value)} value={inputs.certificatePurpose || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.placeholder.certificatePurpose')} />
                  </div>
                  <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4">
                    <span className="text-xs font-extrabold text-user-text block mb-2">{t('modal.signatureAffirmation')}</span>
                    <input type="file" className="text-sm" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              MODULE B: INCOME CERTIFICATE (form.id === 3)
             ========================================== */}
          {form.id === 3 && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.income.step1.title')}</h4>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.fields.fullName')}</label>
                    <input type="text" required onChange={e => handleInputChange('incFullName', e.target.value)} value={inputs.incFullName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.placeholder.fullName')} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.fields.permanentAddress')}</label>
                    <textarea rows={2} required onChange={e => handleInputChange('incAddress', e.target.value)} value={inputs.incAddress || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none resize-none text-sm" placeholder={t('modal.placeholder.permanentAddress')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.fields.nic')}</label>
                      <input type="text" required onChange={e => handleInputChange('incNic', e.target.value)} value={inputs.incNic || ''} className={`w-full p-3 rounded-xl border ${errors.incNic ? 'border-red-500' : 'border-user-border'} bg-user-surface outline-none text-sm`} placeholder={t('modal.placeholder.nic')} />
                      {errors.incNic && <span className="text-red-500 text-[11px] font-bold mt-1 block">{errors.incNic}</span>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.income.incPurpose')}</label>
                      <select required onChange={e => handleInputChange('incPurpose', e.target.value)} value={inputs.incPurpose || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- {t('modal.select')} --</option>
                        <option value="University Admission">{t('modal.income.purposeUniversity')}</option>
                        <option value="Bank Loan">{t('modal.income.purposeBank')}</option>
                        <option value="Scholarship">{t('modal.income.purposeScholarship')}</option>
                        <option value="Other">{t('modal.income.purposeOther')}</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.income.step2.title')}</h4>
                  <p className="text-xs text-user-text-lighter font-semibold">{t('modal.income.toggleSources')}</p>
                  <div className="bg-user-surface p-4 rounded-xl border border-user-border">
                    <label className="flex items-center gap-2 text-sm font-extrabold text-user-text cursor-pointer">
                      <input type="checkbox" checked={hasJobIncome} onChange={e => setHasJobIncome(e.target.checked)} className="accent-user-secondary" />
                      {t('modal.income.jobIncome')}
                    </label>
                    {hasJobIncome && (
                      <div className="mt-3 pt-3 border-t border-user-border">
                        <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.income.jobAmount')}</label>
                        <input type="number" onChange={e => handleInputChange('incomeJobAmt', e.target.value)} value={inputs.incomeJobAmt || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0.00" />
                      </div>
                    )}
                  </div>
                  <div className="bg-user-surface p-4 rounded-xl border border-user-border">
                    <label className="flex items-center gap-2 text-sm font-extrabold text-user-text cursor-pointer">
                      <input type="checkbox" checked={hasPropertyIncome} onChange={e => setHasPropertyIncome(e.target.checked)} className="accent-user-secondary" />
                      {t('modal.income.propertyIncome')}
                    </label>
                    {hasPropertyIncome && (
                      <div className="mt-3 pt-3 border-t border-user-border space-y-3">
                        <div>
                          <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.income.propertyLocation')}</label>
                          <input type="text" onChange={e => handleInputChange('landLoc', e.target.value)} value={inputs.landLoc || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.income.propertyLocationPlaceholder')} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.income.deedNumber')}</label>
                            <input type="text" onChange={e => handleInputChange('landDeed', e.target.value)} value={inputs.landDeed || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.income.deedPlaceholder')} />
                          </div>
                          <div>
                            <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.income.landExtent')}</label>
                            <input type="text" onChange={e => handleInputChange('landSize', e.target.value)} value={inputs.landSize || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.income.landExtentPlaceholder')} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.income.propertyIncomeAmount')}</label>
                          <input type="number" onChange={e => handleInputChange('incomeLandAmt', e.target.value)} value={inputs.incomeLandAmt || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0.00" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-user-surface p-4 rounded-xl border border-user-border">
                    <label className="flex items-center gap-2 text-sm font-extrabold text-user-text cursor-pointer">
                      <input type="checkbox" checked={hasBusinessIncome} onChange={e => setHasBusinessIncome(e.target.checked)} className="accent-user-secondary" />
                      {t('modal.income.businessIncome')}
                    </label>
                    {hasBusinessIncome && (
                      <div className="mt-3 pt-3 border-t border-user-border space-y-3">
                        <div>
                          <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.income.businessName')}</label>
                          <input type="text" onChange={e => handleInputChange('bizName', e.target.value)} value={inputs.bizName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.income.businessNamePlaceholder')} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.income.businessRegNo')}</label>
                            <input type="text" onChange={e => handleInputChange('bizRegNo', e.target.value)} value={inputs.bizRegNo || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="BR-XXXXXX" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.income.businessAnnualIncome')}</label>
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
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.income.step3.title')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.income.summaryEmployment')}</label>
                      <input type="number" onChange={e => handleInputChange('summaryEmployment', e.target.value)} value={inputs.summaryEmployment || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.income.summaryLand')}</label>
                      <input type="number" onChange={e => handleInputChange('summaryLand', e.target.value)} value={inputs.summaryLand || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0.00" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.income.summaryBusiness')}</label>
                      <input type="number" onChange={e => handleInputChange('summaryBusiness', e.target.value)} value={inputs.summaryBusiness || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.income.summaryOther')}</label>
                      <input type="number" onChange={e => handleInputChange('summaryOther', e.target.value)} value={inputs.summaryOther || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0.00" />
                    </div>
                  </div>
                  <div className="bg-user-secondary text-white p-5 rounded-xl flex justify-between items-center mt-2">
                    <span className="text-[11px] font-extrabold uppercase text-yellow-200">{t('modal.income.totalAnnualIncome')}</span>
                    <span className="text-2xl font-black text-user-primary">Rs. {totalCalculatedIncome.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}
              {formStep === 4 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.income.step4.title')}</h4>
                  <div className="bg-user-surface p-4 rounded-xl border border-user-border">
                    <span className="block text-xs font-extrabold text-user-text mb-2">{t('modal.income.reliefRecipient')}</span>
                    <div className="flex gap-5 text-sm font-bold">
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="reliefRadio" checked={isReliefRecipient === true} onChange={() => setIsReliefRecipient(true)} className="accent-user-secondary" /> {t('modal.yes')}</label>
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="reliefRadio" checked={isReliefRecipient === false} onChange={() => { setIsReliefRecipient(false); handleInputChange('reliefName', ''); }} className="accent-user-secondary" /> {t('modal.no')}</label>
                    </div>
                    {isReliefRecipient && <input type="text" required onChange={e => handleInputChange('reliefName', e.target.value)} value={inputs.reliefName || ''} className="w-full mt-3 p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.income.reliefNamePlaceholder')} />}
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.income.accuracyEvidence')}</label>
                    <textarea rows={2} required onChange={e => handleInputChange('incomeAccuracyEvidence', e.target.value)} value={inputs.incomeAccuracyEvidence || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none resize-none text-sm" placeholder={t('modal.income.accuracyPlaceholder')} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.income.submissionTarget')}</label>
                    <input type="text" required onChange={e => handleInputChange('submissionTargetInstitution', e.target.value)} value={inputs.submissionTargetInstitution || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.income.submissionTargetPlaceholder')} />
                  </div>
                  <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2">
                    <span className="text-xs font-extrabold text-user-text">{t('modal.income.uploadDocs')}</span>
                    <input type="file" className="text-sm" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              MODULE C: VALUATION CERTIFICATE (form.id === 4)
             ========================================== */}
          {form.id === 4 && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.valuation.step1.title')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.valuation.refNo')}</label>
                      <input type="text" required onChange={e => handleInputChange('valRefNo', e.target.value)} value={inputs.valRefNo || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.valuation.refNoPlaceholder')} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.valuation.requestDate')}</label>
                      <input type="date" required onChange={e => handleInputChange('valRequestDate', e.target.value)} value={inputs.valRequestDate || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.valuation.dsDivision')}</label>
                      <input type="text" required onChange={e => handleInputChange('valDsDivision', e.target.value)} value={inputs.valDsDivision || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.valuation.dsPlaceholder')} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.valuation.gnDivision')}</label>
                      <input type="text" required onChange={e => handleInputChange('valGnDivision', e.target.value)} value={inputs.valGnDivision || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.valuation.gnPlaceholder')} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.valuation.landName')}</label>
                    <input type="text" required onChange={e => handleInputChange('valLandName', e.target.value)} value={inputs.valLandName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.valuation.landNamePlaceholder')} />
                  </div>
                </div>
              )}
              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.valuation.step2.title')}</h4>
                  <div className="bg-user-surface p-4 rounded-xl border border-user-border space-y-3">
                    <span className="text-xs font-extrabold text-user-secondary uppercase">{t('modal.valuation.boundaries')}</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-[11px] font-bold text-user-secondary mb-1">{t('modal.valuation.boundNorth')}</label><input type="text" required onChange={e => handleInputChange('boundNorth', e.target.value)} value={inputs.boundNorth || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.valuation.boundPlaceholder')} /></div>
                      <div><label className="block text-[11px] font-bold text-user-secondary mb-1">{t('modal.valuation.boundEast')}</label><input type="text" required onChange={e => handleInputChange('boundEast', e.target.value)} value={inputs.boundEast || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.valuation.boundPlaceholder')} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-[11px] font-bold text-user-secondary mb-1">{t('modal.valuation.boundSouth')}</label><input type="text" required onChange={e => handleInputChange('boundSouth', e.target.value)} value={inputs.boundSouth || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.valuation.boundPlaceholder')} /></div>
                      <div><label className="block text-[11px] font-bold text-user-secondary mb-1">{t('modal.valuation.boundWest')}</label><input type="text" required onChange={e => handleInputChange('boundWest', e.target.value)} value={inputs.boundWest || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.valuation.boundPlaceholder')} /></div>
                    </div>
                  </div>
                  <div className="bg-user-surface p-4 rounded-xl border border-user-border">
                    <span className="block text-xs font-extrabold text-user-secondary uppercase mb-3">{t('modal.valuation.totalExtent')}</span>
                    <div className="grid grid-cols-3 gap-3">
                      <div><label className="block text-[11px] font-bold text-user-secondary mb-1">{t('modal.valuation.acres')}</label><input type="number" onChange={e => handleInputChange('sizeAcres', e.target.value)} value={inputs.sizeAcres || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0" /></div>
                      <div><label className="block text-[11px] font-bold text-user-secondary mb-1">{t('modal.valuation.roods')}</label><input type="number" onChange={e => handleInputChange('sizeRoods', e.target.value)} value={inputs.sizeRoods || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0" /></div>
                      <div><label className="block text-[11px] font-bold text-user-secondary mb-1">{t('modal.valuation.perches')}</label><input type="number" onChange={e => handleInputChange('sizePerches', e.target.value)} value={inputs.sizePerches || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0" /></div>
                    </div>
                  </div>
                </div>
              )}
              {formStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.valuation.step3.title')}</h4>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.valuation.landType')}</label>
                    <select required onChange={e => handleInputChange('valLandType', e.target.value)} value={inputs.valLandType || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                      <option value="">-- {t('modal.select')} --</option>
                      <option value="Government (රජයේ ඉඩමකි)">{t('modal.valuation.govtLand')}</option>
                      <option value="Private (පුද්ගලික ඉඩමකි)">{t('modal.valuation.privateLand')}</option>
                      <option value="Devalagam/Temple (විහාරදේවාලගම්)">{t('modal.valuation.templeLand')}</option>
                      <option value="Other">{t('modal.valuation.otherLand')}</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.valuation.possessionYears')}</label>
                      <input type="number" required onChange={e => handleInputChange('possessionYears', e.target.value)} value={inputs.possessionYears || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.valuation.yearsPlaceholder')} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.valuation.possessionMonths')}</label>
                      <input type="number" required onChange={e => handleInputChange('possessionMonths', e.target.value)} value={inputs.possessionMonths || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.valuation.monthsPlaceholder')} />
                    </div>
                  </div>
                  <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2">
                    <span className="text-xs font-extrabold text-user-text">{t('modal.valuation.uploadDocs')}</span>
                    <input type="file" className="text-sm" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              MODULE D: IDENTITY CARD APPLICATION (form.id === 5)
             ========================================== */}
          {form.id === 5 && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <div className="bg-user-surface p-4 rounded-xl border border-user-border space-y-3">
                    <span className="text-xs font-extrabold text-user-secondary uppercase">{t('modal.nic.drpOffice')}</span>
                    <div className="grid grid-cols-3 gap-3">
                      <div><label className="block text-[10px] font-extrabold text-user-secondary">{t('modal.nic.district')}</label><input type="text" disabled value={userData?.district || "Colombo"} className="w-full p-3 rounded-xl border border-user-border bg-user-secondary-light text-user-text-lighter text-sm" /></div>
                      <div><label className="block text-[10px] font-extrabold text-user-secondary">{t('modal.nic.dsDivision')}</label><input type="text" disabled value={userData?.dsDiv || "Thimbirigasyaya"} className="w-full p-3 rounded-xl border border-user-border bg-user-secondary-light text-user-text-lighter text-sm" /></div>
                      <div><label className="block text-[10px] font-extrabold text-user-secondary">{t('modal.nic.gnDivision')}</label><input type="text" disabled value={userData?.gnDiv || "62B / Hunupitiya"} className="w-full p-3 rounded-xl border border-user-border bg-user-secondary-light text-user-text-lighter text-sm" /></div>
                    </div>
                  </div>
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.nic.step1.title')}</h4>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.nic.familyName')}</label>
                    <input type="text" required onChange={e => handleInputChange('nicFamilyName', e.target.value.toUpperCase())} value={inputs.nicFamilyName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm tracking-wider" placeholder={t('modal.nic.familyNamePlaceholder')} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.nic.otherNames')}</label>
                    <input type="text" required onChange={e => handleInputChange('nicOtherNames', e.target.value.toUpperCase())} value={inputs.nicOtherNames || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm tracking-wider" placeholder={t('modal.nic.otherNamesPlaceholder')} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.nic.surname')}</label>
                    <input type="text" required onChange={e => handleInputChange('nicSurname', e.target.value.toUpperCase())} value={inputs.nicSurname || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm tracking-wider" placeholder={t('modal.nic.surnamePlaceholder')} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.nic.preferredName')}</label>
                    <input type="text" onChange={e => handleInputChange('nicPreferredName', e.target.value.toUpperCase())} value={inputs.nicPreferredName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.nic.preferredNamePlaceholder')} />
                  </div>
                </div>
              )}
              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.nic.step2.title')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.fields.sex')}</label>
                      <select required onChange={e => handleInputChange('nicSex', e.target.value)} value={inputs.nicSex || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- {t('modal.select')} --</option><option value="Male">{t('modal.male')}</option><option value="Female">{t('modal.female')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.fields.civilStatus')}</label>
                      <select required onChange={e => handleInputChange('nicCivilStatus', e.target.value)} value={inputs.nicCivilStatus || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- {t('modal.select')} --</option><option value="Single">{t('modal.unmarried')}</option><option value="Married">{t('modal.married')}</option><option value="Widowed">{t('modal.widowed')}</option><option value="Divorced">{t('modal.divorced')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.nic.dob')}</label>
                      <input type="date" required onChange={e => handleInputChange('nicDob', e.target.value)} value={inputs.nicDob || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.nic.birthCertNo')}</label>
                      <input type="text" required onChange={e => handleInputChange('nicBirthCertNo', e.target.value)} value={inputs.nicBirthCertNo || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.nic.birthCertNoPlaceholder')} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.nic.birthPlace')}</label>
                      <input type="text" required onChange={e => handleInputChange('nicBirthPlace', e.target.value)} value={inputs.nicBirthPlace || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.nic.birthPlacePlaceholder')} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.nic.birthDistrict')}</label>
                      <input type="text" required onChange={e => handleInputChange('nicBirthDistrict', e.target.value)} value={inputs.nicBirthDistrict || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.nic.birthDistrictPlaceholder')} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.fields.occupation')}</label>
                    <input type="text" required onChange={e => handleInputChange('nicOccupation', e.target.value)} value={inputs.nicOccupation || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.placeholder.occupation')} />
                  </div>
                </div>
              )}
              {formStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.nic.step3.title')}</h4>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.nic.permAddress')}</label>
                    <textarea rows={2} required onChange={e => handleInputChange('nicPermAddress', e.target.value)} value={inputs.nicPermAddress || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none resize-none text-sm" placeholder={t('modal.nic.permAddressPlaceholder')} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.nic.postalAddress')}</label>
                    <textarea rows={2} onChange={e => handleInputChange('nicPostalAddress', e.target.value)} value={inputs.nicPostalAddress || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none resize-none text-sm" placeholder={t('modal.nic.postalAddressPlaceholder')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.nic.mobile')}</label>
                      <input type="text" required onChange={e => handleInputChange('nicMobilePhone', e.target.value)} value={inputs.nicMobilePhone || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="07XXXXXXXX" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.nic.email')}</label>
                      <input type="email" onChange={e => handleInputChange('nicEmail', e.target.value)} value={inputs.nicEmail || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="name@domain.com" />
                    </div>
                  </div>
                  <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2">
                    <span className="text-xs font-extrabold text-user-text">{t('modal.nic.photoUpload')}</span>
                    <input type="file" className="text-sm" />
                  </div>
                  <div className="flex items-start gap-2.5 bg-user-secondary-light p-3 rounded-xl">
                    <input type="checkbox" required defaultChecked className="accent-user-secondary mt-0.5" />
                    <span className="text-[11px] text-user-text font-semibold leading-tight">{t('modal.nic.declaration')}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              MODULE E: LIVING FUNDS FOR DISABLED PERSONS (form.id === 6)
             ========================================== */}
          {form.id === 6 && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.disabled.step1.title')}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.disabled.district')}</label><input type="text" required onChange={e => handleInputChange('lawDistrict', e.target.value)} value={inputs.lawDistrict || userData?.district || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.disabled.districtPlaceholder')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.disabled.dsOffice')}</label><input type="text" required onChange={e => handleInputChange('lawDsOffice', e.target.value)} value={inputs.lawDsOffice || userData?.dsDiv || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.disabled.dsPlaceholder')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.disabled.gnDivision')}</label><input type="text" required onChange={e => handleInputChange('lawGnDivision', e.target.value)} value={inputs.lawGnDivision || userData?.gnDiv || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.disabled.gnPlaceholder')} /></div>
                  </div>
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2 pt-2">{t('modal.disabled.applicantInfo')}</h4>
                  <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.fields.fullName')}</label><input type="text" required onChange={e => handleInputChange('lawFullName', e.target.value)} value={inputs.lawFullName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.placeholder.fullName')} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.disabled.disabilityNature')}</label><input type="text" required onChange={e => handleInputChange('lawDisabilityNature', e.target.value)} value={inputs.lawDisabilityNature || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.disabled.disabilityNaturePlaceholder')} /></div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.disabled.cause')}</label>
                      <select required onChange={e => handleInputChange('lawDisabilityCause', e.target.value)} value={inputs.lawDisabilityCause || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- {t('modal.select')} --</option><option value="By Birth">{t('modal.disabled.birth')}</option><option value="Accident">{t('modal.disabled.accident')}</option><option value="Other">{t('modal.disabled.other')}</option>
                      </select>
                    </div>
                  </div>
                  {inputs.lawDisabilityCause === 'Accident' && <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.disabled.accidentYear')}</label><input type="number" required onChange={e => handleInputChange('lawAccidentYear', e.target.value)} value={inputs.lawAccidentYear || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.disabled.accidentYearPlaceholder')} /></div>}
                  {inputs.lawDisabilityCause === 'Other' && <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.disabled.otherCause')}</label><input type="text" required onChange={e => handleInputChange('lawOtherCauseDetails', e.target.value)} value={inputs.lawOtherCauseDetails || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.disabled.otherCausePlaceholder')} /></div>}
                  <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.disabled.vocational')}</label><input type="text" required onChange={e => handleInputChange('lawVocationalOrEducation', e.target.value)} value={inputs.lawVocationalOrEducation || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.disabled.vocationalPlaceholder')} /></div>
                </div>
              )}
              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.disabled.step2.title')}</h4>
                  <p className="text-xs font-extrabold text-user-text">{t('modal.disabled.tableA')}</p>
                  {disabledMembers.map((member, idx) => (
                    <div key={`law-disabled-${idx}`} className="bg-user-surface p-4 rounded-xl border border-user-border space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" required placeholder={t('modal.disabled.namePlaceholder')} value={member.name} onChange={e => { const u=[...disabledMembers]; u[idx].name=e.target.value; setDisabledMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder={t('modal.disabled.relationPlaceholder')} value={member.relation} onChange={e => { const u=[...disabledMembers]; u[idx].relation=e.target.value; setDisabledMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <select required value={member.gender} onChange={e => { const u=[...disabledMembers]; u[idx].gender=e.target.value; setDisabledMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm"><option value="">{t('modal.disabled.gender')}</option><option>{t('modal.male')}</option><option>{t('modal.female')}</option></select>
                        <select required value={member.civilStatus} onChange={e => { const u=[...disabledMembers]; u[idx].civilStatus=e.target.value; setDisabledMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm"><option value="">{t('modal.disabled.status')}</option><option>{t('modal.unmarried')}</option><option>{t('modal.married')}</option></select>
                        <input type="date" required value={member.dob} onChange={e => { const u=[...disabledMembers]; u[idx].dob=e.target.value; setDisabledMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" required placeholder={t('modal.fields.nic')} value={member.nic} onChange={e => { const u=[...disabledMembers]; u[idx].nic=e.target.value; setDisabledMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder={t('modal.disabled.disability')} value={member.nature} onChange={e => { const u=[...disabledMembers]; u[idx].nature=e.target.value; setDisabledMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setDisabledMembers([...disabledMembers, { name:'',relation:'',gender:'',civilStatus:'',dob:'',nic:'',nature:'' }])} className="self-start px-4 py-2 rounded-lg border border-user-secondary text-user-secondary bg-user-surface cursor-pointer text-xs font-bold">{t('modal.addRow')}</button>
                  <p className="text-xs font-extrabold text-user-text pt-2">{t('modal.disabled.tableB')}</p>
                  {otherMembers.map((member, idx) => (
                    <div key={`law-other-${idx}`} className="bg-user-surface p-4 rounded-xl border border-user-border space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" required placeholder={t('modal.disabled.namePlaceholder')} value={member.name} onChange={e => { const u=[...otherMembers]; u[idx].name=e.target.value; setOtherMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder={t('modal.disabled.relationPlaceholder')} value={member.relation} onChange={e => { const u=[...otherMembers]; u[idx].relation=e.target.value; setOtherMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <select required value={member.gender} onChange={e => { const u=[...otherMembers]; u[idx].gender=e.target.value; setOtherMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm"><option value="">{t('modal.disabled.gender')}</option><option>{t('modal.male')}</option><option>{t('modal.female')}</option></select>
                        <select required value={member.civilStatus} onChange={e => { const u=[...otherMembers]; u[idx].civilStatus=e.target.value; setOtherMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm"><option value="">{t('modal.disabled.status')}</option><option>{t('modal.unmarried')}</option><option>{t('modal.married')}</option></select>
                        <input type="date" required value={member.dob} onChange={e => { const u=[...otherMembers]; u[idx].dob=e.target.value; setOtherMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" required placeholder={t('modal.fields.nic')} value={member.nic} onChange={e => { const u=[...otherMembers]; u[idx].nic=e.target.value; setOtherMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" placeholder={t('modal.disabled.incomeSource')} value={member.incomeSourceAmt} onChange={e => { const u=[...otherMembers]; u[idx].incomeSourceAmt=e.target.value; setOtherMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setOtherMembers([...otherMembers, { name:'',relation:'',gender:'',civilStatus:'',dob:'',nic:'',incomeSourceAmt:'' }])} className="self-start px-4 py-2 rounded-lg border border-user-secondary text-user-secondary bg-user-surface cursor-pointer text-xs font-bold">{t('modal.addRow')}</button>
                </div>
              )}
              {formStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.disabled.step3.title')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" required onChange={e => handleInputChange('lawBankAccountNo', e.target.value)} value={inputs.lawBankAccountNo || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.disabled.accountNo')} />
                    <input type="text" required onChange={e => handleInputChange('lawBankNameBranch', e.target.value)} value={inputs.lawBankNameBranch || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.disabled.bankBranch')} />
                  </div>
                </div>
              )}
              {formStep === 4 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.disabled.step4.title')}</h4>
                  <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2">
                    <span className="text-xs font-extrabold text-user-secondary">{t('modal.disabled.medicalCert')}</span>
                    <input type="file" className="text-sm" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              MODULE F: VOTER REGISTRATION (form.id === 7)
             ========================================== */}
          {form.id === 7 && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.voter.step1.title')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.voter.electoralDistrict')}</label><input type="text" required onChange={e => handleInputChange('voterElectoralDistrict', e.target.value)} value={inputs.voterElectoralDistrict || userData?.district || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.voter.electoralDistrictPlaceholder')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.voter.pollingDivision')}</label><input type="text" required onChange={e => handleInputChange('voterPollingDivision', e.target.value)} value={inputs.voterPollingDivision || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.voter.pollingDivisionPlaceholder')} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.voter.pollingDistrictNo')}</label><input type="text" required onChange={e => handleInputChange('voterPollingDistrictNo', e.target.value)} value={inputs.voterPollingDistrictNo || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.voter.pollingDistrictNoPlaceholder')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.voter.gnDivision')}</label><input type="text" required onChange={e => handleInputChange('voterGnDivision', e.target.value)} value={inputs.voterGnDivision || userData?.gnDiv || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.voter.gnPlaceholder')} /></div>
                  </div>
                  <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.voter.villageStreet')}</label><input type="text" required onChange={e => handleInputChange('voterVillageStreet', e.target.value)} value={inputs.voterVillageStreet || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.voter.villageStreetPlaceholder')} /></div>
                  <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.voter.householdNo')}</label><input type="text" required onChange={e => handleInputChange('voterHouseholdNo', e.target.value)} value={inputs.voterHouseholdNo || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.voter.householdNoPlaceholder')} /></div>
                  <div className="bg-user-surface border border-user-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <span className="block text-sm font-extrabold text-user-secondary">{t('modal.voter.checkRegister')}</span>
                      <span className="text-[11px] text-user-text-lighter">{t('modal.voter.checkRegisterSub')}</span>
                    </div>
                    <a href="https://ec.lk/vrd" target="_blank" rel="noreferrer" className="bg-user-secondary text-white px-4 py-2 rounded-lg text-xs font-bold no-underline">{t('modal.voter.ecLink')}</a>
                  </div>
                </div>
              )}
              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.voter.step2.title')}</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <button type="button" onClick={() => setVoterPurpose('OptionA')} className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${voterPurpose==='OptionA'?'border-2 border-user-secondary bg-user-primary-light':'border border-user-border bg-user-surface'} font-bold text-xs`}>
                      <div className="text-user-secondary font-extrabold mb-0.5">{t('modal.voter.optionA')}</div>
                      {t('modal.voter.optionADesc')}
                    </button>
                    <button type="button" onClick={() => setVoterPurpose('OptionB')} className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${voterPurpose==='OptionB'?'border-2 border-user-secondary bg-user-primary-light':'border border-user-border bg-user-surface'} font-bold text-xs`}>
                      <div className="text-user-secondary font-extrabold mb-0.5">{t('modal.voter.optionB')}</div>
                      {t('modal.voter.optionBDesc')}
                    </button>
                  </div>
                  {voterPurpose === 'OptionA' && (
                    <div className="border-t-2 border-dashed border-user-border pt-4 space-y-4">
                      <span className="text-xs font-extrabold text-user-secondary">{t('modal.voter.ycForm')}</span>
                      <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.fields.fullName')}</label><input type="text" required onChange={e => handleInputChange('ycFullName', e.target.value)} value={inputs.ycFullName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.placeholder.fullName')} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.fields.nic')}</label><input type="text" required onChange={e => handleInputChange('ycNicNo', e.target.value)} value={inputs.ycNicNo || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.placeholder.nic')} /></div>
                        <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.voter.dob')}</label><input type="date" required min="2008-02-01" max="2010-01-31" onChange={e => handleInputChange('ycDob', e.target.value)} value={inputs.ycDob || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" /></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.fields.sex')}</label><select required onChange={e => handleInputChange('ycGender', e.target.value)} value={inputs.ycGender || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm"><option value="">-- {t('modal.select')} --</option><option>{t('modal.male')}</option><option>{t('modal.female')}</option></select></div>
                        <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.fields.civilStatus')}</label><select required onChange={e => handleInputChange('ycCivilStatus', e.target.value)} value={inputs.ycCivilStatus || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm"><option value="">-- {t('modal.select')} --</option><option>{t('modal.unmarried')}</option><option>{t('modal.married')}</option></select></div>
                        <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.voter.relationToChief')}</label><input type="text" required onChange={e => handleInputChange('ycRelationToChief', e.target.value)} value={inputs.ycRelationToChief || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.voter.relationPlaceholder')} /></div>
                      </div>
                    </div>
                  )}
                  {voterPurpose === 'OptionB' && (
                    <div className="border-t-2 border-dashed border-user-border pt-4 space-y-4">
                      <span className="text-xs font-extrabold text-user-secondary">{t('modal.voter.erForm')}</span>
                      <div className="border border-user-border p-4 rounded-xl bg-user-surface">
                        <span className="text-[11px] font-extrabold text-user-secondary block mb-2">{t('modal.voter.addVoters')}</span>
                        {newVoters.map((voter, idx) => (
                          <div key={`newvoter-${idx}`} className="border-b border-user-border-lighter last:border-0 pb-3 mb-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input type="text" placeholder={t('modal.voter.namePlaceholder')} value={voter.name} onChange={e => { const u=[...newVoters]; u[idx].name=e.target.value; setNewVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" />
                              <input type="text" placeholder={t('modal.voter.relationPlaceholder')} value={voter.relation} onChange={e => { const u=[...newVoters]; u[idx].relation=e.target.value; setNewVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input type="text" placeholder={t('modal.fields.nic')} value={voter.nic} onChange={e => { const u=[...newVoters]; u[idx].nic=e.target.value; setNewVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" />
                              <input type="date" value={voter.dob} onChange={e => { const u=[...newVoters]; u[idx].dob=e.target.value; setNewVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" />
                              <select value={voter.gender} onChange={e => { const u=[...newVoters]; u[idx].gender=e.target.value; setNewVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs"><option value="">{t('modal.disabled.gender')}</option><option>{t('modal.male')}</option><option>{t('modal.female')}</option></select>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => setNewVoters([...newVoters, { name:'',nic:'',dob:'',gender:'',relation:'',prevAddress:'',prevDistrict:'',prevYear:'' }])} className="px-3 py-1.5 rounded-lg border border-user-secondary text-user-secondary bg-user-surface cursor-pointer text-[10px] font-bold">{t('modal.addRow')}</button>
                      </div>
                      <div className="border border-user-border p-4 rounded-xl bg-user-surface">
                        <span className="text-[11px] font-extrabold text-user-secondary block mb-2">{t('modal.voter.removeVoters')}</span>
                        {deletedVoters.map((voter, idx) => (
                          <div key={`delvoter-${idx}`} className="border-b border-user-border-lighter last:border-0 pb-3 mb-3 space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <input type="text" placeholder={t('modal.voter.namePlaceholder')} value={voter.name} onChange={e => { const u=[...deletedVoters]; u[idx].name=e.target.value; setDeletedVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" />
                              <input type="text" placeholder={t('modal.fields.nic')} value={voter.nic} onChange={e => { const u=[...deletedVoters]; u[idx].nic=e.target.value; setDeletedVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" />
                              <select value={voter.reason} onChange={e => { const u=[...deletedVoters]; u[idx].reason=e.target.value; setDeletedVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs"><option value="">{t('modal.voter.reason')}</option><option value="Deceased">{t('modal.voter.deceased')}</option><option value="Moved Away">{t('modal.voter.movedAway')}</option><option value="Other">{t('modal.other')}</option></select>
                            </div>
                            {voter.reason === 'Deceased' && <div className="bg-red-50 p-2 rounded-lg"><label className="block text-[10px] font-bold text-red-600 mb-1">{t('modal.voter.deathDate')}</label><input type="date" value={voter.deathDate} onChange={e => { const u=[...deletedVoters]; u[idx].deathDate=e.target.value; setDeletedVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" /></div>}
                            {voter.reason === 'Moved Away' && <div className="grid grid-cols-2 gap-2 bg-blue-50 p-2 rounded-lg"><div><label className="block text-[10px] font-bold text-blue-700 mb-0.5">{t('modal.voter.newAddress')}</label><input type="text" value={voter.newAddress} onChange={e => { const u=[...deletedVoters]; u[idx].newAddress=e.target.value; setDeletedVoters(u); }} className="w-full p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" /></div><div><label className="block text-[10px] font-bold text-blue-700 mb-0.5">{t('modal.voter.newPhone')}</label><input type="text" value={voter.newPhone} onChange={e => { const u=[...deletedVoters]; u[idx].newPhone=e.target.value; setDeletedVoters(u); }} className="w-full p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" /></div></div>}
                          </div>
                        ))}
                        <button type="button" onClick={() => setDeletedVoters([...deletedVoters, { name:'',nic:'',reason:'',deathDate:'',newAddress:'',newPhone:'' }])} className="px-3 py-1.5 rounded-lg border border-user-secondary text-user-secondary bg-user-surface cursor-pointer text-[10px] font-bold">{t('modal.addRow')}</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {formStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.voter.step3.title')}</h4>
                  <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.voter.chiefName')}</label><input type="text" required onChange={e => handleInputChange('voterChiefName', e.target.value)} value={inputs.voterChiefName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.voter.chiefNamePlaceholder')} /></div>
                  <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.voter.chiefNic')}</label><input type="text" required onChange={e => handleInputChange('voterChiefNic', e.target.value)} value={inputs.voterChiefNic || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.voter.chiefNicPlaceholder')} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.voter.chiefPhone')}</label><input type="text" required onChange={e => handleInputChange('voterChiefPhone', e.target.value)} value={inputs.voterChiefPhone || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="07XXXXXXXX" /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.voter.chiefWhatsApp')}</label><input type="text" required onChange={e => handleInputChange('voterChiefWhatsApp', e.target.value)} value={inputs.voterChiefWhatsApp || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="07XXXXXXXX" /></div>
                  </div>
                  <div className="flex items-start gap-2.5 bg-user-secondary-light p-3 rounded-xl">
                    <input type="checkbox" required className="accent-user-secondary mt-0.5" />
                    <span className="text-[11px] text-user-text font-semibold leading-tight">{t('modal.voter.declaration')}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              MODULE H: PERMIT FOR FELLING TREES (form.id === 8)
             ========================================== */}
          {form.id === 8 && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.tree.step1.title')}</h4>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-2">{t('modal.tree.applicantStatus')}</label>
                    <div className="flex gap-6 text-sm font-bold">
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="tfStatusRadio" checked={inputs.treeApplicantStatus==='Land Owner'} onChange={() => handleInputChange('treeApplicantStatus','Land Owner')} className="accent-user-secondary" /> {t('modal.tree.landOwner')}</label>
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="tfStatusRadio" checked={inputs.treeApplicantStatus==='Authorized Representative'} onChange={() => handleInputChange('treeApplicantStatus','Authorized Representative')} className="accent-user-secondary" /> {t('modal.tree.representative')}</label>
                    </div>
                  </div>
                  <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.fields.fullName')}</label><input type="text" required onChange={e => handleInputChange('treeFullName', e.target.value)} value={inputs.treeFullName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.placeholder.fullName')} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.fields.nic')}</label><input type="text" required onChange={e => handleInputChange('treeNic', e.target.value)} value={inputs.treeNic || ''} className={`w-full p-3 rounded-xl border ${errors.treeNic?'border-red-500':'border-user-border'} bg-user-surface outline-none text-sm`} placeholder={t('modal.placeholder.nic')} />{errors.treeNic && <span className="text-red-500 text-[11px] font-bold mt-1 block">{errors.treeNic}</span>}</div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.tree.phone')}</label><input type="text" required onChange={e => handleInputChange('treePhone', e.target.value)} value={inputs.treePhone || ''} className={`w-full p-3 rounded-xl border ${errors.treePhone?'border-red-500':'border-user-border'} bg-user-surface outline-none text-sm`} placeholder="10 Digits" />{errors.treePhone && <span className="text-red-500 text-[11px] font-bold mt-1 block">{errors.treePhone}</span>}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.fields.permanentAddress')}</label><input type="text" required onChange={e => handleInputChange('treePermanentAddress', e.target.value)} value={inputs.treePermanentAddress || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.placeholder.permanentAddress')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.tree.whatsapp')}</label><input type="text" onChange={e => handleInputChange('treeWhatsApp', e.target.value)} value={inputs.treeWhatsApp || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="07XXXXXXXX" /></div>
                  </div>
                </div>
              )}
              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.tree.step2.title')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.tree.landName')}</label><input type="text" required onChange={e => handleInputChange('treeLandName', e.target.value)} value={inputs.treeLandName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.tree.landNamePlaceholder')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.tree.district')}</label><input type="text" required onChange={e => handleInputChange('treeDistrict', e.target.value)} value={inputs.treeDistrict || userData?.district || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.tree.districtPlaceholder')} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.tree.dsDivision')}</label><input type="text" required onChange={e => handleInputChange('treeDsDivision', e.target.value)} value={inputs.treeDsDivision || userData?.dsDiv || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.tree.dsPlaceholder')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.tree.gnDivision')}</label><input type="text" required onChange={e => handleInputChange('treeGnDivision', e.target.value)} value={inputs.treeGnDivision || userData?.gnDiv || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.tree.gnPlaceholder')} /></div>
                  </div>
                  <div className="bg-user-surface p-4 rounded-xl border border-user-border">
                    <span className="block text-[11px] font-extrabold text-user-secondary uppercase mb-2">{t('modal.tree.landExtent')}</span>
                    <div className="grid grid-cols-3 gap-3">
                      <input type="number" placeholder={t('modal.valuation.acres')} onChange={e => handleInputChange('treeLandAcres', e.target.value)} value={inputs.treeLandAcres || ''} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      <input type="number" placeholder={t('modal.valuation.roods')} onChange={e => handleInputChange('treeLandRoods', e.target.value)} value={inputs.treeLandRoods || ''} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      <input type="number" placeholder={t('modal.valuation.perches')} onChange={e => handleInputChange('treeLandPerches', e.target.value)} value={inputs.treeLandPerches || ''} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.tree.ownershipType')}</label>
                      <select required onChange={e => handleInputChange('treeOwnershipType', e.target.value)} value={inputs.treeOwnershipType || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- {t('modal.select')} --</option><option value="Private">{t('modal.tree.private')}</option><option value="Government / State">{t('modal.tree.government')}</option><option value="LDO Lease / Permit Land">{t('modal.tree.lease')}</option><option value="Temple Property / Viharagam">{t('modal.tree.temple')}</option><option value="Other Tenure Matrix">{t('modal.other')}</option>
                      </select>
                    </div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.tree.deedNumber')}</label><input type="text" required onChange={e => handleInputChange('treeDeedNoDate', e.target.value)} value={inputs.treeDeedNoDate || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.tree.deedPlaceholder')} /></div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.tree.legalDispute')}</label>
                    <select required onChange={e => handleInputChange('treeLegalDisputesExist', e.target.value)} value={inputs.treeLegalDisputesExist || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                      <option value="">-- {t('modal.select')} --</option><option value="No">{t('modal.no')}</option><option value="Yes">{t('modal.yes')}</option>
                    </select>
                  </div>
                </div>
              )}
              {formStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.tree.step3.title')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.tree.boundNorth')}</label><input type="text" required onChange={e => handleInputChange('treeBoundNorth', e.target.value)} value={inputs.treeBoundNorth || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.tree.boundPlaceholder')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.tree.boundEast')}</label><input type="text" required onChange={e => handleInputChange('treeBoundEast', e.target.value)} value={inputs.treeBoundEast || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.tree.boundPlaceholder')} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.tree.boundSouth')}</label><input type="text" required onChange={e => handleInputChange('treeBoundSouth', e.target.value)} value={inputs.treeBoundSouth || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.tree.boundPlaceholder')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.tree.boundWest')}</label><input type="text" required onChange={e => handleInputChange('treeBoundWest', e.target.value)} value={inputs.treeBoundWest || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.tree.boundPlaceholder')} /></div>
                  </div>
                </div>
              )}
              {formStep === 4 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-user-border pb-2">
                    <span className="text-sm font-black text-user-secondary">{t('modal.tree.step4.title')}</span>
                    <button type="button" onClick={() => setTreeLogistics([...treeLogistics, { species:'',girth:'',height:'',middleGirth:'',reason:'',proximityDanger:'No' }])} className="px-3 py-1.5 rounded-lg border border-user-secondary text-user-secondary bg-user-surface cursor-pointer text-xs font-bold">{t('modal.addRow')}</button>
                  </div>
                  {treeLogistics.map((tree, idx) => (
                    <div key={`tree-row-${idx}`} className="bg-user-surface p-4 rounded-xl border border-user-border space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <input type="text" required placeholder={t('modal.tree.species')} value={tree.species} onChange={e => handleTreeRowChange(idx,'species',e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder={t('modal.tree.girth')} value={tree.girth} onChange={e => handleTreeRowChange(idx,'girth',e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder={t('modal.tree.height')} value={tree.height} onChange={e => handleTreeRowChange(idx,'height',e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" required placeholder={t('modal.tree.middleGirth')} value={tree.middleGirth} onChange={e => handleTreeRowChange(idx,'middleGirth',e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder={t('modal.tree.reason')} value={tree.reason} onChange={e => handleTreeRowChange(idx,'reason',e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                      <label className="flex items-center gap-2 text-xs font-bold text-user-secondary cursor-pointer">
                        <input type="checkbox" checked={tree.proximityDanger==='Yes'} onChange={e => handleTreeRowChange(idx,'proximityDanger',e.target.checked?'Yes':'No')} className="accent-user-secondary" />
                        {t('modal.tree.proximityDanger')}
                      </label>
                      {treeLogistics.length > 1 && <button type="button" onClick={() => handleRemoveRow('treeMatrix',idx)} className="border-none bg-none text-red-500 font-bold text-xs cursor-pointer">{t('modal.removeRow')}</button>}
                    </div>
                  ))}
                </div>
              )}
              {formStep === 5 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.tree.step5.title')}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2"><span className="text-xs font-extrabold">{t('modal.tree.deedUpload')}</span><input type="file" className="text-sm" /></div>
                    <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2"><span className="text-xs font-extrabold">{t('modal.tree.surveyPlan')}</span><input type="file" className="text-sm" /></div>
                  </div>
                  <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2"><span className="text-xs font-extrabold">{t('modal.tree.photoEvidence')}</span><input type="file" className="text-sm" /></div>
                  <div className="flex items-start gap-2.5 bg-user-secondary-light p-3 rounded-xl">
                    <input type="checkbox" required defaultChecked className="accent-user-secondary mt-0.5" />
                    <span className="text-[11px] text-user-text font-semibold leading-tight">{t('modal.tree.declaration')}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              MODULE I: TIMBER TRANSPORTATION (form.id === 9)
             ========================================== */}
          {form.id === 9 && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.timber.step1.title')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.timber.gnDivision')}</label><input type="text" required onChange={e => handleInputChange('removalGnDiv', e.target.value)} value={inputs.removalGnDiv || userData?.gnDiv || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.timber.gnPlaceholder')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.timber.dsOffice')}</label><input type="text" required onChange={e => handleInputChange('removalDsOffice', e.target.value)} value={inputs.removalDsOffice || userData?.dsDiv || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.timber.dsPlaceholder')} /></div>
                  </div>
                  <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.fields.fullName')}</label><input type="text" required onChange={e => handleInputChange('voterChiefName', e.target.value)} value={inputs.voterChiefName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.placeholder.fullName')} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.fields.nic')}</label><input type="text" required onChange={e => handleInputChange('voterChiefNic', e.target.value)} value={inputs.voterChiefNic || ''} className={`w-full p-3 rounded-xl border ${errors.voterChiefNic?'border-red-500':'border-user-border'} bg-user-surface outline-none text-sm`} placeholder={t('modal.placeholder.nic')} />{errors.voterChiefNic && <span className="text-red-500 text-[11px] font-bold mt-1 block">{errors.voterChiefNic}</span>}</div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.timber.phone')}</label><input type="text" required onChange={e => handleInputChange('voterChiefPhone', e.target.value)} value={inputs.voterChiefPhone || ''} className={`w-full p-3 rounded-xl border ${errors.voterChiefPhone?'border-red-500':'border-user-border'} bg-user-surface outline-none text-sm`} placeholder="10 Digits" />{errors.voterChiefPhone && <span className="text-red-500 text-[11px] font-bold mt-1 block">{errors.voterChiefPhone}</span>}</div>
                  </div>
                  <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.timber.landownerName')}</label><input type="text" onChange={e => handleInputChange('removalLandownerName', e.target.value)} value={inputs.removalLandownerName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.timber.landownerPlaceholder')} /></div>
                  <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.timber.reason')}</label><textarea rows={2} required onChange={e => handleInputChange('treeCuttingReason', e.target.value)} value={inputs.treeCuttingReason || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none resize-none text-sm" placeholder={t('modal.timber.reasonPlaceholder')} /></div>
                </div>
              )}
              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.timber.step2.title')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.timber.landName')}</label><input type="text" required onChange={e => handleInputChange('removalLandName', e.target.value)} value={inputs.removalLandName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.timber.landNamePlaceholder')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.timber.village')}</label><input type="text" required onChange={e => handleInputChange('removalVillageLocalArea', e.target.value)} value={inputs.removalVillageLocalArea || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.timber.villagePlaceholder')} /></div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary mb-2">{t('modal.timber.ownershipType')}</label>
                    <div className="grid grid-cols-2 gap-2 text-sm font-bold">
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="remOwnershipRadio" checked={inputs.removalOwnershipType==='Government Land'} onChange={() => handleInputChange('removalOwnershipType','Government Land')} className="accent-user-secondary" /> {t('modal.timber.government')}</label>
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="remOwnershipRadio" checked={inputs.removalOwnershipType==='Private Land'} onChange={() => handleInputChange('removalOwnershipType','Private Land')} className="accent-user-secondary" /> {t('modal.timber.private')}</label>
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="remOwnershipRadio" checked={inputs.removalOwnershipType==='Traditional Ownership'} onChange={() => handleInputChange('removalOwnershipType','Traditional Ownership')} className="accent-user-secondary" /> {t('modal.timber.traditional')}</label>
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="remOwnershipRadio" checked={inputs.removalOwnershipType==='Other'} onChange={() => handleInputChange('removalOwnershipType','Other')} className="accent-user-secondary" /> {t('modal.other')}</label>
                    </div>
                  </div>
                  <div className="border border-user-border rounded-xl p-4 bg-user-surface">
                    <span className="block text-[11px] font-extrabold text-user-secondary uppercase mb-2">{t('modal.timber.boundaries')}</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder={t('modal.valuation.boundNorth')} required onChange={e => handleInputChange('remBoundNorth', e.target.value)} value={inputs.remBoundNorth || ''} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      <input type="text" placeholder={t('modal.valuation.boundEast')} required onChange={e => handleInputChange('remBoundEast', e.target.value)} value={inputs.remBoundEast || ''} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      <input type="text" placeholder={t('modal.valuation.boundSouth')} required onChange={e => handleInputChange('remBoundSouth', e.target.value)} value={inputs.remBoundSouth || ''} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      <input type="text" placeholder={t('modal.valuation.boundWest')} required onChange={e => handleInputChange('remBoundWest', e.target.value)} value={inputs.remBoundWest || ''} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.timber.deedNumber')}</label><input type="text" required onChange={e => handleInputChange('removalDeedNumber', e.target.value)} value={inputs.removalDeedNumber || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.timber.deedPlaceholder')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.timber.deedDate')}</label><input type="date" required onChange={e => handleInputChange('removalDeedDate', e.target.value)} value={inputs.removalDeedDate || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" /></div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('modal.timber.dispute')}</label>
                    <select required onChange={e => handleInputChange('removalDisputeStatus', e.target.value)} value={inputs.removalDisputeStatus || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                      <option value="">-- {t('modal.select')} --</option><option value="No">{t('modal.no')}</option><option value="Yes">{t('modal.yes')}</option>
                    </select>
                  </div>
                </div>
              )}
              {formStep === 3 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-user-border pb-2">
                    <span className="text-sm font-black text-user-secondary">{t('modal.timber.step3.title')}</span>
                    <button type="button" onClick={() => setTimberGrid([...timberGrid, { species:'',girth:'',height:'',woodVol:'',firewoodVol:'',infraImpact:'No' }])} className="px-3 py-1.5 rounded-lg border border-user-secondary text-user-secondary bg-user-surface cursor-pointer text-xs font-bold">{t('modal.addRow')}</button>
                  </div>
                  {timberGrid.map((row, idx) => (
                    <div key={`timber-row-${idx}`} className="bg-user-surface p-4 rounded-xl border border-user-border space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <input type="text" required placeholder={t('modal.timber.species')} value={row.species} onChange={e => handleTimberGridChange(idx,'species',e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder={t('modal.timber.girth')} value={row.girth} onChange={e => handleTimberGridChange(idx,'girth',e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder={t('modal.timber.height')} value={row.height} onChange={e => handleTimberGridChange(idx,'height',e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <input type="text" required placeholder={t('modal.timber.woodVol')} value={row.woodVol} onChange={e => handleTimberGridChange(idx,'woodVol',e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder={t('modal.timber.firewoodVol')} value={row.firewoodVol} onChange={e => handleTimberGridChange(idx,'firewoodVol',e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <select value={row.infraImpact} onChange={e => handleTimberGridChange(idx,'infraImpact',e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm"><option value="No">{t('modal.timber.noThreat')}</option><option value="Yes">{t('modal.timber.danger')}</option></select>
                      </div>
                      {timberGrid.length > 1 && <button type="button" onClick={() => handleRemoveRow('timberGrid',idx)} className="border-none bg-none text-red-500 font-bold text-xs cursor-pointer">{t('modal.removeRow')}</button>}
                    </div>
                  ))}
                </div>
              )}
              {formStep === 4 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.timber.step4.title')}</h4>
                  <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2"><span className="text-xs font-extrabold">{t('modal.timber.sketchMap')}</span><input type="file" className="text-sm" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2"><span className="text-[11px] font-extrabold">{t('modal.timber.deedUpload')}</span><input type="file" className="text-sm" /></div>
                    <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2"><span className="text-[11px] font-extrabold">{t('modal.timber.landPlan')}</span><input type="file" className="text-sm" /></div>
                  </div>
                  <div className="flex items-start gap-2.5 bg-user-secondary-light p-3 rounded-xl">
                    <input type="checkbox" required defaultChecked className="accent-user-secondary mt-0.5" />
                    <span className="text-[11px] text-user-text font-semibold leading-tight">{t('modal.timber.declaration')}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              MODULE J: BUSINESS REGISTRATION (form.id === 10)
             ========================================== */}
          {form.id === 10 && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.business.step1.title')}</h4>
                  <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.business.businessName')}</label><input type="text" required onChange={e => handleInputChange('biz_prop_name', e.target.value)} value={inputs.biz_prop_name || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.business.businessNamePlaceholder')} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.business.nature')}</label>
                      <select required onChange={e => handleInputChange('biz_nature_type', e.target.value)} value={inputs.biz_nature_type || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- {t('modal.select')} --</option><option value="Retail Store">{t('modal.business.retail')}</option><option value="IT Services">{t('modal.business.it')}</option><option value="Manufacturing">{t('modal.business.manufacturing')}</option><option value="Other">{t('modal.other')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.business.legalStructure')}</label>
                      <select required onChange={e => handleInputChange('biz_legal_structure', e.target.value)} value={inputs.biz_legal_structure || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="Sole Proprietorship">{t('modal.business.sole')}</option><option value="Partnership">{t('modal.business.partnership')}</option><option value="Private Limited Company">{t('modal.business.pvt')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.business.ownerName')}</label><input type="text" required onChange={e => handleInputChange('biz_owner_name', e.target.value)} value={inputs.biz_owner_name || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.business.ownerNamePlaceholder')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.fields.nic')}</label><input type="text" required onChange={e => handleInputChange('biz_owner_nic', e.target.value)} value={inputs.biz_owner_nic || ''} className={`w-full p-3 rounded-xl border ${errors.biz_owner_nic?'border-red-500':'border-user-border'} bg-user-surface outline-none text-sm`} placeholder={t('modal.placeholder.nic')} />{errors.biz_owner_nic && <span className="text-red-500 text-[11px] font-bold mt-1 block">{errors.biz_owner_nic}</span>}</div>
                  </div>
                </div>
              )}
              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.business.step2.title')}</h4>
                  <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.business.address')}</label><textarea rows={2} required onChange={e => handleInputChange('biz_premises_address', e.target.value)} value={inputs.biz_premises_address || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none resize-none text-sm" placeholder={t('modal.business.addressPlaceholder')} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.business.tenure')}</label>
                      <select required onChange={e => handleInputChange('biz_tenure_type', e.target.value)} value={inputs.biz_tenure_type || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- {t('modal.select')} --</option><option value="Owned by Applicant">{t('modal.business.owned')}</option><option value="Rented / Leased Premises">{t('modal.business.rented')}</option><option value="Family-Owned">{t('modal.business.family')}</option>
                      </select>
                    </div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.business.capital')}</label><input type="number" required onChange={e => handleInputChange('biz_initial_capital', e.target.value)} value={inputs.biz_initial_capital || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0.00" /></div>
                  </div>
                  <div className="bg-user-surface p-4 rounded-xl border border-user-border space-y-3">
                    <span className="text-[11px] font-extrabold text-user-secondary uppercase">{t('modal.business.environment')}</span>
                    <label className="flex items-center gap-2 text-xs font-bold text-user-text cursor-pointer">
                      <input type="checkbox" required defaultChecked className="accent-user-secondary" />
                      {t('modal.business.envCheck')}
                    </label>
                  </div>
                </div>
              )}
              {formStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.business.step3.title')}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2"><span className="text-[11px] font-extrabold">{t('modal.business.leaseDeed')}</span><input type="file" className="text-sm" /></div>
                    <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2"><span className="text-[11px] font-extrabold">{t('modal.business.idCopy')}</span><input type="file" className="text-sm" /></div>
                  </div>
                  <div className="flex items-start gap-2.5 bg-user-secondary-light p-3 rounded-xl">
                    <input type="checkbox" required defaultChecked className="accent-user-secondary mt-0.5" />
                    <span className="text-[11px] text-user-text font-semibold leading-tight">{t('modal.business.declaration')}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              MODULE K: ASSESSMENTS FOR OWNERSHIP OF LANDS (form.id === 11)
             ========================================== */}
          {form.id === 11 && (
            <div className="space-y-4">
              <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('modal.assessment.title')}</h4>
              <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.assessment.landName')}</label><input type="text" required onChange={e => handleInputChange('assessmentLandName', e.target.value)} value={inputs.assessmentLandName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.assessment.landNamePlaceholder')} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.assessment.dsDivision')}</label><input type="text" required onChange={e => handleInputChange('assessmentDsDivision', e.target.value)} value={inputs.assessmentDsDivision || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.assessment.dsPlaceholder')} /></div>
                <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.assessment.gnDivision')}</label><input type="text" required onChange={e => handleInputChange('assessmentGnDivision', e.target.value)} value={inputs.assessmentGnDivision || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.assessment.gnPlaceholder')} /></div>
              </div>
              <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.assessment.currentOwner')}</label><input type="text" required onChange={e => handleInputChange('assessmentCurrentOwner', e.target.value)} value={inputs.assessmentCurrentOwner || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('modal.assessment.currentOwnerPlaceholder')} /></div>
              <div>
                <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('modal.assessment.ownershipType')}</label>
                <select required onChange={e => handleInputChange('assessmentOwnershipType', e.target.value)} value={inputs.assessmentOwnershipType || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                  <option value="">-- {t('modal.select')} --</option><option value="Deeded Land">{t('modal.assessment.deeded')}</option><option value="Leased Land">{t('modal.assessment.leased')}</option><option value="Traditional Ownership">{t('modal.assessment.traditional')}</option>
                </select>
              </div>
              <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2"><span className="text-xs font-extrabold">{t('modal.assessment.uploadDocs')}</span><input type="file" className="text-sm" /></div>
            </div>
          )}

          {/* ---- Action Buttons ---- */}
          <div className="flex justify-between mt-4 pt-2 border-t border-user-border">
            <button
              type="button"
              onClick={() => { if (formStep === 1) onClose(); else setFormStep(prev => prev - 1); }}
              className="px-6 py-2.5 rounded-full border border-user-border bg-user-surface font-bold text-user-text-lighter cursor-pointer hover:bg-user-secondary-light"
            >
              {t('modal.back')}
            </button>
            <button
              type="submit"
              disabled={generating}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-extrabold text-white transition-all ${
                generating ? 'bg-gray-400 cursor-not-allowed' : isLastStep ? 'bg-user-secondary hover:bg-user-secondary-dark cursor-pointer' : 'bg-user-secondary hover:bg-user-secondary-dark cursor-pointer'
              }`}
            >
              {generating ? (
                <>
                  <svg className="animate-spin" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                  {t('modal.generating')}
                </>
              ) : isLastStep ? (
                <>
                  <Icon d={IC.download} size={16} color="#fff" sw={2.5} />
                  {t('modal.downloadPdf')}
                </>
              ) : t('modal.next')}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

// ============================================================
// BLANK PDFS SECTION (with translations)
// ============================================================
const BlankPdfsSection = ({ tab, t }) => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchForms = async () => {
      setLoading(true);
      setError(null);
      try {
        const ref = collection(db, 'downloadable_forms');
        const q = query(ref, where('isActive', '==', true));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setForms(data);
      } catch (e) {
        console.error(e);
        setError(t('blankPdfs.loadError'));
      } finally {
        setLoading(false);
      }
    };
    fetchForms();
  }, []);

  const tabMap = {
    [t('tabs.all')]: 'All',
    [t('tabs.certificates')]: 'Certificates',
    [t('tabs.applications')]: 'Applications',
    [t('tabs.recommendations')]: 'Recommendations'
  };
  const filtered = forms.filter(f => tab === t('tabs.all') || f.category === tabMap[tab]);

  const handleDownload = (form) => {
    if (!form.filePath) { alert(t('blankPdfs.noFilePath')); return; }
    const link = document.createElement('a');
    link.href = form.filePath;
    link.download = `${form.title}.pdf`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <div className="flex flex-col gap-3 pb-5">
      {[1,2,3].map(i => (
        <div key={i} className="bg-user-surface border border-user-border rounded-xl p-5 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-200 rounded-xl flex-shrink-0" />
            <div className="space-y-2"><div className="h-4 bg-gray-200 rounded w-48" /><div className="h-3 bg-gray-200 rounded w-32" /></div>
          </div>
          <div className="h-9 bg-gray-200 rounded-lg w-28" />
        </div>
      ))}
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600 text-sm font-semibold">{error}</div>
  );

  if (filtered.length === 0) return (
    <div className="bg-user-surface border border-user-border rounded-xl p-10 text-center">
      <Icon d={IC.fileText} size={40} color="#B46A02" />
      <p className="text-user-text-lighter font-semibold mt-3 text-sm">{t('blankPdfs.noForms')}</p>
      <p className="text-user-text-lighter text-xs mt-1">{t('blankPdfs.noFormsSub')}</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-3 pb-5">
      {filtered.map(form => (
        <div key={form.id} className="bg-user-surface dark:bg-user-surface border border-user-border dark:border-user-border rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-50 dark:bg-red-50/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-red-100">
              <Icon d={IC.fileText} size={26} color="#dc2626" />
            </div>
            <div>
              <div className="text-base font-extrabold text-user-text dark:text-user-text">{form.title}</div>
              <div className="text-xs font-semibold text-user-text-lighter dark:text-user-text-lighter mt-0.5">{form.description}</div>
              <div className="flex items-center gap-3 mt-1">
                {form.category && <span className="text-[10px] font-bold bg-user-secondary-light text-user-secondary px-2 py-0.5 rounded-full">{form.category}</span>}
                {form.version && <span className="text-[10px] text-user-text-lighter font-semibold">v{form.version}</span>}
                {form.fileSize && <span className="text-[10px] text-user-text-lighter font-semibold">{form.fileSize}</span>}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleDownload(form)}
            className="flex items-center gap-2 py-2 px-5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-extrabold cursor-pointer transition-all"
          >
            <Icon d={IC.download} size={14} color="#fff" sw={2.5} />
            {t('blankPdfs.download')}
          </button>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// MAIN FORMS COMPONENT
// ============================================================
const Forms = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
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
  const [searchParams, setSearchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState('fillable');

  const catTabs = [
    { key: 'All', label: t('tabs.all') },
    { key: 'Certificates', label: t('tabs.certificates') },
    { key: 'Applications', label: t('tabs.applications') },
    { key: 'Recommendations', label: t('tabs.recommendations') }
  ];

  const formList = [
    { id: 1, titleKey: 'forms.residence.title', descKey: 'forms.residence.desc', cat: 'Certificates', imgSrc: '/icons/residence.png' },
    { id: 2, titleKey: 'forms.character.title', descKey: 'forms.character.desc', cat: 'Certificates', imgSrc: '/icons/character.png' },
    { id: 3, titleKey: 'forms.income.title', descKey: 'forms.income.desc', cat: 'Certificates', imgSrc: '/icons/income.png' },
    { id: 4, titleKey: 'forms.valuation.title', descKey: 'forms.valuation.desc', cat: 'Certificates', imgSrc: '/icons/valuation.png' },
    { id: 5, titleKey: 'forms.idCard.title', descKey: 'forms.idCard.desc', cat: 'Applications', imgSrc: '/icons/id-card.png' },
    { id: 6, titleKey: 'forms.disabled.title', descKey: 'forms.disabled.desc', cat: 'Recommendations', imgSrc: '/icons/disabled.png' },
    { id: 7, titleKey: 'forms.voter.title', descKey: 'forms.voter.desc', cat: 'Applications', imgSrc: '/icons/voter.png' },
    { id: 8, titleKey: 'forms.tree.title', descKey: 'forms.tree.desc', cat: 'Recommendations', imgSrc: '/icons/tree.png' },
    { id: 9, titleKey: 'forms.timber.title', descKey: 'forms.timber.desc', cat: 'Recommendations', imgSrc: '/icons/timber.png' },
    { id: 10, titleKey: 'forms.business.title', descKey: 'forms.business.desc', cat: 'Recommendations', imgSrc: '/icons/business.png' },
    { id: 11, titleKey: 'forms.land.title', descKey: 'forms.land.desc', cat: 'Certificates', imgSrc: '/icons/land.png' },
  ];

  useEffect(() => {
    const selectId = searchParams.get('select');
    if (selectId) {
      const formId = parseInt(selectId, 10);
      const matchedForm = formList.find(f => f.id === formId);
      if (matchedForm) {
        setSelectedForm(matchedForm);
        setFormInputs({});
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('select');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
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
  const chipName = userData?.username || userData?.fullName || currentUser?.email?.split('@')[0] || t('profile.user');

  const handleLanguageChange = (langCode) => {
    setCurrentLanguage(langCode);
    i18n.changeLanguage(langCode);
  };

  useEffect(() => {
    const handleClickOutside = () => { setShowSearchResults(false); setShowProfileMenu(false); };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  if (authLoading) return <PageLoadingSkeleton />;

  return (
    <div className="user-module min-h-screen flex flex-col font-sans bg-user-background dark:bg-user-background">
      <div className="flex-1 flex">
        {!isMobile && <DesktopSidebar activePage="forms" navigate={navigate} onLogout={handleLogout} t={t} />}
        <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} activePage="forms" navigate={navigate} onLogout={handleLogout} t={t} />

        <div className="flex-1 flex flex-col min-w-0">
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
              userData={userData}
              currentUser={currentUser}
              t={t}
            />
          )}
          <MobileTopbar chipName={chipName} onMenuClick={() => setMobileMenuOpen(true)} navigate={navigate} currentLanguage={currentLanguage} onLanguageChange={handleLanguageChange} t={t} />

          {/* Mobile Search Bar */}
          <div className="md:hidden pt-3 px-3.5 relative">
            <div className="flex items-center gap-2.5 bg-white border border-user-border rounded-3xl px-4 py-2.5">
              <Icon d={IC.search} size={16} color="#aaa" />
              <input type="text" placeholder={t('search.placeholder')} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }} onFocus={() => setShowSearchResults(true)} className="flex-1 border-none outline-none text-sm font-medium text-user-text bg-transparent" />
              {searchQuery && <button onClick={() => { setSearchQuery(''); setShowSearchResults(false); }} className="bg-none border-none cursor-pointer p-1"><Icon d={IC.close} size={14} color="#aaa" /></button>}
            </div>
            <SearchResultsDropdown searchQuery={searchQuery} showResults={showSearchResults} setShowResults={setShowSearchResults} navigate={navigate} t={t} />
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-user-text tracking-tight mb-1">{t('forms.title')}</h1>
              <p className="text-sm pb-5 font-semibold text-user-text-lighter">{t('forms.subtitle')}</p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-user-secondary-light border border-user-border rounded-xl w-fit mb-5">
              <button
                onClick={() => setViewMode('fillable')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${viewMode === 'fillable' ? 'bg-user-secondary text-white shadow-sm' : 'text-user-text-lighter hover:text-user-text bg-transparent border-none'}`}
              >
                <Icon d={IC.edit} size={15} color={viewMode === 'fillable' ? '#fff' : '#B46A02'} />
                {t('fillableForms')}
              </button>
              <button
                onClick={() => setViewMode('blank')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${viewMode === 'blank' ? 'bg-user-secondary text-white shadow-sm' : 'text-user-text-lighter hover:text-user-text bg-transparent border-none'}`}
              >
                <Icon d={IC.download} size={15} color={viewMode === 'blank' ? '#fff' : '#B46A02'} />
                {t('blankPdfs')}
              </button>
            </div>

            {/* Mode Description Banner */}
            {viewMode === 'fillable' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
                <Icon d={IC.edit} size={18} color="#B46A02" />
                <div>
                  <div className="text-sm font-bold text-amber-800">{t('fillableDesc.title')}</div>
                  <div className="text-xs text-amber-700 mt-0.5">{t('fillableDesc.desc')}</div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
                <Icon d={IC.download} size={18} color="#dc2626" />
                <div>
                  <div className="text-sm font-bold text-red-800">{t('blankPdfs.title')}</div>
                  <div className="text-xs text-red-700 mt-0.5">{t('blankPdfs.desc')}</div>
                </div>
              </div>
            )}

            {/* Category Tabs */}
            <div className="flex gap-2 mb-5 border-b-2 border-user-border dark:border-user-border overflow-x-auto whitespace-nowrap scrollbar-hide md:flex-wrap">
              {catTabs.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setTab(cat.key)}
                  className={`py-2.5 px-5 border-none bg-transparent text-sm font-semibold cursor-pointer transition-all flex-shrink-0 ${
                    tab === cat.key ? 'text-user-primary font-extrabold border-b-2 border-user-primary' : 'text-user-text-lighter hover:text-user-text'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Fillable Forms View */}
            {viewMode === 'fillable' && (
              <div className="grid grid-cols-1 gap-3 pb-5">
                {formList.filter(f => tab === 'All' || f.cat === tab).map(form => (
                  <div key={form.id} className="bg-user-surface dark:bg-user-surface border border-user-border dark:border-user-border rounded-xl p-5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-user-secondary-light dark:bg-user-secondary-light rounded-xl flex items-center justify-center flex-shrink-0">
                        <img src={form.imgSrc} alt={t(form.titleKey)} className="w-10 h-10 object-contain" onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML=`<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#B46A02" stroke-width="1.8"><path d="${IC.forms}"/></svg>`; }} />
                      </div>
                      <div>
                        <div className="text-base font-extrabold text-user-text dark:text-user-text">{t(form.titleKey)}</div>
                        <div className="text-xs font-semibold text-user-text-lighter dark:text-user-text-lighter">{t(form.descKey)}</div>
                        <span className="text-[10px] font-bold bg-user-secondary-light text-user-secondary px-2 py-0.5 rounded-full mt-1 inline-block">{t(`tabs.${form.cat.toLowerCase()}`)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedForm(form); setFormInputs({}); }}
                      className="flex items-center gap-2 py-2 px-5 rounded-lg border border-user-border dark:border-user-border bg-user-surface dark:bg-user-surface text-sm font-extrabold text-user-text dark:text-user-text cursor-pointer transition-all hover:border-user-primary hover:bg-user-background"
                    >
                      <Icon d={IC.edit} size={14} color="#B46A02" />
                      {t('fillForm')}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Blank PDFs View */}
            {viewMode === 'blank' && <BlankPdfsSection tab={tab} t={t} />}
          </div>
        </div>
      </div>

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
        onSuccess={showToast}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slide-up {
          from { transform: translate(-50%, 20px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease; }
        .animate-spin { animation: spin 0.8s linear infinite; }
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
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <footer className="bg-[#6A2301] text-white text-center py-3 px-4 text-sm font-semibold">
        © 2026 Smart Grama Sewa. All rights reserved.
      </footer>
    </div>
  );
};

export default Forms;
// ------------------- END OF Forms.js -------------------