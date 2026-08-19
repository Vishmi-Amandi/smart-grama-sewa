import { useEffect, useState, useRef } from "react";
import { LayoutDashboard, CalendarDays, Clock, Megaphone, Search, User, Settings, LogOut, ArrowRightLeft, Menu, X } from "lucide-react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, orderBy, limit, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useTranslation } from 'react-i18next';

// ─── GN Officer Notification Bell ────────────────────────────────────────────
const GNNotificationBell = ({ theme }) => {
  const navigate = useNavigate();
  const [personalNotifs, setPersonalNotifs] = useState([]);
  const [adminNotifs, setAdminNotifs] = useState([]);
  const [readAnnouncements, setReadAnnouncements] = useState(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [shaking, setShaking] = useState(false);
  const isFirstLoad = useRef(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => { 
      setCurrentUser(user || null);
      if (user) {
        try {
          const officerSnap = await getDoc(doc(db, 'gn_officers', user.uid));
          if (officerSnap.exists()) {
            const data = officerSnap.data();
            setReadAnnouncements(new Set(data.readAnnouncements || []));
          }
        } catch (e) {
          console.warn('GN officer data fetch error:', e.message);
        }
      }
    });
    return () => unsub();
  }, []);

  // 1. Real-time personal notifications for GN Officer
  useEffect(() => {
    if (!currentUser) return;
    isFirstLoad.current = true;
    const q = query(
      collection(db, 'gn_officers', currentUser.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(), 
        createdAt: d.data().createdAt?.toDate?.() || null,
        isPersonal: true 
      }));
      if (!isFirstLoad.current) {
        const hasNew = snap.docChanges().some(c => c.type === 'added');
        if (hasNew) { setShaking(true); setTimeout(() => setShaking(false), 700); }
      } else { isFirstLoad.current = false; }
      setPersonalNotifs(items);
    });
    return () => unsub();
  }, [currentUser]);

  // 2. Real-time Admin Announcements targeting all_users or gn_officers
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs
        .filter(d => {
          const data = d.data();
          const cat = data.category || '';
          const status = data.status || '';
          const isTargeted = ['all_users', 'gn_officers'].includes(cat);
          const isActive = ['published', 'Active', ''].includes(status);
          return isTargeted && isActive;
        })
        .map(d => {
          const data = d.data();
          return {
            id: d.id,
            type: 'admin_notice',
            title: data.title || 'Admin Announcement',
            body: data.description || data.body || '',
            createdAt: data.publishedAt?.toDate?.() || data.createdAt?.toDate?.() || null,
            isPersonal: false,
          };
        });
      setAdminNotifs(items);
    }, (err) => console.warn("Admin announcements listener warning:", err));

    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false); };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const markAsRead = async (n) => {
    if (!currentUser) return;
    if (n.isPersonal) {
      try { 
        await updateDoc(doc(db, 'gn_officers', currentUser.uid, 'notifications', n.id), { read: true }); 
      } catch (e) { 
        console.warn('GN mark read:', e.message); 
      }
    } else {
      setReadAnnouncements(prev => new Set([...prev, n.id]));
      try {
        await updateDoc(doc(db, 'gn_officers', currentUser.uid), {
          readAnnouncements: arrayUnion(n.id)
        });
      } catch (e) {
        console.warn('GN mark announcement read:', e.message);
      }
    }
  };

  const TYPE_CONFIG = {
    new_appointment:       { icon: '📋', color: '#8B4513', bg: '#FEF3C7', nav: '/gn-appointments' },
    appointment_cancelled: { icon: '❌', color: '#991B1B', bg: '#FEE2E2', nav: '/gn-appointments' },
    transfer_submitted:    { icon: '📋', color: '#8B4513', bg: '#FEF3C7', nav: '/change-gn-request-status' },
    transfer_approved:     { icon: '✅', color: '#065F46', bg: '#D1FAE5', nav: '/change-gn-request-status' },
    transfer_rejected:     { icon: '❌', color: '#991B1B', bg: '#FEE2E2', nav: '/change-gn-request-status' },
    admin_notice:          { icon: '📢', color: '#D97706', bg: '#FEF3C7', nav: '/gn-dashboard' },
    announcement:          { icon: '📢', color: '#D97706', bg: '#FEF3C7', nav: '/gn-dashboard' },
  };
  const getTypeConfig = (type) => TYPE_CONFIG[type] || { icon: '🔔', color: '#8B4513', bg: '#FEF3C7', nav: '/gn-dashboard' };

  // Combine personal notifications and admin notices
  const notifications = [
    ...personalNotifs,
    ...adminNotifs.map(a => ({ ...a, read: readAnnouncements.has(a.id) }))
  ].sort((a, b) => {
    const aTime = a.createdAt ? a.createdAt.getTime() : 0;
    const bTime = b.createdAt ? b.createdAt.getTime() : 0;
    return bTime - aTime;
  });

  const unread = notifications.filter(n => !n.read).length;

  const timeAgo = (date) => {
    if (!date) return '';
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins/60)}h ago`;
    return `${Math.floor(mins/1440)}d ago`;
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className={`relative p-2 rounded-full transition-colors ${shaking ? 'animate-bounce' : ''} ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        aria-label="GN Notifications"
      >
        <span style={{ fontSize: '20px' }}>🔔</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl border z-50 overflow-hidden flex flex-col ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'
          }`}
          style={{ maxHeight: '420px' }}
        >
          <div className={`px-4 py-3 border-b text-sm font-bold ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
            Notifications {unread > 0 && <span style={{ color: '#8B4513' }}>({unread})</span>}
          </div>
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔔</div>
                <p className="text-sm text-gray-400 font-semibold">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">New updates will appear here</p>
              </div>
            ) : (
              notifications.slice(0, 15).map(n => {
                const cfg = getTypeConfig(n.type);
                return (
                  <div
                    key={n.id}
                    onClick={() => { markAsRead(n); setIsOpen(false); navigate(cfg.nav); }}
                    className={`flex gap-3 px-4 py-3 cursor-pointer border-b transition-colors ${
                      theme === 'dark' ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-50 hover:bg-gray-50'
                    } ${!n.read ? (theme === 'dark' ? 'bg-gray-700/50' : '') : ''}`}
                    style={{
                      borderLeft: !n.read ? `3px solid ${cfg.color}` : '3px solid transparent',
                      background: !n.read ? `${cfg.bg}50` : undefined,
                    }}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: cfg.bg }}>
                      <span style={{ fontSize: '15px' }}>{cfg.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate"
                        style={{ color: !n.read ? cfg.color : theme === 'dark' ? '#fff' : '#1f2937' }}>
                        {n.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5"
                        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {(n.body || '').slice(0, 110)}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {notifications.length > 0 && (
            <button
              onClick={() => { setIsOpen(false); navigate('/gn-dashboard'); }}
              className="w-full py-2.5 text-xs font-bold text-[#8B4513] border-t hover:bg-amber-50 transition-colors"
              style={{ borderColor: theme === 'dark' ? '#374151' : '#f0f0f0' }}
            >
              View Dashboard & Notices →
            </button>
          )}
        </div>
      )}
    </div>
  );
};
// ────────────────────────────────────────────────────────────────────────────

export const getThemeClasses = (theme) => ({

  bg: theme === "dark" ? "bg-gray-900" : "bg-[#F5F0DC]",
  card: theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-800",
  text: theme === "dark" ? "text-white" : "text-gray-800",
  subtext: theme === "dark" ? "text-gray-300" : "text-gray-500",
  border: theme === "dark" ? "border-gray-700" : "border-gray-200",
  input: theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-600 border-gray-200",
  tableHead: theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-50 text-gray-400",
  tableRow: theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50",
  divider: theme === "dark" ? "divide-gray-700" : "divide-gray-100",
});

const GNLayout = ({ children, gnStatus, theme }) => {
  // ✅ i18n is defined here, inside the component
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [showLang, setShowLang] = useState(false);
  const [selectedLang, setSelectedLang] = useState(
    i18n.language === 'si' ? 'සිංහල' :
    i18n.language === 'ta' ? 'தமிழ்' : 'English'
  );
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [userData, setUserData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Language options
  const languages = [
    { code: 'en', label: 'English', display: 'EN' },
    { code: 'si', label: 'සිංහල', display: 'SI' },
    { code: 'ta', label: 'தமிழ்', display: 'TA' },
  ];

  const changeLanguage = (langCode, langLabel) => {
    i18n.changeLanguage(langCode);
    setSelectedLang(langLabel);
    setShowLang(false);
  };

  // Keep selectedLang in sync with i18n language changes
  useEffect(() => {
    const langMap = {
      en: 'English',
      si: 'සිංහල',
      ta: 'தமிழ்'
    };
    setSelectedLang(langMap[i18n.language] || 'English');
  }, [i18n.language]);

  // Search pages (translated)
  const searchPages = [
    { name: t('lbl_dashboard'), path: "/gn-dashboard", icon: <LayoutDashboard size={16} /> },
    { name: t('lbl_appointments'), path: "/gn-appointments", icon: <CalendarDays size={16} /> },
    { name: t('lbl_schedule'), path: "/gn-schedule", icon: <Clock size={16} /> },
    { name: t('btn_create_announcement'), path: "/gn-create-announcement", icon: <Megaphone size={16} /> },
    { name: t('lbl_announcement_list'), path: "/gn-announcement-list", icon: <Megaphone size={16} /> },
    { name: t('lbl_citizen_search'), path: "/gn-citizen-search", icon: <Search size={16} /> },
    { name: t('lbl_profile'), path: "/gn-profile", icon: <User size={16} /> },
    { name: t('lbl_settings'), path: "/gn-settings", icon: <Settings size={16} /> },
    { name: t('lbl_current_status'), path: "/gn-current-status", icon: <User size={16} /> },
    { name: t('btn_change_gn_division'), path: "/gn-change-gn-division", icon: <LogOut size={16} /> },
    { name: t('lbl_notification_settings'), path: "/gn-settings?tab=notification", icon: <Settings size={16} /> },
    { name: t('lbl_appearance_settings'), path: "/gn-settings?tab=appearance", icon: <Settings size={16} /> },
    { name: t('lbl_security_settings'), path: "/gn-settings?tab=security", icon: <Settings size={16} /> },
    { name: t('lbl_weekly_hours_settings'), path: "/gn-settings?tab=hours", icon: <Settings size={16} /> },
    { name: t('lbl_personal_info_profile'), path: "/gn-profile?tab=personal", icon: <User size={16} /> },
    { name: t('lbl_office_details_profile'), path: "/gn-profile?tab=office", icon: <User size={16} /> },
    { name: t('lbl_activity_log_profile'), path: "/gn-profile?tab=activity", icon: <User size={16} /> },
  ];

  const filteredPages = searchQuery.trim()
    ? searchPages.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSearchNavigate = (fullPath) => {
    const [pathname, search] = fullPath.split("?");
    navigate(
      { pathname, search: search ? `?${search}` : "" },
      { replace: false }
    );
    setSearchQuery("");
    setShowResults(false);
    setMobileSidebarOpen(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "gn_officers", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Get translated status label
  const getStatusLabel = (status) => {
    if (!status) return t('status_available');
    const statusMap = {
      'Available': t('status_available'),
      'In Meeting': t('status_in_meeting'),
      'On Field': t('status_on_field'),
      'Unavailable': t('status_not_available'),
    };
    return statusMap[status] || status;
  };

  const mobileNavItems = [
    { name: t('lbl_dashboard'), path: "/gn-dashboard", icon: <LayoutDashboard size={20} /> },
    { name: t('lbl_appointments'), path: "/gn-appointments", icon: <CalendarDays size={20} /> },
    { name: t('lbl_citizen_search'), path: "/gn-citizen-search", icon: <Search size={20} /> },
    { name: t('lbl_profile'), path: "/gn-profile", icon: <User size={20} /> },
    { name: t('lbl_sign_out'), action: "signout", icon: <LogOut size={20} /> },
  ];

  const handleMobileAction = (action) => {
    if (action === "signout") {
      signOut(auth).then(() => navigate("/home"));
    }
  };

  return (
    <div className={`flex flex-col h-screen ${theme === "dark" ? "bg-gray-900 text-white" : ""}`}>

      {/* Main Area: Sidebar + Right Side */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className={`w-64 bg-[#8B4513] text-white flex flex-col flex-shrink-0 overflow-y-auto fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          {/* Close button on mobile */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 text-white p-1"
          >
            <X size={24} />
          </button>

          {/* Branding */}
          <div className="p-5 text-center border-b border-[#9B4D00]">
            <h1 className="text-white font-bold text-lg">{t('lbl_grama_niladhari')}</h1>
            <p className="text-[#E5A800] font-semibold text-sm">{t('lbl_portal')}</p>
            <img
              src="/logo.png"
              alt={t('lbl_smart_grama_sewa')}
              className="w-32 h-32 mx-auto mt-3 object-contain"
            />
          </div>

          {/* Status Badge */}
          <Link
            to="/gn-current-status"
            className="mx-4 mt-4 bg-[#9B4D00] rounded-lg px-4 py-3 block hover:bg-[#7a3b00] transition"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <p className="text-xs text-gray-300">{t('lbl_current_status')}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${
                gnStatus === "Available"   ? "bg-green-400 shadow-[0_0_6px_2px_rgba(74,222,128,0.6)]"  :
                gnStatus === "In Meeting"  ? "bg-orange-400 shadow-[0_0_6px_2px_rgba(251,146,60,0.6)]" :
                gnStatus === "On Field"    ? "bg-red-400 shadow-[0_0_6px_2px_rgba(248,113,113,0.6)]"   :
                gnStatus === "Unavailable" ? "bg-slate-400"                                              :
                "bg-gray-400"
              }`}></span>
              <span className="text-white font-semibold text-sm">{getStatusLabel(gnStatus)}</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 mt-6 px-4 space-y-1">
            <Link
              to="/gn-dashboard"
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-4 py-2 ${location.pathname === "/gn-dashboard" ? "bg-[#E5A800] text-black font-semibold" : "text-white hover:bg-[#9B4D00]"}`}
            >
              <LayoutDashboard size={18} /> {t('lbl_dashboard')}
            </Link>

            <Link
              to="/gn-appointments"
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-4 py-2 ${location.pathname === "/gn-appointments" ? "bg-[#E5A800] text-black font-semibold" : "text-white hover:bg-[#9B4D00]"}`}
            >
              <CalendarDays size={18} /> {t('lbl_appointments')}
            </Link>

            <Link
              to="/gn-schedule"
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg ${location.pathname === "/gn-schedule" ? "bg-[#E5A800] text-black font-semibold" : "text-white hover:bg-[#9B4D00]"}`}
            >
              <Clock size={18} /> {t('lbl_schedule')}
            </Link>

            {/* Announcements Dropdown */}
            <div>
              <div
                onClick={() => setShowAnnouncements(!showAnnouncements)}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer
                  ${location.pathname === "/gn-create-announcement" || location.pathname === "/gn-announcement-list"
                    ? "bg-[#E5A800] text-black font-semibold"
                    : "text-white hover:bg-[#9B4D00]"
                  }`}
              >
                <Megaphone size={18} />
                <span className="flex-1">{t('lbl_announcements')}</span>
                <span className="text-xs">{showAnnouncements ? "▲" : "▼"}</span>
              </div>
              {showAnnouncements && (
                <div className="ml-8 mt-1 space-y-1">
                  <Link
                    to="/gn-create-announcement"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="flex items-center gap-2 text-orange-200 px-4 py-2 rounded-lg hover:bg-[#9B4D00] text-sm"
                  >
                    {t('btn_create_announcement')}
                  </Link>
                  <Link
                    to="/gn-announcement-list"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="flex items-center gap-2 text-orange-200 px-4 py-2 rounded-lg hover:bg-[#9B4D00] text-sm"
                  >
                    {t('lbl_announcement_list')}
                  </Link>
                </div>
              )}
            </div>

            <Link
              to="/gn-citizen-search"
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg ${location.pathname === "/gn-citizen-search" ? "bg-[#E5A800] text-black font-semibold" : "text-white hover:bg-[#9B4D00]"}`}
            >
              <Search size={18} /> {t('lbl_citizen_search')}
            </Link>

            <hr className="border-[#9B4D00] my-2" />

            <Link
              to="/gn-profile"
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg ${location.pathname === "/gn-profile" ? "bg-[#E5A800] text-black font-semibold" : "text-white hover:bg-[#9B4D00]"}`}
            >
              <User size={18} /> {t('lbl_profile')}
            </Link>

            <Link
              to="/gn-settings"
              onClick={() => setMobileSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg ${location.pathname === "/gn-settings" ? "bg-[#E5A800] text-black font-semibold" : "text-white hover:bg-[#9B4D00]"}`}
            >
              <Settings size={18} /> {t('lbl_settings')}
            </Link>
          </nav>

          <button
            onClick={() => signOut(auth).then(() => navigate("/home"))}
            className="flex items-center gap-3 text-white px-8 py-4 rounded-lg hover:bg-[#9B4D00] w-full"
          >
            <LogOut size={18} /> {t('lbl_sign_out')}
          </button>
        </aside>

        {/* Overlay for mobile sidebar */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Right Side: Header + Content */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Header */}
          <header className={`h-16 shadow z-10 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white"}`}>

            <div className="flex items-center gap-3 flex-1">
              {/* Hamburger - Mobile Only */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className={`lg:hidden p-2 rounded-lg ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
              >
                <Menu size={24} className={theme === "dark" ? "text-gray-200" : "text-gray-600"} />
              </button>

              {/* Search Bar */}
              <div className="relative flex-1 sm:w-80 sm:flex-none">
                <div className={`flex items-center rounded-full px-4 py-2 ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}>
                  <Search size={18} className={`mr-2 ${theme === "dark" ? "text-gray-300" : "text-gray-400"}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
                    onFocus={() => setShowResults(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") { setShowResults(false); }
                      if (e.key === "Enter" && filteredPages.length > 0) {
                        handleSearchNavigate(filteredPages[0].path);
                      }
                    }}
                    placeholder={t('lbl_search_pages')}
                    className={`bg-transparent outline-none text-sm w-full
                      ${theme === "dark"
                        ? "text-white placeholder-gray-400"
                        : "text-gray-600 placeholder-gray-400"
                      }`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(""); setShowResults(false); }}
                      className={`ml-1 ${theme === "dark" ? "text-gray-300 hover:text-white" : "text-gray-400 hover:text-gray-600"}`}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Dropdown Results */}
                {showResults && searchQuery && (
                  <div className={`absolute top-12 left-0 w-full rounded-2xl shadow-xl z-50 overflow-hidden border
                    ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                    {filteredPages.length > 0 ? (
                      <>
                        <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide
                          ${theme === "dark" ? "text-gray-300 bg-gray-700" : "text-gray-400 bg-gray-50"}`}>
                          {t('lbl_pages')}
                        </div>
                        {filteredPages.map((page) => (
                          <div
                            key={page.path}
                            onClick={() => handleSearchNavigate(page.path)}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition
                              ${theme === "dark"
                                ? "text-white hover:bg-gray-700"
                                : "text-gray-700 hover:bg-gray-50"}`}
                          >
                            <span className="text-[#E5A800]">{page.icon}</span>
                            <span className="text-sm font-semibold">{page.name}</span>
                            <span className={`ml-auto text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-400"}`}>
                              → {page.path}
                            </span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className={`px-4 py-4 text-sm text-center ${theme === "dark" ? "text-gray-300" : "text-gray-400"}`}>
                        {t('lbl_no_results', { query: searchQuery })}
                      </div>
                    )}
                  </div>
                )}

                {/* Click outside to close */}
                {showResults && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowResults(false)}
                  />
                )}
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3 sm:gap-6">

              {/* Language Dropdown */}
              <div className="relative">
                <div
                  onClick={() => setShowLang(!showLang)}
                  className={`flex items-center gap-2 border rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm cursor-pointer
                    ${theme === "dark"
                      ? "border-gray-600 text-gray-200 hover:bg-gray-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  🌐 <span className="hidden sm:inline">{selectedLang}</span> ▾
                </div>
                {showLang && (
                  <div className={`absolute right-0 mt-2 w-44 border rounded-xl shadow-lg z-50 overflow-hidden
                    ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                    <div className={`px-4 py-2 text-xs uppercase tracking-wide border-b
                      ${theme === "dark" ? "text-gray-400 border-gray-700" : "text-gray-400 border-gray-200"}`}>
                      {t('lbl_selected')}
                    </div>
                    <div className={`px-4 py-2 text-sm font-bold
                      ${theme === "dark" ? "text-white bg-gray-700" : "text-gray-800 bg-gray-50"}`}>
                      ✓ {selectedLang}
                    </div>
                    <div className={`border-t my-1 ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}></div>
                    <div className={`px-4 py-2 text-xs uppercase tracking-wide
                      ${theme === "dark" ? "text-gray-400" : "text-gray-400"}`}>
                      {t('lbl_switch_to')}
                    </div>
                    {languages
                      .filter((lang) => lang.label !== selectedLang)
                      .map((lang) => (
                        <div
                          key={lang.code}
                          onClick={() => changeLanguage(lang.code, lang.label)}
                          className={`px-4 py-2 text-sm cursor-pointer
                            ${theme === "dark"
                              ? "text-gray-200 hover:bg-gray-700"
                              : "text-gray-700 hover:bg-gray-100"
                            }`}
                        >
                          {lang.label}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* GN Notification Bell */}
              <GNNotificationBell theme={theme} />

              {/* User Info */}
              <Link to="/gn-profile" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
                <div className="text-right hidden sm:block">
                  <p className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                    {userData?.fullName || t('lbl_officer')}
                  </p>
                  <p className="text-xs text-[#E5A800]">
                    {userData?.gnDiv || t('lbl_grama_niladhari')}
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden flex items-center justify-center font-bold text-white bg-[#8B4513]">
                  {userData?.photoURL ? (
                    <img
                      key={userData.photoURL}
                      src={userData.photoURL}
                      alt={t('lbl_avatar')}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    userData?.fullName?.charAt(0).toUpperCase() || "G"
                  )}
                </div>
              </Link>
            </div>
          </header>

          {/* Main Content */}
          <main className={`flex-1 p-4 sm:p-6 overflow-y-auto pb-20 lg:pb-6 ${theme === "dark" ? "bg-gray-800" : "bg-[#F5F0DC]"}`}>
            {children}
          </main>

        </div>
      </div>

      {/* BOTTOM NAVIGATION BAR - Mobile Only */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] z-50 ${theme === "dark" ? "bg-gray-900" : "bg-white"}`}>
        <div className="flex justify-around items-center py-2 px-2">
          {mobileNavItems.map((item, index) => (
            item.action ? (
              <button
                key={index}
                onClick={() => handleMobileAction(item.action)}
                className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${theme === "dark" ? "text-gray-400 hover:text-red-400" : "text-gray-500 hover:text-red-600"}`}
              >
                <span className="text-xl sm:text-2xl">{item.icon}</span>
                <span className="text-[10px] sm:text-xs mt-1 font-medium">{item.name}</span>
              </button>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? "text-[#E5A800]"
                    : theme === "dark" ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="text-xl sm:text-2xl">{item.icon}</span>
                <span className="text-[10px] sm:text-xs mt-1 font-medium">{item.name}</span>
              </Link>
            )
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#5C1E00] text-[#E5A800] text-center py-3 text-sm flex-shrink-0 hidden lg:block">
        © 2026 {t('lbl_smart_grama_sewa')}. {t('lbl_all_rights_reserved')}
      </footer>

    </div>
  );
};

export default GNLayout;