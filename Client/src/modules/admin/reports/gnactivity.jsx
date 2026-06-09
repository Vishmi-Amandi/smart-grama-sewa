import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../../firebase';

import {
  LayoutDashboard, UserCheck, ArrowLeftRight, BarChart2, User,
  Activity, LogOut, Search, ChevronDown, Megaphone,
  TrendingUp, TrendingDown, Users, Calendar, Clock,
  Download, Filter, ChevronRight, CheckCircle, XCircle,
  AlertTriangle, Award, MapPin, Layers, UserX, Star,
  ShieldOff, AlarmClock
} from "lucide-react";
import * as Icon from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";


// ─── Colors ──────────────────────────────────────────────────────────────────
const C = {
  primary: '#7B2D00',
  accent: '#F5A623',
  bg: '#F5F0E8',
  dark: '#6B2400',
  darker: '#3D1500',
  darkest: '#2C1200',
  muted: '#7A5C44',
  white: '#FFFFFF',
  cardDark: '#3D1500',
  border: '#DDD0BC',
  inputBg: '#FFF9F0',
  text: '#2C1200',
  textMuted: '#7A5C44',
  success: '#166534',
  successBg: '#dcfce7',
  warn: '#854d0e',
  warnBg: '#fef9c3',
  danger: '#991b1b',
  dangerBg: '#fee2e2',
  chart: ['#7B2D00', '#F5A623', '#6B2400', '#C8A882', '#3D1500', '#F5C87A', '#B05A00'],
};

// ─── Sub-report list ─────────────────────────────────────────────────────────
const SUB_REPORTS = [
  { id: 'login-activity', label: 'A. GN Login Activity Report', icon: Activity },
  { id: 'appt-handling', label: 'B. GN Appointment Handling Report', icon: Calendar },
  { id: 'availability', label: 'C. GN Availability Report', icon: Clock },
  { id: 'performance', label: 'D. GN Performance Comparison Report', icon: Award },
  { id: 'inactive', label: 'E. Inactive GN Report', icon: UserX },
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
  return new Date(d).toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' });
}
function daysBetween(a, b) {
  if (!a || !b) return 0;
  return Math.round(Math.abs(new Date(b) - new Date(a)) / 864e5);
}
function daysAgo(d) {
  if (!d) return 9999;
  return Math.floor((Date.now() - new Date(d).getTime()) / 864e5);
}

// ─── Shared UI: StatCard ─────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Ic, accent, trend, full }) {
  return (
    <div className={`rounded-xl p-5 flex flex-col gap-2 ${full ? 'col-span-full' : ''}`}
      style={{ background: C.white, border: `1px solid ${C.border}`, minWidth: 0 }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>{label}</span>
        <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: accent || C.bg }}>
          {Ic && <Ic size={18} color={C.primary} />}
        </span>
      </div>
      <div className="text-3xl font-bold" style={{ color: C.darkest }}>{value}</div>
      {sub && (
        <div className="text-xs flex items-center gap-1" style={{ color: C.textMuted }}>
          {trend === 'up' && <TrendingUp size={12} color="#16a34a" />}
          {trend === 'down' && <TrendingDown size={12} color="#dc2626" />}
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Shared UI: SectionHead ──────────────────────────────────────────────────
function SectionHead({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-bold" style={{ color: C.darkest }}>{title}</h2>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>{subtitle}</p>}
    </div>
  );
}

// ─── Shared UI: Skeleton ─────────────────────────────────────────────────────
function Sk({ h = 20, w = '100%', r = 8 }) {
  return <div style={{ height: h, width: w, borderRadius: r, background: C.border, opacity: 0.5, animation: 'pulse 1.5s ease-in-out infinite' }} />;
}

// ─── Shared UI: Badge ────────────────────────────────────────────────────────
function Badge({ label, type = 'neutral' }) {
  const map = {
    success: { bg: C.successBg, color: C.success },
    warn: { bg: C.warnBg, color: C.warn },
    danger: { bg: C.dangerBg, color: C.danger },
    neutral: { bg: C.bg, color: C.muted },
    primary: { bg: '#fdf0e0', color: C.primary },
  };
  const s = map[type] || map.neutral;
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ background: s.bg, color: s.color }}>
      {label}
    </span>
  );
}

// ─── Date Filter Bar ─────────────────────────────────────────────────────────
function DateFilterBar({ sort, setSort, start, setStart, end, setEnd, onApply, onReset }) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl mb-6"
      style={{ background: C.white, border: `1px solid ${C.border}` }}>
      <Filter size={15} color={C.primary} />
      <span className="text-xs font-bold uppercase tracking-wider mr-1" style={{ color: C.primary }}>Filters</span>
      <select value={sort} onChange={e => setSort(e.target.value)}
        className="px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-amber-300"
        style={{ borderColor: C.border, background: C.inputBg, color: C.text }}>
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
      </select>
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium" style={{ color: C.textMuted }}>From</label>
        <input type="date" value={start} onChange={e => setStart(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-amber-300"
          style={{ borderColor: C.border, background: C.inputBg, color: C.text }} />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium" style={{ color: C.textMuted }}>To</label>
        <input type="date" value={end} onChange={e => setEnd(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-amber-300"
          style={{ borderColor: C.border, background: C.inputBg, color: C.text }} />
      </div>
      <button onClick={onApply}
        className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
        style={{ background: C.primary, color: C.white }}>Apply</button>
      <button onClick={onReset}
        className="px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-50"
        style={{ border: `1px solid ${C.border}`, color: C.textMuted, background: 'transparent' }}>Reset</button>
    </div>
  );
}

// ─── Shared UI: Table wrapper ─────────────────────────────────────────────────
function TableCard({ title, count, columns, rows, emptyMsg = 'No data in selected range.' }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
      <div className="px-5 py-3 flex items-center justify-between" style={{ background: C.primary }}>
        <span className="text-sm font-bold text-white">{title}</span>
        {count !== undefined && <span className="text-xs" style={{ color: '#C8A882' }}>{count} records</span>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ background: C.white }}>
          <thead>
            <tr style={{ background: C.bg, color: C.textMuted, fontSize: 11 }}>
              {columns.map(c => <th key={c} className="px-4 py-2 text-left font-semibold whitespace-nowrap">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0
              ? <tr><td colSpan={columns.length} className="px-4 py-6 text-center text-sm" style={{ color: C.textMuted }}>{emptyMsg}</td></tr>
              : rows}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TRow({ cells, idx }) {
  return (
    <tr style={{ borderTop: `1px solid ${C.border}`, background: idx % 2 === 0 ? C.white : C.bg }}>
      {cells.map((cell, i) => (
        <td key={i} className="px-4 py-2.5 text-xs whitespace-nowrap" style={{ color: C.text }}>{cell}</td>
      ))}
    </tr>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// A. GN LOGIN ACTIVITY REPORT
// ═══════════════════════════════════════════════════════════════════════════
function GNLoginActivityReport({ start, end, sort }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [gnSnap, logSnap] = await Promise.all([
          getDocs(collection(db, 'gn_officers')),
          getDocs(collection(db, 'activity_logs')),
        ]);
        let gns = gnSnap.docs.map(d => ({ ...d.data(), id: d.id }));
        let logs = logSnap.docs.map(d => ({ ...d.data(), id: d.id }));

        const loginLogs = logs.filter(l => (l.action || l.type || '').toLowerCase().includes('login'));

        // Apply date range to login logs
        let filtLogs = loginLogs;
        if (start) filtLogs = filtLogs.filter(l => toDate(l.createdAt) >= new Date(start));
        if (end) { const ed = new Date(end); ed.setHours(23, 59, 59); filtLogs = filtLogs.filter(l => toDate(l.createdAt) <= ed); }

        // Build per-GN login stats
        const gnRows = gns.map(gn => {
          const gnLogs = filtLogs.filter(l => l.uid === gn.uid);
          const lastLogin = toDate(gn.lastLogin);
          const days = daysAgo(lastLogin);
          const freq = gnLogs.length > 0
            ? (gnLogs.length / Math.max(1, daysBetween(
              toDate(gnLogs[gnLogs.length - 1]?.createdAt), toDate(gnLogs[0]?.createdAt)) || 1)).toFixed(2)
            : '0';
          return {
            ...gn,
            totalLogins: gnLogs.length,
            lastLogin,
            daysAgo: days,
            freq: parseFloat(freq),
            status: days <= 7 ? 'active' : days <= 30 ? 'moderate' : 'inactive',
          };
        });

        // Sort
        gnRows.sort(sort === 'oldest'
          ? (a, b) => (a.lastLogin || 0) - (b.lastLogin || 0)
          : (a, b) => (b.lastLogin || 0) - (a.lastLogin || 0));

        // Chart: logins per day (last 14 days)
        const days14 = Array.from({ length: 14 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (13 - i));
          return d.toISOString().slice(0, 10);
        });
        const dailyChart = days14.map(day => ({
          date: day.slice(5),
          logins: filtLogs.filter(l => toDate(l.createdAt)?.toISOString().slice(0, 10) === day).length
        }));

        const active = gnRows.filter(g => g.status === 'active').length;
        const moderate = gnRows.filter(g => g.status === 'moderate').length;
        const inactive = gnRows.filter(g => g.status === 'inactive').length;

        setData({ gnRows, dailyChart, active, moderate, inactive, total: gnRows.length });
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [start, end, sort]);

  if (loading) return <div className="flex flex-col gap-4"><div className="grid grid-cols-3 gap-4">{[1, 2, 3].map(i => <Sk key={i} h={110} />)}</div><Sk h={260} /><Sk h={240} /></div>;
  if (!data) return <p style={{ color: C.textMuted }}>No data.</p>;

  const pieData = [
    { name: 'Active (≤7d)', value: data.active, color: C.primary },
    { name: 'Moderate (≤30d)', value: data.moderate, color: C.accent },
    { name: 'Inactive (>30d)', value: data.inactive, color: '#C8A882' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total GN Officers" value={data.total} icon={Users} accent="#fdf0e0" />
        <StatCard label="Active (≤7 days)" value={data.active} icon={CheckCircle} accent={C.successBg} sub="Logged in this week" trend="up" />
        <StatCard label="Moderate (≤30d)" value={data.moderate} icon={AlarmClock} accent={C.warnBg} sub="Logged in this month" />
        <StatCard label="Inactive (>30d)" value={data.inactive} icon={UserX} accent={C.dangerBg} sub="No recent login" trend="down" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background: C.white, border: `1px solid ${C.border}` }}>
          <SectionHead title="Daily Login Events (Last 14 Days)" subtitle="Login frequency across all GNs" />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.dailyChart}>
              <defs>
                <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.primary} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis tick={{ fontSize: 11, fill: C.textMuted }} />
              <Tooltip contentStyle={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8 }} />
              <Area type="monotone" dataKey="logins" stroke={C.primary} fill="url(#lg1)" strokeWidth={2} name="Logins" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl p-5" style={{ background: C.white, border: `1px solid ${C.border}` }}>
          <SectionHead title="GN Activity Status Distribution" subtitle="Active vs inactive breakdown" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                dataKey="value" paddingAngle={3}>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: C.textMuted }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <TableCard
        title="GN Login Activity Details"
        count={data.gnRows.length}
        columns={['#', 'Full Name', 'GN Division', 'District', 'Last Login', 'Days Since Login', 'Total Logins', 'Login Freq/Day', 'Status']}
        rows={data.gnRows.slice(0, 15).map((g, i) => (
          <tr key={g.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : C.bg }}>
            <td className="px-4 py-2.5 text-xs font-bold" style={{ color: C.textMuted }}>{i + 1}</td>
            <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: C.darkest }}>{g.fullName || '—'}</td>
            <td className="px-4 py-2.5 text-xs" style={{ color: C.text }}>{g.gnDivisionName || g.gnDiv || '—'}</td>
            <td className="px-4 py-2.5 text-xs" style={{ color: C.textMuted }}>{g.district || '—'}</td>
            <td className="px-4 py-2.5 text-xs" style={{ color: C.textMuted }}>{fmtDate(g.lastLogin)}</td>
            <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: g.daysAgo > 30 ? C.danger : g.daysAgo > 7 ? C.warn : C.success }}>
              {g.daysAgo === 9999 ? 'Never' : g.daysAgo + ' days ago'}
            </td>
            <td className="px-4 py-2.5 text-xs text-center font-bold" style={{ color: C.darkest }}>{g.totalLogins}</td>
            <td className="px-4 py-2.5 text-xs text-center" style={{ color: C.textMuted }}>{g.freq}</td>
            <td className="px-4 py-2.5">
              <Badge label={g.status} type={g.status === 'active' ? 'success' : g.status === 'moderate' ? 'warn' : 'danger'} />
            </td>
          </tr>
        ))}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// B. GN APPOINTMENT HANDLING REPORT
// ═══════════════════════════════════════════════════════════════════════════
function GNAppointmentHandlingReport({ start, end, sort }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [gnSnap, apptSnap] = await Promise.all([
          getDocs(collection(db, 'gn_officers')),
          getDocs(collection(db, 'appointments')),
        ]);
        let gns = gnSnap.docs.map(d => ({ ...d.data(), id: d.id }));
        let appts = apptSnap.docs.map(d => ({ ...d.data(), id: d.id }));

        if (start) appts = appts.filter(a => toDate(a.createdAt) >= new Date(start));
        if (end) { const ed = new Date(end); ed.setHours(23, 59, 59); appts = appts.filter(a => toDate(a.createdAt) <= ed); }

        const gnRows = gns.map(gn => {
          const mine = appts.filter(a => a.gnDiv === gn.gnDiv || a.uid === gn.uid);
          const completed = mine.filter(a => (a.status || '').toLowerCase() === 'completed').length;
          const cancelled = mine.filter(a => (a.status || '').toLowerCase() === 'cancelled').length;
          const pending = mine.filter(a => (a.status || '').toLowerCase() === 'pending').length;
          const rate = mine.length ? ((completed / mine.length) * 100).toFixed(0) : '0';
          return { ...gn, total: mine.length, completed, cancelled, pending, rate: parseInt(rate) };
        }).filter(g => g.total > 0);

        gnRows.sort(sort === 'oldest'
          ? (a, b) => a.total - b.total
          : (a, b) => b.total - a.total);

        // Top 8 GNs bar chart
        const chartData = gnRows.slice(0, 8).map(g => ({
          name: (g.gnDivisionName || g.gnDiv || g.fullName || '').slice(0, 10),
          Completed: g.completed, Cancelled: g.cancelled, Pending: g.pending
        }));

        // Daily workload last 14 days
        const days14 = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (13 - i)); return d.toISOString().slice(0, 10); });
        const workload = days14.map(day => ({
          date: day.slice(5),
          count: appts.filter(a => toDate(a.createdAt)?.toISOString().slice(0, 10) === day).length
        }));

        const totals = {
          all: appts.length, comp: appts.filter(a => (a.status || '').toLowerCase() === 'completed').length,
          canc: appts.filter(a => (a.status || '').toLowerCase() === 'cancelled').length,
          pend: appts.filter(a => (a.status || '').toLowerCase() === 'pending').length
        };

        setData({ gnRows, chartData, workload, totals });
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [start, end, sort]);

  if (loading) return <div className="flex flex-col gap-4"><div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Sk key={i} h={110} />)}</div><Sk h={260} /><Sk h={240} /></div>;
  if (!data) return <p style={{ color: C.textMuted }}>No data.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Appointments" value={data.totals.all} icon={Calendar} accent="#fdf0e0" />
        <StatCard label="Completed" value={data.totals.comp} icon={CheckCircle} accent={C.successBg} sub="Successfully handled" trend="up" />
        <StatCard label="Cancelled" value={data.totals.canc} icon={XCircle} accent={C.dangerBg} sub="Not completed" trend="down" />
        <StatCard label="Pending" value={data.totals.pend} icon={Clock} accent={C.warnBg} sub="Awaiting action" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background: C.white, border: `1px solid ${C.border}` }}>
          <SectionHead title="Top 8 GNs by Appointment Volume" subtitle="Completed, cancelled, and pending per GN division" />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={data.chartData} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.textMuted }} />
              <YAxis tick={{ fontSize: 11, fill: C.textMuted }} />
              <Tooltip contentStyle={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8 }} />
              <Bar dataKey="Completed" fill={C.primary} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Cancelled" fill="#C8A882" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Pending" fill={C.accent} radius={[4, 4, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11, color: C.textMuted }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl p-5" style={{ background: C.white, border: `1px solid ${C.border}` }}>
          <SectionHead title="Daily Appointment Workload" subtitle="Total appointments created per day (last 14 days)" />
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={data.workload}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis tick={{ fontSize: 11, fill: C.textMuted }} />
              <Tooltip contentStyle={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8 }} />
              <Line type="monotone" dataKey="count" stroke={C.accent} strokeWidth={2.5} dot={{ r: 3 }} name="Appointments" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <TableCard
        title="GN Appointment Handling Details"
        count={data.gnRows.length}
        columns={['#', 'GN Officer', 'GN Division', 'District', 'Total', 'Completed', 'Cancelled', 'Pending', 'Completion Rate', 'Performance']}
        rows={data.gnRows.slice(0, 12).map((g, i) => {
          const perf = g.rate >= 80 ? 'excellent' : g.rate >= 50 ? 'good' : g.rate >= 20 ? 'average' : 'poor';
          const perfColor = { excellent: C.success, good: C.primary, average: C.warn, poor: C.danger }[perf];
          return (
            <tr key={g.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : C.bg }}>
              <td className="px-4 py-2.5 text-xs font-bold" style={{ color: C.textMuted }}>{i + 1}</td>
              <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: C.darkest }}>{g.fullName || '—'}</td>
              <td className="px-4 py-2.5 text-xs" style={{ color: C.text }}>{g.gnDivisionName || g.gnDiv || '—'}</td>
              <td className="px-4 py-2.5 text-xs" style={{ color: C.textMuted }}>{g.district || '—'}</td>
              <td className="px-4 py-2.5 text-xs font-bold text-center" style={{ color: C.darkest }}>{g.total}</td>
              <td className="px-4 py-2.5 text-xs text-center font-semibold" style={{ color: C.success }}>{g.completed}</td>
              <td className="px-4 py-2.5 text-xs text-center font-semibold" style={{ color: C.danger }}>{g.cancelled}</td>
              <td className="px-4 py-2.5 text-xs text-center font-semibold" style={{ color: C.warn }}>{g.pending}</td>
              <td className="px-4 py-2.5 text-xs text-center">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: C.border }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${g.rate}%`, background: perfColor }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: perfColor, minWidth: 28 }}>{g.rate}%</span>
                </div>
              </td>
              <td className="px-4 py-2.5">
                <Badge label={perf} type={perf === 'excellent' || perf === 'good' ? 'success' : perf === 'average' ? 'warn' : 'danger'} />
              </td>
            </tr>
          );
        })}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// C. GN AVAILABILITY REPORT
// ═══════════════════════════════════════════════════════════════════════════
function GNAvailabilityReport({ start, end, sort }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const gnSnap = await getDocs(collection(db, 'gn_officers'));
        let gns = gnSnap.docs.map(d => ({ ...d.data(), id: d.id }));

        if (start) gns = gns.filter(g => !g.hoursUpdatedAt || toDate(g.hoursUpdatedAt) >= new Date(start));
        if (end) { const ed = new Date(end); ed.setHours(23, 59, 59); gns = gns.filter(g => !g.hoursUpdatedAt || toDate(g.hoursUpdatedAt) <= ed); }

        const gnRows = gns.map(gn => {
          // Parse workingHours to count available days and slots
          const wh = gn.workingHours || {};
          const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          const availDays = dayKeys.filter(d => wh[d] && (wh[d].isAvailable || wh[d].available || wh[d].enabled)).length;
          // Count total slots from workingHours timeSlots or just estimate from slotDuration & maxAppointments
          const slots = gn.maxAppointments ? parseInt(gn.maxAppointments) * availDays : availDays * 8;
          const slotDur = gn.slotDuration ? parseInt(gn.slotDuration) : 30;
          const lastUpdate = toDate(gn.hoursUpdatedAt);
          const updatedDaysAgo = daysAgo(lastUpdate);
          const consistency = updatedDaysAgo <= 7 ? 'consistent' : updatedDaysAgo <= 30 ? 'irregular' : 'outdated';
          return { ...gn, availDays, slots, slotDur, lastUpdate, updatedDaysAgo, consistency };
        });

        gnRows.sort(sort === 'oldest'
          ? (a, b) => a.availDays - b.availDays
          : (a, b) => b.availDays - a.availDays);

        // Chart: distribution of available days
        const dayDist = [0, 1, 2, 3, 4, 5, 6, 7].map(n => ({
          days: `${n}d`, count: gnRows.filter(g => g.availDays === n).length
        }));

        // Consistency chart
        const consPie = [
          { name: 'Consistent', value: gnRows.filter(g => g.consistency === 'consistent').length, color: C.primary },
          { name: 'Irregular', value: gnRows.filter(g => g.consistency === 'irregular').length, color: C.accent },
          { name: 'Outdated', value: gnRows.filter(g => g.consistency === 'outdated').length, color: '#C8A882' },
        ];

        const avgDays = gnRows.length ? (gnRows.reduce((s, g) => s + g.availDays, 0) / gnRows.length).toFixed(1) : 0;
        const avgSlots = gnRows.length ? Math.round(gnRows.reduce((s, g) => s + g.slots, 0) / gnRows.length) : 0;

        setData({ gnRows, dayDist, consPie, avgDays, avgSlots });
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [start, end, sort]);

  if (loading) return <div className="flex flex-col gap-4"><div className="grid grid-cols-3 gap-4">{[1, 2, 3].map(i => <Sk key={i} h={110} />)}</div><Sk h={260} /><Sk h={240} /></div>;
  if (!data) return <p style={{ color: C.textMuted }}>No data.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total GN Officers" value={data.gnRows.length} icon={Users} accent="#fdf0e0" />
        <StatCard label="Avg. Available Days" value={data.avgDays} icon={Calendar} accent="#fdf0e0" sub="Days per week (avg)" />
        <StatCard label="Avg. Slots / Week" value={data.avgSlots} icon={Layers} accent="#fdf0e0" sub="Estimated appointment slots" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background: C.white, border: `1px solid ${C.border}` }}>
          <SectionHead title="Distribution of Available Days/Week" subtitle="How many GNs offer each number of available days" />
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={data.dayDist} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="days" tick={{ fontSize: 12, fill: C.textMuted }} />
              <YAxis tick={{ fontSize: 11, fill: C.textMuted }} />
              <Tooltip contentStyle={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8 }} />
              <Bar dataKey="count" name="GN Officers" radius={[6, 6, 0, 0]}>
                {data.dayDist.map((_, i) => <Cell key={i} fill={i >= 4 ? C.primary : C.accent} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl p-5" style={{ background: C.white, border: `1px solid ${C.border}` }}>
          <SectionHead title="Schedule Consistency" subtitle="How up-to-date is each GN's working hours setting" />
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={data.consPie} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                dataKey="value" paddingAngle={3}>
                {data.consPie.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: C.textMuted }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <TableCard
        title="GN Availability Details"
        count={data.gnRows.length}
        columns={['#', 'GN Officer', 'GN Division', 'District', 'Available Days/Wk', 'Est. Slots/Wk', 'Slot Duration', 'Last Updated', 'Consistency']}
        rows={data.gnRows.slice(0, 12).map((g, i) => (
          <tr key={g.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : C.bg }}>
            <td className="px-4 py-2.5 text-xs font-bold" style={{ color: C.textMuted }}>{i + 1}</td>
            <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: C.darkest }}>{g.fullName || '—'}</td>
            <td className="px-4 py-2.5 text-xs" style={{ color: C.text }}>{g.gnDivisionName || g.gnDiv || '—'}</td>
            <td className="px-4 py-2.5 text-xs" style={{ color: C.textMuted }}>{g.district || '—'}</td>
            <td className="px-4 py-2.5 text-xs text-center">
              <div className="flex items-center gap-1 justify-center">
                <div className="flex gap-0.5">
                  {[...Array(7)].map((_, d) => (
                    <div key={d} className="w-3 h-3 rounded-sm" style={{ background: d < g.availDays ? C.primary : C.border }} />
                  ))}
                </div>
                <span className="ml-1 font-bold" style={{ color: C.darkest }}>{g.availDays}/7</span>
              </div>
            </td>
            <td className="px-4 py-2.5 text-xs text-center font-semibold" style={{ color: C.darkest }}>{g.slots}</td>
            <td className="px-4 py-2.5 text-xs text-center" style={{ color: C.textMuted }}>{g.slotDur} min</td>
            <td className="px-4 py-2.5 text-xs" style={{ color: C.textMuted }}>{fmtDate(g.lastUpdate)}</td>
            <td className="px-4 py-2.5">
              <Badge label={g.consistency}
                type={g.consistency === 'consistent' ? 'success' : g.consistency === 'irregular' ? 'warn' : 'danger'} />
            </td>
          </tr>
        ))}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// D. GN PERFORMANCE COMPARISON REPORT
// ═══════════════════════════════════════════════════════════════════════════
function GNPerformanceComparisonReport({ start, end, sort }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rankBy, setRankBy] = useState('appointments');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [gnSnap, apptSnap, logSnap] = await Promise.all([
          getDocs(collection(db, 'gn_officers')),
          getDocs(collection(db, 'appointments')),
          getDocs(collection(db, 'activity_logs')),
        ]);
        let gns = gnSnap.docs.map(d => ({ ...d.data(), id: d.id }));
        let appts = apptSnap.docs.map(d => ({ ...d.data(), id: d.id }));
        let logs = logSnap.docs.map(d => ({ ...d.data(), id: d.id }));

        if (start) { appts = appts.filter(a => toDate(a.createdAt) >= new Date(start)); logs = logs.filter(l => toDate(l.createdAt) >= new Date(start)); }
        if (end) {
          const ed = new Date(end); ed.setHours(23, 59, 59);
          appts = appts.filter(a => toDate(a.createdAt) <= ed);
          logs = logs.filter(l => toDate(l.createdAt) <= ed);
        }

        const gnRows = gns.map((gn, idx) => {
          const mine = appts.filter(a => a.gnDiv === gn.gnDiv || a.uid === gn.uid);
          const myLogs = logs.filter(l => l.uid === gn.uid);
          const completed = mine.filter(a => (a.status || '').toLowerCase() === 'completed').length;
          const wh = gn.workingHours || {};
          const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          const availDays = dayKeys.filter(d => wh[d] && (wh[d].isAvailable || wh[d].available || wh[d].enabled)).length;
          const compRate = mine.length ? Math.round((completed / mine.length) * 100) : 0;
          const actScore = Math.min(100, myLogs.length * 2);
          const availScore = Math.round((availDays / 7) * 100);
          const overallScore = Math.round((compRate * 0.4) + (actScore * 0.4) + (availScore * 0.2));
          return { ...gn, appts: mine.length, completed, compRate, activity: myLogs.length, actScore, availDays, availScore, overallScore };
        });

        gnRows.sort((a, b) => b.overallScore - a.overallScore);
        const ranked = gnRows.map((g, i) => ({ ...g, rank: i + 1 }));

        // Top 6 radar chart
        const radarData = [
          { metric: 'Appointments', ...Object.fromEntries(ranked.slice(0, 4).map(g => [g.gnDiv || g.fullName || g.id, g.appts])) },
          { metric: 'Completion %', ...Object.fromEntries(ranked.slice(0, 4).map(g => [g.gnDiv || g.fullName || g.id, g.compRate])) },
          { metric: 'Activity', ...Object.fromEntries(ranked.slice(0, 4).map(g => [g.gnDiv || g.fullName || g.id, Math.min(100, g.activity * 2)])) },
          { metric: 'Availability', ...Object.fromEntries(ranked.slice(0, 4).map(g => [g.gnDiv || g.fullName || g.id, g.availScore])) },
        ];
        const top4Names = ranked.slice(0, 4).map(g => g.gnDiv || g.fullName || g.id);

        // Bar chart
        const sortedForBar = [...ranked].sort(rankBy === 'appointments'
          ? (a, b) => b.appts - a.appts
          : (a, b) => b.overallScore - a.overallScore);
        const barData = sortedForBar.slice(0, 10).map(g => ({
          name: (g.gnDivisionName || g.gnDiv || g.fullName || '').slice(0, 10),
          Score: g.overallScore,
          Appointments: g.appts,
        }));

        setData({ ranked, radarData, top4Names, barData });
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [start, end, sort]);

  if (loading) return <div className="flex flex-col gap-4"><Sk h={260} /><Sk h={260} /><Sk h={280} /></div>;
  if (!data) return <p style={{ color: C.textMuted }}>No data.</p>;

  const radarColors = [C.primary, C.accent, '#C8A882', '#B05A00'];

  return (
    <div className="flex flex-col gap-6">
      {/* Top 3 podium */}
      <div className="rounded-xl p-5" style={{ background: C.white, border: `1px solid ${C.border}` }}>
        <SectionHead title="Top Performing GN Officers" subtitle="Ranked by overall performance score (appointments + activity + availability)" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.ranked.slice(0, 3).map((g, i) => {
            const medals = ['🥇', '🥈', '🥉'];
            const borders = [`2px solid ${C.accent}`, `1px solid ${C.border}`, `1px solid ${C.border}`];
            const bgs = [`#fff8f0`, C.white, C.white];
            return (
              <div key={g.id} className="rounded-xl p-4 flex flex-col gap-2 items-center text-center"
                style={{ border: borders[i], background: bgs[i] }}>
                <div className="text-3xl">{medals[i]}</div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold"
                  style={{ background: C.primary, color: C.white }}>
                  {(g.fullName || '?').slice(0, 2).toUpperCase()}
                </div>
                <p className="font-bold text-sm" style={{ color: C.darkest }}>{g.fullName || '—'}</p>
                <p className="text-xs" style={{ color: C.textMuted }}>{g.gnDivisionName || g.gnDiv || '—'}</p>
                <div className="flex gap-3 mt-1 text-xs">
                  <span style={{ color: C.textMuted }}><span className="font-bold" style={{ color: C.primary }}>{g.appts}</span> appts</span>
                  <span style={{ color: C.textMuted }}><span className="font-bold" style={{ color: C.success }}>{g.compRate}%</span> done</span>
                </div>
                <div className="w-full mt-2">
                  <div className="flex justify-between text-xs mb-1"><span style={{ color: C.textMuted }}>Score</span><span className="font-bold" style={{ color: C.primary }}>{g.overallScore}/100</span></div>
                  <div className="h-2 rounded-full" style={{ background: C.border }}>
                    <div className="h-2 rounded-full" style={{ width: `${g.overallScore}%`, background: C.primary }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background: C.white, border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <SectionHead title="Performance Ranking Chart" subtitle="Sort by metric" />
            <div className="flex gap-2">
              {['appointments', 'score'].map(v => (
                <button key={v} onClick={() => setRankBy(v)}
                  className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
                  style={{ background: rankBy === v ? C.primary : C.white, color: rankBy === v ? C.white : C.primary, border: `1px solid ${rankBy === v ? C.primary : C.border}` }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.barData} layout="vertical" barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: C.textMuted }} />
              <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 10, fill: C.textMuted }} />
              <Tooltip contentStyle={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8 }} />
              <Bar dataKey={rankBy === 'score' ? 'Score' : 'Appointments'} fill={C.primary} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl p-5" style={{ background: C.white, border: `1px solid ${C.border}` }}>
          <SectionHead title="Multi-Metric Radar (Top 4)" subtitle="Comparing top GNs across all performance dimensions" />
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={data.radarData}>
              <PolarGrid stroke={C.border} />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: C.textMuted }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: C.textMuted }} />
              {data.top4Names.map((name, i) => (
                <Radar key={name} name={name} dataKey={name}
                  stroke={radarColors[i]} fill={radarColors[i]} fillOpacity={0.12} strokeWidth={2} />
              ))}
              <Legend wrapperStyle={{ fontSize: 11, color: C.textMuted }} />
              <Tooltip contentStyle={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <TableCard
        title="Full GN Performance Ranking"
        count={data.ranked.length}
        columns={['Rank', 'GN Officer', 'GN Division', 'District', 'Appointments', 'Completed', 'Rate', 'Activity', 'Avail Days', 'Overall Score']}
        rows={data.ranked.slice(0, 15).map((g, i) => {
          const tier = g.rank <= 3 ? 'success' : g.rank <= 8 ? 'primary' : g.rank <= 15 ? 'warn' : 'danger';
          return (
            <tr key={g.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : C.bg }}>
              <td className="px-4 py-2.5">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold"
                  style={{ background: g.rank <= 3 ? C.accent : C.bg, color: g.rank <= 3 ? C.darkest : C.textMuted }}>
                  {g.rank}
                </span>
              </td>
              <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: C.darkest }}>{g.fullName || '—'}</td>
              <td className="px-4 py-2.5 text-xs" style={{ color: C.text }}>{g.gnDivisionName || g.gnDiv || '—'}</td>
              <td className="px-4 py-2.5 text-xs" style={{ color: C.textMuted }}>{g.district || '—'}</td>
              <td className="px-4 py-2.5 text-xs text-center font-bold" style={{ color: C.darkest }}>{g.appts}</td>
              <td className="px-4 py-2.5 text-xs text-center font-semibold" style={{ color: C.success }}>{g.completed}</td>
              <td className="px-4 py-2.5 text-xs text-center font-semibold" style={{ color: g.compRate >= 70 ? C.success : g.compRate >= 40 ? C.warn : C.danger }}>{g.compRate}%</td>
              <td className="px-4 py-2.5 text-xs text-center" style={{ color: C.textMuted }}>{g.activity}</td>
              <td className="px-4 py-2.5 text-xs text-center" style={{ color: C.textMuted }}>{g.availDays}/7</td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full" style={{ background: C.border }}>
                    <div className="h-2 rounded-full" style={{ width: `${g.overallScore}%`, background: g.overallScore >= 70 ? C.primary : g.overallScore >= 40 ? C.accent : '#C8A882' }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: C.darkest, minWidth: 28 }}>{g.overallScore}</span>
                </div>
              </td>
            </tr>
          );
        })}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// E. INACTIVE GN REPORT
// ═══════════════════════════════════════════════════════════════════════════
function InactiveGNReport({ start, end, sort }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(30);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [gnSnap, apptSnap, logSnap] = await Promise.all([
          getDocs(collection(db, 'gn_officers')),
          getDocs(collection(db, 'appointments')),
          getDocs(collection(db, 'activity_logs')),
        ]);
        let gns = gnSnap.docs.map(d => ({ ...d.data(), id: d.id }));
        let appts = apptSnap.docs.map(d => ({ ...d.data(), id: d.id }));
        let logs = logSnap.docs.map(d => ({ ...d.data(), id: d.id }));

        // All GNs annotated
        const gnRows = gns.map(gn => {
          const myAppts = appts.filter(a => a.gnDiv === gn.gnDiv || a.uid === gn.uid);
          const myLogs = logs.filter(l => l.uid === gn.uid);
          const lastLogin = toDate(gn.lastLogin);
          const lastAppt = myAppts.length ? toDate(myAppts.sort((a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0))[0]?.createdAt) : null;
          const lastAct = myLogs.length ? toDate(myLogs.sort((a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0))[0]?.createdAt) : null;
          const loginDays = daysAgo(lastLogin);
          const apptDays = daysAgo(lastAppt);
          const actDays = daysAgo(lastAct);
          const noLogin = loginDays > threshold;
          const noAppts = myAppts.length === 0 || apptDays > threshold;
          const isInactive = noLogin && noAppts;
          const riskLevel = loginDays > 90 ? 'critical' : loginDays > 60 ? 'high' : loginDays > 30 ? 'medium' : 'low';
          return {
            ...gn, lastLogin, lastAppt, lastAct, loginDays, apptDays, actDays,
            totalAppts: myAppts.length, noLogin, noAppts, isInactive, riskLevel
          };
        });

        const inactive = gnRows.filter(g => g.isInactive);
        const noLoginOnly = gnRows.filter(g => g.noLogin && !g.noAppts);
        const noApptsOnly = gnRows.filter(g => g.noAppts && !g.noLogin);

        inactive.sort(sort === 'oldest' ? (a, b) => a.loginDays - b.loginDays : (a, b) => b.loginDays - a.loginDays);

        // Inactivity by duration buckets
        const buckets = [
          { range: '31–60 days', count: inactive.filter(g => g.loginDays >= 31 && g.loginDays <= 60).length },
          { range: '61–90 days', count: inactive.filter(g => g.loginDays >= 61 && g.loginDays <= 90).length },
          { range: '91–180 days', count: inactive.filter(g => g.loginDays >= 91 && g.loginDays <= 180).length },
          { range: '>180 days', count: inactive.filter(g => g.loginDays > 180).length },
        ];

        setData({ gnRows, inactive, noLoginOnly, noApptsOnly, buckets });
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [start, end, sort, threshold]);

  if (loading) return <div className="flex flex-col gap-4"><div className="grid grid-cols-3 gap-4">{[1, 2, 3].map(i => <Sk key={i} h={110} />)}</div><Sk h={260} /><Sk h={280} /></div>;
  if (!data) return <p style={{ color: C.textMuted }}>No data.</p>;

  return (
    <div className="flex flex-col gap-6">
      {/* Threshold selector */}
      <div className="flex items-center gap-4 px-5 py-3 rounded-xl"
        style={{ background: C.dangerBg, border: `1px solid #fca5a5` }}>
        <ShieldOff size={18} color={C.danger} />
        <span className="text-sm font-semibold" style={{ color: C.danger }}>Inactivity Threshold:</span>
        {[14, 30, 60, 90].map(d => (
          <button key={d} onClick={() => setThreshold(d)}
            className="px-3 py-1 rounded-full text-xs font-bold transition-all"
            style={{ background: threshold === d ? C.danger : 'transparent', color: threshold === d ? C.white : C.danger, border: `1px solid ${C.danger}` }}>
            {d} days
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total GN Officers" value={data.gnRows.length} icon={Users} accent="#fdf0e0" />
        <StatCard label="Fully Inactive" value={data.inactive.length} icon={UserX} accent={C.dangerBg} sub={`No login + no appts >${threshold}d`} trend="down" />
        <StatCard label="No Recent Login" value={data.noLoginOnly.length + data.inactive.length} icon={ShieldOff} accent={C.warnBg} sub="Login overdue" />
        <StatCard label="No Appointments" value={data.noApptsOnly.length + data.inactive.length} icon={Calendar} accent={C.warnBg} sub="No appointment activity" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background: C.white, border: `1px solid ${C.border}` }}>
          <SectionHead title="Inactive GNs by Duration" subtitle="How long each group has been inactive" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.buckets} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: C.textMuted }} />
              <YAxis tick={{ fontSize: 11, fill: C.textMuted }} />
              <Tooltip contentStyle={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8 }} />
              <Bar dataKey="count" name="Inactive GNs" radius={[6, 6, 0, 0]}>
                {data.buckets.map((_, i) => <Cell key={i} fill={[C.accent, '#B05A00', C.dark, C.darkest][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl p-5" style={{ background: C.white, border: `1px solid ${C.border}` }}>
          <SectionHead title="Risk Level Summary" subtitle="Inactivity risk categorisation" />
          <div className="flex flex-col gap-3 mt-4">
            {[
              { level: 'Critical (>90d)', color: C.danger, bg: C.dangerBg, count: data.inactive.filter(g => g.loginDays > 90).length },
              { level: 'High (61–90d)', color: '#c2410c', bg: '#ffedd5', count: data.inactive.filter(g => g.loginDays > 60 && g.loginDays <= 90).length },
              { level: 'Medium (31–60d)', color: C.warn, bg: C.warnBg, count: data.inactive.filter(g => g.loginDays > 30 && g.loginDays <= 60).length },
            ].map(r => (
              <div key={r.level} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: r.bg }}>
                <AlertTriangle size={16} color={r.color} />
                <span className="text-sm font-semibold flex-1" style={{ color: r.color }}>{r.level}</span>
                <span className="text-xl font-extrabold" style={{ color: r.color }}>{r.count}</span>
                <span className="text-xs" style={{ color: r.color }}>GNs</span>
              </div>
            ))}
            <div className="mt-2 p-3 rounded-lg" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
              <p className="text-xs font-semibold" style={{ color: C.textMuted }}>
                ⚠️ Recommended actions: Send reminders, verify contact details, or initiate review process for critical/high risk GNs.
              </p>
            </div>
          </div>
        </div>
      </div>

      <TableCard
        title={`Inactive GN Officers (threshold: >${threshold} days)`}
        count={data.inactive.length}
        columns={['#', 'GN Officer', 'GN Division', 'District', 'Last Login', 'Days Inactive', 'Last Appointment', 'Total Appts', 'Risk Level', 'Action Needed']}
        rows={data.inactive.slice(0, 15).map((g, i) => {
          const riskColor = g.riskLevel === 'critical' ? C.danger : g.riskLevel === 'high' ? '#c2410c' : C.warn;
          const riskBg = g.riskLevel === 'critical' ? C.dangerBg : g.riskLevel === 'high' ? '#ffedd5' : C.warnBg;
          return (
            <tr key={g.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.white : C.bg }}>
              <td className="px-4 py-2.5 text-xs font-bold" style={{ color: C.textMuted }}>{i + 1}</td>
              <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: C.darkest }}>{g.fullName || '—'}</td>
              <td className="px-4 py-2.5 text-xs" style={{ color: C.text }}>{g.gnDivisionName || g.gnDiv || '—'}</td>
              <td className="px-4 py-2.5 text-xs" style={{ color: C.textMuted }}>{g.district || '—'}</td>
              <td className="px-4 py-2.5 text-xs" style={{ color: C.textMuted }}>{fmtDate(g.lastLogin)}</td>
              <td className="px-4 py-2.5 text-xs font-bold" style={{ color: riskColor }}>
                {g.loginDays === 9999 ? 'Never' : g.loginDays + ' days'}
              </td>
              <td className="px-4 py-2.5 text-xs" style={{ color: C.textMuted }}>{fmtDate(g.lastAppt)}</td>
              <td className="px-4 py-2.5 text-xs text-center font-semibold" style={{ color: g.totalAppts === 0 ? C.danger : C.text }}>{g.totalAppts}</td>
              <td className="px-4 py-2.5">
                <span className="px-2 py-0.5 rounded-full text-xs font-bold capitalize"
                  style={{ background: riskBg, color: riskColor }}>{g.riskLevel}</span>
              </td>
              <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: riskColor }}>
                {g.riskLevel === 'critical' ? 'Urgent review' : g.riskLevel === 'high' ? 'Send reminder' : 'Monitor'}
              </td>
            </tr>
          );
        })}
        emptyMsg={`No GNs found inactive for more than ${threshold} days.`}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NAV COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
function NavItem({ icon: Ic, label, active, bold, onClick }) {
  return (
    <li onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-all ${active ? 'bg-amber-700 text-white font-bold' : bold ? 'text-amber-900 font-bold hover:bg-amber-100' : 'text-amber-800 hover:bg-amber-100'
        }`}
      style={{ fontSize: bold && !Ic ? '0.85rem' : '0.82rem' }}>
      {Ic && <Ic size={16} className={active ? 'text-white' : 'text-amber-700'} />}
      <span>{label}</span>
    </li>
  );
}

function Sidebar({ onLogout }) {
  const navigate = useNavigate();
  return (
    <aside className="w-64 flex-shrink-0 flex flex-col py-6 px-3 gap-2 border-r"
      style={{ borderColor: C.border, background: C.bg }}>
      <div className="flex items-center gap-2 px-3 mb-6">
        <img src="/logo2.png" alt="Smart Grama Sewa" className="h-10" />
      </div>
      <ul className="flex flex-col gap-1 flex-1">
        <NavItem icon={LayoutDashboard} label="Dashboard" bold onClick={() => navigate('/admin/dashboard')} />
        <li className="px-4 pt-3 pb-1 text-xs font-extrabold" style={{ color: C.primary }}>GN management</li>
        <NavItem icon={UserCheck} label="Registration Requests" onClick={() => navigate('/admin/registrationrequestapproval')} />
        <NavItem icon={ArrowLeftRight} label="Transfer Request" onClick={() => navigate('/admin/transferrequestapproval')} />
        <li className="px-4 pt-3 pb-1 text-xs font-extrabold" style={{ color: C.primary }}>Reports</li>
        <NavItem icon={BarChart2} label="System reports" onClick={() => navigate('/admin/reports/system')} />
        <NavItem icon={User} label="Individual user access" onClick={() => navigate('/admin/reports/useraccess')} />
        <NavItem icon={Activity} label="GN activity reports" active onClick={() => navigate('/admin/reports/gnactivity')} />
        <li className="pt-4">
          <NavItem icon={Megaphone} label="Announcements" bold onClick={() => navigate('/admin/announcements')} />
        </li>
        <li className="pt-1">
          <NavItem icon={Calendar} label="Appointment Calendar" bold
            onClick={() => navigate('/admin/calendar')} />
        </li>
        <li className="pt-2">
          <NavItem icon={TrendingUp} label="Statistical Changes" bold active
            onClick={() => navigate('/admin/statistical-changes')} />
        </li>
      </ul>
      <div className="px-3 pt-4 border-t" style={{ borderColor: C.border }}>
        <button onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm font-bold transition-all hover:bg-red-50"
          style={{ color: '#991B1B' }}>
          <LogOut size={16} /><span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

function Topbar() {
  const [searchVal, setSearchVal] = useState("");
  return (
    <header className="flex items-center gap-4 px-6 py-4 border-b sticky top-0 z-20"
      style={{ borderColor: C.border, background: C.bg }}>
      <div className="flex-1 relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" color={C.textMuted} />
        <input
          className="w-full pl-10 pr-4 py-2.5 rounded-full border text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          style={{ borderColor: '#C8B89A', background: C.inputBg, color: C.text }}
          placeholder="search..." value={searchVal} onChange={e => setSearchVal(e.target.value)} />
      </div>
      <button className="flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-full border"
        style={{ borderColor: '#C8B89A', color: C.text, background: C.inputBg }}>
        English <ChevronDown size={14} />
      </button>
      <button className="relative w-10 h-10 rounded-full flex items-center justify-center border"
        style={{ borderColor: '#C8B89A', background: C.inputBg }}>
        <Icon.Bell size={18} color={C.primary} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: C.accent }} />
      </button>
      <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: C.primary }}>
        <Icon.User size={18} color="#fff" />
      </button>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function AdminGNActivityReports() {
  const [activeReport, setActiveReport] = useState('login-activity');
  const [sort, setSort] = useState('newest');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [applied, setApplied] = useState({ sort: 'newest', start: '', end: '' });

  function handleApply() { setApplied({ sort, start, end }); }
  function handleReset() {
    setSort('newest'); setStart(''); setEnd('');
    setApplied({ sort: 'newest', start: '', end: '' });
  }

  const activeLabel = SUB_REPORTS.find(r => r.id === activeReport)?.label || '';
  const ActiveIcon = SUB_REPORTS.find(r => r.id === activeReport)?.icon || Activity;

  const renderReport = () => {
    const p = { start: applied.start, end: applied.end, sort: applied.sort };
    switch (activeReport) {
      case 'login-activity': return <GNLoginActivityReport          {...p} />;
      case 'appt-handling': return <GNAppointmentHandlingReport    {...p} />;
      case 'availability': return <GNAvailabilityReport           {...p} />;
      case 'performance': return <GNPerformanceComparisonReport  {...p} />;
      case 'inactive': return <InactiveGNReport               {...p} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: C.bg, fontFamily: "'Segoe UI',sans-serif" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
      <Sidebar onLogout={() => { }} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-y-auto px-8 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-1 text-xs" style={{ color: C.textMuted }}>
            <span>Reports</span>
            <ChevronRight size={12} />
            <span style={{ color: C.primary, fontWeight: 600 }}>GN Activity Reports</span>
          </div>

          {/* Page header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: C.darkest }}>
                📊 GN Activity Reports
              </h1>
              <p className="text-sm mt-0.5" style={{ color: C.textMuted }}>
                Compare and evaluate all Grama Niladhari officers across login, appointments, availability and performance
              </p>
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
              style={{ background: C.dark, color: C.white }}>
              <Download size={14} /> Export Report
            </button>
          </div>

          {/* Sub-report selector */}
          <div className="flex flex-wrap items-end gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: C.primary }}>Select Sub-Report</label>
              <div className="relative">
                <select value={activeReport} onChange={e => setActiveReport(e.target.value)}
                  className="pl-4 pr-10 py-2.5 rounded-xl text-sm font-semibold border-2 focus:outline-none focus:ring-2 focus:ring-amber-300 appearance-none cursor-pointer"
                  style={{ borderColor: C.primary, background: C.white, color: C.darkest, minWidth: 320 }}>
                  {SUB_REPORTS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" color={C.primary} />
              </div>
            </div>

            {/* Quick pill tabs */}
            <div className="flex gap-2 flex-wrap pb-0.5">
              {SUB_REPORTS.map(r => (
                <button key={r.id} onClick={() => setActiveReport(r.id)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: activeReport === r.id ? C.primary : C.white,
                    color: activeReport === r.id ? C.white : C.textMuted,
                    border: `1px solid ${activeReport === r.id ? C.primary : C.border}`
                  }}>
                  {r.label.split('.')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          {/* Active report header strip */}
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl mb-5"
            style={{ background: C.primary }}>
            <ActiveIcon size={18} color={C.accent} />
            <span className="text-sm font-bold text-white">{activeLabel}</span>
            <span className="ml-auto text-xs" style={{ color: '#C8A882' }}>
              {applied.start && applied.end
                ? `${applied.start} – ${applied.end}`
                : 'All available data'}
            </span>
          </div>

          {/* Date filter */}
          <DateFilterBar sort={sort} setSort={setSort} start={start} setStart={setStart}
            end={end} setEnd={setEnd} onApply={handleApply} onReset={handleReset} />

          {/* Report content */}
          {renderReport()}
        </main>

        {/* Footer */}
        <footer className="text-center text-xs py-4"
          style={{ background: C.cardDark, color: '#C8A882' }}>
          © 2026 Smart Grama Sewa. All rights reserved.
        </footer>
      </div>
    </div>
  );
}