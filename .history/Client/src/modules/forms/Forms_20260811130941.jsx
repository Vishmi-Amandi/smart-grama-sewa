import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
const DesktopSidebar = ({ activePage, navigate, onLogout, t }) => {
  const navItems = [
    { key: 'dashboard', icon: IC.dashboard, label: t('nav.dashboard'), path: '/dashboard' },
    { key: 'announcements', icon: IC.announce, label: t('nav.announcements'), path: '/announcements' },
    { key: 'appointments', icon: IC.appts, label: t('nav.appointments'), path: '/appointments' },
    { key: 'forms', icon: IC.forms, label: t('nav.forms'), path: '/forms' },
    { key: 'ai', icon: IC.ai, label: t('nav.ai'), path: '/ai' },
  ];
  const bottomNav = [
    { key: 'profile', icon: IC.profile, label: t('nav.profile'), path: '/profile' },
    { key: 'settings', icon: IC.settings, label: t('nav.settings'), path: '/settings' },
    { key: 'logout', icon: IC.logout, label: t('nav.logout'), action: 'logout' },
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
const DesktopTopbar = ({ chipName, searchQuery, setSearchQuery, showResults, setShowResults, navigate, currentLanguage, onLanguageChange, showProfileMenu, setShowProfileMenu, handleLogout, t }) => (
  <div className="desktop-topbar h-16 bg-user-surface dark:bg-user-surface border-b border-user-border dark:border-user-border flex items-center px-7 gap-3.5 sticky top-0 z-40 shadow-sm">
    <div className="flex-1 max-w-[400px] relative">
      <div className="flex items-center gap-2.5 bg-user-secondary-light dark:bg-user-secondary-light border border-user-border dark:border-user-border rounded-3xl px-4 py-2 transition-colors hover:border-user-primary">
        <Icon d={IC.search} size={16} color="#aaa" />
        <input
          type="text"
          placeholder={t('search.placeholder')}
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
          className="flex-1 border-none outline-none text-sm font-medium text-user-text dark:text-user-text bg-transparent"
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
            <Icon d={IC.profile} size={14} /> {t('nav.profile')}
          </button>
          <button onClick={() => { navigate('/settings'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
            <Icon d={IC.settings} size={14} /> {t('nav.settings')}
          </button>
          <hr className="my-1 dark:border-gray-700" />
          <button onClick={() => { handleLogout(); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
            <Icon d={IC.logout} size={14} /> {t('nav.logout')}
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
  const navItems = [
    { key: 'dashboard', icon: IC.dashboard, label: t('nav.dashboard'), path: '/dashboard' },
    { key: 'announcements', icon: IC.announce, label: t('nav.announcements'), path: '/announcements' },
    { key: 'appointments', icon: IC.appts, label: t('nav.appointments'), path: '/appointments' },
    { key: 'forms', icon: IC.forms, label: t('nav.forms'), path: '/forms' },
    { key: 'ai', icon: IC.ai, label: t('nav.ai'), path: null },
  ];
  const bottomNav = [
    { key: 'profile', icon: IC.profile, label: t('nav.profile'), path: '/profile' },
    { key: 'settings', icon: IC.settings, label: t('nav.settings'), path: '/settings' },
    { key: 'logout', icon: IC.logout, label: t('nav.logout'), action: 'logout' },
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

// Search Results Dropdown Component
const SearchResultsDropdown = ({ searchQuery, showResults, setShowResults, navigate, t }) => {
  const PAGE_ACTIONS = [
    { name: t('nav.dashboard'), path: '/dashboard', icon: IC.dashboard },
    { name: t('nav.announcements'), path: '/announcements', icon: IC.announce },
    { name: t('nav.appointments'), path: '/appointments', icon: IC.appts },
    { name: t('nav.forms'), path: '/forms', icon: IC.forms },
    { name: t('nav.ai'), path: null, icon: IC.ai },
    { name: t('nav.profile'), path: '/profile', icon: IC.profile },
    { name: t('nav.settings'), path: '/settings', icon: IC.settings },
  ];
  const [filteredPages, setFilteredPages] = useState([]);

  useEffect(() => {
    if (!searchQuery.trim()) { setFilteredPages([]); return; }
    const query = searchQuery.toLowerCase();
    setFilteredPages(PAGE_ACTIONS.filter(page => page.name.toLowerCase().includes(query)));
  }, [searchQuery, t]);

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
// MAPPING OF FORM FIELDS (for Download Form)
// ============================================================
const formFieldKeys = {
  1: [ // Residence Certificate
    'applicantName', 'applicantAddress', 'sex', 'age', 'civilStatus', 'isSriLankan', 'religion', 'occupation',
    'villagePeriod', 'gnPeriod', 'residenceEvidence', 'nicNumber', 'electoralDetails',
    'fatherName', 'fatherAddress', 'courtConviction', 'socialService', 'certificatePurpose'
  ],
  2: [ // Character Certificate – same fields as Residence (they are similar)
    'applicantName', 'applicantAddress', 'sex', 'age', 'civilStatus', 'isSriLankan', 'religion', 'occupation',
    'villagePeriod', 'gnPeriod', 'residenceEvidence', 'nicNumber', 'electoralDetails',
    'fatherName', 'fatherAddress', 'courtConviction', 'socialService', 'certificatePurpose'
  ],
  3: [ // Income Certificate
    'incFullName', 'incAddress', 'incNic', 'incPurpose',
    'incomeJobAmt', 'incomeLandAmt', 'incomeBizAmt',
    'summaryEmployment', 'summaryLand', 'summaryBusiness', 'summaryOther',
    'reliefName', 'incomeAccuracyEvidence', 'submissionTargetInstitution'
  ],
  4: [ // Valuation Certificate
    'valRefNo', 'valRequestDate', 'valDsDivision', 'valGnDivision', 'valLandName',
    'boundNorth', 'boundEast', 'boundSouth', 'boundWest',
    'sizeAcres', 'sizeRoods', 'sizePerches',
    'valLandType', 'possessionYears', 'possessionMonths'
  ],
  5: [ // Identity Card Application
    'nicFamilyName', 'nicOtherNames', 'nicSurname', 'nicPreferredName',
    'nicSex', 'nicCivilStatus', 'nicDob', 'nicBirthCertNo',
    'nicBirthPlace', 'nicBirthDistrict', 'nicOccupation',
    'nicPermAddress', 'nicPostalAddress', 'nicMobilePhone', 'nicEmail'
  ],
  6: [ // Living Funds for Disabled Persons
    'lawDistrict', 'lawDsOffice', 'lawGnDivision',
    'lawFullName', 'lawDisabilityNature', 'lawDisabilityCause',
    'lawAccidentYear', 'lawOtherCauseDetails', 'lawVocationalOrEducation',
    'lawBankAccountNo', 'lawBankNameBranch'
  ],
  7: [ // Voter Registration
    'voterElectoralDistrict', 'voterPollingDivision', 'voterPollingDistrictNo',
    'voterGnDivision', 'voterVillageStreet', 'voterHouseholdNo',
    // Option A fields
    'ycFullName', 'ycNicNo', 'ycDob', 'ycGender', 'ycCivilStatus', 'ycRelationToChief',
    // Option B fields are dynamic (newVoters, deletedVoters) – handled separately in PDF generation
    'voterChiefName', 'voterChiefNic', 'voterChiefPhone', 'voterChiefWhatsApp'
  ],
  8: [ // Permit for Felling Trees
    'treeApplicantStatus', 'treeFullName', 'treeNic', 'treePhone',
    'treePermanentAddress', 'treeWhatsApp',
    'treeLandName', 'treeDistrict', 'treeDsDivision', 'treeGnDivision',
    'treeLandAcres', 'treeLandRoods', 'treeLandPerches',
    'treeOwnershipType', 'treeDeedNoDate', 'treeLegalDisputesExist',
    'treeBoundNorth', 'treeBoundEast', 'treeBoundSouth', 'treeBoundWest'
    // treeLogistics matrix is handled separately
  ],
  9: [ // Permit for Timber Transportation
    'removalGnDiv', 'removalDsOffice',
    'voterChiefName', 'voterChiefNic', 'voterChiefPhone',
    'removalLandownerName', 'treeCuttingReason',
    'removalLandName', 'removalVillageLocalArea',
    'removalOwnershipType',
    'remBoundNorth', 'remBoundEast', 'remBoundSouth', 'remBoundWest',
    'removalDeedNumber', 'removalDeedDate', 'removalDisputeStatus'
    // timberGrid matrix is handled separately
  ],
  10: [ // Business Registration
    'biz_prop_name', 'biz_nature_type', 'biz_legal_structure',
    'biz_owner_name', 'biz_owner_nic',
    'biz_premises_address', 'biz_tenure_type', 'biz_initial_capital'
  ],
  11: [ // Assessments for Ownership of Lands
    'assessmentLandName', 'assessmentDsDivision', 'assessmentGnDivision',
    'assessmentCurrentOwner', 'assessmentOwnershipType'
  ]
};

// Helper to build default inputs for a form using user data
const getDefaultFormInputs = (form, userData, currentUser) => {
  const fields = formFieldKeys[form.id] || [];
  const inputs = {};

  // Map user data to form fields (if field name matches a userData property)
  const userMap = {
    applicantName: userData?.fullName || '',
    applicantAddress: userData?.address || '',
    sex: userData?.gender || '',
    age: userData?.dob ? new Date().getFullYear() - new Date(userData.dob).getFullYear() : '',
    civilStatus: userData?.civilStatus || '',
    isSriLankan: 'Yes', // default
    religion: userData?.religion || '',
    occupation: userData?.occupation || '',
    villagePeriod: '',
    gnPeriod: '',
    residenceEvidence: '',
    nicNumber: userData?.nic || '',
    electoralDetails: '',
    fatherName: '',
    fatherAddress: '',
    courtConviction: 'No',
    socialService: '',
    certificatePurpose: '',
    incFullName: userData?.fullName || '',
    incAddress: userData?.address || '',
    incNic: userData?.nic || '',
    incPurpose: '',
    incomeJobAmt: '',
    incomeLandAmt: '',
    incomeBizAmt: '',
    summaryEmployment: '',
    summaryLand: '',
    summaryBusiness: '',
    summaryOther: '',
    reliefName: '',
    incomeAccuracyEvidence: '',
    submissionTargetInstitution: '',
    valRefNo: '',
    valRequestDate: '',
    valDsDivision: userData?.dsDiv || '',
    valGnDivision: userData?.gnDiv || '',
    valLandName: '',
    boundNorth: '', boundEast: '', boundSouth: '', boundWest: '',
    sizeAcres: '', sizeRoods: '', sizePerches: '',
    valLandType: '',
    possessionYears: '', possessionMonths: '',
    nicFamilyName: '', nicOtherNames: '', nicSurname: '', nicPreferredName: '',
    nicSex: userData?.gender || '',
    nicCivilStatus: userData?.civilStatus || '',
    nicDob: userData?.dob || '',
    nicBirthCertNo: '',
    nicBirthPlace: '',
    nicBirthDistrict: userData?.district || '',
    nicOccupation: userData?.occupation || '',
    nicPermAddress: userData?.address || '',
    nicPostalAddress: '',
    nicMobilePhone: userData?.mobile || '',
    nicEmail: currentUser?.email || '',
    lawDistrict: userData?.district || '',
    lawDsOffice: userData?.dsDiv || '',
    lawGnDivision: userData?.gnDiv || '',
    lawFullName: userData?.fullName || '',
    lawDisabilityNature: '',
    lawDisabilityCause: '',
    lawAccidentYear: '',
    lawOtherCauseDetails: '',
    lawVocationalOrEducation: '',
    lawBankAccountNo: '',
    lawBankNameBranch: '',
    voterElectoralDistrict: userData?.district || '',
    voterPollingDivision: '',
    voterPollingDistrictNo: '',
    voterGnDivision: userData?.gnDiv || '',
    voterVillageStreet: '',
    voterHouseholdNo: '',
    ycFullName: '',
    ycNicNo: '',
    ycDob: '',
    ycGender: '',
    ycCivilStatus: '',
    ycRelationToChief: '',
    voterChiefName: userData?.fullName || '',
    voterChiefNic: userData?.nic || '',
    voterChiefPhone: userData?.mobile || '',
    voterChiefWhatsApp: userData?.mobile || '',
    treeApplicantStatus: 'Land Owner',
    treeFullName: userData?.fullName || '',
    treeNic: userData?.nic || '',
    treePhone: userData?.mobile || '',
    treePermanentAddress: userData?.address || '',
    treeWhatsApp: userData?.mobile || '',
    treeLandName: '',
    treeDistrict: userData?.district || '',
    treeDsDivision: userData?.dsDiv || '',
    treeGnDivision: userData?.gnDiv || '',
    treeLandAcres: '', treeLandRoods: '', treeLandPerches: '',
    treeOwnershipType: '',
    treeDeedNoDate: '',
    treeLegalDisputesExist: 'No',
    treeBoundNorth: '', treeBoundEast: '', treeBoundSouth: '', treeBoundWest: '',
    removalGnDiv: userData?.gnDiv || '',
    removalDsOffice: userData?.dsDiv || '',
    removalLandownerName: userData?.fullName || '',
    treeCuttingReason: '',
    removalLandName: '',
    removalVillageLocalArea: '',
    removalOwnershipType: '',
    remBoundNorth: '', remBoundEast: '', remBoundSouth: '', remBoundWest: '',
    removalDeedNumber: '',
    removalDeedDate: '',
    removalDisputeStatus: 'No',
    biz_prop_name: '',
    biz_nature_type: '',
    biz_legal_structure: 'Sole Proprietorship',
    biz_owner_name: userData?.fullName || '',
    biz_owner_nic: userData?.nic || '',
    biz_premises_address: userData?.address || '',
    biz_tenure_type: '',
    biz_initial_capital: '',
    assessmentLandName: '',
    assessmentDsDivision: userData?.dsDiv || '',
    assessmentGnDivision: userData?.gnDiv || '',
    assessmentCurrentOwner: userData?.fullName || '',
    assessmentOwnershipType: ''
  };

  // For each field in the form's list, set the value from userMap or empty string
  fields.forEach(key => {
    inputs[key] = userMap[key] !== undefined ? userMap[key] : '';
  });

  return inputs;
};

// ============================================================
// SIMPLE PDF GENERATION – NOW WITH TRANSLATED LABELS
// ============================================================
const generateFormPDF = async ({ form, inputs, userData, currentUser, disabledMembers, otherMembers, newVoters, deletedVoters, treeLogistics, timberGrid, t, fieldKeys }) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' });
  const refNo = `SGS-${form.id.toString().padStart(2, '0')}-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const formatLabel = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Get applicant details (always from userData or fallback)
  const applicantName = userData?.fullName || inputs.applicantName || inputs.incFullName || inputs.treeFullName || inputs.lawFullName || currentUser?.displayName || '___________';
  const applicantNic = userData?.nic || inputs.nicNumber || inputs.incNic || inputs.treeNic || inputs.voterChiefNic || '___________';
  const applicantAddress = userData?.address || inputs.applicantAddress || inputs.incAddress || inputs.treePermanentAddress || inputs.nicPermAddress || '___________';
  const applicantPhone = userData?.mobile || inputs.treePhone || inputs.voterChiefPhone || inputs.nicMobilePhone || '___________';
  const applicantEmail = currentUser?.email || inputs.nicEmail || '___________';

  // Build form data rows – now using translation keys
  let formDataRows = '';
  const keysToDisplay = fieldKeys || Object.keys(inputs).filter(key => inputs[key] && typeof inputs[key] !== 'object' && inputs[key] !== '');
  
  if (keysToDisplay && keysToDisplay.length > 0) {
    for (const key of keysToDisplay) {
      const value = inputs[key] !== undefined ? inputs[key] : '';
      // 🔥 KEY CHANGE: use translation for the label, fallback to formatted key
      const label = t('forms.fields.' + key, formatLabel(key));
      formDataRows += `
        <tr style="border-bottom: 1px solid #e8d5b7;">
          <td style="padding: 10px 12px; font-weight: 600; color: #6A2301; background: #fdf6ee; width: 35%; font-size: 12px;">${label}</td>
          <td style="padding: 10px 12px; font-size: 12px; color: #2d1a00;">${String(value) || '_________________________'}</td>
        </tr>
      `;
    }
  }

  // Build table sections for arrays – now with translated titles passed in
  const buildTableSection = (title, items) => {
    if (!items || items.length === 0) return '';
    const validItems = items.filter(item => item.name || item.species || Object.values(item).some(v => v && v !== ''));
    if (validItems.length === 0) return '';
   
    let html = `<div style="margin-top: 25px;"><div style="font-weight: 800; font-size: 14px; color: #6A2301; margin-bottom: 12px; border-left: 4px solid #B46A02; padding-left: 12px;">${title}</div>`;
   
    validItems.forEach((item, idx) => {
      html += `<div style="margin-bottom: 12px; padding: 12px; background: #fdf6ee; border: 1px solid #e8d5b7; border-radius: 8px;">
        <div style="font-size: 11px; font-weight: 700; color: #B46A02; margin-bottom: 8px;">${t('pdf.entry')} ${idx + 1}</div>
        <table style="width: 100%; border-collapse: collapse;">`;
     
      for (const [key, value] of Object.entries(item)) {
        if (value && typeof value !== 'object' && value !== '') {
          html += `<tr style="border-bottom: 1px solid #e8d5b7;">
            <td style="padding: 8px 10px; font-weight: 600; color: #6A2301; width: 35%; font-size: 11px;">${formatLabel(key)}</td>
            <td style="padding: 8px 10px; font-size: 11px; color: #2d1a00;">${String(value)}</td>
          </tr>`;
        }
      }
      html += `</table></div>`;
    });
    html += `</div>`;
    return html;
  };

  let extraSections = '';
  if (form.id === 6) {
    extraSections += buildTableSection(t('pdf.familyMembersWithDisabilities'), disabledMembers);
    extraSections += buildTableSection(t('pdf.otherFamilyMembers'), otherMembers);
  }
  if (form.id === 7) {
    extraSections += buildTableSection(t('pdf.newVoters'), newVoters);
    extraSections += buildTableSection(t('pdf.votersToBeRemoved'), deletedVoters);
  }
  if (form.id === 8) {
    extraSections += buildTableSection(t('pdf.treesToBeFelled'), treeLogistics);
  }
  if (form.id === 9) {
    extraSections += buildTableSection(t('pdf.timberDetails'), timberGrid);
  }

  // Create complete HTML for print – using translated strings
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${form.title} - ${t('pdf.filledApplication')}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          background: white;
          padding: 20px;
        }
        .print-container {
          max-width: 1000px;
          margin: 0 auto;
          background: white;
        }
        .header {
          background: linear-gradient(135deg, #6A2301 0%, #B46A02 100%);
          color: white;
          padding: 25px 30px;
          border-radius: 0;
        }
        .header h1 {
          font-size: 24px;
          margin-bottom: 5px;
        }
        .form-banner {
          background: #FFF8EE;
          border-bottom: 3px solid #B46A02;
          padding: 15px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .form-banner h2 {
          font-size: 18px;
          color: #6A2301;
        }
        .citizen-badge {
          background: #6A2301;
          color: white;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: bold;
        }
        .info-box {
          background: #fdf6ee;
          border: 1px solid #e8d5b7;
          border-radius: 10px;
          padding: 20px 25px;
          margin: 20px 30px;
        }
        .section-title {
          font-weight: 800;
          font-size: 16px;
          color: #6A2301;
          margin-bottom: 15px;
          border-left: 4px solid #B46A02;
          padding-left: 12px;
        }
        .form-table {
          margin: 20px 30px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        .info-item {
          border-bottom: 1px dashed #e8d5b7;
          padding-bottom: 8px;
        }
        .info-label {
          font-size: 10px;
          color: #B46A02;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .info-value {
          font-size: 13px;
          font-weight: 600;
          color: #2d1a00;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        .signatures {
          margin: 30px 30px 20px 30px;
          display: flex;
          justify-content: space-between;
          gap: 50px;
        }
        .signature-line {
          border-top: 1.5px solid #6A2301;
          padding-top: 8px;
          margin-top: 40px;
        }
        .declaration {
          margin: 0 30px 20px 30px;
          padding: 15px 20px;
          background: #FFF8EE;
          border: 1px solid #e8d5b7;
          border-radius: 8px;
        }
        .footer {
          background: #6A2301;
          color: white;
          padding: 12px 30px;
          font-size: 10px;
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
        }
        @media print {
          body {
            padding: 0;
            margin: 0;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        <div class="header">
          <h1>${t('pdf.smartGramaSewa')}</h1>
          <p>${t('pdf.subtitle')}</p>
          <p style="font-size: 11px; margin-top: 5px;">${t('pdf.gnDivisionLabel')} ${userData?.gnDiv || 'N/A'}</p>
        </div>

        <div class="form-banner">
          <div>
            <h2>${form.title}</h2>
            <p style="font-size: 10px; color: #B46A02; margin-top: 3px;">${t('pdf.formId')} SGS-F${String(form.id).padStart(2, '0')}</p>
          </div>
          <div class="citizen-badge">${t('pdf.citizenCopy')}</div>
        </div>

        <div class="info-box">
          <div style="font-weight: bold; margin-bottom: 15px; color: #6A2301;">${t('pdf.applicantInfo')}</div>
          <div class="info-grid">
            <div class="info-item"><div class="info-label">${t('pdf.fullName')}</div><div class="info-value">${applicantName}</div></div>
            <div class="info-item"><div class="info-label">${t('pdf.nic')}</div><div class="info-value">${applicantNic}</div></div>
            <div class="info-item"><div class="info-label">${t('pdf.address')}</div><div class="info-value">${applicantAddress}</div></div>
            <div class="info-item"><div class="info-label">${t('pdf.phone')}</div><div class="info-value">${applicantPhone}</div></div>
            <div class="info-item"><div class="info-label">${t('pdf.email')}</div><div class="info-value">${applicantEmail}</div></div>
            <div class="info-item"><div class="info-label">${t('pdf.gnDivision')}</div><div class="info-value">${userData?.gnDiv || '—'}</div></div>
          </div>
        </div>

        ${formDataRows ? `
        <div class="form-table">
          <div class="section-title">${t('pdf.formDetails')}</div>
          <table style="border: 1px solid #e8d5b7;">
            ${formDataRows}
          </table>
        </div>
        ` : ''}

        ${extraSections}

        <div class="signatures">
          <div style="flex: 1;">
            <div class="signature-line"></div>
            <div style="font-size: 11px; font-weight: bold; margin-top: 5px;">${t('pdf.applicantSignature')}</div>
            <div style="font-size: 10px; color: #888;">${applicantName}</div>
          </div>
          <div style="flex: 1;">
            <div class="signature-line"></div>
            <div style="font-size: 11px; font-weight: bold; margin-top: 5px;">${t('pdf.gnSignature')}</div>
            <div style="font-size: 10px; color: #888;">${userData?.gnDiv || 'GN Office'}</div>
          </div>
        </div>

        <div class="declaration">
          <div style="font-weight: bold; margin-bottom: 5px;">${t('pdf.declarationTitle')}</div>
          <div style="font-size: 10px; line-height: 1.5;">${t('pdf.declarationText')}</div>
        </div>

        <div class="footer">
          <div>${t('pdf.footer', { year: now.getFullYear() })}</div>
          <div>${t('pdf.reference')} ${refNo}</div>
          <div>${t('pdf.generated')} ${dateStr} ${timeStr}</div>
        </div>
      </div>
     
      <div class="no-print" style="text-align: center; padding: 20px; background: #f0f0f0; margin-top: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #6A2301; color: white; border: none; border-radius: 5px; cursor: pointer;">${t('pdf.saveButton')}</button>
        <p style="margin-top: 10px; font-size: 12px;">${t('pdf.saveInstruction')}</p>
      </div>
     
      <script>
        // Auto-trigger print dialog
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        }
      </script>
    </body>
    </html>
  `;

  // Open new window with content and trigger print
  const printWindow = window.open('', '_blank');
  printWindow.document.write(printContent);
  printWindow.document.close();
 
  return true;
};

// --- Multi-Step Dynamic Overlay Engine (fully translated) ---
const DynamicFormModal = ({ form, onClose, inputs, setInputs, currentUser, userData, onSuccess, t }) => {
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
      alert(t('validation.correctErrors'));
      return;
    }
    if (form.id === 7 && formStep === 3 && voterPurpose === 'OptionA') {
      const dobTimestamp = new Date(inputs.ycDob).getTime();
      const minBound = new Date('2008-02-01').getTime();
      const maxBound = new Date('2010-01-31').getTime();
      if (!inputs.ycDob || dobTimestamp < minBound || dobTimestamp > maxBound) {
        alert(t('validation.ycDobRange'));
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

        // Pass the translation function t and the field keys to the PDF generator
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
          t,
          fieldKeys: Object.keys(finalInputs) // Show only filled fields in modal PDF
        });
        onSuccess?.(`${form.title} — ${t('toast.downloadSuccess')}`);
        onClose();
        setFormStep(1);
      } catch (err) {
        console.error('PDF generation error:', err);
        alert(t('validation.pdfError'));
      } finally {
        setGenerating(false);
      }
    }
  };

  const isResidenceOrCharacter = form.id === 1 || form.id === 2;

  // Helper to get step indicator labels based on form id
  const getStepLabels = () => {
    const steps = [];
    if (isResidenceOrCharacter) {
      steps.push(t('forms.modal.divisionApplicant'), t('forms.modal.residenceFamily'), t('forms.modal.verificationReason'));
    } else if (form.id === 3) {
      steps.push(t('forms.modal.personalInfo'), t('forms.modal.incomeBreakdown'), t('forms.modal.totalSummary'), t('forms.modal.uploadsDeclarations'));
    } else if (form.id === 4) {
      steps.push(t('forms.modal.landIdentityLocation'), t('forms.modal.boundariesDimensions'), t('forms.modal.tenureUploads'));
    } else if (form.id === 5) {
      steps.push(t('forms.modal.drpMetadata'), t('forms.modal.statusBirthRegistry'), t('forms.modal.residenceAffidavits'));
    } else if (form.id === 6) {
      steps.push(t('forms.modal.regionApplicant'), t('forms.modal.familyDetails'), t('forms.modal.bankAssistance'), t('forms.modal.uploadCertification'));
    } else if (form.id === 7) {
      steps.push(t('forms.modal.boundariesRegion'), t('forms.modal.purposeRegistration'), t('forms.modal.chiefDeclaration'));
    } else if (form.id === 8) {
      steps.push(t('forms.modal.applicantMeta'), t('forms.modal.propertyLocation'), t('forms.modal.spatialBoundaries'), t('forms.modal.treeLogisticsMatrix'), t('forms.modal.documentAudits'));
    } else if (form.id === 9) {
      steps.push(t('forms.modal.requestInformation'), t('forms.modal.propertyProfile'), t('forms.modal.timberTableMatrix'), t('forms.modal.layoutUploads'));
    } else if (form.id === 10) {
      steps.push(t('forms.modal.ownerBusinessMeta'), t('forms.modal.environmentalPremises'), t('forms.modal.legalDeedUploads'));
    } else if (form.id === 11) {
      steps.push(t('forms.modal.landOwnershipAssessment'));
    }
    return steps;
  };

  const stepLabels = getStepLabels();

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/40 z-[1000]" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1001] w-full max-w-[760px] max-h-[90vh] bg-user-surface dark:bg-user-surface rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        <div className="bg-user-secondary dark:bg-user-secondary p-5 flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="text-xl font-black text-white">{form.title}</h3>
            <p className="text-xs text-yellow-200">{t('forms.modal.officialPortal')}</p>
          </div>
          <button onClick={onClose} className="text-white text-3xl cursor-pointer leading-5">×</button>
        </div>

        {/* Step Indicators */}
        <div className="flex flex-wrap gap-2 bg-user-secondary-light dark:bg-user-secondary-light p-3 border-b border-user-border dark:border-user-border text-[11px] font-extrabold text-user-text-lighter flex-shrink-0 overflow-x-auto">
          {stepLabels.map((label, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span> &gt; </span>}
              <span className={formStep === idx + 1 ? 'text-user-secondary' : ''}>{label}</span>
            </React.Fragment>
          ))}
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4 bg-user-background dark:bg-user-background">

          {/* ==========================================
              MODULE A: RESIDENCE & CHARACTER CERTIFICATES
             ========================================== */}
          {isResidenceOrCharacter && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.divisionApplicant')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.dsDivision')}</label>
                      <input type="text" disabled value={userData?.dsDiv || "Colombo / Thimbirigasyaya"} className="w-full p-3 rounded-xl border border-user-border bg-user-secondary-light text-user-text-lighter text-sm" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.gnDivision')}</label>
                      <input type="text" disabled value={userData?.gnDiv || "Hunupitiya (62B)"} className="w-full p-3 rounded-xl border border-user-border bg-user-secondary-light text-user-text-lighter text-sm" />
                    </div>
                  </div>
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2 pt-2">{t('forms.fields.applicantName')}</h4>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.fullName')}</label>
                    <input type="text" required onChange={e => handleInputChange('applicantName', e.target.value)} value={inputs.applicantName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none focus:border-user-primary text-sm" placeholder={t('forms.fields.fullName')} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.permanentAddress')}</label>
                    <input type="text" required onChange={e => handleInputChange('applicantAddress', e.target.value)} value={inputs.applicantAddress || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none focus:border-user-primary text-sm" placeholder={t('forms.fields.permanentAddress')} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.sex')}</label>
                      <select required onChange={e => handleInputChange('sex', e.target.value)} value={inputs.sex || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- {t('common.select')} --</option>
                        <option value="Male">{t('forms.selectOptions.male')}</option>
                        <option value="Female">{t('forms.selectOptions.female')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.age')}</label>
                      <input type="number" required onChange={e => handleInputChange('age', e.target.value)} value={inputs.age || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.age')} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.civilStatus')}</label>
                      <select required onChange={e => handleInputChange('civilStatus', e.target.value)} value={inputs.civilStatus || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- {t('common.select')} --</option>
                        <option value="Unmarried">{t('forms.selectOptions.unmarried')}</option>
                        <option value="Married">{t('forms.selectOptions.married')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.sriLankan')}</label>
                      <select required onChange={e => handleInputChange('isSriLankan', e.target.value)} value={inputs.isSriLankan || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="Yes">{t('forms.selectOptions.yes')}</option>
                        <option value="No">{t('forms.selectOptions.no')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.religion')}</label>
                      <input type="text" required onChange={e => handleInputChange('religion', e.target.value)} value={inputs.religion || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.religion')} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.occupation')}</label>
                    <input type="text" required onChange={e => handleInputChange('occupation', e.target.value)} value={inputs.occupation || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.occupation')} />
                  </div>
                </div>
              )}
              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.residenceFamily')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.villagePeriod')}</label>
                      <input type="text" required onChange={e => handleInputChange('villagePeriod', e.target.value)} value={inputs.villagePeriod || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.villagePeriod')} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.gnPeriod')}</label>
                      <input type="text" required onChange={e => handleInputChange('gnPeriod', e.target.value)} value={inputs.gnPeriod || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.gnPeriod')} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.residenceEvidence')}</label>
                    <input type="text" required onChange={e => handleInputChange('residenceEvidence', e.target.value)} value={inputs.residenceEvidence || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.residenceEvidence')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.nicNumber')}</label>
                      <input type="text" required onChange={e => handleInputChange('nicNumber', e.target.value)} value={inputs.nicNumber || ''} className={`w-full p-3 rounded-xl border ${errors.nicNumber ? 'border-red-500' : 'border-user-border'} bg-user-surface outline-none text-sm`} placeholder={t('forms.fields.nicNumber')} />
                      {errors.nicNumber && <span className="text-red-500 text-[11px] font-bold mt-1 block">{errors.nicNumber}</span>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.electoralDetails')}</label>
                      <input type="text" required onChange={e => handleInputChange('electoralDetails', e.target.value)} value={inputs.electoralDetails || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.electoralDetails')} />
                    </div>
                  </div>
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2 pt-2">{t('forms.fields.fatherName')}</h4>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.fatherName')}</label>
                    <input type="text" required onChange={e => handleInputChange('fatherName', e.target.value)} value={inputs.fatherName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.fatherName')} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.fatherAddress')}</label>
                    <input type="text" required onChange={e => handleInputChange('fatherAddress', e.target.value)} value={inputs.fatherAddress || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.fatherAddress')} />
                  </div>
                </div>
              )}
              {formStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.verificationReason')}</h4>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.courtConviction')}</label>
                    <select required onChange={e => handleInputChange('courtConviction', e.target.value)} value={inputs.courtConviction || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                      <option value="No">{t('forms.selectOptions.no')}</option>
                      <option value="Yes">{t('forms.selectOptions.yes')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.socialService')}</label>
                    <textarea rows={2} onChange={e => handleInputChange('socialService', e.target.value)} value={inputs.socialService || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none resize-none text-sm" placeholder={t('forms.fields.socialService')} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.certificatePurpose')}</label>
                    <input type="text" required onChange={e => handleInputChange('certificatePurpose', e.target.value)} value={inputs.certificatePurpose || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.certificatePurpose')} />
                  </div>
                  <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4">
                    <span className="text-xs font-extrabold text-user-text block mb-2">{t('forms.fields.signatureAffirmation')}</span>
                    <input type="file" className="text-sm" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              MODULE B: INCOME CERTIFICATE
             ========================================== */}
          {form.id === 3 && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.personalInfo')}</h4>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.incFullName')}</label>
                    <input type="text" required onChange={e => handleInputChange('incFullName', e.target.value)} value={inputs.incFullName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.incFullName')} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.incAddress')}</label>
                    <textarea rows={2} required onChange={e => handleInputChange('incAddress', e.target.value)} value={inputs.incAddress || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none resize-none text-sm" placeholder={t('forms.fields.incAddress')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.incNic')}</label>
                      <input type="text" required onChange={e => handleInputChange('incNic', e.target.value)} value={inputs.incNic || ''} className={`w-full p-3 rounded-xl border ${errors.incNic ? 'border-red-500' : 'border-user-border'} bg-user-surface outline-none text-sm`} placeholder={t('forms.fields.incNic')} />
                      {errors.incNic && <span className="text-red-500 text-[11px] font-bold mt-1 block">{errors.incNic}</span>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.incPurpose')}</label>
                      <select required onChange={e => handleInputChange('incPurpose', e.target.value)} value={inputs.incPurpose || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- {t('common.select')} --</option>
                        <option value="University Admission">{t('income.purposes.university')}</option>
                        <option value="Bank Loan">{t('income.purposes.bankLoan')}</option>
                        <option value="Scholarship">{t('income.purposes.scholarship')}</option>
                        <option value="Other">{t('income.purposes.other')}</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.incomeBreakdown')}</h4>
                  <p className="text-xs text-user-text-lighter font-semibold">{t('income.toggleStreams')}</p>
                  <div className="bg-user-surface p-4 rounded-xl border border-user-border">
                    <label className="flex items-center gap-2 text-sm font-extrabold text-user-text cursor-pointer">
                      <input type="checkbox" checked={hasJobIncome} onChange={e => setHasJobIncome(e.target.checked)} className="accent-user-secondary" />
                      {t('income.jobLabel')}
                    </label>
                    {hasJobIncome && (
                      <div className="mt-3 pt-3 border-t border-user-border">
                        <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.incomeJobAmt')}</label>
                        <input type="number" onChange={e => handleInputChange('incomeJobAmt', e.target.value)} value={inputs.incomeJobAmt || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0.00" />
                      </div>
                    )}
                  </div>
                  <div className="bg-user-surface p-4 rounded-xl border border-user-border">
                    <label className="flex items-center gap-2 text-sm font-extrabold text-user-text cursor-pointer">
                      <input type="checkbox" checked={hasPropertyIncome} onChange={e => setHasPropertyIncome(e.target.checked)} className="accent-user-secondary" />
                      {t('income.propertyLabel')}
                    </label>
                    {hasPropertyIncome && (
                      <div className="mt-3 pt-3 border-t border-user-border space-y-3">
                        <div>
                          <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.landLoc')}</label>
                          <input type="text" onChange={e => handleInputChange('landLoc', e.target.value)} value={inputs.landLoc || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.landLoc')} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.landDeed')}</label>
                            <input type="text" onChange={e => handleInputChange('landDeed', e.target.value)} value={inputs.landDeed || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.landDeed')} />
                          </div>
                          <div>
                            <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.landSize')}</label>
                            <input type="text" onChange={e => handleInputChange('landSize', e.target.value)} value={inputs.landSize || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.landSize')} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.incomeLandAmt')}</label>
                          <input type="number" onChange={e => handleInputChange('incomeLandAmt', e.target.value)} value={inputs.incomeLandAmt || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0.00" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-user-surface p-4 rounded-xl border border-user-border">
                    <label className="flex items-center gap-2 text-sm font-extrabold text-user-text cursor-pointer">
                      <input type="checkbox" checked={hasBusinessIncome} onChange={e => setHasBusinessIncome(e.target.checked)} className="accent-user-secondary" />
                      {t('income.businessLabel')}
                    </label>
                    {hasBusinessIncome && (
                      <div className="mt-3 pt-3 border-t border-user-border space-y-3">
                        <div>
                          <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.bizName')}</label>
                          <input type="text" onChange={e => handleInputChange('bizName', e.target.value)} value={inputs.bizName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.bizName')} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.bizRegNo')}</label>
                            <input type="text" onChange={e => handleInputChange('bizRegNo', e.target.value)} value={inputs.bizRegNo || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.bizRegNo')} />
                          </div>
                          <div>
                            <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.incomeBizAmt')}</label>
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
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.totalSummary')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.summaryEmployment')}</label>
                      <input type="number" onChange={e => handleInputChange('summaryEmployment', e.target.value)} value={inputs.summaryEmployment || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.summaryLand')}</label>
                      <input type="number" onChange={e => handleInputChange('summaryLand', e.target.value)} value={inputs.summaryLand || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0.00" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.summaryBusiness')}</label>
                      <input type="number" onChange={e => handleInputChange('summaryBusiness', e.target.value)} value={inputs.summaryBusiness || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.summaryOther')}</label>
                      <input type="number" onChange={e => handleInputChange('summaryOther', e.target.value)} value={inputs.summaryOther || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0.00" />
                    </div>
                  </div>
                  <div className="bg-user-secondary text-white p-5 rounded-xl flex justify-between items-center mt-2">
                    <span className="text-[11px] font-extrabold uppercase text-yellow-200">{t('income.totalAnnual')}</span>
                    <span className="text-2xl font-black text-user-primary">Rs. {totalCalculatedIncome.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}
              {formStep === 4 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.uploadsDeclarations')}</h4>
                  <div className="bg-user-surface p-4 rounded-xl border border-user-border">
                    <span className="block text-xs font-extrabold text-user-text mb-2">{t('income.reliefQuestion')}</span>
                    <div className="flex gap-5 text-sm font-bold">
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="reliefRadio" checked={isReliefRecipient === true} onChange={() => setIsReliefRecipient(true)} className="accent-user-secondary" /> {t('forms.selectOptions.yes')}</label>
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="reliefRadio" checked={isReliefRecipient === false} onChange={() => { setIsReliefRecipient(false); handleInputChange('reliefName', ''); }} className="accent-user-secondary" /> {t('forms.selectOptions.no')}</label>
                    </div>
                    {isReliefRecipient && <input type="text" required onChange={e => handleInputChange('reliefName', e.target.value)} value={inputs.reliefName || ''} className="w-full mt-3 p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.reliefName')} />}
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.incomeAccuracyEvidence')}</label>
                    <textarea rows={2} required onChange={e => handleInputChange('incomeAccuracyEvidence', e.target.value)} value={inputs.incomeAccuracyEvidence || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none resize-none text-sm" placeholder={t('forms.fields.incomeAccuracyEvidence')} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.submissionTargetInstitution')}</label>
                    <input type="text" required onChange={e => handleInputChange('submissionTargetInstitution', e.target.value)} value={inputs.submissionTargetInstitution || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.submissionTargetInstitution')} />
                  </div>
                  <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2">
                    <span className="text-xs font-extrabold text-user-text">{t('income.attachAudits')}</span>
                    <input type="file" className="text-sm" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              MODULE C: VALUATION CERTIFICATE (FORM ID: 4)
             ========================================== */}
          {form.id === 4 && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.landIdentityLocation')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.valRefNo')}</label>
                      <input type="text" required onChange={e => handleInputChange('valRefNo', e.target.value)} value={inputs.valRefNo || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.valRefNo')} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.valRequestDate')}</label>
                      <input type="date" required onChange={e => handleInputChange('valRequestDate', e.target.value)} value={inputs.valRequestDate || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.valDsDivision')}</label>
                      <input type="text" required onChange={e => handleInputChange('valDsDivision', e.target.value)} value={inputs.valDsDivision || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.valDsDivision')} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.valGnDivision')}</label>
                      <input type="text" required onChange={e => handleInputChange('valGnDivision', e.target.value)} value={inputs.valGnDivision || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.valGnDivision')} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.valLandName')}</label>
                    <input type="text" required onChange={e => handleInputChange('valLandName', e.target.value)} value={inputs.valLandName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.valLandName')} />
                  </div>
                </div>
              )}
              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.boundariesDimensions')}</h4>
                  <div className="bg-user-surface p-4 rounded-xl border border-user-border space-y-3">
                    <span className="text-xs font-extrabold text-user-secondary uppercase">{t('valuation.fourBoundaries')}</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-[11px] font-bold text-user-secondary mb-1">{t('forms.fields.boundNorth')}</label><input type="text" required onChange={e => handleInputChange('boundNorth', e.target.value)} value={inputs.boundNorth || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.boundNorth')} /></div>
                      <div><label className="block text-[11px] font-bold text-user-secondary mb-1">{t('forms.fields.boundEast')}</label><input type="text" required onChange={e => handleInputChange('boundEast', e.target.value)} value={inputs.boundEast || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.boundEast')} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-[11px] font-bold text-user-secondary mb-1">{t('forms.fields.boundSouth')}</label><input type="text" required onChange={e => handleInputChange('boundSouth', e.target.value)} value={inputs.boundSouth || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.boundSouth')} /></div>
                      <div><label className="block text-[11px] font-bold text-user-secondary mb-1">{t('forms.fields.boundWest')}</label><input type="text" required onChange={e => handleInputChange('boundWest', e.target.value)} value={inputs.boundWest || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.boundWest')} /></div>
                    </div>
                  </div>
                  <div className="bg-user-surface p-4 rounded-xl border border-user-border">
                    <span className="block text-xs font-extrabold text-user-secondary uppercase mb-3">{t('valuation.totalExtent')}</span>
                    <div className="grid grid-cols-3 gap-3">
                      <div><label className="block text-[11px] font-bold text-user-secondary mb-1">{t('forms.fields.sizeAcres')}</label><input type="number" onChange={e => handleInputChange('sizeAcres', e.target.value)} value={inputs.sizeAcres || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0" /></div>
                      <div><label className="block text-[11px] font-bold text-user-secondary mb-1">{t('forms.fields.sizeRoods')}</label><input type="number" onChange={e => handleInputChange('sizeRoods', e.target.value)} value={inputs.sizeRoods || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0" /></div>
                      <div><label className="block text-[11px] font-bold text-user-secondary mb-1">{t('forms.fields.sizePerches')}</label><input type="number" onChange={e => handleInputChange('sizePerches', e.target.value)} value={inputs.sizePerches || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0" /></div>
                    </div>
                  </div>
                </div>
              )}
              {formStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.tenureUploads')}</h4>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.valLandType')}</label>
                    <select required onChange={e => handleInputChange('valLandType', e.target.value)} value={inputs.valLandType || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                      <option value="">-- {t('common.select')} --</option>
                      <option value="Government (රජයේ ඉඩමකි)">{t('forms.selectOptions.government')}</option>
                      <option value="Private (පුද්ගලික ඉඩමකි)">{t('forms.selectOptions.private')}</option>
                      <option value="Devalagam/Temple (විහාරදේවාලගම්)">{t('forms.selectOptions.temple')}</option>
                      <option value="Other">{t('forms.selectOptions.other')}</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.possessionYears')}</label>
                      <input type="number" required onChange={e => handleInputChange('possessionYears', e.target.value)} value={inputs.possessionYears || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.possessionYears')} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.possessionMonths')}</label>
                      <input type="number" required onChange={e => handleInputChange('possessionMonths', e.target.value)} value={inputs.possessionMonths || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.possessionMonths')} />
                    </div>
                  </div>
                  <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2">
                    <span className="text-xs font-extrabold text-user-text">{t('valuation.supportingFiles')}</span>
                    <input type="file" className="text-sm" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              MODULE D: IDENTITY CARD APPLICATION (FORM ID: 5)
             ========================================== */}
          {form.id === 5 && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <div className="bg-user-surface p-4 rounded-xl border border-user-border space-y-3">
                    <span className="text-xs font-extrabold text-user-secondary uppercase">{t('identity.drpAdmin')}</span>
                    <div className="grid grid-cols-3 gap-3">
                      <div><label className="block text-[10px] font-extrabold text-user-secondary">{t('forms.fields.district')}</label><input type="text" disabled value={userData?.district || "Colombo"} className="w-full p-3 rounded-xl border border-user-border bg-user-secondary-light text-user-text-lighter text-sm" /></div>
                      <div><label className="block text-[10px] font-extrabold text-user-secondary">{t('forms.fields.dsDivision')}</label><input type="text" disabled value={userData?.dsDiv || "Thimbirigasyaya"} className="w-full p-3 rounded-xl border border-user-border bg-user-secondary-light text-user-text-lighter text-sm" /></div>
                      <div><label className="block text-[10px] font-extrabold text-user-secondary">{t('forms.fields.gnDivision')}</label><input type="text" disabled value={userData?.gnDiv || "62B / Hunupitiya"} className="w-full p-3 rounded-xl border border-user-border bg-user-secondary-light text-user-text-lighter text-sm" /></div>
                    </div>
                  </div>
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('identity.nameMatrix')}</h4>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.nicFamilyName')}</label>
                    <input type="text" required onChange={e => handleInputChange('nicFamilyName', e.target.value.toUpperCase())} value={inputs.nicFamilyName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm tracking-wider" placeholder={t('forms.fields.nicFamilyName')} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.nicOtherNames')}</label>
                    <input type="text" required onChange={e => handleInputChange('nicOtherNames', e.target.value.toUpperCase())} value={inputs.nicOtherNames || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm tracking-wider" placeholder={t('forms.fields.nicOtherNames')} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.nicSurname')}</label>
                    <input type="text" required onChange={e => handleInputChange('nicSurname', e.target.value.toUpperCase())} value={inputs.nicSurname || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm tracking-wider" placeholder={t('forms.fields.nicSurname')} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.nicPreferredName')}</label>
                    <input type="text" onChange={e => handleInputChange('nicPreferredName', e.target.value.toUpperCase())} value={inputs.nicPreferredName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.nicPreferredName')} />
                  </div>
                </div>
              )}
              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.statusBirthRegistry')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.nicSex')}</label>
                      <select required onChange={e => handleInputChange('nicSex', e.target.value)} value={inputs.nicSex || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- {t('common.select')} --</option>
                        <option value="Male">{t('forms.selectOptions.male')}</option>
                        <option value="Female">{t('forms.selectOptions.female')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.nicCivilStatus')}</label>
                      <select required onChange={e => handleInputChange('nicCivilStatus', e.target.value)} value={inputs.nicCivilStatus || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- {t('common.select')} --</option>
                        <option value="Single">{t('forms.selectOptions.single')}</option>
                        <option value="Married">{t('forms.selectOptions.married')}</option>
                        <option value="Widowed">{t('forms.selectOptions.widowed')}</option>
                        <option value="Divorced">{t('forms.selectOptions.divorced')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.nicDob')}</label>
                      <input type="date" required onChange={e => handleInputChange('nicDob', e.target.value)} value={inputs.nicDob || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.nicBirthCertNo')}</label>
                      <input type="text" required onChange={e => handleInputChange('nicBirthCertNo', e.target.value)} value={inputs.nicBirthCertNo || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.nicBirthCertNo')} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.nicBirthPlace')}</label>
                      <input type="text" required onChange={e => handleInputChange('nicBirthPlace', e.target.value)} value={inputs.nicBirthPlace || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.nicBirthPlace')} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.nicBirthDistrict')}</label>
                      <input type="text" required onChange={e => handleInputChange('nicBirthDistrict', e.target.value)} value={inputs.nicBirthDistrict || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.nicBirthDistrict')} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.nicOccupation')}</label>
                    <input type="text" required onChange={e => handleInputChange('nicOccupation', e.target.value)} value={inputs.nicOccupation || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.nicOccupation')} />
                  </div>
                </div>
              )}
              {formStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.residenceAffidavits')}</h4>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.nicPermAddress')}</label>
                    <textarea rows={2} required onChange={e => handleInputChange('nicPermAddress', e.target.value)} value={inputs.nicPermAddress || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none resize-none text-sm" placeholder={t('forms.fields.nicPermAddress')} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.nicPostalAddress')}</label>
                    <textarea rows={2} onChange={e => handleInputChange('nicPostalAddress', e.target.value)} value={inputs.nicPostalAddress || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none resize-none text-sm" placeholder={t('forms.fields.nicPostalAddress')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.nicMobilePhone')}</label>
                      <input type="text" required onChange={e => handleInputChange('nicMobilePhone', e.target.value)} value={inputs.nicMobilePhone || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.nicMobilePhone')} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.nicEmail')}</label>
                      <input type="email" onChange={e => handleInputChange('nicEmail', e.target.value)} value={inputs.nicEmail || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.nicEmail')} />
                    </div>
                  </div>
                  <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2">
                    <span className="text-xs font-extrabold text-user-text">{t('identity.attachPhoto')}</span>
                    <input type="file" className="text-sm" />
                  </div>
                  <div className="flex items-start gap-2.5 bg-user-secondary-light p-3 rounded-xl">
                    <input type="checkbox" required defaultChecked className="accent-user-secondary mt-0.5" />
                    <span className="text-[11px] text-user-text font-semibold leading-tight">{t('identity.drpDeclaration')}</span>
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
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.regionApplicant')}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.lawDistrict')}</label><input type="text" required onChange={e => handleInputChange('lawDistrict', e.target.value)} value={inputs.lawDistrict || userData?.district || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.lawDistrict')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.lawDsOffice')}</label><input type="text" required onChange={e => handleInputChange('lawDsOffice', e.target.value)} value={inputs.lawDsOffice || userData?.dsDiv || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.lawDsOffice')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.lawGnDivision')}</label><input type="text" required onChange={e => handleInputChange('lawGnDivision', e.target.value)} value={inputs.lawGnDivision || userData?.gnDiv || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.lawGnDivision')} /></div>
                  </div>
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2 pt-2">{t('forms.fields.applicantName')}</h4>
                  <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.lawFullName')}</label><input type="text" required onChange={e => handleInputChange('lawFullName', e.target.value)} value={inputs.lawFullName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.lawFullName')} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.lawDisabilityNature')}</label><input type="text" required onChange={e => handleInputChange('lawDisabilityNature', e.target.value)} value={inputs.lawDisabilityNature || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.lawDisabilityNature')} /></div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.lawDisabilityCause')}</label>
                      <select required onChange={e => handleInputChange('lawDisabilityCause', e.target.value)} value={inputs.lawDisabilityCause || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- {t('common.select')} --</option>
                        <option value="By Birth">{t('forms.selectOptions.byBirth')}</option>
                        <option value="Accident">{t('forms.selectOptions.accident')}</option>
                        <option value="Other">{t('forms.selectOptions.other')}</option>
                      </select>
                    </div>
                  </div>
                  {inputs.lawDisabilityCause === 'Accident' && <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.lawAccidentYear')}</label><input type="number" required onChange={e => handleInputChange('lawAccidentYear', e.target.value)} value={inputs.lawAccidentYear || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.lawAccidentYear')} /></div>}
                  {inputs.lawDisabilityCause === 'Other' && <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.lawOtherCauseDetails')}</label><input type="text" required onChange={e => handleInputChange('lawOtherCauseDetails', e.target.value)} value={inputs.lawOtherCauseDetails || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.lawOtherCauseDetails')} /></div>}
                  <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.lawVocationalOrEducation')}</label><input type="text" required onChange={e => handleInputChange('lawVocationalOrEducation', e.target.value)} value={inputs.lawVocationalOrEducation || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.lawVocationalOrEducation')} /></div>
                </div>
              )}
              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.familyDetails')}</h4>
                  <p className="text-xs font-extrabold text-user-text">{t('disabled.tableA')}</p>
                  {disabledMembers.map((member, idx) => (
                    <div key={`law-disabled-${idx}`} className="bg-user-surface p-4 rounded-xl border border-user-border space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" required placeholder={t('disabled.fullName')} value={member.name} onChange={e => { const u=[...disabledMembers]; u[idx].name=e.target.value; setDisabledMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder={t('disabled.relationship')} value={member.relation} onChange={e => { const u=[...disabledMembers]; u[idx].relation=e.target.value; setDisabledMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <select required value={member.gender} onChange={e => { const u=[...disabledMembers]; u[idx].gender=e.target.value; setDisabledMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm"><option value="">{t('disabled.gender')}</option><option>{t('forms.selectOptions.male')}</option><option>{t('forms.selectOptions.female')}</option></select>
                        <select required value={member.civilStatus} onChange={e => { const u=[...disabledMembers]; u[idx].civilStatus=e.target.value; setDisabledMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm"><option value="">{t('disabled.status')}</option><option>{t('forms.selectOptions.unmarried')}</option><option>{t('forms.selectOptions.married')}</option></select>
                        <input type="date" required value={member.dob} onChange={e => { const u=[...disabledMembers]; u[idx].dob=e.target.value; setDisabledMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" required placeholder={t('disabled.nic')} value={member.nic} onChange={e => { const u=[...disabledMembers]; u[idx].nic=e.target.value; setDisabledMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder={t('disabled.disabilityType')} value={member.nature} onChange={e => { const u=[...disabledMembers]; u[idx].nature=e.target.value; setDisabledMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setDisabledMembers([...disabledMembers, { name:'',relation:'',gender:'',civilStatus:'',dob:'',nic:'',nature:'' }])} className="self-start px-4 py-2 rounded-lg border border-user-secondary text-user-secondary bg-user-surface cursor-pointer text-xs font-bold">+ {t('common.addRow')}</button>
                  <p className="text-xs font-extrabold text-user-text pt-2">{t('disabled.tableB')}</p>
                  {otherMembers.map((member, idx) => (
                    <div key={`law-other-${idx}`} className="bg-user-surface p-4 rounded-xl border border-user-border space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" required placeholder={t('disabled.fullName')} value={member.name} onChange={e => { const u=[...otherMembers]; u[idx].name=e.target.value; setOtherMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder={t('disabled.relationship')} value={member.relation} onChange={e => { const u=[...otherMembers]; u[idx].relation=e.target.value; setOtherMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <select required value={member.gender} onChange={e => { const u=[...otherMembers]; u[idx].gender=e.target.value; setOtherMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm"><option value="">{t('disabled.gender')}</option><option>{t('forms.selectOptions.male')}</option><option>{t('forms.selectOptions.female')}</option></select>
                        <select required value={member.civilStatus} onChange={e => { const u=[...otherMembers]; u[idx].civilStatus=e.target.value; setOtherMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm"><option value="">{t('disabled.status')}</option><option>{t('forms.selectOptions.unmarried')}</option><option>{t('forms.selectOptions.married')}</option></select>
                        <input type="date" required value={member.dob} onChange={e => { const u=[...otherMembers]; u[idx].dob=e.target.value; setOtherMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" required placeholder={t('disabled.nic')} value={member.nic} onChange={e => { const u=[...otherMembers]; u[idx].nic=e.target.value; setOtherMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" placeholder={t('disabled.incomeSource')} value={member.incomeSourceAmt} onChange={e => { const u=[...otherMembers]; u[idx].incomeSourceAmt=e.target.value; setOtherMembers(u); }} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setOtherMembers([...otherMembers, { name:'',relation:'',gender:'',civilStatus:'',dob:'',nic:'',incomeSourceAmt:'' }])} className="self-start px-4 py-2 rounded-lg border border-user-secondary text-user-secondary bg-user-surface cursor-pointer text-xs font-bold">+ {t('common.addRow')}</button>
                </div>
              )}
              {formStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.bankAssistance')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" required onChange={e => handleInputChange('lawBankAccountNo', e.target.value)} value={inputs.lawBankAccountNo || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.lawBankAccountNo')} />
                    <input type="text" required onChange={e => handleInputChange('lawBankNameBranch', e.target.value)} value={inputs.lawBankNameBranch || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.lawBankNameBranch')} />
                  </div>
                </div>
              )}
              {formStep === 4 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.uploadCertification')}</h4>
                  <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2">
                    <span className="text-xs font-extrabold text-user-secondary">{t('disabled.medicalCert')}</span>
                    <input type="file" className="text-sm" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              MODULE F: VOTER REGISTRATION (FORM ID: 7)
             ========================================== */}
          {form.id === 7 && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.boundariesRegion')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.voterElectoralDistrict')}</label><input type="text" required onChange={e => handleInputChange('voterElectoralDistrict', e.target.value)} value={inputs.voterElectoralDistrict || userData?.district || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.voterElectoralDistrict')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.voterPollingDivision')}</label><input type="text" required onChange={e => handleInputChange('voterPollingDivision', e.target.value)} value={inputs.voterPollingDivision || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.voterPollingDivision')} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.voterPollingDistrictNo')}</label><input type="text" required onChange={e => handleInputChange('voterPollingDistrictNo', e.target.value)} value={inputs.voterPollingDistrictNo || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.voterPollingDistrictNo')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.voterGnDivision')}</label><input type="text" required onChange={e => handleInputChange('voterGnDivision', e.target.value)} value={inputs.voterGnDivision || userData?.gnDiv || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.voterGnDivision')} /></div>
                  </div>
                  <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.voterVillageStreet')}</label><input type="text" required onChange={e => handleInputChange('voterVillageStreet', e.target.value)} value={inputs.voterVillageStreet || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.voterVillageStreet')} /></div>
                  <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.voterHouseholdNo')}</label><input type="text" required onChange={e => handleInputChange('voterHouseholdNo', e.target.value)} value={inputs.voterHouseholdNo || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.voterHouseholdNo')} /></div>
                  <div className="bg-user-surface border border-user-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <span className="block text-sm font-extrabold text-user-secondary">{t('voter.checkRegister')}</span>
                      <span className="text-[11px] text-user-text-lighter">{t('voter.crossVerify')}</span>
                    </div>
                    <a href="https://ec.lk/vrd" target="_blank" rel="noreferrer" className="bg-user-secondary text-white px-4 py-2 rounded-lg text-xs font-bold no-underline">ec.lk/vrd</a>
                  </div>
                </div>
              )}
              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.purposeRegistration')}</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <button type="button" onClick={() => setVoterPurpose('OptionA')} className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${voterPurpose==='OptionA'?'border-2 border-user-secondary bg-user-primary-light':'border border-user-border bg-user-surface'} font-bold text-xs`}>
                      <div className="text-user-secondary font-extrabold mb-0.5">{t('voter.optionA')}</div>
                      {t('voter.optionADesc')}
                    </button>
                    <button type="button" onClick={() => setVoterPurpose('OptionB')} className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${voterPurpose==='OptionB'?'border-2 border-user-secondary bg-user-primary-light':'border border-user-border bg-user-surface'} font-bold text-xs`}>
                      <div className="text-user-secondary font-extrabold mb-0.5">{t('voter.optionB')}</div>
                      {t('voter.optionBDesc')}
                    </button>
                  </div>
                  {voterPurpose === 'OptionA' && (
                    <div className="border-t-2 border-dashed border-user-border pt-4 space-y-4">
                      <span className="text-xs font-extrabold text-user-secondary">{t('voter.ycForm')}</span>
                      <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.ycFullName')}</label><input type="text" required onChange={e => handleInputChange('ycFullName', e.target.value)} value={inputs.ycFullName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.ycFullName')} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.ycNicNo')}</label><input type="text" required onChange={e => handleInputChange('ycNicNo', e.target.value)} value={inputs.ycNicNo || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.ycNicNo')} /></div>
                        <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.ycDob')}</label><input type="date" required min="2008-02-01" max="2010-01-31" onChange={e => handleInputChange('ycDob', e.target.value)} value={inputs.ycDob || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" /></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.ycGender')}</label><select required onChange={e => handleInputChange('ycGender', e.target.value)} value={inputs.ycGender || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm"><option value="">-- {t('common.select')} --</option><option>{t('forms.selectOptions.male')}</option><option>{t('forms.selectOptions.female')}</option></select></div>
                        <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.ycCivilStatus')}</label><select required onChange={e => handleInputChange('ycCivilStatus', e.target.value)} value={inputs.ycCivilStatus || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm"><option value="">-- {t('common.select')} --</option><option>{t('forms.selectOptions.unmarried')}</option><option>{t('forms.selectOptions.married')}</option></select></div>
                        <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.ycRelationToChief')}</label><input type="text" required onChange={e => handleInputChange('ycRelationToChief', e.target.value)} value={inputs.ycRelationToChief || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.ycRelationToChief')} /></div>
                      </div>
                    </div>
                  )}
                  {voterPurpose === 'OptionB' && (
                    <div className="border-t-2 border-dashed border-user-border pt-4 space-y-4">
                      <span className="text-xs font-extrabold text-user-secondary">{t('voter.erForm')}</span>
                      <div className="border border-user-border p-4 rounded-xl bg-user-surface">
                        <span className="text-[11px] font-extrabold text-user-secondary block mb-2">{t('voter.newlyAdded')}</span>
                        {newVoters.map((voter, idx) => (
                          <div key={`newvoter-${idx}`} className="border-b border-user-border-lighter last:border-0 pb-3 mb-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input type="text" placeholder={t('voter.fullName')} value={voter.name} onChange={e => { const u=[...newVoters]; u[idx].name=e.target.value; setNewVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" />
                              <input type="text" placeholder={t('voter.relationship')} value={voter.relation} onChange={e => { const u=[...newVoters]; u[idx].relation=e.target.value; setNewVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input type="text" placeholder={t('voter.nic')} value={voter.nic} onChange={e => { const u=[...newVoters]; u[idx].nic=e.target.value; setNewVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" />
                              <input type="date" value={voter.dob} onChange={e => { const u=[...newVoters]; u[idx].dob=e.target.value; setNewVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" />
                              <select value={voter.gender} onChange={e => { const u=[...newVoters]; u[idx].gender=e.target.value; setNewVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs"><option value="">{t('voter.gender')}</option><option>{t('forms.selectOptions.male')}</option><option>{t('forms.selectOptions.female')}</option></select>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => setNewVoters([...newVoters, { name:'',nic:'',dob:'',gender:'',relation:'',prevAddress:'',prevDistrict:'',prevYear:'' }])} className="px-3 py-1.5 rounded-lg border border-user-secondary text-user-secondary bg-user-surface cursor-pointer text-[10px] font-bold">+ {t('common.addRow')}</button>
                      </div>
                      <div className="border border-user-border p-4 rounded-xl bg-user-surface">
                        <span className="text-[11px] font-extrabold text-user-secondary block mb-2">{t('voter.deleted')}</span>
                        {deletedVoters.map((voter, idx) => (
                          <div key={`delvoter-${idx}`} className="border-b border-user-border-lighter last:border-0 pb-3 mb-3 space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <input type="text" placeholder={t('voter.fullName')} value={voter.name} onChange={e => { const u=[...deletedVoters]; u[idx].name=e.target.value; setDeletedVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" />
                              <input type="text" placeholder={t('voter.nic')} value={voter.nic} onChange={e => { const u=[...deletedVoters]; u[idx].nic=e.target.value; setDeletedVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" />
                              <select value={voter.reason} onChange={e => { const u=[...deletedVoters]; u[idx].reason=e.target.value; setDeletedVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs"><option value="">{t('voter.reason')}</option><option value="Deceased">{t('forms.selectOptions.deceased')}</option><option value="Moved Away">{t('forms.selectOptions.movedAway')}</option><option value="Other">{t('forms.selectOptions.other')}</option></select>
                            </div>
                            {voter.reason === 'Deceased' && <div className="bg-red-50 p-2 rounded-lg"><label className="block text-[10px] font-bold text-red-600 mb-1">{t('voter.deathDate')}</label><input type="date" value={voter.deathDate} onChange={e => { const u=[...deletedVoters]; u[idx].deathDate=e.target.value; setDeletedVoters(u); }} className="p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" /></div>}
                            {voter.reason === 'Moved Away' && <div className="grid grid-cols-2 gap-2 bg-blue-50 p-2 rounded-lg"><div><label className="block text-[10px] font-bold text-blue-700 mb-0.5">{t('voter.newAddress')}</label><input type="text" value={voter.newAddress} onChange={e => { const u=[...deletedVoters]; u[idx].newAddress=e.target.value; setDeletedVoters(u); }} className="w-full p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" /></div><div><label className="block text-[10px] font-bold text-blue-700 mb-0.5">{t('voter.newPhone')}</label><input type="text" value={voter.newPhone} onChange={e => { const u=[...deletedVoters]; u[idx].newPhone=e.target.value; setDeletedVoters(u); }} className="w-full p-2 rounded-lg border border-user-border bg-user-surface outline-none text-xs" /></div></div>}
                          </div>
                        ))}
                        <button type="button" onClick={() => setDeletedVoters([...deletedVoters, { name:'',nic:'',reason:'',deathDate:'',newAddress:'',newPhone:'' }])} className="px-3 py-1.5 rounded-lg border border-user-secondary text-user-secondary bg-user-surface cursor-pointer text-[10px] font-bold">+ {t('common.addRow')}</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {formStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.chiefDeclaration')}</h4>
                  <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.voterChiefName')}</label><input type="text" required onChange={e => handleInputChange('voterChiefName', e.target.value)} value={inputs.voterChiefName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.voterChiefName')} /></div>
                  <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.voterChiefNic')}</label><input type="text" required onChange={e => handleInputChange('voterChiefNic', e.target.value)} value={inputs.voterChiefNic || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.voterChiefNic')} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.voterChiefPhone')}</label><input type="text" required onChange={e => handleInputChange('voterChiefPhone', e.target.value)} value={inputs.voterChiefPhone || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.voterChiefPhone')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.voterChiefWhatsApp')}</label><input type="text" required onChange={e => handleInputChange('voterChiefWhatsApp', e.target.value)} value={inputs.voterChiefWhatsApp || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.voterChiefWhatsApp')} /></div>
                  </div>
                  <div className="flex items-start gap-2.5 bg-user-secondary-light p-3 rounded-xl">
                    <input type="checkbox" required className="accent-user-secondary mt-0.5" />
                    <span className="text-[11px] text-user-text font-semibold leading-tight">{t('voter.legalAcknowledgment')}</span>
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
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.applicantMeta')}</h4>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-2">{t('forms.fields.treeApplicantStatus')}</label>
                    <div className="flex gap-6 text-sm font-bold">
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="tfStatusRadio" checked={inputs.treeApplicantStatus==='Land Owner'} onChange={() => handleInputChange('treeApplicantStatus','Land Owner')} className="accent-user-secondary" /> {t('forms.selectOptions.landOwner')}</label>
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="tfStatusRadio" checked={inputs.treeApplicantStatus==='Authorized Representative'} onChange={() => handleInputChange('treeApplicantStatus','Authorized Representative')} className="accent-user-secondary" /> {t('forms.selectOptions.authorizedRep')}</label>
                    </div>
                  </div>
                  <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.treeFullName')}</label><input type="text" required onChange={e => handleInputChange('treeFullName', e.target.value)} value={inputs.treeFullName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.treeFullName')} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.treeNic')}</label><input type="text" required onChange={e => handleInputChange('treeNic', e.target.value)} value={inputs.treeNic || ''} className={`w-full p-3 rounded-xl border ${errors.treeNic?'border-red-500':'border-user-border'} bg-user-surface outline-none text-sm`} placeholder={t('forms.fields.treeNic')} />{errors.treeNic && <span className="text-red-500 text-[11px] font-bold mt-1 block">{errors.treeNic}</span>}</div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.treePhone')}</label><input type="text" required onChange={e => handleInputChange('treePhone', e.target.value)} value={inputs.treePhone || ''} className={`w-full p-3 rounded-xl border ${errors.treePhone?'border-red-500':'border-user-border'} bg-user-surface outline-none text-sm`} placeholder={t('forms.fields.treePhone')} />{errors.treePhone && <span className="text-red-500 text-[11px] font-bold mt-1 block">{errors.treePhone}</span>}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.treePermanentAddress')}</label><input type="text" required onChange={e => handleInputChange('treePermanentAddress', e.target.value)} value={inputs.treePermanentAddress || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.treePermanentAddress')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.treeWhatsApp')}</label><input type="text" onChange={e => handleInputChange('treeWhatsApp', e.target.value)} value={inputs.treeWhatsApp || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.treeWhatsApp')} /></div>
                  </div>
                </div>
              )}
              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.propertyLocation')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.treeLandName')}</label><input type="text" required onChange={e => handleInputChange('treeLandName', e.target.value)} value={inputs.treeLandName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.treeLandName')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.treeDistrict')}</label><input type="text" required onChange={e => handleInputChange('treeDistrict', e.target.value)} value={inputs.treeDistrict || userData?.district || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.treeDistrict')} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.treeDsDivision')}</label><input type="text" required onChange={e => handleInputChange('treeDsDivision', e.target.value)} value={inputs.treeDsDivision || userData?.dsDiv || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.treeDsDivision')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.treeGnDivision')}</label><input type="text" required onChange={e => handleInputChange('treeGnDivision', e.target.value)} value={inputs.treeGnDivision || userData?.gnDiv || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.treeGnDivision')} /></div>
                  </div>
                  <div className="bg-user-surface p-4 rounded-xl border border-user-border">
                    <span className="block text-[11px] font-extrabold text-user-secondary uppercase mb-2">{t('tree.landExtent')}</span>
                    <div className="grid grid-cols-3 gap-3">
                      <input type="number" placeholder={t('forms.fields.treeLandAcres')} onChange={e => handleInputChange('treeLandAcres', e.target.value)} value={inputs.treeLandAcres || ''} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      <input type="number" placeholder={t('forms.fields.treeLandRoods')} onChange={e => handleInputChange('treeLandRoods', e.target.value)} value={inputs.treeLandRoods || ''} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      <input type="number" placeholder={t('forms.fields.treeLandPerches')} onChange={e => handleInputChange('treeLandPerches', e.target.value)} value={inputs.treeLandPerches || ''} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.treeOwnershipType')}</label>
                      <select required onChange={e => handleInputChange('treeOwnershipType', e.target.value)} value={inputs.treeOwnershipType || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- {t('common.select')} --</option>
                        <option value="Private">{t('forms.selectOptions.private')}</option>
                        <option value="Government / State">{t('forms.selectOptions.government')}</option>
                        <option value="LDO Lease / Permit Land">{t('tree.ldoLease')}</option>
                        <option value="Temple Property / Viharagam">{t('forms.selectOptions.temple')}</option>
                        <option value="Other Tenure Matrix">{t('forms.selectOptions.other')}</option>
                      </select>
                    </div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.treeDeedNoDate')}</label><input type="text" required onChange={e => handleInputChange('treeDeedNoDate', e.target.value)} value={inputs.treeDeedNoDate || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.treeDeedNoDate')} /></div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.treeLegalDisputesExist')}</label>
                    <select required onChange={e => handleInputChange('treeLegalDisputesExist', e.target.value)} value={inputs.treeLegalDisputesExist || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                      <option value="">-- {t('common.select')} --</option>
                      <option value="No">{t('forms.selectOptions.no')}</option>
                      <option value="Yes">{t('forms.selectOptions.yes')}</option>
                    </select>
                  </div>
                </div>
              )}
              {formStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.spatialBoundaries')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.treeBoundNorth')}</label><input type="text" required onChange={e => handleInputChange('treeBoundNorth', e.target.value)} value={inputs.treeBoundNorth || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.treeBoundNorth')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.treeBoundEast')}</label><input type="text" required onChange={e => handleInputChange('treeBoundEast', e.target.value)} value={inputs.treeBoundEast || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.treeBoundEast')} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.treeBoundSouth')}</label><input type="text" required onChange={e => handleInputChange('treeBoundSouth', e.target.value)} value={inputs.treeBoundSouth || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.treeBoundSouth')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.treeBoundWest')}</label><input type="text" required onChange={e => handleInputChange('treeBoundWest', e.target.value)} value={inputs.treeBoundWest || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.treeBoundWest')} /></div>
                  </div>
                </div>
              )}
              {formStep === 4 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-user-border pb-2">
                    <span className="text-sm font-black text-user-secondary">{t('forms.modal.treeLogisticsMatrix')}</span>
                    <button type="button" onClick={() => setTreeLogistics([...treeLogistics, { species:'',girth:'',height:'',middleGirth:'',reason:'',proximityDanger:'No' }])} className="px-3 py-1.5 rounded-lg border border-user-secondary text-user-secondary bg-user-surface cursor-pointer text-xs font-bold">+ {t('common.addRow')}</button>
                  </div>
                  {treeLogistics.map((tree, idx) => (
                    <div key={`tree-row-${idx}`} className="bg-user-surface p-4 rounded-xl border border-user-border space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <input type="text" required placeholder={t('tree.species')} value={tree.species} onChange={e => handleTreeRowChange(idx,'species',e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder={t('tree.girth')} value={tree.girth} onChange={e => handleTreeRowChange(idx,'girth',e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder={t('tree.height')} value={tree.height} onChange={e => handleTreeRowChange(idx,'height',e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" required placeholder={t('tree.middleGirth')} value={tree.middleGirth} onChange={e => handleTreeRowChange(idx,'middleGirth',e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder={t('tree.reason')} value={tree.reason} onChange={e => handleTreeRowChange(idx,'reason',e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                      <label className="flex items-center gap-2 text-xs font-bold text-user-secondary cursor-pointer">
                        <input type="checkbox" checked={tree.proximityDanger==='Yes'} onChange={e => handleTreeRowChange(idx,'proximityDanger',e.target.checked?'Yes':'No')} className="accent-user-secondary" />
                        {t('tree.proximityDanger')}
                      </label>
                      {treeLogistics.length > 1 && <button type="button" onClick={() => handleRemoveRow('treeMatrix',idx)} className="border-none bg-none text-red-500 font-bold text-xs cursor-pointer">{t('common.remove')}</button>}
                    </div>
                  ))}
                </div>
              )}
              {formStep === 5 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.documentAudits')}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2"><span className="text-xs font-extrabold">{t('tree.deedCopy')}</span><input type="file" className="text-sm" /></div>
                    <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2"><span className="text-xs font-extrabold">{t('tree.surveyPlan')}</span><input type="file" className="text-sm" /></div>
                  </div>
                  <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2"><span className="text-xs font-extrabold">{t('tree.photoEvidence')}</span><input type="file" className="text-sm" /></div>
                  <div className="flex items-start gap-2.5 bg-user-secondary-light p-3 rounded-xl">
                    <input type="checkbox" required defaultChecked className="accent-user-secondary mt-0.5" />
                    <span className="text-[11px] text-user-text font-semibold leading-tight">{t('tree.declaration')}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              MODULE I: TIMBER TRANSPORTATION (FORM ID: 9)
             ========================================== */}
          {form.id === 9 && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.requestInformation')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.removalGnDiv')}</label><input type="text" required onChange={e => handleInputChange('removalGnDiv', e.target.value)} value={inputs.removalGnDiv || userData?.gnDiv || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.removalGnDiv')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.removalDsOffice')}</label><input type="text" required onChange={e => handleInputChange('removalDsOffice', e.target.value)} value={inputs.removalDsOffice || userData?.dsDiv || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.removalDsOffice')} /></div>
                  </div>
                  <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.voterChiefName')}</label><input type="text" required onChange={e => handleInputChange('voterChiefName', e.target.value)} value={inputs.voterChiefName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.voterChiefName')} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.voterChiefNic')}</label><input type="text" required onChange={e => handleInputChange('voterChiefNic', e.target.value)} value={inputs.voterChiefNic || ''} className={`w-full p-3 rounded-xl border ${errors.voterChiefNic?'border-red-500':'border-user-border'} bg-user-surface outline-none text-sm`} placeholder={t('forms.fields.voterChiefNic')} />{errors.voterChiefNic && <span className="text-red-500 text-[11px] font-bold mt-1 block">{errors.voterChiefNic}</span>}</div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.voterChiefPhone')}</label><input type="text" required onChange={e => handleInputChange('voterChiefPhone', e.target.value)} value={inputs.voterChiefPhone || ''} className={`w-full p-3 rounded-xl border ${errors.voterChiefPhone?'border-red-500':'border-user-border'} bg-user-surface outline-none text-sm`} placeholder={t('forms.fields.voterChiefPhone')} />{errors.voterChiefPhone && <span className="text-red-500 text-[11px] font-bold mt-1 block">{errors.voterChiefPhone}</span>}</div>
                  </div>
                  <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.removalLandownerName')}</label><input type="text" onChange={e => handleInputChange('removalLandownerName', e.target.value)} value={inputs.removalLandownerName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.removalLandownerName')} /></div>
                  <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.treeCuttingReason')}</label><textarea rows={2} required onChange={e => handleInputChange('treeCuttingReason', e.target.value)} value={inputs.treeCuttingReason || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none resize-none text-sm" placeholder={t('forms.fields.treeCuttingReason')} /></div>
                </div>
              )}
              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.propertyProfile')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.removalLandName')}</label><input type="text" required onChange={e => handleInputChange('removalLandName', e.target.value)} value={inputs.removalLandName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.removalLandName')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.removalVillageLocalArea')}</label><input type="text" required onChange={e => handleInputChange('removalVillageLocalArea', e.target.value)} value={inputs.removalVillageLocalArea || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.removalVillageLocalArea')} /></div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary mb-2">{t('forms.fields.removalOwnershipType')}</label>
                    <div className="grid grid-cols-2 gap-2 text-sm font-bold">
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="remOwnershipRadio" checked={inputs.removalOwnershipType==='Government Land'} onChange={() => handleInputChange('removalOwnershipType','Government Land')} className="accent-user-secondary" /> {t('forms.selectOptions.government')}</label>
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="remOwnershipRadio" checked={inputs.removalOwnershipType==='Private Land'} onChange={() => handleInputChange('removalOwnershipType','Private Land')} className="accent-user-secondary" /> {t('forms.selectOptions.private')}</label>
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="remOwnershipRadio" checked={inputs.removalOwnershipType==='Traditional Ownership'} onChange={() => handleInputChange('removalOwnershipType','Traditional Ownership')} className="accent-user-secondary" /> {t('forms.selectOptions.traditional')}</label>
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="remOwnershipRadio" checked={inputs.removalOwnershipType==='Other'} onChange={() => handleInputChange('removalOwnershipType','Other')} className="accent-user-secondary" /> {t('forms.selectOptions.other')}</label>
                    </div>
                  </div>
                  <div className="border border-user-border rounded-xl p-4 bg-user-surface">
                    <span className="block text-[11px] font-extrabold text-user-secondary uppercase mb-2">{t('valuation.fourBoundaries')}</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder={t('forms.fields.remBoundNorth')} required onChange={e => handleInputChange('remBoundNorth', e.target.value)} value={inputs.remBoundNorth || ''} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      <input type="text" placeholder={t('forms.fields.remBoundEast')} required onChange={e => handleInputChange('remBoundEast', e.target.value)} value={inputs.remBoundEast || ''} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      <input type="text" placeholder={t('forms.fields.remBoundSouth')} required onChange={e => handleInputChange('remBoundSouth', e.target.value)} value={inputs.remBoundSouth || ''} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      <input type="text" placeholder={t('forms.fields.remBoundWest')} required onChange={e => handleInputChange('remBoundWest', e.target.value)} value={inputs.remBoundWest || ''} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.removalDeedNumber')}</label><input type="text" required onChange={e => handleInputChange('removalDeedNumber', e.target.value)} value={inputs.removalDeedNumber || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.removalDeedNumber')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.removalDeedDate')}</label><input type="date" required onChange={e => handleInputChange('removalDeedDate', e.target.value)} value={inputs.removalDeedDate || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" /></div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-user-secondary mb-1">{t('forms.fields.removalDisputeStatus')}</label>
                    <select required onChange={e => handleInputChange('removalDisputeStatus', e.target.value)} value={inputs.removalDisputeStatus || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                      <option value="">-- {t('common.select')} --</option>
                      <option value="No">{t('forms.selectOptions.no')}</option>
                      <option value="Yes">{t('forms.selectOptions.yes')}</option>
                    </select>
                  </div>
                </div>
              )}
              {formStep === 3 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-user-border pb-2">
                    <span className="text-sm font-black text-user-secondary">{t('forms.modal.timberTableMatrix')}</span>
                    <button type="button" onClick={() => setTimberGrid([...timberGrid, { species:'',girth:'',height:'',woodVol:'',firewoodVol:'',infraImpact:'No' }])} className="px-3 py-1.5 rounded-lg border border-user-secondary text-user-secondary bg-user-surface cursor-pointer text-xs font-bold">+ {t('common.addRow')}</button>
                  </div>
                  {timberGrid.map((row, idx) => (
                    <div key={`timber-row-${idx}`} className="bg-user-surface p-4 rounded-xl border border-user-border space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <input type="text" required placeholder={t('timber.species')} value={row.species} onChange={e => handleTimberGridChange(idx,'species',e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder={t('timber.girth')} value={row.girth} onChange={e => handleTimberGridChange(idx,'girth',e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder={t('timber.height')} value={row.height} onChange={e => handleTimberGridChange(idx,'height',e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <input type="text" required placeholder={t('timber.woodVol')} value={row.woodVol} onChange={e => handleTimberGridChange(idx,'woodVol',e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <input type="text" required placeholder={t('timber.firewoodVol')} value={row.firewoodVol} onChange={e => handleTimberGridChange(idx,'firewoodVol',e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" />
                        <select value={row.infraImpact} onChange={e => handleTimberGridChange(idx,'infraImpact',e.target.value)} className="p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm"><option value="No">{t('timber.noThreat')}</option><option value="Yes">{t('timber.yesDanger')}</option></select>
                      </div>
                      {timberGrid.length > 1 && <button type="button" onClick={() => handleRemoveRow('timberGrid',idx)} className="border-none bg-none text-red-500 font-bold text-xs cursor-pointer">{t('common.remove')}</button>}
                    </div>
                  ))}
                </div>
              )}
              {formStep === 4 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.layoutUploads')}</h4>
                  <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2"><span className="text-xs font-extrabold">{t('timber.sketchMap')}</span><input type="file" className="text-sm" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2"><span className="text-[11px] font-extrabold">{t('timber.deedCopy')}</span><input type="file" className="text-sm" /></div>
                    <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2"><span className="text-[11px] font-extrabold">{t('timber.landPlan')}</span><input type="file" className="text-sm" /></div>
                  </div>
                  <div className="flex items-start gap-2.5 bg-user-secondary-light p-3 rounded-xl">
                    <input type="checkbox" required defaultChecked className="accent-user-secondary mt-0.5" />
                    <span className="text-[11px] text-user-text font-semibold leading-tight">{t('timber.declaration')}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==========================================
              MODULE J: BUSINESS REGISTRATION (FORM ID: 10)
             ========================================== */}
          {form.id === 10 && (
            <>
              {formStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.ownerBusinessMeta')}</h4>
                  <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.biz_prop_name')}</label><input type="text" required onChange={e => handleInputChange('biz_prop_name', e.target.value)} value={inputs.biz_prop_name || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.biz_prop_name')} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.biz_nature_type')}</label>
                      <select required onChange={e => handleInputChange('biz_nature_type', e.target.value)} value={inputs.biz_nature_type || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- {t('common.select')} --</option>
                        <option value="Retail Store">{t('business.retail')}</option>
                        <option value="IT Services">{t('business.it')}</option>
                        <option value="Manufacturing">{t('business.manufacturing')}</option>
                        <option value="Other">{t('forms.selectOptions.other')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.biz_legal_structure')}</label>
                      <select required onChange={e => handleInputChange('biz_legal_structure', e.target.value)} value={inputs.biz_legal_structure || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="Sole Proprietorship">{t('forms.selectOptions.soleProprietorship')}</option>
                        <option value="Partnership">{t('forms.selectOptions.partnership')}</option>
                        <option value="Private Limited Company">{t('forms.selectOptions.privateLimited')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.biz_owner_name')}</label><input type="text" required onChange={e => handleInputChange('biz_owner_name', e.target.value)} value={inputs.biz_owner_name || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.biz_owner_name')} /></div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.biz_owner_nic')}</label><input type="text" required onChange={e => handleInputChange('biz_owner_nic', e.target.value)} value={inputs.biz_owner_nic || ''} className={`w-full p-3 rounded-xl border ${errors.biz_owner_nic?'border-red-500':'border-user-border'} bg-user-surface outline-none text-sm`} placeholder={t('forms.fields.biz_owner_nic')} />{errors.biz_owner_nic && <span className="text-red-500 text-[11px] font-bold mt-1 block">{errors.biz_owner_nic}</span>}</div>
                  </div>
                </div>
              )}
              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.environmentalPremises')}</h4>
                  <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.biz_premises_address')}</label><textarea rows={2} required onChange={e => handleInputChange('biz_premises_address', e.target.value)} value={inputs.biz_premises_address || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none resize-none text-sm" placeholder={t('forms.fields.biz_premises_address')} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.biz_tenure_type')}</label>
                      <select required onChange={e => handleInputChange('biz_tenure_type', e.target.value)} value={inputs.biz_tenure_type || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                        <option value="">-- {t('common.select')} --</option>
                        <option value="Owned by Applicant">{t('business.owned')}</option>
                        <option value="Rented / Leased Premises">{t('business.rented')}</option>
                        <option value="Family-Owned">{t('business.family')}</option>
                      </select>
                    </div>
                    <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.biz_initial_capital')}</label><input type="number" required onChange={e => handleInputChange('biz_initial_capital', e.target.value)} value={inputs.biz_initial_capital || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder="0.00" /></div>
                  </div>
                  <div className="bg-user-surface p-4 rounded-xl border border-user-border space-y-3">
                    <span className="text-[11px] font-extrabold text-user-secondary uppercase">{t('business.environmentalCompliance')}</span>
                    <label className="flex items-center gap-2 text-xs font-bold text-user-text cursor-pointer">
                      <input type="checkbox" required defaultChecked className="accent-user-secondary" />
                      {t('business.complianceCheck')}
                    </label>
                  </div>
                </div>
              )}
              {formStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.legalDeedUploads')}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2"><span className="text-[11px] font-extrabold">{t('business.premisesProof')}</span><input type="file" className="text-sm" /></div>
                    <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2"><span className="text-[11px] font-extrabold">{t('business.ownerIdProof')}</span><input type="file" className="text-sm" /></div>
                  </div>
                  <div className="flex items-start gap-2.5 bg-user-secondary-light p-3 rounded-xl">
                    <input type="checkbox" required defaultChecked className="accent-user-secondary mt-0.5" />
                    <span className="text-[11px] text-user-text font-semibold leading-tight">{t('business.finalDeclaration')}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Form 11: Assessments for Ownership of Lands */}
          {form.id === 11 && (
            <div className="space-y-4">
              <h4 className="text-sm font-black text-user-secondary border-b border-user-border pb-2">{t('forms.modal.landOwnershipAssessment')}</h4>
              <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.assessmentLandName')}</label><input type="text" required onChange={e => handleInputChange('assessmentLandName', e.target.value)} value={inputs.assessmentLandName || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.assessmentLandName')} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.assessmentDsDivision')}</label><input type="text" required onChange={e => handleInputChange('assessmentDsDivision', e.target.value)} value={inputs.assessmentDsDivision || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.assessmentDsDivision')} /></div>
                <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.assessmentGnDivision')}</label><input type="text" required onChange={e => handleInputChange('assessmentGnDivision', e.target.value)} value={inputs.assessmentGnDivision || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.assessmentGnDivision')} /></div>
              </div>
              <div><label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.assessmentCurrentOwner')}</label><input type="text" required onChange={e => handleInputChange('assessmentCurrentOwner', e.target.value)} value={inputs.assessmentCurrentOwner || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm" placeholder={t('forms.fields.assessmentCurrentOwner')} /></div>
              <div>
                <label className="block text-[11px] font-extrabold text-user-secondary uppercase mb-1">{t('forms.fields.assessmentOwnershipType')}</label>
                <select required onChange={e => handleInputChange('assessmentOwnershipType', e.target.value)} value={inputs.assessmentOwnershipType || ''} className="w-full p-3 rounded-xl border border-user-border bg-user-surface outline-none text-sm">
                  <option value="">-- {t('common.select')} --</option>
                  <option value="Deeded Land">{t('forms.selectOptions.deeded')}</option>
                  <option value="Leased Land">{t('forms.selectOptions.leased')}</option>
                  <option value="Traditional Ownership">{t('forms.selectOptions.traditional')}</option>
                </select>
              </div>
              <div className="bg-user-surface border-2 border-dashed border-user-secondary rounded-xl p-4 space-y-2"><span className="text-xs font-extrabold">{t('assessment.supportingDocs')}</span><input type="file" className="text-sm" /></div>
            </div>
          )}

          {/* ---- Action Buttons ---- */}
          <div className="flex justify-between mt-4 pt-2 border-t border-user-border">
            <button
              type="button"
              onClick={() => { if (formStep === 1) onClose(); else setFormStep(prev => prev - 1); }}
              className="px-6 py-2.5 rounded-full border border-user-border bg-user-surface font-bold text-user-text-lighter cursor-pointer hover:bg-user-secondary-light"
            >
              {t('forms.buttons.back')}
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
                  {t('forms.buttons.generatingPDF')}
                </>
              ) : isLastStep ? (
                <>
                  <Icon d={IC.download} size={16} color="#fff" sw={2.5} />
                  {t('forms.buttons.downloadPDF')}
                </>
              ) : t('forms.buttons.next')}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

// ============================================================
// MAIN FORMS COMPONENT
// ============================================================
const Forms = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  // No local currentLanguage – use i18n.language directly
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState('All');
  const [selectedForm, setSelectedForm] = useState(null);
  const [formInputs, setFormInputs] = useState({});
  const [toast, setToast] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const catTabs = ['All', 'Certificates', 'Applications', 'Recommendations'];

  // Build form list with translated titles and descriptions
  const formList = [
    { id: 1, title: t('forms.formList.0.title'), desc: t('forms.formList.0.desc'), cat: "Certificates", imgSrc: "/icons/residence.png" },
    { id: 2, title: t('forms.formList.1.title'), desc: t('forms.formList.1.desc'), cat: "Certificates", imgSrc: "/icons/character.png" },
    { id: 3, title: t('forms.formList.2.title'), desc: t('forms.formList.2.desc'), cat: "Certificates", imgSrc: "/icons/income.png" },
    { id: 4, title: t('forms.formList.3.title'), desc: t('forms.formList.3.desc'), cat: "Certificates", imgSrc: "/icons/valuation.png" },
    { id: 5, title: t('forms.formList.4.title'), desc: t('forms.formList.4.desc'), cat: "Applications", imgSrc: "/icons/id-card.png" },
    { id: 6, title: t('forms.formList.5.title'), desc: t('forms.formList.5.desc'), cat: "Recommendations", imgSrc: "/icons/disabled.png" },
    { id: 7, title: t('forms.formList.6.title'), desc: t('forms.formList.6.desc'), cat: "Applications", imgSrc: "/icons/voter.png" },
    { id: 8, title: t('forms.formList.7.title'), desc: t('forms.formList.7.desc'), cat: "Recommendations", imgSrc: "/icons/tree.png" },
    { id: 9, title: t('forms.formList.8.title'), desc: t('forms.formList.8.desc'), cat: "Recommendations", imgSrc: "/icons/timber.png" },
    { id: 10, title: t('forms.formList.9.title'), desc: t('forms.formList.9.desc'), cat: "Recommendations", imgSrc: "/icons/business.png" },
    { id: 11, title: t('forms.formList.10.title'), desc: t('forms.formList.10.desc'), cat: "Certificates", imgSrc: "/icons/land.png" },
  ];

  // *** UPDATED: generate filled PDF with user data AND all form fields ***
  const downloadBlankForm = async (form) => {
    try {
      // Build default inputs for the form using the helper
      const defaultInputs = getDefaultFormInputs(form, userData, currentUser);
      // Also get the list of field keys for this form
      const fieldKeys = formFieldKeys[form.id] || [];

      await generateFormPDF({
        form,
        inputs: defaultInputs,
        userData,
        currentUser,
        disabledMembers: [],
        otherMembers: [],
        newVoters: [],
        deletedVoters: [],
        treeLogistics: [],
        timberGrid: [],
        t,
        fieldKeys: fieldKeys, // this ensures all fields are shown, even if empty
      });
      showToast(`${form.title} — ${t('toast.downloadSuccess')}`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert(t('validation.pdfError'));
    }
  };

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
  const chipName = userData?.username || userData?.fullName || currentUser?.email?.split('@')[0] || 'User';

  // Language handling – directly call i18n
  const handleLanguageChange = (langCode) => {
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
              currentLanguage={i18n.language}
              onLanguageChange={handleLanguageChange}
              showProfileMenu={showProfileMenu}
              setShowProfileMenu={setShowProfileMenu}
              handleLogout={handleLogout}
              t={t}
            />
          )}
          <MobileTopbar 
            chipName={chipName} 
            onMenuClick={() => setMobileMenuOpen(true)} 
            navigate={navigate} 
            currentLanguage={i18n.language}
            onLanguageChange={handleLanguageChange} 
            t={t} 
          />

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
              <h1 className="text-2xl md:text-3xl font-black text-user-text tracking-tight mb-1">{t('forms.pageTitle')}</h1>
              <p className="text-sm pb-5 font-semibold text-user-text-lighter">{t('forms.pageSubtitle')}</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-start gap-3">
              <Icon d={IC.edit} size={18} color="#B46A02" />
              <div>
                <div className="text-sm font-bold text-amber-800">{t('forms.fillableTitle')}</div>
                <div className="text-xs text-amber-700 mt-0.5">{t('forms.fillableText')}</div>
              </div>
            </div>

            <div className="flex gap-2 mb-5 border-b-2 border-user-border dark:border-user-border overflow-x-auto whitespace-nowrap scrollbar-hide md:flex-wrap">
              {catTabs.map(cat => (
                <button
                  key={cat}
                  onClick={() => setTab(cat)}
                  className={`py-2.5 px-5 border-none bg-transparent text-sm font-semibold cursor-pointer transition-all flex-shrink-0 ${
                    tab === cat ? 'text-user-primary font-extrabold border-b-2 border-user-primary' : 'text-user-text-lighter hover:text-user-text'
                  }`}
                >
                  {t(`forms.tabs.${cat.toLowerCase()}`)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 pb-5">
              {formList.filter(f => tab === 'All' || f.cat === tab).map(form => (
                <div key={form.id} className="bg-user-surface dark:bg-user-surface border border-user-border dark:border-user-border rounded-xl p-5 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-user-secondary-light dark:bg-user-secondary-light rounded-xl flex items-center justify-center flex-shrink-0">
                      <img src={form.imgSrc} alt={form.title} className="w-10 h-10 object-contain" onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML=`<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#B46A02" stroke-width="1.8"><path d="${IC.forms}"/></svg>`; }} />
                    </div>
                    <div>
                      <div className="text-base font-extrabold text-user-text dark:text-user-text">{form.title}</div>
                      <div className="text-xs font-semibold text-user-text-lighter dark:text-user-text-lighter">{form.desc}</div>
                      <span className="text-[10px] font-bold bg-user-secondary-light text-user-secondary px-2 py-0.5 rounded-full mt-1 inline-block">{form.cat}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setSelectedForm(form); setFormInputs({}); }}
                      className="flex items-center gap-2 py-2 px-5 rounded-lg border border-user-border dark:border-user-border bg-user-surface dark:bg-user-surface text-sm font-extrabold text-user-text dark:text-user-text cursor-pointer transition-all hover:border-user-primary hover:bg-user-background"
                    >
                      <Icon d={IC.edit} size={14} color="#B46A02" />
                      {t('forms.buttons.fillForm')}
                    </button>
                    <button
                      onClick={() => downloadBlankForm(form)}
                      className="flex items-center gap-2 py-2 px-5 rounded-lg border border-user-border dark:border-user-border bg-user-surface dark:bg-user-surface text-sm font-extrabold text-user-text dark:text-user-text cursor-pointer transition-all hover:border-user-primary hover:bg-user-background"
                      title={t('forms.buttons.downloadForm')}
                    >
                      <Icon d={IC.download} size={14} color="#B46A02" />
                      {t('forms.buttons.downloadForm')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-[#6A2301] text-white text-center py-3 px-4 text-sm font-semibold">
        © 2026 Smart Grama Sewa. All rights reserved.
      </footer>

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[1100] animate-slide-up">
          <div className={`flex items-center gap-4 py-3 px-6 rounded-xl shadow-lg ${toast.type === 'success' ? 'bg-user-success' : 'bg-user-error'} text-white`}>
            <Icon d={toast.type === 'success' ? IC.check : IC.alertTriangle} size={18} color="#fff" sw={2.5} />
            <span className="text-sm font-semibold">{toast.message}</span>
            <button onClick={() => setToast(null)} className="bg-none border-none cursor-pointer text-white text-xl leading-5 p-0">×</button>
          </div>
        </div>
      )}

      <DynamicFormModal
        form={selectedForm}
        onClose={() => setSelectedForm(null)}
        inputs={formInputs}
        setInputs={setFormInputs}
        currentUser={currentUser}
        userData={userData}
        onSuccess={showToast}
        t={t}
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
    </div>
  );
};

export default Forms;