import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../user/components/languageSwitcher';
import { PageLoadingSkeleton } from '../user/components/skeleton';
import NotificationBell from '../user/components/NotificationBell';

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

// ============================================================
// NavItem, DesktopSidebar, DesktopTopbar, MobileTopbar, MobileSidebar, SearchResultsDropdown
// (unchanged – same as provided)
// ============================================================
// ... (keep all those components exactly as they were)

// ============================================================
// BLANK PDF GENERATOR (NEW)
// ============================================================
const generateBlankPDF = (form, userData) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' });
  const refNo = `SGS-BLANK-${form.id.toString().padStart(2, '0')}-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${form.title} - Blank Form</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: white; padding: 20px; }
        .print-container { max-width: 1000px; margin: 0 auto; background: white; }
        .header {
          background: linear-gradient(135deg, #6A2301 0%, #B46A02 100%);
          color: white;
          padding: 25px 30px;
          border-radius: 0;
        }
        .header h1 { font-size: 24px; margin-bottom: 5px; }
        .form-banner {
          background: #FFF8EE;
          border-bottom: 3px solid #B46A02;
          padding: 15px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .form-banner h2 { font-size: 18px; color: #6A2301; }
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
        .form-table { margin: 20px 30px; }
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
        table { width: 100%; border-collapse: collapse; }
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
        .placeholder {
          color: #888;
          font-weight: 400;
          border-bottom: 1px solid #ddd;
          display: inline-block;
          min-width: 120px;
          padding: 0 8px;
        }
        @media print {
          body { padding: 0; margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        <div class="header">
          <h1>Smart Grama Sewa</h1>
          <p>Sri Lanka Local Government Services Portal</p>
          <p style="font-size: 11px; margin-top: 5px;">Grama Niladhari Division: ${userData?.gnDiv || '_______________'}</p>
        </div>

        <div class="form-banner">
          <div>
            <h2>${form.title}</h2>
            <p style="font-size: 10px; color: #B46A02; margin-top: 3px;">Form ID: SGS-F${String(form.id).padStart(2, '0')} (BLANK COPY)</p>
          </div>
          <div class="citizen-badge">BLANK FORM</div>
        </div>

        <div class="info-box">
          <div style="font-weight: bold; margin-bottom: 15px; color: #6A2301;">APPLICANT INFORMATION</div>
          <div class="info-grid">
            <div class="info-item"><div class="info-label">Full Name</div><div class="info-value"><span class="placeholder">_____________</span></div></div>
            <div class="info-item"><div class="info-label">NIC Number</div><div class="info-value"><span class="placeholder">_____________</span></div></div>
            <div class="info-item"><div class="info-label">Address</div><div class="info-value"><span class="placeholder">_____________</span></div></div>
            <div class="info-item"><div class="info-label">Contact Number</div><div class="info-value"><span class="placeholder">_____________</span></div></div>
            <div class="info-item"><div class="info-label">Email</div><div class="info-value"><span class="placeholder">_____________</span></div></div>
            <div class="info-item"><div class="info-label">GN Division</div><div class="info-value"><span class="placeholder">_____________</span></div></div>
          </div>
        </div>

        <div class="form-table">
          <div class="section-title">FORM DETAILS</div>
          <table style="border: 1px solid #e8d5b7;">
            <tr style="border-bottom: 1px solid #e8d5b7;">
              <td style="padding: 10px 12px; font-weight: 600; color: #6A2301; background: #fdf6ee; width: 35%; font-size: 12px;">All fields</td>
              <td style="padding: 10px 12px; font-size: 12px; color: #2d1a00;"><span class="placeholder">__________________________________________</span></td>
            </tr>
          </table>
        </div>

        <div class="signatures">
          <div style="flex: 1;">
            <div class="signature-line"></div>
            <div style="font-size: 11px; font-weight: bold; margin-top: 5px;">Applicant's Signature</div>
            <div style="font-size: 10px; color: #888;">_________________</div>
          </div>
          <div style="flex: 1;">
            <div class="signature-line"></div>
            <div style="font-size: 11px; font-weight: bold; margin-top: 5px;">GN Officer's Signature & Stamp</div>
            <div style="font-size: 10px; color: #888;">${userData?.gnDiv || 'GN Office'}</div>
          </div>
        </div>

        <div class="declaration">
          <div style="font-weight: bold; margin-bottom: 5px;">DECLARATION</div>
          <div style="font-size: 10px; line-height: 1.5;">I hereby declare that the information provided in this form is true and accurate to the best of my knowledge. I understand that providing false information is a punishable offence under applicable Sri Lankan law.</div>
        </div>

        <div class="footer">
          <div>© ${now.getFullYear()} Smart Grama Sewa — All Rights Reserved</div>
          <div>Reference: ${refNo}</div>
          <div>Generated: ${dateStr} ${timeStr}</div>
        </div>
      </div>

      <div class="no-print" style="text-align: center; padding: 20px; background: #f0f0f0; margin-top: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #6A2301; color: white; border: none; border-radius: 5px; cursor: pointer;">Save as PDF</button>
        <p style="margin-top: 10px; font-size: 12px;">Click the button above, then choose "Save as PDF" as the destination.</p>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 500);
        }
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(printContent);
  printWindow.document.close();
  return true;
};

// ============================================================
// FILLABLE PDF GENERATOR (existing, unchanged)
// ============================================================
const generateFormPDF = async ({ form, inputs, userData, currentUser, disabledMembers, otherMembers, newVoters, deletedVoters, treeLogistics, timberGrid }) => {
  // ... (keep the existing implementation)
};

// ============================================================
// DYNAMIC FORM MODAL (unchanged)
// ============================================================
const DynamicFormModal = ({ form, onClose, inputs, setInputs, currentUser, userData, onSuccess }) => {
  // ... (keep the existing implementation – it uses generateFormPDF)
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
  const [downloading, setDownloading] = useState(null); // form id being downloaded

  const catTabs = ['All', 'Certificates', 'Applications', 'Recommendations'];

  const formList = [
    { id: 1, title: "Residence Certificate", cat: "Certificates", imgSrc: "/icons/residence.png", desc: "Proof of residence for official use" },
    { id: 2, title: "Character Certificate", cat: "Certificates", imgSrc: "/icons/character.png", desc: "Proof of character for various purposes" },
    { id: 3, title: "Income Certificate", cat: "Certificates", imgSrc: "/icons/income.png", desc: "Proof of income for various purposes" },
    { id: 4, title: "Valuation Certificate", cat: "Certificates", imgSrc: "/icons/valuation.png", desc: "Property valuation for legal needs" },
    { id: 5, title: "Identity Card Application", cat: "Applications", imgSrc: "/icons/id-card.png", desc: "New or replacement NIC application" },
    { id: 6, title: "Living Funds for Disabled Persons", cat: "Recommendations", imgSrc: "/icons/disabled.png", desc: "Financial assistance for persons with disabilities" },
    { id: 7, title: "Voter Registration Form", cat: "Applications", imgSrc: "/icons/voter.png", desc: "Register or revise names on the local voting list" },
    { id: 8, title: "Permit for Felling Trees", cat: "Recommendations", imgSrc: "/icons/tree.png", desc: "Approval to cut down Jack or protected trees" },
    { id: 9, title: "Permit for Timber Transportation", cat: "Recommendations", imgSrc: "/icons/timber.png", desc: "Legal permit to move timber between areas" },
    { id: 10, title: "Business Registration Recommendation", cat: "Recommendations", imgSrc: "/icons/business.png", desc: "GN approval for new business starts" },
    { id: 11, title: "Assessments for Ownership of Lands", cat: "Certificates", imgSrc: "/icons/land.png", desc: "Verify land ownership and boundaries" },
  ];

  // ... (all useEffect hooks remain unchanged)

  // Handle blank download
  const handleBlankDownload = async (form) => {
    setDownloading(form.id);
    try {
      await generateBlankPDF(form, userData);
    } catch (err) {
      console.error('Blank PDF error:', err);
      alert('Failed to generate blank PDF. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  // ... (rest of the component JSX)

  // In the fillable forms list, modify the button row:
  // Replace the existing button with two buttons.

  return (
    <div className="user-module min-h-screen flex flex-col font-sans bg-user-background dark:bg-user-background">
      {/* ... (sidebar, topbar, mobile search) ... */}

      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-user-text tracking-tight mb-1">Forms</h1>
          <p className="text-sm pb-5 font-semibold text-user-text-lighter">Apply for certificates, permits, and official documents through your Grama Niladhari</p>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-5 border-b-2 border-user-border dark:border-user-border overflow-x-auto whitespace-nowrap scrollbar-hide md:flex-wrap">
          {catTabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2.5 px-5 border-none bg-transparent text-sm font-semibold cursor-pointer transition-all flex-shrink-0 ${
                tab === t ? 'text-user-primary font-extrabold border-b-2 border-user-primary' : 'text-user-text-lighter hover:text-user-text'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Fillable Forms List */}
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
                  className="flex items-center gap-2 py-2 px-4 rounded-lg border border-user-border dark:border-user-border bg-user-surface dark:bg-user-surface text-sm font-extrabold text-user-text dark:text-user-text cursor-pointer transition-all hover:border-user-primary hover:bg-user-background"
                >
                  <Icon d={IC.edit} size={14} color="#B46A02" />
                  Fill Form
                </button>
                <button
                  onClick={() => handleBlankDownload(form)}
                  disabled={downloading === form.id}
                  className="flex items-center gap-2 py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-extrabold cursor-pointer transition-all disabled:opacity-50"
                >
                  <Icon d={IC.download} size={14} color="#fff" sw={2.5} />
                  {downloading === form.id ? 'Loading...' : 'Download Form'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ... (footer, toast, modal) ... */}
    </div>
  );
};

export default Forms;