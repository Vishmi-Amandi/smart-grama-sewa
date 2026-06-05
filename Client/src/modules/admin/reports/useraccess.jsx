import { useState, useEffect } from "react";
import {
  LayoutDashboard, UserCheck, ArrowLeftRight, BarChart2, User,
  Activity, LogOut, Search, ChevronDown, Megaphone,
  TrendingUp, TrendingDown, Users, Calendar, Clock,
  Download, Filter, ChevronRight, CheckCircle, XCircle,
  Shield, FileText, Eye, LogIn, LogOut as LogOutIcon,
  AlertTriangle, Edit, Bell, Megaphone as MegaphoneIcon,
  ClipboardList, History, MapPin, RefreshCw
} from "lucide-react";
import * as Icon from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// ─── Firebase ────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ─── Colors ──────────────────────────────────────────────────────────────────
const COLORS = {
  primary:   '#7B2D00',
  accent:    '#F5A623',
  bg:        '#F5F0E8',
  dark:      '#6B2400',
  darker:    '#3D1500',
  darkest:   '#2C1200',
  muted:     '#7A5C44',
  white:     '#FFFFFF',
  cardDark:  '#3D1500',
  border:    '#DDD0BC',
  inputBg:   '#FFF9F0',
  text:      '#2C1200',
  textMuted: '#7A5C44',
  success:   '#166534',
  successBg: '#dcfce7',
  warn:      '#854d0e',
  warnBg:    '#fef9c3',
  danger:    '#991b1b',
  dangerBg:  '#fee2e2',
  chart:     ['#7B2D00','#F5A623','#6B2400','#C8A882','#3D1500','#F5C87A','#B05A00'],
};

// ─── Sub-report definitions ──────────────────────────────────────────────────
const SUB_REPORTS = [
  { id: 'login-history',   label: 'A. Login History Report',     icon: LogIn },
  { id: 'appt-history',    label: 'B. Appointment History Report', icon: Calendar },
  { id: 'action-log',      label: 'C. Action Log Report',         icon: ClipboardList },
  { id: 'daily-activity',  label: 'D. Daily Activity Report',     icon: Activity },
  { id: 'avail-history',   label: 'E. Availability History Report', icon: Clock },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (v?.toDate) return v.toDate();
  if (typeof v === 'string' || typeof v === 'number') return new Date(v);
  return null;
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-LK', { day:'2-digit', month:'short', year:'numeric' });
}
function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-LK', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function daysAgo(d) {
  if (!d) return 9999;
  return Math.floor((Date.now() - new Date(d).getTime()) / 864e5);
}

// ─── Shared: StatCard ─────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Ic, accent, trend }) {
  return (
    <div className="rounded-xl p-5 flex flex-col gap-2"
      style={{ background: COLORS.white, border:`1px solid ${COLORS.border}`, minWidth:0 }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color:COLORS.textMuted }}>{label}</span>
        <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: accent||COLORS.bg }}>
          {Ic && <Ic size={18} color={COLORS.primary}/>}
        </span>
      </div>
      <div className="text-3xl font-bold" style={{ color:COLORS.darkest }}>{value}</div>
      {sub && (
        <div className="text-xs flex items-center gap-1" style={{ color:COLORS.textMuted }}>
          {trend==='up'   && <TrendingUp   size={12} color="#16a34a"/>}
          {trend==='down' && <TrendingDown size={12} color="#dc2626"/>}
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Shared: SectionHead ──────────────────────────────────────────────────────
function SectionHead({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-bold" style={{ color:COLORS.darkest }}>{title}</h2>
      {subtitle && <p className="text-xs mt-0.5" style={{ color:COLORS.textMuted }}>{subtitle}</p>}
    </div>
  );
}

// ─── Shared: Skeleton ────────────────────────────────────────────────────────
function Sk({ h=20, w='100%', r=8 }) {
  return <div style={{ height:h, width:w, borderRadius:r, background:COLORS.border, opacity:0.5, animation:'pulse 1.5s ease-in-out infinite' }}/>;
}

// ─── Shared: Badge ────────────────────────────────────────────────────────────
function Badge({ label, type='neutral' }) {
  const map = {
    success: { bg:COLORS.successBg, color:COLORS.success },
    warn:    { bg:COLORS.warnBg,    color:COLORS.warn },
    danger:  { bg:COLORS.dangerBg,  color:COLORS.danger },
    neutral: { bg:COLORS.bg,        color:COLORS.muted },
    primary: { bg:'#fdf0e0',        color:COLORS.primary },
    info:    { bg:'#e0f2fe',        color:'#0369a1' },
  };
  const s = map[type]||map.neutral;
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ background:s.bg, color:s.color }}>{label}</span>
  );
}

// ─── Shared: TableCard ───────────────────────────────────────────────────────
function TableCard({ title, count, columns, rows, emptyMsg='No data in selected range.' }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border:`1px solid ${COLORS.border}` }}>
      <div className="px-5 py-3 flex items-center justify-between" style={{ background:COLORS.primary }}>
        <span className="text-sm font-bold text-white">{title}</span>
        {count !== undefined && <span className="text-xs" style={{ color:'#C8A882' }}>{count} records</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ background:COLORS.white }}>
          <thead>
            <tr style={{ background:COLORS.bg, color:COLORS.textMuted, fontSize:11 }}>
              {columns.map(c => <th key={c} className="px-4 py-2 text-left font-semibold whitespace-nowrap">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0
              ? <tr><td colSpan={columns.length} className="px-4 py-6 text-center text-sm" style={{ color:COLORS.textMuted }}>{emptyMsg}</td></tr>
              : rows}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Date Filter Bar ─────────────────────────────────────────────────────────
function DateFilterBar({ sort, setSort, startDate, setStartDate, endDate, setEndDate, onApply, onReset }) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl mb-6"
      style={{ background:COLORS.white, border:`1px solid ${COLORS.border}` }}>
      <Filter size={15} color={COLORS.primary}/>
      <span className="text-xs font-bold uppercase tracking-wider mr-1" style={{ color:COLORS.primary }}>Filters</span>
      <select value={sort} onChange={e=>setSort(e.target.value)}
        className="px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-amber-300"
        style={{ borderColor:COLORS.border, background:COLORS.inputBg, color:COLORS.text }}>
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
      </select>
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium" style={{ color:COLORS.textMuted }}>From</label>
        <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-amber-300"
          style={{ borderColor:COLORS.border, background:COLORS.inputBg, color:COLORS.text }}/>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium" style={{ color:COLORS.textMuted }}>To</label>
        <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-amber-300"
          style={{ borderColor:COLORS.border, background:COLORS.inputBg, color:COLORS.text }}/>
      </div>
      <button onClick={onApply}
        className="px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
        style={{ background:COLORS.primary, color:COLORS.white }}>Apply</button>
      <button onClick={onReset}
        className="px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-50"
        style={{ border:`1px solid ${COLORS.border}`, color:COLORS.textMuted, background:'transparent' }}>Reset</button>
    </div>
  );
}

// ─── GN Selector ─────────────────────────────────────────────────────────────
function GNSelector({ gnList, selectedGN, onSelect }) {
  return (
    <div className="flex flex-col gap-1 mb-6">
      <label className="text-xs font-bold uppercase tracking-wider" style={{ color:COLORS.primary }}>
        Select GN Officer
      </label>
      <div className="relative" style={{ maxWidth:400 }}>
        <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color={COLORS.textMuted}/>
        <select
          value={selectedGN?.uid || ''}
          onChange={e => {
            const gn = gnList.find(g => g.uid === e.target.value);
            onSelect(gn || null);
          }}
          className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm font-semibold border-2 focus:outline-none focus:ring-2 focus:ring-amber-300 appearance-none cursor-pointer"
          style={{ borderColor:COLORS.primary, background:COLORS.white, color:COLORS.darkest }}>
          <option value="">— Choose a GN Officer —</option>
          {gnList.map(g => (
            <option key={g.uid||g.id} value={g.uid||g.id}>
              {g.fullName || g.username || '—'} · {g.gnDivisionName || g.gnDiv || '—'} · {g.district || '—'}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" color={COLORS.primary}/>
      </div>
    </div>
  );
}

// ─── GN Profile Card ─────────────────────────────────────────────────────────
function GNProfileCard({ gn }) {
  if (!gn) return null;
  const lastLoginDays = daysAgo(toDate(gn.lastLogin));
  const status = lastLoginDays <= 7 ? 'active' : lastLoginDays <= 30 ? 'moderate' : 'inactive';
  const statusColor = { active:COLORS.success, moderate:COLORS.warn, inactive:COLORS.danger };
  const statusBg    = { active:COLORS.successBg, moderate:COLORS.warnBg, inactive:COLORS.dangerBg };

  return (
    <div className="rounded-xl p-5 mb-6 flex items-center gap-6"
      style={{ background:COLORS.white, border:`1.5px solid ${COLORS.border}`,
        borderLeft:`4px solid ${COLORS.primary}` }}>
      {/* Avatar */}
      <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-extrabold"
        style={{ background:COLORS.primary, color:COLORS.white }}>
        {(gn.fullName||'?').slice(0,2).toUpperCase()}
      </div>
      {/* Info */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color:COLORS.textMuted }}>Full Name</p>
          <p className="text-sm font-bold" style={{ color:COLORS.darkest }}>{gn.fullName||'—'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color:COLORS.textMuted }}>GN Division</p>
          <p className="text-sm font-semibold" style={{ color:COLORS.text }}>{gn.gnDivisionName||gn.gnDiv||'—'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color:COLORS.textMuted }}>District</p>
          <p className="text-sm" style={{ color:COLORS.text }}>{gn.district||'—'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color:COLORS.textMuted }}>Email</p>
          <p className="text-sm" style={{ color:COLORS.text }}>{gn.email||'—'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color:COLORS.textMuted }}>GN Code</p>
          <p className="text-sm font-mono" style={{ color:COLORS.text }}>{gn.gnCode||'—'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color:COLORS.textMuted }}>Last Login</p>
          <p className="text-sm" style={{ color:COLORS.text }}>{fmtDate(toDate(gn.lastLogin))}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color:COLORS.textMuted }}>Joined</p>
          <p className="text-sm" style={{ color:COLORS.text }}>{fmtDate(toDate(gn.createdAt))}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color:COLORS.textMuted }}>Status</p>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold capitalize"
            style={{ background:statusBg[status], color:statusColor[status] }}>
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Empty GN Selector placeholder ───────────────────────────────────────────
function NoGNSelected() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-xl"
      style={{ background:COLORS.white, border:`1.5px dashed ${COLORS.border}` }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background:COLORS.bg }}>
        <User size={28} color={COLORS.textMuted}/>
      </div>
      <p className="text-sm font-semibold" style={{ color:COLORS.textMuted }}>
        Please select a GN Officer above to load the report
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// A. LOGIN HISTORY REPORT
// ═══════════════════════════════════════════════════════════════════════════
function LoginHistoryReport({ gn, startDate, endDate, sort }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gn) { setData(null); return; }
    async function load() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'activity_logs'));
        let logs = snap.docs.map(d => ({ ...d.data(), id:d.id }))
          .filter(l => l.uid === (gn.uid || gn.id));

        const loginLogs  = logs.filter(l => (l.action||l.type||'').toLowerCase().includes('login'));
        const failedLogs = loginLogs.filter(l => (l.action||l.type||'').toLowerCase().includes('fail') || (l.description||'').toLowerCase().includes('fail'));

        if (startDate) loginLogs.splice(0, loginLogs.length, ...loginLogs.filter(l => toDate(l.createdAt) >= new Date(startDate)));
        if (endDate) { const ed = new Date(endDate); ed.setHours(23,59,59); loginLogs.splice(0, loginLogs.length, ...loginLogs.filter(l => toDate(l.createdAt) <= ed)); }

        loginLogs.sort(sort === 'oldest'
          ? (a,b) => (toDate(a.createdAt)||0) - (toDate(b.createdAt)||0)
          : (a,b) => (toDate(b.createdAt)||0) - (toDate(a.createdAt)||0));

        // Daily login trend (last 30 days)
        const days30 = Array.from({ length:30 }, (_,i) => {
          const d = new Date(); d.setDate(d.getDate() - (29-i));
          return d.toISOString().slice(0,10);
        });
        const dailyTrend = days30.map(day => ({
          date: day.slice(5),
          logins: loginLogs.filter(l => toDate(l.createdAt)?.toISOString().slice(0,10) === day).length,
        }));

        // Hour distribution
        const hourBuckets = Array(24).fill(0);
        loginLogs.forEach(l => { const d = toDate(l.createdAt); if (d) hourBuckets[d.getHours()]++; });
        const hourData = Array.from({ length:24 }, (_,h) => ({
          hour: `${String(h).padStart(2,'0')}:00`, logins: hourBuckets[h]
        })).filter((_,h) => h >= 5 && h <= 23);

        setData({ loginLogs, failedLogs, dailyTrend, hourData,
          total: loginLogs.length,
          failed: failedLogs.length,
          lastLogin: toDate(gn.lastLogin),
        });
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [gn, startDate, endDate, sort]);

  if (!gn) return <NoGNSelected/>;
  if (loading) return <div className="flex flex-col gap-4"><div className="grid grid-cols-3 gap-4">{[1,2,3].map(i=><Sk key={i} h={110}/>)}</div><Sk h={260}/><Sk h={240}/></div>;
  if (!data) return <p style={{ color:COLORS.textMuted }}>No data.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Login Sessions" value={data.total}      icon={LogIn}     accent="#fdf0e0" sub="All login events recorded"/>
        <StatCard label="Failed Attempts"       value={data.failed}    icon={Shield}    accent={COLORS.dangerBg} sub="Authentication failures" trend="down"/>
        <StatCard label="Success Rate"
          value={data.total > 0 ? `${Math.round(((data.total - data.failed)/data.total)*100)}%` : '—'}
          icon={CheckCircle} accent={COLORS.successBg} sub="Successful logins" trend="up"/>
        <StatCard label="Last Login" value={fmtDate(data.lastLogin)} icon={Clock} accent="#fdf0e0" sub="Most recent session"/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background:COLORS.white, border:`1px solid ${COLORS.border}` }}>
          <SectionHead title="Daily Login Trend (Last 30 Days)" subtitle="Login frequency over time"/>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.dailyTrend}>
              <defs>
                <linearGradient id="lgA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={COLORS.primary} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border}/>
              <XAxis dataKey="date" tick={{ fontSize:10, fill:COLORS.textMuted }} interval={5}/>
              <YAxis tick={{ fontSize:11, fill:COLORS.textMuted }}/>
              <Tooltip contentStyle={{ background:COLORS.white, border:`1px solid ${COLORS.border}`, borderRadius:8 }}/>
              <Area type="monotone" dataKey="logins" stroke={COLORS.primary} fill="url(#lgA)" strokeWidth={2} name="Logins"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl p-5" style={{ background:COLORS.white, border:`1px solid ${COLORS.border}` }}>
          <SectionHead title="Login Hours Distribution" subtitle="When this GN typically logs in"/>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.hourData} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border}/>
              <XAxis dataKey="hour" tick={{ fontSize:9, fill:COLORS.textMuted }} interval={2}/>
              <YAxis tick={{ fontSize:11, fill:COLORS.textMuted }}/>
              <Tooltip contentStyle={{ background:COLORS.white, border:`1px solid ${COLORS.border}`, borderRadius:8 }}/>
              <Bar dataKey="logins" name="Logins" radius={[4,4,0,0]}>
                {data.hourData.map((e,i) => {
                  const isPeak = e.logins === Math.max(...data.hourData.map(h=>h.logins));
                  return <Cell key={i} fill={isPeak ? COLORS.accent : COLORS.primary} fillOpacity={isPeak ? 1 : 0.75}/>;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs mt-1" style={{ color:COLORS.textMuted }}>
            <span className="inline-block w-2.5 h-2.5 rounded mr-1" style={{ background:COLORS.accent, verticalAlign:'middle' }}/>
            Peak login hour highlighted
          </p>
        </div>
      </div>

      <TableCard
        title={`Login Session History — ${gn.fullName}`}
        count={data.loginLogs.length}
        columns={['#', 'Event Title', 'Action', 'Type', 'Description', 'Date & Time', 'Status']}
        rows={data.loginLogs.slice(0,20).map((l,i) => {
          const isFail = (l.action||l.type||'').toLowerCase().includes('fail') || (l.description||'').toLowerCase().includes('fail');
          return (
            <tr key={l.id} style={{ borderTop:`1px solid ${COLORS.border}`, background:i%2===0?COLORS.white:COLORS.bg }}>
              <td className="px-4 py-2.5 text-xs font-bold" style={{ color:COLORS.textMuted }}>{i+1}</td>
              <td className="px-4 py-2.5 text-xs font-semibold" style={{ color:COLORS.darkest }}>{l.title||'Login Event'}</td>
              <td className="px-4 py-2.5 text-xs" style={{ color:COLORS.text }}>{l.action||'—'}</td>
              <td className="px-4 py-2.5 text-xs" style={{ color:COLORS.textMuted }}>{l.type||'—'}</td>
              <td className="px-4 py-2.5 text-xs max-w-xs truncate" style={{ color:COLORS.textMuted }}>{l.description||'—'}</td>
              <td className="px-4 py-2.5 text-xs whitespace-nowrap" style={{ color:COLORS.textMuted }}>{fmtDateTime(toDate(l.createdAt))}</td>
              <td className="px-4 py-2.5">
                <Badge label={isFail?'failed':'success'} type={isFail?'danger':'success'}/>
              </td>
            </tr>
          );
        })}
        emptyMsg="No login sessions found for this GN in the selected range."
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// B. APPOINTMENT HISTORY REPORT
// ═══════════════════════════════════════════════════════════════════════════
function AppointmentHistoryReport({ gn, startDate, endDate, sort }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gn) { setData(null); return; }
    async function load() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'appointments'));
        let appts = snap.docs.map(d => ({ ...d.data(), id:d.id }))
          .filter(a => a.gnDiv === gn.gnDiv || a.uid === (gn.uid||gn.id));

        if (startDate) appts = appts.filter(a => toDate(a.createdAt) >= new Date(startDate));
        if (endDate)   { const ed = new Date(endDate); ed.setHours(23,59,59); appts = appts.filter(a => toDate(a.createdAt) <= ed); }

        appts.sort(sort === 'oldest'
          ? (a,b) => (toDate(a.createdAt)||0) - (toDate(b.createdAt)||0)
          : (a,b) => (toDate(b.createdAt)||0) - (toDate(a.createdAt)||0));

        const completed = appts.filter(a => (a.status||'').toLowerCase() === 'completed').length;
        const cancelled = appts.filter(a => (a.status||'').toLowerCase() === 'cancelled').length;
        const pending   = appts.filter(a => (a.status||'').toLowerCase() === 'pending').length;

        // Daily appt trend (last 30 days)
        const days30 = Array.from({ length:30 }, (_,i) => {
          const d = new Date(); d.setDate(d.getDate() - (29-i));
          return d.toISOString().slice(0,10);
        });
        const dailyTrend = days30.map(day => ({
          date: day.slice(5),
          count: appts.filter(a => toDate(a.createdAt)?.toISOString().slice(0,10) === day).length,
        }));

        // Service breakdown
        const svcMap = {};
        appts.forEach(a => { const s = a.service||'Other'; svcMap[s] = (svcMap[s]||0)+1; });
        const serviceData = Object.entries(svcMap).sort((a,b)=>b[1]-a[1]).slice(0,6)
          .map(([name,value],i) => ({ name, value, color: COLORS.chart[i] || '#C8A882' }));

        const compRate = appts.length ? Math.round((completed/appts.length)*100) : 0;

        setData({ appts, completed, cancelled, pending, dailyTrend, serviceData, compRate, total:appts.length });
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [gn, startDate, endDate, sort]);

  if (!gn) return <NoGNSelected/>;
  if (loading) return <div className="flex flex-col gap-4"><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i=><Sk key={i} h={110}/>)}</div><Sk h={260}/><Sk h={240}/></div>;
  if (!data) return <p style={{ color:COLORS.textMuted }}>No data.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Appointments" value={data.total}      icon={Calendar}    accent="#fdf0e0"/>
        <StatCard label="Completed"           value={data.completed} icon={CheckCircle} accent={COLORS.successBg} sub={`${data.compRate}% completion rate`} trend="up"/>
        <StatCard label="Cancelled"           value={data.cancelled} icon={XCircle}     accent={COLORS.dangerBg}  sub="Not completed" trend="down"/>
        <StatCard label="Pending"             value={data.pending}   icon={Clock}       accent={COLORS.warnBg}    sub="Awaiting action"/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background:COLORS.white, border:`1px solid ${COLORS.border}` }}>
          <SectionHead title="Appointment Trend (Last 30 Days)" subtitle="Daily appointment volume handled by this GN"/>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.dailyTrend}>
              <defs>
                <linearGradient id="lgB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={COLORS.accent} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border}/>
              <XAxis dataKey="date" tick={{ fontSize:10, fill:COLORS.textMuted }} interval={5}/>
              <YAxis tick={{ fontSize:11, fill:COLORS.textMuted }}/>
              <Tooltip contentStyle={{ background:COLORS.white, border:`1px solid ${COLORS.border}`, borderRadius:8 }}/>
              <Area type="monotone" dataKey="count" stroke={COLORS.accent} fill="url(#lgB)" strokeWidth={2} name="Appointments"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl p-5" style={{ background:COLORS.white, border:`1px solid ${COLORS.border}` }}>
          <SectionHead title="Service Type Breakdown" subtitle="Which services were most requested"/>
          {data.serviceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.serviceData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {data.serviceData.map((e,i) => <Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip contentStyle={{ background:COLORS.white, border:`1px solid ${COLORS.border}`, borderRadius:8 }}/>
                <Legend wrapperStyle={{ fontSize:11, color:COLORS.textMuted }}/>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48" style={{ color:COLORS.textMuted, fontSize:13 }}>
              No service data available
            </div>
          )}
        </div>
      </div>

      <TableCard
        title={`Appointment History — ${gn.fullName}`}
        count={data.total}
        columns={['#','Citizen Name','NIC','Mobile','Service','Date','Slot','Notes','Status']}
        rows={data.appts.slice(0,20).map((a,i) => {
          const st = (a.status||'').toLowerCase();
          const type = st==='completed'?'success':st==='cancelled'?'danger':'warn';
          return (
            <tr key={a.id} style={{ borderTop:`1px solid ${COLORS.border}`, background:i%2===0?COLORS.white:COLORS.bg }}>
              <td className="px-4 py-2.5 text-xs font-bold" style={{ color:COLORS.textMuted }}>{i+1}</td>
              <td className="px-4 py-2.5 text-xs font-semibold" style={{ color:COLORS.darkest }}>{a.fullName||'—'}</td>
              <td className="px-4 py-2.5 text-xs font-mono" style={{ color:COLORS.textMuted }}>{a.nic||'—'}</td>
              <td className="px-4 py-2.5 text-xs" style={{ color:COLORS.textMuted }}>{a.mobile||'—'}</td>
              <td className="px-4 py-2.5 text-xs" style={{ color:COLORS.text }}>{a.service||'—'}</td>
              <td className="px-4 py-2.5 text-xs whitespace-nowrap" style={{ color:COLORS.textMuted }}>{a.date||'—'}</td>
              <td className="px-4 py-2.5 text-xs" style={{ color:COLORS.textMuted }}>{a.slot||'—'}</td>
              <td className="px-4 py-2.5 text-xs max-w-xs truncate" style={{ color:COLORS.textMuted }}>{a.notes||'—'}</td>
              <td className="px-4 py-2.5"><Badge label={a.status||'unknown'} type={type}/></td>
            </tr>
          );
        })}
        emptyMsg="No appointments found for this GN in the selected range."
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// C. ACTION LOG REPORT
// ═══════════════════════════════════════════════════════════════════════════
function ActionLogReport({ gn, startDate, endDate, sort }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gn) { setData(null); return; }
    async function load() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'activity_logs'));
        let logs = snap.docs.map(d => ({ ...d.data(), id:d.id }))
          .filter(l => l.uid === (gn.uid||gn.id));

        if (startDate) logs = logs.filter(l => toDate(l.createdAt) >= new Date(startDate));
        if (endDate)   { const ed = new Date(endDate); ed.setHours(23,59,59); logs = logs.filter(l => toDate(l.createdAt) <= ed); }

        logs.sort(sort === 'oldest'
          ? (a,b) => (toDate(a.createdAt)||0) - (toDate(b.createdAt)||0)
          : (a,b) => (toDate(b.createdAt)||0) - (toDate(a.createdAt)||0));

        // Categorise actions
        const classify = l => {
          const a = (l.action||l.type||l.title||'').toLowerCase();
          if (a.includes('approv') || a.includes('reject') || a.includes('appoint')) return 'appointment';
          if (a.includes('schedule') || a.includes('avail') || a.includes('slot') || a.includes('hour')) return 'schedule';
          if (a.includes('announce') || a.includes('post') || a.includes('publish')) return 'announcement';
          if (a.includes('login') || a.includes('logout') || a.includes('auth')) return 'auth';
          if (a.includes('update') || a.includes('edit') || a.includes('change') || a.includes('profile')) return 'profile';
          return 'other';
        };

        const categorised = logs.map(l => ({ ...l, category: classify(l) }));
        const catCounts = {};
        categorised.forEach(l => { catCounts[l.category] = (catCounts[l.category]||0)+1; });

        const catPie = Object.entries(catCounts).map(([name,value],i) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value, color: COLORS.chart[i]||'#C8A882'
        }));

        // Daily actions
        const days14 = Array.from({ length:14 }, (_,i) => {
          const d = new Date(); d.setDate(d.getDate() - (13-i));
          return d.toISOString().slice(0,10);
        });
        const daily = days14.map(day => ({
          date: day.slice(5),
          actions: logs.filter(l => toDate(l.createdAt)?.toISOString().slice(0,10) === day).length,
        }));

        const catIconMap = {
          appointment: { icon: Calendar,   color:COLORS.primary,  bg:'#fdf0e0' },
          schedule:    { icon: Clock,       color:COLORS.dark,     bg:COLORS.bg },
          announcement:{ icon: Bell,        color:COLORS.darker,   bg:'#f3e8d0' },
          auth:        { icon: Shield,      color:'#0369a1',       bg:'#e0f2fe' },
          profile:     { icon: Edit,        color:COLORS.muted,    bg:COLORS.bg },
          other:       { icon: FileText,    color:'#6b7280',       bg:'#f9fafb' },
        };

        setData({ logs: categorised, catPie, daily, catCounts, catIconMap, total:logs.length });
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [gn, startDate, endDate, sort]);

  if (!gn) return <NoGNSelected/>;
  if (loading) return <div className="flex flex-col gap-4"><div className="grid grid-cols-3 gap-4">{[1,2,3].map(i=><Sk key={i} h={110}/>)}</div><Sk h={260}/><Sk h={240}/></div>;
  if (!data) return <p style={{ color:COLORS.textMuted }}>No data.</p>;

  return (
    <div className="flex flex-col gap-6">
      {/* Action category summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {['appointment','schedule','announcement','auth','profile','other'].map(cat => {
          const meta = data.catIconMap[cat];
          const Ic = meta.icon;
          const count = data.catCounts[cat] || 0;
          return (
            <div key={cat} className="rounded-xl p-4 flex flex-col gap-2"
              style={{ background:COLORS.white, border:`1px solid ${COLORS.border}` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:meta.bg }}>
                <Ic size={16} color={meta.color}/>
              </div>
              <p className="text-xl font-extrabold" style={{ color:COLORS.darkest }}>{count}</p>
              <p className="text-xs font-semibold capitalize" style={{ color:COLORS.textMuted }}>{cat}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background:COLORS.white, border:`1px solid ${COLORS.border}` }}>
          <SectionHead title="Daily Action Volume (Last 14 Days)" subtitle="Total logged actions per day"/>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.daily} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border}/>
              <XAxis dataKey="date" tick={{ fontSize:11, fill:COLORS.textMuted }}/>
              <YAxis tick={{ fontSize:11, fill:COLORS.textMuted }}/>
              <Tooltip contentStyle={{ background:COLORS.white, border:`1px solid ${COLORS.border}`, borderRadius:8 }}/>
              <Bar dataKey="actions" name="Actions" radius={[5,5,0,0]}>
                {data.daily.map((_,i) => <Cell key={i} fill={i%2===0?COLORS.primary:COLORS.dark}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl p-5" style={{ background:COLORS.white, border:`1px solid ${COLORS.border}` }}>
          <SectionHead title="Action Type Distribution" subtitle="Breakdown of what this GN has been doing"/>
          {data.catPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.catPie} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {data.catPie.map((e,i) => <Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip contentStyle={{ background:COLORS.white, border:`1px solid ${COLORS.border}`, borderRadius:8 }}/>
                <Legend wrapperStyle={{ fontSize:11, color:COLORS.textMuted }}/>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm" style={{ color:COLORS.textMuted }}>No action data available</div>
          )}
        </div>
      </div>

      <TableCard
        title={`Full Action Audit Log — ${gn.fullName}`}
        count={data.total}
        columns={['#','Title','Action','Type','Description','Timestamp','Category']}
        rows={data.logs.slice(0,20).map((l,i) => {
          const meta = data.catIconMap[l.category]||data.catIconMap.other;
          const Ic = meta.icon;
          return (
            <tr key={l.id} style={{ borderTop:`1px solid ${COLORS.border}`, background:i%2===0?COLORS.white:COLORS.bg }}>
              <td className="px-4 py-2.5 text-xs font-bold" style={{ color:COLORS.textMuted }}>{i+1}</td>
              <td className="px-4 py-2.5 text-xs font-semibold" style={{ color:COLORS.darkest }}>{l.title||'—'}</td>
              <td className="px-4 py-2.5 text-xs" style={{ color:COLORS.text }}>{l.action||'—'}</td>
              <td className="px-4 py-2.5 text-xs" style={{ color:COLORS.textMuted }}>{l.type||'—'}</td>
              <td className="px-4 py-2.5 text-xs max-w-xs truncate" style={{ color:COLORS.textMuted }}>{l.description||'—'}</td>
              <td className="px-4 py-2.5 text-xs whitespace-nowrap" style={{ color:COLORS.textMuted }}>{fmtDateTime(toDate(l.createdAt))}</td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background:meta.bg }}>
                    <Ic size={11} color={meta.color}/>
                  </div>
                  <span className="text-xs capitalize font-semibold" style={{ color:meta.color }}>{l.category}</span>
                </div>
              </td>
            </tr>
          );
        })}
        emptyMsg="No action logs found for this GN in the selected range."
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// D. DAILY ACTIVITY REPORT
// ═══════════════════════════════════════════════════════════════════════════
function DailyActivityReport({ gn, startDate, endDate, sort }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gn) { setData(null); return; }
    async function load() {
      setLoading(true);
      try {
        const [logSnap, apptSnap] = await Promise.all([
          getDocs(collection(db, 'activity_logs')),
          getDocs(collection(db, 'appointments')),
        ]);
        let logs  = logSnap.docs.map(d => ({ ...d.data(), id:d.id })).filter(l => l.uid === (gn.uid||gn.id));
        let appts = apptSnap.docs.map(d => ({ ...d.data(), id:d.id })).filter(a => a.gnDiv===gn.gnDiv || a.uid===(gn.uid||gn.id));

        if (startDate) { logs=logs.filter(l=>toDate(l.createdAt)>=new Date(startDate)); appts=appts.filter(a=>toDate(a.createdAt)>=new Date(startDate)); }
        if (endDate) {
          const ed=new Date(endDate); ed.setHours(23,59,59);
          logs=logs.filter(l=>toDate(l.createdAt)<=ed);
          appts=appts.filter(a=>toDate(a.createdAt)<=ed);
        }

        // Build per-day activity summary (last 30 days or within range)
        const days30 = Array.from({ length:30 }, (_,i) => {
          const d = new Date(); d.setDate(d.getDate() - (29-i));
          return d.toISOString().slice(0,10);
        });

        const dailySummary = days30.map(day => {
          const dayLogs  = logs.filter(l  => toDate(l.createdAt)?.toISOString().slice(0,10)  === day);
          const dayAppts = appts.filter(a => toDate(a.createdAt)?.toISOString().slice(0,10) === day);
          return {
            date:    day.slice(5),
            fullDate: day,
            actions: dayLogs.length,
            appts:   dayAppts.length,
            total:   dayLogs.length + dayAppts.length,
          };
        }).filter(d => d.total > 0 || sort === 'oldest');

        // Sort
        const sorted = sort === 'oldest'
          ? [...dailySummary].sort((a,b) => a.fullDate.localeCompare(b.fullDate))
          : [...dailySummary].sort((a,b) => b.fullDate.localeCompare(a.fullDate));

        // Heatmap data: last 30 days grid
        const heatData = days30.map(day => {
          const dayLogs  = logs.filter(l  => toDate(l.createdAt)?.toISOString().slice(0,10)  === day).length;
          const dayAppts = appts.filter(a => toDate(a.createdAt)?.toISOString().slice(0,10) === day).length;
          return { date: day, total: dayLogs + dayAppts };
        });

        const maxActivity = Math.max(...heatData.map(d => d.total), 1);
        const activeDays = heatData.filter(d => d.total > 0).length;
        const totalActions = logs.length;
        const avgPerDay = activeDays > 0 ? (totalActions / activeDays).toFixed(1) : '0';

        // Chart for last 30 days
        const chartData = days30.map(day => ({
          date: day.slice(5),
          Actions: logs.filter(l => toDate(l.createdAt)?.toISOString().slice(0,10) === day).length,
          Appointments: appts.filter(a => toDate(a.createdAt)?.toISOString().slice(0,10) === day).length,
        }));

        setData({ sorted, chartData, heatData, maxActivity, activeDays, totalActions, avgPerDay, totalAppts: appts.length });
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [gn, startDate, endDate, sort]);

  if (!gn) return <NoGNSelected/>;
  if (loading) return <div className="flex flex-col gap-4"><div className="grid grid-cols-3 gap-4">{[1,2,3].map(i=><Sk key={i} h={110}/>)}</div><Sk h={260}/><Sk h={200}/><Sk h={240}/></div>;
  if (!data) return <p style={{ color:COLORS.textMuted }}>No data.</p>;

  // Heatmap colours
  const getHeatColor = (total) => {
    if (total === 0) return COLORS.border;
    const pct = total / data.maxActivity;
    if (pct > 0.75) return COLORS.primary;
    if (pct > 0.5)  return COLORS.dark;
    if (pct > 0.25) return COLORS.accent;
    return '#F5C87A';
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Actions"    value={data.totalActions} icon={Activity}  accent="#fdf0e0" sub="All logged events"/>
        <StatCard label="Total Appointments"value={data.totalAppts}  icon={Calendar}  accent="#fdf0e0" sub="Handled in period"/>
        <StatCard label="Active Days"       value={data.activeDays}  icon={CheckCircle} accent={COLORS.successBg} sub="Days with any activity" trend="up"/>
        <StatCard label="Avg Actions / Day" value={data.avgPerDay}   icon={TrendingUp} accent="#fdf0e0" sub="On active days"/>
      </div>

      {/* Activity heatmap */}
      <div className="rounded-xl p-5" style={{ background:COLORS.white, border:`1px solid ${COLORS.border}` }}>
        <SectionHead title="30-Day Activity Heatmap" subtitle="Each cell = one day · darker = more activity"/>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {data.heatData.map((d,i) => (
            <div key={i} title={`${d.date}: ${d.total} actions`}
              className="w-7 h-7 rounded-md cursor-default transition-transform hover:scale-110"
              style={{ background: getHeatColor(d.total) }}>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs" style={{ color:COLORS.textMuted }}>Less</span>
          {['#E8DDD0','#F5C87A',COLORS.accent,COLORS.dark,COLORS.primary].map((c,i) => (
            <div key={i} className="w-5 h-5 rounded" style={{ background:c }}/>
          ))}
          <span className="text-xs" style={{ color:COLORS.textMuted }}>More</span>
        </div>
      </div>

      <div className="rounded-xl p-5" style={{ background:COLORS.white, border:`1px solid ${COLORS.border}` }}>
        <SectionHead title="Daily Actions vs Appointments (Last 30 Days)" subtitle="Two activity streams overlaid"/>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={data.chartData} barSize={8}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border}/>
            <XAxis dataKey="date" tick={{ fontSize:9, fill:COLORS.textMuted }} interval={5}/>
            <YAxis tick={{ fontSize:11, fill:COLORS.textMuted }}/>
            <Tooltip contentStyle={{ background:COLORS.white, border:`1px solid ${COLORS.border}`, borderRadius:8 }}/>
            <Bar dataKey="Actions"      fill={COLORS.primary} radius={[3,3,0,0]}/>
            <Bar dataKey="Appointments" fill={COLORS.accent}  radius={[3,3,0,0]}/>
            <Legend wrapperStyle={{ fontSize:11, color:COLORS.textMuted }}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <TableCard
        title={`Daily Activity Summary — ${gn.fullName}`}
        count={data.sorted.filter(d=>d.total>0).length}
        columns={['Date','Total Actions','Appointments Handled','Activity Level']}
        rows={data.sorted.filter(d=>d.total>0).slice(0,20).map((d,i) => {
          const level = d.total >= 10 ? 'high' : d.total >= 4 ? 'moderate' : 'low';
          return (
            <tr key={d.fullDate} style={{ borderTop:`1px solid ${COLORS.border}`, background:i%2===0?COLORS.white:COLORS.bg }}>
              <td className="px-4 py-2.5 text-xs font-semibold" style={{ color:COLORS.darkest }}>{fmtDate(new Date(d.fullDate))}</td>
              <td className="px-4 py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, d.actions*8)}px`, minWidth:4, background:COLORS.primary }}/>
                  <span className="font-bold" style={{ color:COLORS.darkest }}>{d.actions}</span>
                </div>
              </td>
              <td className="px-4 py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, d.appts*8)}px`, minWidth:4, background:COLORS.accent }}/>
                  <span className="font-bold" style={{ color:COLORS.darkest }}>{d.appts}</span>
                </div>
              </td>
              <td className="px-4 py-2.5">
                <Badge label={level} type={level==='high'?'success':level==='moderate'?'warn':'neutral'}/>
              </td>
            </tr>
          );
        })}
        emptyMsg="No activity recorded for this GN in the selected range."
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// E. AVAILABILITY HISTORY REPORT
// ═══════════════════════════════════════════════════════════════════════════
function AvailabilityHistoryReport({ gn, startDate, endDate, sort }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gn) { setData(null); return; }
    async function load() {
      setLoading(true);
      try {
        // Primary source: the GN's own workingHours and hoursUpdatedAt from gn_officers
        // Secondary: activity_logs for schedule-related changes
        const logSnap = await getDocs(collection(db, 'activity_logs'));
        let logs = logSnap.docs.map(d => ({ ...d.data(), id:d.id }))
          .filter(l => {
            if (l.uid !== (gn.uid||gn.id)) return false;
            const a = (l.action||l.type||l.title||'').toLowerCase();
            return a.includes('schedule') || a.includes('avail') || a.includes('slot') || a.includes('hour') || a.includes('working');
          });

        if (startDate) logs = logs.filter(l => toDate(l.createdAt) >= new Date(startDate));
        if (endDate)   { const ed=new Date(endDate); ed.setHours(23,59,59); logs=logs.filter(l=>toDate(l.createdAt)<=ed); }

        logs.sort(sort === 'oldest'
          ? (a,b) => (toDate(a.createdAt)||0) - (toDate(b.createdAt)||0)
          : (a,b) => (toDate(b.createdAt)||0) - (toDate(a.createdAt)||0));

        // Parse working hours from GN profile
        const wh = gn.workingHours || {};
        const dayKeys = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
        const dayLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        const scheduleData = dayKeys.map((key, i) => {
          const dayData = wh[key] || {};
          const available = !!(dayData.isAvailable || dayData.available || dayData.enabled);
          const startT = dayData.startTime || dayData.start || '—';
          const endT   = dayData.endTime   || dayData.end   || '—';
          return { day: dayLabels[i], key, available, startTime: startT, endTime: endT };
        });

        const availCount = scheduleData.filter(d => d.available).length;
        const lastUpdate = toDate(gn.hoursUpdatedAt);
        const updateDaysAgo = lastUpdate ? Math.floor((Date.now()-lastUpdate.getTime())/864e5) : null;
        const consistency = updateDaysAgo === null ? 'unknown'
          : updateDaysAgo <= 7 ? 'consistent'
          : updateDaysAgo <= 30 ? 'irregular'
          : 'outdated';

        // Chart: schedule changes over time from logs
        const days30 = Array.from({ length:30 }, (_,i) => {
          const d = new Date(); d.setDate(d.getDate() - (29-i));
          return d.toISOString().slice(0,10);
        });
        const changeTimeline = days30.map(day => ({
          date: day.slice(5),
          changes: logs.filter(l => toDate(l.createdAt)?.toISOString().slice(0,10) === day).length,
        }));

        setData({ logs, scheduleData, availCount, lastUpdate, updateDaysAgo, consistency, changeTimeline, totalChanges: logs.length });
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [gn, startDate, endDate, sort]);

  if (!gn) return <NoGNSelected/>;
  if (loading) return <div className="flex flex-col gap-4"><div className="grid grid-cols-3 gap-4">{[1,2,3].map(i=><Sk key={i} h={110}/>)}</div><Sk h={180}/><Sk h={260}/><Sk h={240}/></div>;
  if (!data) return <p style={{ color:COLORS.textMuted }}>No data.</p>;

  const consistencyType = { consistent:'success', irregular:'warn', outdated:'danger', unknown:'neutral' }[data.consistency];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Available Days/Week" value={`${data.availCount}/7`}  icon={Calendar}   accent="#fdf0e0" sub="Current working schedule"/>
        <StatCard label="Schedule Changes"    value={data.totalChanges}       icon={History}    accent="#fdf0e0" sub="In selected period"/>
        <StatCard label="Last Updated"        value={data.lastUpdate ? fmtDate(data.lastUpdate) : '—'} icon={Clock} accent="#fdf0e0" sub={data.updateDaysAgo !== null ? `${data.updateDaysAgo} days ago` : ''}/>
        <StatCard label="Consistency"         value={data.consistency.charAt(0).toUpperCase()+data.consistency.slice(1)} icon={CheckCircle} accent={data.consistency==='consistent'?COLORS.successBg:data.consistency==='outdated'?COLORS.dangerBg:COLORS.warnBg} sub="Schedule regularity"/>
      </div>

      {/* Current schedule grid */}
      <div className="rounded-xl p-5" style={{ background:COLORS.white, border:`1px solid ${COLORS.border}` }}>
        <SectionHead title="Current Working Schedule" subtitle={`Active schedule for ${gn.fullName} · ${data.availCount} days available`}/>
        <div className="grid grid-cols-7 gap-2 mt-2">
          {data.scheduleData.map(d => (
            <div key={d.day} className="rounded-xl p-3 flex flex-col items-center gap-1 text-center"
              style={{
                background: d.available ? COLORS.primary : COLORS.bg,
                border: `1.5px solid ${d.available ? COLORS.primary : COLORS.border}`,
              }}>
              <p className="text-xs font-extrabold" style={{ color: d.available ? '#fff' : COLORS.textMuted }}>{d.day}</p>
              {d.available ? (
                <>
                  <CheckCircle size={14} color="#fff"/>
                  <p className="text-xs" style={{ color:'rgba(255,255,255,0.85)', fontSize:9 }}>{d.startTime}</p>
                  <p className="text-xs" style={{ color:'rgba(255,255,255,0.65)', fontSize:9 }}>to {d.endTime}</p>
                </>
              ) : (
                <>
                  <XCircle size={14} color={COLORS.textMuted}/>
                  <p className="text-xs" style={{ color:COLORS.textMuted, fontSize:9 }}>Off</p>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 pt-3" style={{ borderTop:`1px solid ${COLORS.border}` }}>
          <div className="flex items-center gap-2 text-xs" style={{ color:COLORS.textMuted }}>
            <div className="w-4 h-4 rounded" style={{ background:COLORS.primary }}/>
            Available day
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color:COLORS.textMuted }}>
            <div className="w-4 h-4 rounded" style={{ background:COLORS.bg, border:`1px solid ${COLORS.border}` }}/>
            Off / Unavailable
          </div>
          <div className="ml-auto">
            <Badge label={data.consistency} type={consistencyType}/>
          </div>
        </div>
      </div>

      {/* Change timeline */}
      <div className="rounded-xl p-5" style={{ background:COLORS.white, border:`1px solid ${COLORS.border}` }}>
        <SectionHead title="Schedule Change Timeline (Last 30 Days)" subtitle="How often has this GN updated their availability"/>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.changeTimeline} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border}/>
            <XAxis dataKey="date" tick={{ fontSize:9, fill:COLORS.textMuted }} interval={5}/>
            <YAxis tick={{ fontSize:11, fill:COLORS.textMuted }}/>
            <Tooltip contentStyle={{ background:COLORS.white, border:`1px solid ${COLORS.border}`, borderRadius:8 }}/>
            <Bar dataKey="changes" name="Schedule Updates" radius={[5,5,0,0]}>
              {data.changeTimeline.map((_,i) => <Cell key={i} fill={COLORS.dark}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <TableCard
        title={`Schedule Change Log — ${gn.fullName}`}
        count={data.totalChanges}
        columns={['#','Event Title','Action','Type','Description','Timestamp']}
        rows={data.logs.slice(0,20).map((l,i) => (
          <tr key={l.id} style={{ borderTop:`1px solid ${COLORS.border}`, background:i%2===0?COLORS.white:COLORS.bg }}>
            <td className="px-4 py-2.5 text-xs font-bold" style={{ color:COLORS.textMuted }}>{i+1}</td>
            <td className="px-4 py-2.5 text-xs font-semibold" style={{ color:COLORS.darkest }}>{l.title||'Schedule Update'}</td>
            <td className="px-4 py-2.5 text-xs" style={{ color:COLORS.text }}>{l.action||'—'}</td>
            <td className="px-4 py-2.5 text-xs" style={{ color:COLORS.textMuted }}>{l.type||'—'}</td>
            <td className="px-4 py-2.5 text-xs max-w-xs truncate" style={{ color:COLORS.textMuted }}>{l.description||'—'}</td>
            <td className="px-4 py-2.5 text-xs whitespace-nowrap" style={{ color:COLORS.textMuted }}>{fmtDateTime(toDate(l.createdAt))}</td>
          </tr>
        ))}
        emptyMsg="No schedule change logs found for this GN in the selected range."
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NAV COMPONENTS  (identical to System Performance page)
// ═══════════════════════════════════════════════════════════════════════════
function NavItem({ icon: Ic, label, active, bold, onClick }) {
  return (
    <li onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-all ${
        active ? 'bg-amber-700 text-white font-bold'
        : bold  ? 'text-amber-900 font-bold hover:bg-amber-100'
                : 'text-amber-800 hover:bg-amber-100'
      }`}
      style={{ fontSize: bold && !Ic ? '0.85rem' : '0.82rem' }}>
      {Ic && <Ic size={16} className={active ? 'text-white' : 'text-amber-700'}/>}
      <span>{label}</span>
    </li>
  );
}

function Sidebar({ onLogout }) {
  const navigate = useNavigate();
  return (
    <aside className="w-64 flex-shrink-0 flex flex-col py-6 px-3 gap-2 border-r"
      style={{ borderColor: COLORS.border, background: COLORS.bg }}>
      <div className="flex items-center gap-2 px-3 mb-6">
        <img src="/logo2.png" alt="Smart Grama Sewa" className="h-10"/>
      </div>
      <ul className="flex flex-col gap-1 flex-1">
        <NavItem icon={LayoutDashboard} label="Dashboard" bold onClick={() => navigate('/admin/dashboard')}/>
        <li className="px-4 pt-3 pb-1 text-xs font-extrabold" style={{ color:COLORS.primary }}>GN management</li>
        <NavItem icon={UserCheck}      label="Registration Requests" onClick={() => navigate('/admin/registrationrequestapproval')}/>
        <NavItem icon={ArrowLeftRight} label="Transfer Request"      onClick={() => navigate('/admin/transferrequestapproval')}/>
        <li className="px-4 pt-3 pb-1 text-xs font-extrabold" style={{ color:COLORS.primary }}>Reports</li>
        <NavItem icon={BarChart2} label="System reports"         onClick={() => navigate('/admin/reports/system')}/>
        <NavItem icon={User}      label="Individual user access" active onClick={() => navigate('/admin/reports/user-access')}/>
        <NavItem icon={Activity}  label="GN activity reports"         onClick={() => navigate('/admin/reports/gn-activity')}/>
        <li className="pt-4">
          <NavItem icon={Megaphone} label="Announcements" bold onClick={() => navigate('/admin/announcements')}/>
        </li>
      </ul>
      <div className="px-3 pt-4 border-t" style={{ borderColor: COLORS.border }}>
        <button onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm font-bold transition-all hover:bg-red-50"
          style={{ color:'#991B1B' }}>
          <LogOut size={16}/><span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

function Topbar() {
  const [searchVal, setSearchVal] = useState('');
  return (
    <header className="flex items-center gap-4 px-6 py-4 border-b sticky top-0 z-20"
      style={{ borderColor: COLORS.border, background: COLORS.bg }}>
      <div className="flex-1 relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" color={COLORS.textMuted}/>
        <input
          className="w-full pl-10 pr-4 py-2.5 rounded-full border text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          style={{ borderColor:'#C8B89A', background:COLORS.inputBg, color:COLORS.text }}
          placeholder="search..." value={searchVal} onChange={e => setSearchVal(e.target.value)}/>
      </div>
      <button className="flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-full border"
        style={{ borderColor:'#C8B89A', color:COLORS.text, background:COLORS.inputBg }}>
        English <ChevronDown size={14}/>
      </button>
      <button className="relative w-10 h-10 rounded-full flex items-center justify-center border"
        style={{ borderColor:'#C8B89A', background:COLORS.inputBg }}>
        <Icon.Bell size={18} color={COLORS.primary}/>
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background:COLORS.accent }}/>
      </button>
      <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background:COLORS.primary }}>
        <Icon.User size={18} color="#fff"/>
      </button>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function AdminIndividualGNUserAccessReports() {
  const [gnList,      setGnList]      = useState([]);
  const [selectedGN,  setSelectedGN]  = useState(null);
  const [activeReport,setActiveReport] = useState('login-history');
  const [sort,        setSort]         = useState('newest');
  const [startDate,   setStartDate]    = useState('');
  const [endDate,     setEndDate]      = useState('');
  const [applied,     setApplied]      = useState({ sort:'newest', start:'', end:'' });

  // Load GN list once
  useEffect(() => {
    getDocs(collection(db,'gn_officers'))
      .then(snap => setGnList(snap.docs.map(d => ({ ...d.data(), id:d.id }))))
      .catch(console.error);
  }, []);

  function handleApply() { setApplied({ sort, start:startDate, end:endDate }); }
  function handleReset() {
    setSort('newest'); setStartDate(''); setEndDate('');
    setApplied({ sort:'newest', start:'', end:'' });
  }

  const activeLabel = SUB_REPORTS.find(r => r.id === activeReport)?.label || '';

  const renderReport = () => {
    const p = { gn:selectedGN, startDate:applied.start, endDate:applied.end, sort:applied.sort };
    switch(activeReport) {
      case 'login-history':  return <LoginHistoryReport       {...p}/>;
      case 'appt-history':   return <AppointmentHistoryReport {...p}/>;
      case 'action-log':     return <ActionLogReport          {...p}/>;
      case 'daily-activity': return <DailyActivityReport      {...p}/>;
      case 'avail-history':  return <AvailabilityHistoryReport{...p}/>;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background:COLORS.bg, fontFamily:"'Segoe UI',sans-serif" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
      <Sidebar onLogout={() => {}}/>

      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar/>

        <main className="flex-1 overflow-y-auto px-8 py-6">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-1 text-xs" style={{ color:COLORS.textMuted }}>
            <span>Reports</span>
            <ChevronRight size={12}/>
            <span style={{ color:COLORS.primary, fontWeight:600 }}>Individual User Access</span>
          </div>

          {/* Page header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color:COLORS.darkest }}>
                📊 Individual GN (User Access) Reports
              </h1>
              <p className="text-sm mt-0.5" style={{ color:COLORS.textMuted }}>
                Deep analysis of a single GN officer — login history, appointments, actions and availability
              </p>
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
              style={{ background:COLORS.dark, color:COLORS.white }}>
              <Download size={14}/> Export Report
            </button>
          </div>

          {/* Sub-Report Dropdown + pills  — same layout as SystemPerformanceReports */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color:COLORS.primary }}>
                Select Sub-Report
              </label>
              <div className="relative">
                <select
                  value={activeReport}
                  onChange={e => setActiveReport(e.target.value)}
                  className="pl-4 pr-10 py-2.5 rounded-xl text-sm font-semibold border-2 focus:outline-none focus:ring-2 focus:ring-amber-300 appearance-none cursor-pointer"
                  style={{ borderColor:COLORS.primary, background:COLORS.white, color:COLORS.darkest, minWidth:320 }}>
                  {SUB_REPORTS.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" color={COLORS.primary}/>
              </div>
            </div>

            {/* Quick pill tabs */}
            <div className="flex gap-2 flex-wrap pt-5">
              {SUB_REPORTS.map(r => (
                <button key={r.id} onClick={() => setActiveReport(r.id)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: activeReport===r.id ? COLORS.primary : COLORS.white,
                    color:       activeReport===r.id ? COLORS.white   : COLORS.textMuted,
                    border:`1px solid ${activeReport===r.id ? COLORS.primary : COLORS.border}`
                  }}>
                  {r.label.split('.')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          {/* Active report title strip — same as SystemPerformanceReports */}
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl mb-5"
            style={{ background:COLORS.primary }}>
            <BarChart2 size={18} color={COLORS.accent}/>
            <span className="text-sm font-bold text-white">{activeLabel}</span>
            <span className="ml-auto text-xs" style={{ color:'#C8A882' }}>
              {applied.start && applied.end
                ? `${fmtDate(new Date(applied.start))} – ${fmtDate(new Date(applied.end))}`
                : 'All time'}
            </span>
          </div>

          {/* GN Officer selector */}
          <GNSelector gnList={gnList} selectedGN={selectedGN} onSelect={setSelectedGN}/>

          {/* GN profile summary */}
          {selectedGN && <GNProfileCard gn={selectedGN}/>}

          {/* Date filters */}
          <DateFilterBar
            sort={sort} setSort={setSort}
            startDate={startDate} setStartDate={setStartDate}
            endDate={endDate}     setEndDate={setEndDate}
            onApply={handleApply} onReset={handleReset}
          />

          {/* Report content */}
          {renderReport()}

        </main>

        {/* Footer */}
        <footer className="text-center text-xs py-4"
          style={{ background:COLORS.cardDark, color:'#C8A882' }}>
          © 2026 Smart Grama Sewa. All rights reserved.
        </footer>
      </div>
    </div>
  );
}