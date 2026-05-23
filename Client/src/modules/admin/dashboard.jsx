// Client/src/modules/admin/dashboard.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';

import {
  collection, query, orderBy, limit,
  onSnapshot, getDocs, where, doc, getDoc,
} from 'firebase/firestore';

import {
  LayoutDashboard, ArrowLeftRight, BarChart2, UserCheck,
  Activity, Megaphone, Bell, Search, ChevronDown, User,
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
};

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

// ─── Skeleton ─────────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-lg ${className}`}
      style={{ background: 'rgba(255,255,255,0.18)' }} />
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

// ─── Stat Card ────────────────────────────────────────────────────────────
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
        active ? 'bg-amber-700 text-white font-bold'
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
  return (
    <aside className="w-64 flex-shrink-0 flex flex-col py-6 px-3 gap-2 border-r"
      style={{ borderColor: '#DDD0BC', background: COLORS.bg }}>

      {/* Logo */}
      <div className="flex items-center gap-2 px-3 mb-6">
        <img src="/logo2.png"></img>
      </div>

      {/* Nav links */}
      <ul className="flex flex-col gap-1 flex-1">
        <NavItem icon={LayoutDashboard} label="Dashboard" active />

        <li className="px-4 pt-3 pb-1 text-xs font-extrabold" style={{ color: COLORS.primary }}>
          GN management
        </li>
        <NavItem icon={UserCheck}      label="Registration Requests"
          onClick={() => navigate('/admin/gn-management/registrations')} />
        <NavItem icon={ArrowLeftRight} label="Transfer Request"
          onClick={() => navigate('/admin/gn-management/transfers')} />

        <li className="px-4 pt-3 pb-1 text-xs font-extrabold" style={{ color: COLORS.primary }}>
          Reports
        </li>
        <NavItem icon={BarChart2} label="System reports"
          onClick={() => navigate('/admin/reports/system')} />
        <NavItem icon={User}      label="Individual user access"
          onClick={() => navigate('/admin/reports/user-access')} />
        <NavItem icon={Activity}  label="GN activity reports"
          onClick={() => navigate('/admin/reports/gn-activity')} />

        <li className="px-4 pt-4">
          <NavItem icon={Megaphone} label="Announcements" bold
            onClick={() => navigate('/admin/announcements')} />
        </li>
        <li className="px-4 pt-1">
          <NavItem icon={Bell} label="Notifications" bold
            onClick={() => navigate('/admin/notifications')} />
        </li>
      </ul>

      {/* Logout */}
      <div className="px-3 pt-4 border-t" style={{ borderColor: '#DDD0BC' }}>
        <button onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm font-bold transition-all hover:bg-red-50"
          style={{ color: '#991B1B' }}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────
function Topbar({ adminName }) {
  const [searchVal, setSearchVal] = useState('');
  return (
    <header className="flex items-center gap-4 px-6 py-4 border-b"
      style={{ borderColor: '#DDD0BC', background: COLORS.bg }}>
      <div className="flex-1 relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2"
          style={{ color: COLORS.textMuted }} />
        <input
          className="w-full pl-10 pr-4 py-2.5 rounded-full border text-sm focus:outline-none"
          style={{ borderColor: '#C8B89A', background: '#FFF9F0', color: COLORS.text }}
          placeholder="search..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
        />
      </div>
      <button className="flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-full border"
        style={{ borderColor: '#C8B89A', color: COLORS.text, background: '#FFF9F0' }}>
        English <ChevronDown size={14} />
      </button>
      <button className="relative w-10 h-10 rounded-full flex items-center justify-center border"
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
  const navigate = useNavigate();

  const [adminName, setAdminName] = useState('');

  // Loading states
  const [usersLoading,        setUsersLoading]        = useState(true);
  const [gnOfficersLoading,   setGnOfficersLoading]   = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [chartLoading,        setChartLoading]        = useState(true);
  const [activityLoading,     setActivityLoading]     = useState(true);

  // Error states
  const [usersError,        setUsersError]        = useState(null);
  const [gnOfficersError,   setGnOfficersError]   = useState(null);
  const [appointmentsError, setAppointmentsError] = useState(null);
  const [chartError,        setChartError]        = useState(null);
  const [activityError,     setActivityError]     = useState(null);

  // Data states
  const [totalUsers,         setTotalUsers]         = useState(0);
  const [totalGnOfficers,    setTotalGnOfficers]    = useState(0);
  const [appointmentsPerDay, setAppointmentsPerDay] = useState(0);
  const [systemUsagePerDay,  setSystemUsagePerDay]  = useState(0);
  const [chartData,          setChartData]          = useState([]);
  const [activityLogs,       setActivityLogs]       = useState([]);

  // ── Get logged-in admin's fullName from gn_officers ───────────────────
  // gn_officers fields: uid, fullName, role
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

  // ── 1. Count `users` → Total registered Citizens ─────────────────────
  // users fields: uid, fullName, role, email, gnDiv, district, createdAt
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

  // ── 2. Count `gn_officers` → Total registered GN Officers ────────────
  // gn_officers fields: uid, fullName, role, gnDiv, gnDivision, district
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

  // ── 3. Count today's `appointments` → Appointments per day ───────────
  // appointments fields: uid, fullName, gnDiv, district,
  //                      service, slot, status, createdAt, date
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
        setAppointmentsPerDay(snap.size);
      } catch (err) {
        setAppointmentsError(`Appointments fetch failed: ${err.message}`);
      } finally {
        setAppointmentsLoading(false);
      }
    })();
  }, []);

  // ── 4. Count today's `activity_logs` → System usage per day ──────────
  // activity_logs fields: uid, action, type, title, description, createdAt
  useEffect(() => {
    (async () => {
      try {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);
        const q = query(
          collection(db, 'activity_logs'),
          where('createdAt', '>=', todayStart),
          where('createdAt', '<=', todayEnd)
        );
        const snap = await getDocs(q);
        setSystemUsagePerDay(snap.size);
      } catch (err) {
        console.error('System usage fetch failed:', err.message);
      }
    })();
  }, []);

  // ── 5. Weekly chart from `appointments.createdAt` ─────────────────────
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

        // Build last-7-days buckets
        const buckets = {};
        for (let i = 6; i >= 0; i--) {
          const d   = new Date();
          d.setDate(d.getDate() - i);
          const key = DAY_LABELS[d.getDay()];
          buckets[key] = { day: key, appointments: 0 };
        }

        // appointments.createdAt (Timestamp) → bucket by day label
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

  // ── 6. Real-time listener on `activity_logs` → Recent activities ──────
  // activity_logs fields: type, title, description, action, uid, createdAt
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

  // ── Logout ────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // ── Donut % (relative to totalGnOfficers) ─────────────────────────────
  const gnTotal = totalGnOfficers || 1;
  const pct     = (value) => Math.min(100, Math.round((value / gnTotal) * 100));

  const statCards = [
    {
      label:   'Total registered Citizen',
      value:   fmtNumber(totalUsers),
      pct:     pct(totalUsers),
      sub:     `${pct(totalUsers)}% of total Grama Niladhari officers in country`,
      loading: usersLoading,
      error:   usersError,
    },
    {
      label:   'Total registered Grama Niladhari',
      value:   fmtNumber(totalGnOfficers),
      pct:     100,
      sub:     `${totalGnOfficers} GN officers registered in the system`,
      loading: gnOfficersLoading,
      error:   gnOfficersError,
    },
    {
      label:   'System usage per day',
      value:   fmtNumber(systemUsagePerDay),
      pct:     pct(systemUsagePerDay),
      sub:     `${pct(systemUsagePerDay)}% of total Grama Niladhari officers in country`,
      loading: false,
      error:   null,
    },
    {
      label:   'Appointment per day',
      value:   fmtNumber(appointmentsPerDay),
      pct:     pct(appointmentsPerDay),
      sub:     `${pct(appointmentsPerDay)}% of total Grama Niladhari officers in country`,
      loading: appointmentsLoading,
      error:   appointmentsError,
    },
  ];

  return (
    <div className="flex min-h-screen"
      style={{ background: COLORS.bg, fontFamily: "'Lato', sans-serif" }}>

      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 flex flex-col min-h-screen">
        <Topbar adminName={adminName} />

        <div className="flex-1 p-6 flex flex-col gap-6">

          {/* Stat Cards */}
          <div className="flex gap-4 flex-wrap">
            {statCards.map((s) => (
              <div key={s.label} className="flex-1 min-w-[180px] flex flex-col gap-1">
                {s.error && <ErrorBanner message={s.error} />}
                <StatCard label={s.label} value={s.value}
                  pct={s.pct} sub={s.sub} loading={s.loading} />
              </div>
            ))}
          </div>

          {/* Approval Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/admin/gn-management/registrations')}
              className="flex-1 py-5 rounded-2xl text-sm font-bold tracking-wider uppercase transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: COLORS.cardBrown, color: COLORS.white }}>
              registration approval
            </button>
            <button
              onClick={() => navigate('/admin/gn-management/transfers')}
              className="flex-1 py-5 rounded-2xl text-sm font-bold tracking-wider uppercase transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: COLORS.cardDark, color: COLORS.white }}>
              transfer approval
            </button>
          </div>

          {/* Chart + Activities */}
          <div className="flex gap-4 flex-wrap">

            {/* Weekly Appointments Chart */}
            <div className="flex-1 min-w-[300px] rounded-2xl p-5"
              style={{ background: COLORS.white, border: '1px solid #E8DDD0' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-sm" style={{ color: COLORS.primary }}>
                    Appointments rate
                  </h3>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>
                    appointments per week
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
                    <YAxis tick={{ fontSize: 11, fill: COLORS.textMuted }}
                      axisLine={false} tickLine={false} />
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

            {/* Recent Activities */}
            <div className="flex-1 min-w-[280px] rounded-2xl p-5 flex flex-col gap-3"
              style={{ background: COLORS.white, border: '1px solid #E8DDD0' }}>
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} style={{ color: COLORS.primary }} />
                <h3 className="font-bold text-sm" style={{ color: COLORS.primary }}>
                  Recent activities
                </h3>
                <span className="ml-auto flex items-center gap-1 text-xs"
                  style={{ color: COLORS.textMuted }}>
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
                  live
                </span>
              </div>
              {activityError && <ErrorBanner message={activityError} />}
              {activityLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 size={24} className="animate-spin" style={{ color: COLORS.accent }} />
                </div>
              ) : activityLogs.length === 0 ? (
                <p className="text-xs text-center py-8" style={{ color: COLORS.textMuted }}>
                  No recent activities found.
                </p>
              ) : (
                activityLogs.map((log) => {
                  // activity_logs fields: type, title, description, action, createdAt
                  const meta = ACTIVITY_META[log.type] ?? ACTIVITY_META.report;
                  const Icon = meta.icon;
                  return (
                    <div key={log.id}
                      className="flex items-start gap-3 pb-3 border-b last:border-0"
                      style={{ borderColor: '#F0E8DC' }}>
                      <Icon size={15} color={meta.color} className="mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold leading-snug"
                          style={{ color: COLORS.text }}>
                          {log.title || log.action || 'Activity'}
                        </p>
                        {log.description && (
                          <p className="text-xs leading-snug opacity-75"
                            style={{ color: COLORS.text }}>
                            {log.description}
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