// modules/forms/Forms.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { PageLoadingSkeleton } from '../components/skeleton';
import LanguageSwitcher from '../components/languageSwitcher';
import NotificationBell from '../components/NotificationBell';

// Import all form components
import ResidenceCertificate from './ResidenceCertificate';
import CharacterCertificate from './CharacterCertificate';
import IncomeCertificate from './IncomeCertificate';
import BirthCertificate from './BirthCertificate';
import MarriageCertificate from './MarriageCertificate';
import DeathCertificate from './DeathCertificate';
import LandCertificate from './LandCertificate';
import BusinessCertificate from './BusinessCertificate';
import PoliceClearance from './PoliceClearance';
import TaxClearance from './TaxClearance';
import IdentityCertificate from './IdentityCertificate';

// Reuse icons and UI helpers from Profile
// (For brevity, we import the same Icon component and IC object)
// In practice, you can move these to a shared file.
import { Icon, IC } from '../components/icons'; // assuming you create a shared icons file

// Reuse NavItem, DesktopTopbar, MobileTopbar, etc. (they are identical to Profile)
// To avoid duplication, better to extract them into shared components.
// For now, we'll copy them here (or import from a common layout file).

// ---------- (copy the NavItem, DesktopTopbar, MobileTopbar, MobileSidebar, DesktopSidebar, SearchResultsDropdown from Profile) ----------
// ... (paste the same components from Profile.jsx, or import from a shared layout file)

// We'll assume you have a shared layout file, but for this example we'll inline them.

// ---------- Forms list component ----------
const FormsList = ({ onFillForm, onDownloadForm, t }) => {
  const forms = [
    { id: 'residence', label: t('form_residence'), desc: t('form_residence_desc') },
    { id: 'character', label: t('form_character'), desc: t('form_character_desc') },
    { id: 'income', label: t('form_income'), desc: t('form_income_desc') },
    { id: 'birth', label: t('form_birth'), desc: t('form_birth_desc') },
    { id: 'marriage', label: t('form_marriage'), desc: t('form_marriage_desc') },
    { id: 'death', label: t('form_death'), desc: t('form_death_desc') },
    { id: 'land', label: t('form_land'), desc: t('form_land_desc') },
    { id: 'business', label: t('form_business'), desc: t('form_business_desc') },
    { id: 'police', label: t('form_police'), desc: t('form_police_desc') },
    { id: 'tax', label: t('form_tax'), desc: t('form_tax_desc') },
    { id: 'identity', label: t('form_identity'), desc: t('form_identity_desc') },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {forms.map((form) => (
        <div key={form.id} className="bg-user-surface border border-user-border rounded-xl p-5 flex flex-col">
          <h3 className="text-lg font-extrabold text-user-text mb-1">{form.label}</h3>
          <p className="text-sm text-user-text-lighter flex-1 mb-4">{form.desc}</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => onFillForm(form.id)}
              className="flex-1 py-2.5 px-4 bg-user-primary rounded-round text-sm font-extrabold text-user-text hover:bg-user-primary-dark transition"
            >
              {t('lbl_fill_form')}
            </button>
            <button
              onClick={() => onDownloadForm(form.id)}
              className="flex-1 py-2.5 px-4 bg-user-secondary rounded-round text-sm font-extrabold text-white hover:bg-user-secondary-dark transition"
            >
              {t('lbl_download_form')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ---------- MAIN Forms component ----------
const Forms = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Same auth & resize effects as Profile
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
            setUserData(snap.data());
          }
        } catch (e) { console.warn(e); }
      } else {
        navigate('/login');
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const handleLanguageChange = (lang) => {
    setCurrentLanguage(lang);
    i18n.changeLanguage(lang);
  };

  // Navigation handlers
  const handleFillForm = (formId) => {
    navigate(`/forms/${formId}`);
  };

  const handleDownloadForm = (formId) => {
    // Placeholder: trigger PDF download or open a new tab
    alert(`Downloading ${formId} form...`);
  };

  const chipName = userData?.username || userData?.fullName || currentUser?.email?.split('@')[0] || 'User';

  if (authLoading) return <PageLoadingSkeleton />;

  return (
    <div className="user-module min-h-screen flex flex-col font-sans bg-user-background">
      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <DesktopSidebar
            navigate={navigate}
            onLogout={handleLogout}
            currentPath={currentPath}
            t={t}
          />
        )}

        {/* Mobile Sidebar Overlay */}
        <MobileSidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          navigate={navigate}
          onLogout={handleLogout}
          currentPath={currentPath}
          t={t}
        />

        {/* MAIN COLUMN */}
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
              userData={userData}
              currentUser={currentUser}
              t={t}
            />
          )}

          {/* Mobile Topbar */}
          <MobileTopbar
            chipName={chipName}
            onMenuClick={() => setMobileMenuOpen(true)}
            navigate={navigate}
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
            t={t}
          />

          {/* Mobile Search Bar (same as Profile) */}
          {/* ... (copy the mobile search bar) ... */}

          {/* CONTENT */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            <Routes>
              <Route
                path="/"
                element={
                  <>
                    <h1 className="text-2xl md:text-3xl font-black text-user-text tracking-tight">
                      {t('lbl_forms')}
                    </h1>
                    <p className="text-sm font-semibold text-user-text-lighter mb-6">
                      {t('lbl_forms_description')}
                    </p>
                    <FormsList
                      onFillForm={handleFillForm}
                      onDownloadForm={handleDownloadForm}
                      t={t}
                    />
                  </>
                }
              />
              <Route path="residence" element={<ResidenceCertificate />} />
              <Route path="character" element={<CharacterCertificate />} />
              <Route path="income" element={<IncomeCertificate />} />
              <Route path="birth" element={<BirthCertificate />} />
              <Route path="marriage" element={<MarriageCertificate />} />
              <Route path="death" element={<DeathCertificate />} />
              <Route path="land" element={<LandCertificate />} />
              <Route path="business" element={<BusinessCertificate />} />
              <Route path="police" element={<PoliceClearance />} />
              <Route path="tax" element={<TaxClearance />} />
              <Route path="identity" element={<IdentityCertificate />} />
            </Routes>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-[#6A2301] text-white text-center py-3 px-4 text-sm font-semibold">
        © 2026 Smart Grama Sewa. All rights reserved.
      </footer>

      <style>{`
        .rounded-round { border-radius: 999px; }
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