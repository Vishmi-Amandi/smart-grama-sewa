import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';

import {
  collection, query, orderBy, limit,
  onSnapshot, getDocs, where, doc, getDoc, updateDoc, serverTimestamp
} from 'firebase/firestore';

import {
  LayoutDashboard, ArrowLeftRight, BarChart2, UserCheck,
  Activity, Megaphone, Calendar, Bell, Search, ChevronDown, User,
  TrendingUp, Clock, CheckCircle, XCircle, RefreshCw,
  Loader2, AlertCircle, LogOut,
} from 'lucide-react';

import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Theme ────────────────────────────────────────────────────────────────
const COLORS = {
  primary:   '#7B2D00',
  accent:    '#F5A623',
  bg:        '#F5F0E8',
  cardBrown: '#6B2400',
  cardDark:  '#3D1500',
  text:      '#2C1200',
  textMuted: '#7A5C44',
  white:     '#FFFFFF',
};

// ─── activity_logs.type → icon / colour ──────────────────────────────────
const ACTIVITY_META = {
  approved:    { icon: CheckCircle,    color: '#22c55e' },
  registered:  { icon: CheckCircle,    color: '#22c55e' },
  pending:     { icon: RefreshCw,      color: '#F5A623' },
  rejected:    { icon: XCircle,        color: '#ef4444' },
  report:      { icon: Activity,       color: '#60a5fa' },
  transferred: { icon: ArrowLeftRight, color: '#a78bfa' },
  login:       { icon: UserCheck,      color: '#34d399' },
  appointment: { icon: Calendar,       color: '#f472b6' },
};

// Default fallback for unknown types
const DEFAULT_ACTIVITY_META = { icon: Activity, color: '#60a5fa' };

// ─── Helpers ──────────────────────────────────────────────────────────────
function timeAgo(timestamp) {
  if (!timestamp) return '';
  const ts   = timestamp.toDate ? timestamp.toDate().getTime() : Number(timestamp);
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)    return `${diff} sec ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} day ago`;
}

function fmtNumber(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString();
}

function todayDateString() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

// ─── Skeleton ─────────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-lg ${className}`}
      style={{ background: 'rgba(255,255,255,0.18)', animation: 'pulse 1.5s ease-in-out infinite' }} />
  );
}

// ─── Error Banner ─────────────────────────────────────────────────────────
function ErrorBanner({ message }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs"
      style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}>
      <AlertCircle size={14} />
      <span>{message}</span>
    </div>
  );
}

// ─── Simple Number Card ──────────────────────────────────────────────────
function SimpleStatCard({ label, value, sub, icon: Icon, loading,
  secondaryValue, secondaryLabel, secondaryLoading }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl p-5 flex-1 min-w-[180px]"
      style={{ background: COLORS.cardBrown, color: COLORS.white }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold opacity-80 leading-tight">{label}</p>
        {Icon && <Icon size={16} style={{ color: COLORS.accent }} />}
      </div>
      {loading ? (
        <>
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-3 w-40" />
        </>
      ) : (
        <>
          <p className="text-3xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>{value}</p>
          <p className="text-xs opacity-70 leading-snug">{sub}</p>
        </>
      )}

      {/* Secondary stat row */}
      {(secondaryLabel !== undefined) && (
        <div className="mt-1 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
          {secondaryLoading ? (
            <>
              <Skeleton className="h-6 w-20 mb-1" />
              <Skeleton className="h-3 w-32" />
            </>
          ) : (
            <>
              <p className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
                {secondaryValue}
              </p>
              <p className="text-xs opacity-70 leading-snug mt-0.5">{secondaryLabel}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────
function DonutChart({ pct }) {
  const r    = 38;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#3D1500" strokeWidth="12" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke="#F5A623" strokeWidth="12"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        strokeDashoffset={circ * 0.25}
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text x="50" y="55" textAnchor="middle" fill="#FFFFFF"
        fontSize="15" fontWeight="700" fontFamily="Georgia, serif">
        {pct}%
      </text>
    </svg>
  );
}

// ─── Stat Card (with donut) ────────────────────────────────────────────────
function StatCard({ label, value, pct, sub, loading }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl p-5 flex-1 min-w-[180px]"
      style={{ background: COLORS.cardBrown, color: COLORS.white }}>
      <p className="text-xs font-semibold opacity-80 leading-tight">{label}</p>
      {loading ? (
        <>
          <Skeleton className="h-9 w-28" />
          <div className="flex justify-center"><Skeleton className="w-24 h-24 rounded-full" /></div>
          <Skeleton className="h-3 w-40" />
        </>
      ) : (
        <>
          <p className="text-3xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>{value}</p>
          <div className="flex justify-center"><DonutChart pct={pct} /></div>
          <p className="text-xs opacity-70 leading-snug">{sub}</p>
        </>
      )}
    </div>
  );
}

// ─── Nav Item ─────────────────────────────────────────────────────────────
function NavItem({ icon: Icon, label, active, bold, onClick }) {
  return (
    <li onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-all ${
        active  ? 'bg-amber-700 text-white font-bold'
        : bold  ? 'text-amber-900 font-bold hover:bg-amber-100'
                : 'text-amber-800 hover:bg-amber-100'
      }`}
      style={{ fontSize: bold && !Icon ? '0.85rem' : '0.82rem' }}>
      {Icon && <Icon size={16} className={active ? 'text-white' : 'text-amber-700'} />}
      <span>{label}</span>
    </li>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────
function Sidebar({ onLogout }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col py-6 px-3 gap-2 border-r"
      style={{ borderColor: '#DDD0BC', background: COLORS.bg }}>

      {/* Logo */}
      <div className="flex items-center gap-2 px-3 mb-6">
        <img src="/logo2.png" alt="Logo" />
      </div>

      {/* Nav links */}
      <ul className="flex flex-col gap-1 flex-1">
        <NavItem icon={LayoutDashboard} label={t('nav_admin_dashboard')} active 
          onClick={() => navigate('/admin/dashboard')} />

        <li className="px-4 pt-3 pb-1 text-xs font-extrabold" style={{ color: COLORS.primary }}>
          {t('nav_gn_management_heading')}
        </li>
        <NavItem icon={UserCheck}       label={t('nav_reg_requests')}
          onClick={() => navigate('/admin/registrationrequestapproval')} />
        <NavItem icon={ArrowLeftRight} label={t('nav_trans_requests')}
          onClick={() => navigate('/admin/transferrequestapproval')} />
        <li className="px-4 pt-3 pb-1 text-xs font-extrabold" style={{ color: COLORS.primary }}>
          {t('nav_reports_heading')}
        </li>
        <NavItem icon={BarChart2} label={t('nav_sys_reports')}
          onClick={() => navigate('/admin/reports/system')} />
        <NavItem icon={User}      label={t('nav_ind_user_access')}
          onClick={() => navigate('/admin/reports/useraccess')} />
        <NavItem icon={Activity}  label={t('nav_gn_activity_reports')}
          onClick={() => navigate('/admin/reports/gnactivity')} />

        <li className="pt-4">
          <NavItem icon={Megaphone} label={t('nav_announcements')} bold
            onClick={() => navigate('/admin/announcements')} />
        </li>
        <li className="pt-4">
          <NavItem icon={Calendar} label={t('nav_appointment_calendar')} bold
            onClick={() => navigate("/admin/calendar")} />
        </li>
        <li className="pt-2">
          {/* UPDATED KEY: Changed nav_statistical_changes to nav_stat_changes */}
          <NavItem icon={TrendingUp} label={t('nav_stat_changes')} bold
            onClick={() => navigate('/admin/staticalchanges')} />
        </li>
      </ul>

      {/* Logout */}
      <div className="px-3 pt-4 border-t" style={{ borderColor: '#DDD0BC' }}>
        <button onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm font-bold transition-all hover:bg-red-50"
          style={{ color: '#991B1B' }}>
          <LogOut size={16} />
          <span>{t('btn_logout')}</span>
        </button>
      </div>
    </aside>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────
function Topbar({ adminName }) {
  const { t, i18n } = useTranslation();
  const [searchVal, setSearchVal] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setDropdownOpen(false);
  };

  const currentLanguageLabel = () => {
    if (i18n.language === 'si') return 'සිංහල';
    if (i18n.language === 'ta') return 'தமிழ்';
    return 'English';
  };

  return (
    <header className="flex items-center gap-4 px-6 py-4 border-b"
      style={{ borderColor: '#DDD0BC', background: COLORS.bg }}>
      <div className="flex-1 relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2"
          style={{ color: COLORS.textMuted }} />
        <input
          className="w-full pl-10 pr-4 py-2.5 rounded-full border text-sm focus:outline-none"
          style={{ borderColor: '#C8B89A', background: '#FFF9F0', color: COLORS.text }}
          placeholder={t('search_placeholder')}
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
        />
      </div>
      
      {/* Language Switcher Dropdown */}
      <div className="relative">
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-full border transition-all active:scale-95"
          style={{ borderColor: '#C8B89A', color: COLORS.text, background: '#FFF9F0' }}
        >
          {currentLanguageLabel()} <ChevronDown size={14} />
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-32 rounded-xl border shadow-lg overflow-hidden z-50"
               style={{ background: '#FFF9F0', borderColor: '#C8B89A' }}>
            <button onClick={() => toggleLanguage('en')} className="w-full text-left px-4 py-2 text-sm text-[#2C1200] hover:bg-amber-100 font-semibold transition-colors">English</button>
            <button onClick={() => toggleLanguage('si')} className="w-full text-left px-4 py-2 text-sm text-[#2C1200] hover:bg-amber-100 font-semibold transition-colors">සිංහල</button>
            <button onClick={() => toggleLanguage('ta')} className="w-full text-left px-4 py-2 text-sm text-[#2C1200] hover:bg-amber-100 font-semibold transition-colors">தமிழ்</button>
          </div>
        )}
      </div>

      <button onClick={() => navigate('/admin/announcements')} title="Notifications / Announcements" className="relative w-10 h-10 rounded-full flex items-center justify-center border cursor-pointer hover:bg-amber-100 transition"
        style={{ borderColor: '#C8B89A', background: '#FFF9F0' }}>
        <Bell size={18} style={{ color: COLORS.primary }} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
          style={{ background: COLORS.accent }} />
      </button>
      <div className="flex items-center gap-2">
        <button className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: COLORS.primary }}>
          <User size={18} color="#fff" />
        </button>
        {adminName && (
          <span className="text-xs font-bold hidden md:block" style={{ color: COLORS.primary }}>
            {adminName}
          </span>
        )}
      </div>
    </header>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────
export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [adminName, setAdminName] = useState('');

  // Loading states
  const [usersLoading,              setUsersLoading]              = useState(true);
  const [gnOfficersLoading,         setGnOfficersLoading]         = useState(true);
  const [loginsLoading,             setLoginsLoading]             = useState(true);
  const [citizenLoginsLoading,      setCitizenLoginsLoading]      = useState(true);
  const [appointmentsDoneLoading,   setAppointmentsDoneLoading]   = useState(true);
  const [appointmentsTodayLoading,  setAppointmentsTodayLoading]  = useState(true);
  const [chartLoading,              setChartLoading]              = useState(true);
  const [activityLoading,           setActivityLoading]           = useState(true);
  const [statsConfigLoading,        setStatsConfigLoading]        = useState(true);

  // Error states
  const [usersError,              setUsersError]              = useState(null);
  const [gnOfficersError,         setGnOfficersError]         = useState(null);
  const [loginsError,             setLoginsError]             = useState(null);
  const [appointmentsDoneError,   setAppointmentsDoneError]   = useState(null);
  const [chartError,              setChartError]              = useState(null);
  const [activityError,           setActivityError]           = useState(null);

  // Data states
  const [totalUsers,          setTotalUsers]          = useState(0);
  const [totalGnOfficers,     setTotalGnOfficers]     = useState(0);
  const [loginsToday,         setLoginsToday]         = useState(0);   
  const [citizenLoginsToday,  setCitizenLoginsToday]  = useState(0);   
  const [appointmentsDone,    setAppointmentsDone]    = useState(0);   
  const [appointmentsToday,   setAppointmentsToday]   = useState(0);   
  const [chartData,           setChartData]           = useState([]);
  const [activityLogs,        setActivityLogs]        = useState([]);

  const [totalPopulation,          setTotalPopulation]          = useState(0);
  const [totalWorkingGnOfficers,   setTotalWorkingGnOfficers]   = useState(0);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) { navigate('/login'); return; }
      try {
        const snap = await getDoc(doc(db, 'gn_officers', user.uid));
        if (snap.exists()) setAdminName(snap.data().fullName || 'Admin');
        else setAdminName('Admin');
      } catch {
        setAdminName('Admin');
      }
    });
    return () => unsubAuth();
  }, [navigate]);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'system_stats', 'config'));
        if (snap.exists()) {
          const data = snap.data();
          setTotalPopulation(Number(data.totalPopulation) || 0);
          setTotalWorkingGnOfficers(Number(data.totalWorkingGnOfficers) || 0);
        }
      } catch (err) {
        console.error('Stats config fetch failed:', err.message);
      } finally {
        setStatsConfigLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        setTotalUsers(snap.size);
      } catch (err) {
        setUsersError(`Users fetch failed: ${err.message}`);
      } finally {
        setUsersLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'gn_officers'));
        setTotalGnOfficers(snap.size);
      } catch (err) {
        setGnOfficersError(`GN Officers fetch failed: ${err.message}`);
      } finally {
        setGnOfficersLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);
        const q = query(
          collection(db, 'gn_officers'),
          where('lastLogin', '>=', todayStart),
          where('lastLogin', '<=', todayEnd)
        );
        const snap = await getDocs(q);
        setLoginsToday(snap.size);
      } catch (err) {
        setLoginsError(`GN login count failed: ${err.message}`);
      } finally {
        setLoginsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);
        const q = query(
          collection(db, 'users'),
          where('lastLogin', '>=', todayStart),
          where('lastLogin', '<=', todayEnd)
        );
        const snap = await getDocs(q);
        setCitizenLoginsToday(snap.size);
      } catch (err) {
        console.error('Citizen login count failed:', err.message);
      } finally {
        setCitizenLoginsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const today = todayDateString();
        const q = query(
          collection(db, 'appointments'),
          where('date', '==', today),
          where('status', '==', 'done')
        );
        const snap = await getDocs(q);
        setAppointmentsDone(snap.size);
      } catch (err) {
        try {
          const today = todayDateString();
          const q2 = query(collection(db, 'appointments'), where('date', '==', today));
          const snap2 = await getDocs(q2);
          setAppointmentsDone(snap2.docs.filter(d => d.data().status === 'done').length);
        } catch (err2) {
          setAppointmentsDoneError(`Appointments fetch failed: ${err2.message}`);
        }
      } finally {
        setAppointmentsDoneLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);
        const q = query(
          collection(db, 'appointments'),
          where('createdAt', '>=', todayStart),
          where('createdAt', '<=', todayEnd)
        );
        const snap = await getDocs(q);
        setAppointmentsToday(snap.size);
      } catch (err) {
        console.error('Appointments today fetch failed:', err.message);
      } finally {
        setAppointmentsTodayLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const DAY_LABELS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const q = query(
          collection(db, 'appointments'),
          where('createdAt', '>=', sevenDaysAgo),
          orderBy('createdAt', 'asc')
        );
        const snap = await getDocs(q);

        const buckets = {};
        for (let i = 6; i >= 0; i--) {
          const d   = new Date();
          d.setDate(d.getDate() - i);
          const key = DAY_LABELS[d.getDay()];
          buckets[key] = { day: key, appointments: 0 };
        }

        snap.docs.forEach((docSnap) => {
          const data      = docSnap.data();
          const createdAt = data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(data.createdAt);
          const dayKey = DAY_LABELS[createdAt.getDay()];
          if (buckets[dayKey]) buckets[dayKey].appointments += 1;
        });

        setChartData(Object.values(buckets));
      } catch (err) {
        setChartError(`Chart fetch failed: ${err.message}`);
      } finally {
        setChartLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'activity_logs'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setActivityLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setActivityLoading(false);
      },
      (err) => {
        setActivityError(`Activity logs failed: ${err.message}`);
        setActivityLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const citizenPct = totalPopulation > 0
    ? Math.min(100, Math.round((totalUsers / totalPopulation) * 100))
    : 0;

  const gnPct = totalWorkingGnOfficers > 0
    ? Math.min(100, Math.round((totalGnOfficers / totalWorkingGnOfficers) * 100))
    : 0;

  return (
    <div className="flex min-h-screen"
      style={{ background: COLORS.bg, fontFamily: "'Lato', sans-serif" }}>

      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 flex flex-col min-h-screen">
        <Topbar adminName={adminName} />

        <div className="flex-1 p-6 flex flex-col gap-6">

          {/* Stat Cards Row */}
          <div className="flex gap-4 flex-wrap">

            {/* Card 1 — Total Citizens */}
            <div className="flex-1 min-w-[180px] flex flex-col gap-1">
              {usersError && <ErrorBanner message={usersError} />}
              <StatCard
                label={t('lbl_total_citizens')}
                value={fmtNumber(totalUsers)}
                pct={statsConfigLoading ? 0 : citizenPct}
                sub={
                  statsConfigLoading
                    ? t('lbl_loading_population')
                    : totalPopulation > 0
                      ? t('lbl_pop_pct_sub', { pct: citizenPct, pop: fmtNumber(totalPopulation) })
                      : t('lbl_pop_not_set')
                }
                loading={usersLoading}
              />
            </div>

            {/* Card 2 — Total GN Officers */}
            <div className="flex-1 min-w-[180px] flex flex-col gap-1">
              {gnOfficersError && <ErrorBanner message={gnOfficersError} />}
              <StatCard
                label={t('lbl_total_gn')}
                value={fmtNumber(totalGnOfficers)}
                pct={statsConfigLoading ? 0 : gnPct}
                sub={
                  statsConfigLoading
                    ? t('lbl_loading_target')
                    : totalWorkingGnOfficers > 0
                      ? t('lbl_gn_pct_sub', { pct: gnPct, count: fmtNumber(totalWorkingGnOfficers) })
                      : t('lbl_gn_not_set')
                }
                loading={gnOfficersLoading}
              />
            </div>

            {/* Card 3 — Logins today */}
            <div className="flex-1 min-w-[180px] flex flex-col gap-1">
              {loginsError && <ErrorBanner message={loginsError} />}
              <SimpleStatCard
                label={t('lbl_sys_logins')}
                value={fmtNumber(loginsToday)}
                sub={t('lbl_gn_logged_sub')}
                icon={UserCheck}
                loading={loginsLoading}
                // secondaryValue={fmtNumber(citizenLoginsToday)}
                // secondaryLabel={t('lbl_citizen_logged_sub')}
                // secondaryLoading={citizenLoginsLoading}
              />
            </div>

            {/* Card 4 — Appointments */}
            <div className="flex-1 min-w-[180px] flex flex-col gap-1">
              {appointmentsDoneError && <ErrorBanner message={appointmentsDoneError} />}
              <SimpleStatCard
                label={t('lbl_appointments_today')}
                value={fmtNumber(appointmentsDone)}
                sub={t('lbl_completed_sub')}
                icon={CheckCircle}
                loading={appointmentsDoneLoading}
                secondaryValue={fmtNumber(appointmentsToday)}
                secondaryLabel={t('lbl_created_today_sub')}
                secondaryLoading={appointmentsTodayLoading}
              />
            </div>

          </div>

          <button
            onClick={() => navigate('/admin/staticalchanges')}
            className="flex-1 py-5 rounded-2xl text-sm font-bold tracking-wider uppercase transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: '#6a2a0070', color: COLORS.cardBrown }}>
            {t('btn_statical_changes')}
          </button>

          {/* Approval Action Grid */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/admin/registrationrequestapproval')}
              className="flex-1 py-5 rounded-2xl text-sm font-bold tracking-wider uppercase transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: COLORS.cardBrown, color: COLORS.white }}>
              {t('btn_reg_approval')}
            </button>
            <button
              onClick={() => navigate('/admin/gn-management/transfers')}
              className="flex-1 py-5 rounded-2xl text-sm font-bold tracking-wider uppercase transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: COLORS.cardBrown, color: COLORS.white }}>
              {t('btn_trans_approval')}
            </button>
          </div>

          {/* Graphs Grid */}
          <div className="flex gap-4 flex-wrap">

            {/* Appointment Flow */}
            <div className="flex-1 min-w-[300px] rounded-2xl p-5"
              style={{ background: COLORS.white, border: '1px solid #E8DDD0' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-sm" style={{ color: COLORS.primary }}>
                    {t('rate_appointments')}
                  </h3>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>
                    {t('rate_sub')}
                  </p>
                </div>
                <TrendingUp size={18} style={{ color: COLORS.accent }} />
              </div>
              {chartError && <ErrorBanner message={chartError} />}
              {chartLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 size={28} className="animate-spin" style={{ color: COLORS.accent }} />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0E8DC" />
                    <XAxis dataKey="day"
                      tick={{ fontSize: 11, fill: COLORS.textMuted }}
                      axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: COLORS.textMuted }}
                      axisLine={false} tickLine={false}
                      allowDecimals={false}
                      tickFormatter={(v) => Number.isInteger(v) ? v : ''}
                    />
                    <Tooltip contentStyle={{
                      background: COLORS.cardBrown, border: 'none',
                      borderRadius: 8, color: '#fff', fontSize: 12,
                    }} />
                    <Line type="monotone" dataKey="appointments"
                      stroke={COLORS.accent} strokeWidth={3}
                      dot={{ r: 5, fill: COLORS.primary, strokeWidth: 2, stroke: COLORS.accent }}
                      activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Live Activities Logger */}
            <div className="flex-1 min-w-[280px] rounded-2xl p-5 flex flex-col gap-3"
              style={{ background: COLORS.white, border: '1px solid #E8DDD0' }}>
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} style={{ color: COLORS.primary }} />
                <h3 className="font-bold text-sm" style={{ color: COLORS.primary }}>
                  {t('recent_activities_title')}
                </h3>
                <span className="ml-auto flex items-center gap-1 text-xs"
                  style={{ color: COLORS.textMuted }}>
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
                  {t('live_indicator')}
                </span>
              </div>
              {activityError && <ErrorBanner message={activityError} />}
              {activityLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 size={24} className="animate-spin" style={{ color: COLORS.accent }} />
                </div>
              ) : activityLogs.length === 0 ? (
                <p className="text-xs text-center py-8" style={{ color: COLORS.textMuted }}>
                  {t('no_activities')}
                </p>
              ) : (
                activityLogs.map((log) => {
                  const rawType = (log.type || '').toLowerCase().trim();
                  const meta = ACTIVITY_META[rawType] ?? DEFAULT_ACTIVITY_META;
                  const Icon = meta.icon;

                  const displayTitle = log.title || log.action || log.type || 'Activity';
                  const displayDesc  = log.description || null;

                  return (
                    <div key={log.id}
                      className="flex items-start gap-3 pb-3 border-b last:border-0"
                      style={{ borderColor: '#F0E8DC' }}>
                      <Icon size={15} color={meta.color} className="mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold leading-snug truncate"
                          style={{ color: COLORS.text }}>
                          {displayTitle}
                        </p>
                        {displayDesc && (
                          <p className="text-xs leading-snug opacity-75 truncate"
                            style={{ color: COLORS.text }}>
                            {displayDesc}
                          </p>
                        )}
                        <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
                          {timeAgo(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

        <footer className="text-center text-xs py-4"
          style={{ background: COLORS.cardDark, color: '#C8A882' }}>
          © 2026 Smart Grama Sewa. All rights reserved.
        </footer>
      </main>
    </div>
  );
}