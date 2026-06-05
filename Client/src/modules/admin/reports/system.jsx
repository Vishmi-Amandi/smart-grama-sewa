import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../../firebase';

import {
  LayoutDashboard, UserCheck, ArrowLeftRight, BarChart2, User,
  Activity, LogOut, Search, ChevronDown, Megaphone, Bell,
  TrendingUp, TrendingDown, Users, Calendar, Clock, AlertCircle,
  Download, RefreshCw, Filter, ChevronRight, Database, Wifi,
  XCircle, CheckCircle
} from "lucide-react";
import * as Icon from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore, collection, getDocs, query, where,
  orderBy, Timestamp, doc, getDoc
} from "firebase/firestore";

// ─── Colors ─────────────────────────────────────────────────────────────────
const COLORS = {
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
  chart: ['#F5A623', '#7B2D00', '#6B2400', '#C8A882', '#3D1500', '#F5C87A', '#B05A00'],
};

// ─── Sub-report definitions ──────────────────────────────────────────────────
const SUB_REPORTS = [
  { id: 'user-stats', label: 'A. User Statistics Report', icon: Users },
  { id: 'appt-summary', label: 'B. Appointment Summary Report', icon: Calendar },
  { id: 'system-usage', label: 'C. System Usage Report', icon: Activity },
  { id: 'activity-trend', label: 'D. System Activity Trend Report', icon: TrendingUp },
  { id: 'system-health', label: 'E. System Health Report', icon: Wifi },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function toDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (val?.toDate) return val.toDate();
  if (typeof val === 'string' || typeof val === 'number') return new Date(val);
  return null;
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' });
}
function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => {
    const k = keyFn(item);
    acc[k] = (acc[k] || []);
    acc[k].push(item);
    return acc;
  }, {});
}
function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

// ─── Export Buttomn ─────────────────────────────────────────────────────────────────
function exportToCSV(data, filename = "report.csv") {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const headers = Object.keys(data[0]);

  const csvRows = [
    headers.join(","), // header row
    ...data.map(row =>
      headers.map(field => JSON.stringify(row[field] ?? "")).join(",")
    )
  ];

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Ic, accent, trend }) {
  return (
    <div className="rounded-xl p-5 flex flex-col gap-2"
      style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, minWidth: 0 }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>{label}</span>
        <span className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: accent || COLORS.bg }}>
          {Ic && <Ic size={18} color={COLORS.primary} />}
        </span>
      </div>
      <div className="text-3xl font-bold" style={{ color: COLORS.darkest }}>{value}</div>
      {sub && <div className="text-xs flex items-center gap-1" style={{ color: COLORS.textMuted }}>
        {trend === 'up' && <TrendingUp size={12} color="#16a34a" />}
        {trend === 'down' && <TrendingDown size={12} color="#dc2626" />}
        {sub}
      </div>}
    </div>
  );
}

// ─── Section Heading ─────────────────────────────────────────────────────────
function SectionHead({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold" style={{ color: COLORS.darkest }}>{title}</h2>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>{subtitle}</p>}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function Skeleton({ h = 20, w = '100%', r = 8 }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: r, background: COLORS.border, opacity: 0.5,
      animation: 'pulse 1.5s ease-in-out infinite'
    }} />
  );
}

// ─── NavItem ─────────────────────────────────────────────────────────────────
function NavItem({ icon: Ic, label, active, bold, onClick }) {
  return (
    <li onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-all ${active ? 'bg-amber-700 text-white font-bold'
        : bold ? 'text-amber-900 font-bold hover:bg-amber-100'
          : 'text-amber-800 hover:bg-amber-100'
        }`}
      style={{ fontSize: bold && !Ic ? '0.85rem' : '0.82rem' }}>
      {Ic && <Ic size={16} className={active ? 'text-white' : 'text-amber-700'} />}
      <span>{label}</span>
    </li>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ onLogout }) {
  const navigate = useNavigate();
  return (
    <aside className="w-64 flex-shrink-0 flex flex-col py-6 px-3 gap-2 border-r"
      style={{ borderColor: COLORS.border, background: COLORS.bg }}>

      {/*Logo*/}
      <div className="flex items-center gap-2 px-3 mb-6">
        <img src="/logo2.png" alt="Smart Grama Sewa" />
      </div>
      {/*Nav link*/}
      <ul className="flex flex-col gap-1 flex-1">
        <NavItem icon={LayoutDashboard} label="Dashboard" bold onClick={() => navigate('/admin/dashboard')} />
        <li className="px-4 pt-3 pb-1 text-xs font-extrabold" style={{ color: COLORS.primary }}>Grama Niladhari officer Management</li>
        <NavItem icon={UserCheck} label="Registration Requests" onClick={() => navigate('/admin/registrationrequestapproval')} />
        <NavItem icon={ArrowLeftRight} label="Transfer Request" onClick={() => navigate('/admin/transferrequestapproval')} />
        <li className="px-4 pt-3 pb-1 text-xs font-extrabold" style={{ color: COLORS.primary }}>Reports</li>
        <NavItem icon={BarChart2} label="System reports" active onClick={() => navigate('/admin/reports/system')} />
        <NavItem icon={User} label="Individual user access" onClick={() => navigate('/admin/reports/user-access')} />
        <NavItem icon={Activity} label="GN activity reports" onClick={() => navigate('/admin/reports/gn-activity')} />
        <li className="pt-4">
          <NavItem icon={Megaphone} label="Announcements" bold onClick={() => navigate('/admin/announcements')} />
        </li>
        <li className="pt-4">
          <NavItem icon={Calendar} label="Appointment Calendar" bold onClick={() => navigate("/admin/calendar")} />
        </li>
      </ul>


      <div className="px-3 pt-4 border-t" style={{ borderColor: COLORS.border }}>
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

// ─── Topbar ───────────────────────────────────────────────────────────────────
function Topbar() {
  const [searchVal, setSearchVal] = useState("");
  return (
    <header className="flex items-center gap-4 px-6 py-4 border-b sticky top-0 z-20"
      style={{ borderColor: COLORS.border, background: COLORS.bg }}>
      <div className="flex-1 relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" color={COLORS.textMuted} />
        <input
          className="w-full pl-10 pr-4 py-2.5 rounded-full border text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          style={{ borderColor: '#C8B89A', background: COLORS.inputBg, color: COLORS.text }}
          placeholder="search..." value={searchVal} onChange={(e) => setSearchVal(e.target.value)} />
      </div>
      <button className="flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-full border"
        style={{ borderColor: '#C8B89A', color: COLORS.text, background: COLORS.inputBg }}>
        English <ChevronDown size={14} />
      </button>
      <button className="relative w-10 h-10 rounded-full flex items-center justify-center border"
        style={{ borderColor: '#C8B89A', background: COLORS.inputBg }}>
        <Icon.Bell size={18} color={COLORS.primary} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: COLORS.accent }} />
      </button>
      <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: COLORS.primary }}>
        <Icon.User size={18} color="#fff" />
      </button>
    </header>
  );
}

// ─── Date Filter Bar ──────────────────────────────────────────────────────────
function DateFilterBar({ sort, setSort, startDate, setStartDate, endDate, setEndDate, onApply, onReset }) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl mb-6"
      style={{ background: COLORS.white, border: `1px solid ${COLORS.border}` }}>
      <Filter size={15} color={COLORS.primary} />
      <span className="text-xs font-bold uppercase tracking-wider mr-1" style={{ color: COLORS.primary }}>Filters</span>

      <select value={sort} onChange={e => setSort(e.target.value)}
        className="px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-amber-300"
        style={{ borderColor: COLORS.border, background: COLORS.inputBg, color: COLORS.text }}>
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
      </select>

      <div className="flex items-center gap-2">
        <label className="text-xs font-medium" style={{ color: COLORS.textMuted }}>From</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-amber-300"
          style={{ borderColor: COLORS.border, background: COLORS.inputBg, color: COLORS.text }} />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium" style={{ color: COLORS.textMuted }}>To</label>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-amber-300"
          style={{ borderColor: COLORS.border, background: COLORS.inputBg, color: COLORS.text }} />
      </div>

      <button onClick={onApply}
        className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
        style={{ background: COLORS.primary, color: COLORS.white }}>
        Apply
      </button>
      <button onClick={onReset}
        className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:bg-amber-50"
        style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, background: 'transparent' }}>
        Reset
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-REPORT A: User Statistics
// ═══════════════════════════════════════════════════════════════════════════════
function UserStatisticsReport({ startDate, endDate, sort }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const [gnSnap, userSnap] = await Promise.all([
          getDocs(collection(db, 'gn_officers')),
          getDocs(collection(db, 'users'))
        ]);
        const gnList = gnSnap.docs.map(d => ({ ...d.data(), id: d.id }));
        const userList = userSnap.docs.map(d => ({ ...d.data(), id: d.id }));

        const now = new Date();
        const ranges = [
          { label: 'Today', start: new Date(now.toDateString()) },
          { label: '7 Days', start: new Date(now - 7 * 864e5) },
          { label: '30 Days', start: new Date(now - 30 * 864e5) },
        ];

        // Filter by date range if set
        let filteredGN = gnList;
        let filteredUsers = userList;
        if (startDate) {
          filteredGN = filteredGN.filter(u => toDate(u.createdAt) >= new Date(startDate));
          filteredUsers = filteredUsers.filter(u => toDate(u.createdAt) >= new Date(startDate));
        }
        if (endDate) {
          const ed = new Date(endDate); ed.setHours(23, 59, 59);
          filteredGN = filteredGN.filter(u => toDate(u.createdAt) <= ed);
          filteredUsers = filteredUsers.filter(u => toDate(u.createdAt) <= ed);
        }

        // Sort
        const sortFn = sort === 'oldest'
          ? (a, b) => (toDate(a.createdAt) || 0) - (toDate(b.createdAt) || 0)
          : (a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0);
        filteredGN.sort(sortFn);
        filteredUsers.sort(sortFn);

        // Daily registrations chart (last 14 days)
        const days = Array.from({ length: 14 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (13 - i));
          return d.toISOString().slice(0, 10);
        });
        const combined = [...gnList, ...userList];
        const dailyRegs = days.map(day => ({
          date: day.slice(5),
          GNs: gnList.filter(u => toDate(u.createdAt)?.toISOString().slice(0, 10) === day).length,
          Citizens: userList.filter(u => toDate(u.createdAt)?.toISOString().slice(0, 10) === day).length,
        }));

        setData({
          gnList, userList, filteredGN, filteredUsers, dailyRegs,
          totals: { gn: gnList.length, citizens: userList.length }
        });
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    fetch();
  }, [startDate, endDate, sort]);

  if (loading) return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} h={110} />)}</div>
      <Skeleton h={260} />
    </div>
  );
  if (!data) return <p style={{ color: COLORS.textMuted }}>No data available.</p>;

  // Export function
  function handleExport() {
  if (!data) return;

  const exportData = data.filteredGN.map(u => ({
    Name: u.fullName || '',
    Division: u.gnDivisionName || u.gnDiv || '',
    District: u.district || '',
    Registered: fmtDate(toDate(u.createdAt)),
    Role: u.role || ''
  }));

  exportToCSV(exportData, "user_statistics_report.csv");
}

  return (
    <div className="flex flex-col gap-6">
      {/*Export Button*/}
      <div className="flex justify-between items-center">
        <SectionHead title="User Statistics Report" />
        <button onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: COLORS.primary, color: COLORS.white }}>
          <Download size={14} /> Export Report 
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total GN Officers" value={data.totals.gn} icon={Users} accent="#FFF3E0" sub="All registered GNs" />
        <StatCard label="Total Citizens" value={data.totals.citizens} icon={User} accent="#FFF3E0" sub="All citizen users" />
        <StatCard label="Total Users" value={data.totals.gn + data.totals.citizens} icon={Activity} accent="#FFF3E0" sub="Combined system users" />
      </div>

      <div className="rounded-xl p-5" style={{ background: COLORS.white, border: `1px solid ${COLORS.border}` }}>
        <SectionHead title="Daily New Registrations (Last 14 Days)" subtitle="GN Officers vs Citizens joining per day" />
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.dailyRegs} barSize={12}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: COLORS.textMuted }} />
            <YAxis tick={{ fontSize: 11, fill: COLORS.textMuted }} />
            <Tooltip contentStyle={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8 }} />
            <Bar dataKey="GNs" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Citizens" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
            <Legend wrapperStyle={{ fontSize: 12, color: COLORS.textMuted }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
        <div className="px-5 py-3 flex items-center justify-between"
          style={{ background: COLORS.primary }}>
          <span className="text-sm font-bold text-white">Recent GN Registrations ({data.filteredGN.length})</span>
          <span className="text-xs" style={{ color: '#C8A882' }}>Filtered results</span>
        </div>
        <table className="w-full text-sm" style={{ background: COLORS.white }}>
          <thead>
            <tr style={{ background: COLORS.bg, color: COLORS.textMuted, fontSize: 11 }}>
              {['Full Name', 'GN Division', 'District', 'Registered', 'Status'].map(h => (
                <th key={h} className="px-4 py-2 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.filteredGN.slice(0, 10).map((gn, i) => (
              <tr key={gn.id} style={{
                borderTop: `1px solid ${COLORS.border}`,
                background: i % 2 === 0 ? COLORS.white : COLORS.bg
              }}>
                <td className="px-4 py-2.5 font-medium" style={{ color: COLORS.darkest }}>{gn.fullName || '—'}</td>
                <td className="px-4 py-2.5" style={{ color: COLORS.text }}>{gn.gnDivisionName || gn.gnDiv || '—'}</td>
                <td className="px-4 py-2.5" style={{ color: COLORS.text }}>{gn.district || '—'}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: COLORS.textMuted }}>{fmtDate(toDate(gn.createdAt))}</td>
                <td className="px-4 py-2.5">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: gn.role === 'gn' ? '#dcfce7' : '#fef9c3', color: gn.role === 'gn' ? '#166534' : '#854d0e' }}>
                    {gn.role || 'active'}
                  </span>
                </td>
              </tr>
            ))}
            {data.filteredGN.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-sm" style={{ color: COLORS.textMuted }}>No records in selected range.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-REPORT B: Appointment Summary
// ═══════════════════════════════════════════════════════════════════════════════
function AppointmentSummaryReport({ startDate, endDate, sort }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'appointments'));
        let appts = snap.docs.map(d => ({ ...d.data(), id: d.id }));

        if (startDate) appts = appts.filter(a => toDate(a.createdAt) >= new Date(startDate));
        if (endDate) { const ed = new Date(endDate); ed.setHours(23, 59, 59); appts = appts.filter(a => toDate(a.createdAt) <= ed); }
        const sortFn = sort === 'oldest'
          ? (a, b) => (toDate(a.createdAt) || 0) - (toDate(b.createdAt) || 0)
          : (a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0);
        appts.sort(sortFn);

        const statusCount = { completed: 0, cancelled: 0, pending: 0, other: 0 };
        appts.forEach(a => {
          const s = (a.status || '').toLowerCase();
          if (s === 'completed') statusCount.completed++;
          else if (s === 'cancelled') statusCount.cancelled++;
          else if (s === 'pending') statusCount.pending++;
          else statusCount.other++;
        });

        const days = Array.from({ length: 14 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (13 - i));
          return d.toISOString().slice(0, 10);
        });
        const daily = days.map(day => ({
          date: day.slice(5),
          count: appts.filter(a => toDate(a.createdAt)?.toISOString().slice(0, 10) === day).length
        }));

        const pieData = [
          { name: 'Completed', value: statusCount.completed, color: COLORS.primary },
          { name: 'Pending', value: statusCount.pending, color: COLORS.accent },
          { name: 'Cancelled', value: statusCount.cancelled, color: '#C8A882' },
        ];

        setData({ appts, statusCount, daily, pieData, total: appts.length });
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    fetch();
  }, [startDate, endDate, sort]);

  if (loading) return <div className="flex flex-col gap-4"><div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} h={110} />)}</div><Skeleton h={260} /></div>;
  if (!data) return <p style={{ color: COLORS.textMuted }}>No data available.</p>;

    // Export function
function handleExport() {
  if (!data) return;

  const exportData = data.appts.map(a => ({
    Name: a.fullName || '',
    NIC: a.nic || '',
    Service: a.service || '',
    GN_Division: a.gnDiv || '',
    Date: a.date || '',
    Slot: a.slot || '',
    Status: a.status || ''
  }));

  exportToCSV(exportData, "appointment_summary_report.csv");
}
  return (
    <div className="flex flex-col gap-6">
      {/*Export Button*/}
      <div className="flex justify-between items-center">
        <SectionHead title="Appointment Summary Report" />        
        <button onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: COLORS.primary, color: COLORS.white }}>
          <Download size={14} /> Export Report
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Appointments" value={data.total} icon={Calendar} accent="#FFF3E0" />
        <StatCard label="Completed" value={data.statusCount.completed} icon={CheckCircle} accent="#dcfce7" sub="Successfully done" trend="up" />
        <StatCard label="Pending" value={data.statusCount.pending} icon={Clock} accent="#fef9c3" sub="Awaiting action" />
        <StatCard label="Cancelled" value={data.statusCount.cancelled} icon={XCircle} accent="#fee2e2" sub="Not completed" trend="down" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background: COLORS.white, border: `1px solid ${COLORS.border}` }}>
          <SectionHead title="Appointments Over Time" subtitle="Daily booking trend (last 14 days)" />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.daily}>
              <defs>
                <linearGradient id="apptGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: COLORS.textMuted }} />
              <YAxis tick={{ fontSize: 11, fill: COLORS.textMuted }} />
              <Tooltip contentStyle={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8 }} />
              <Area type="monotone" dataKey="count" stroke={COLORS.primary} fill="url(#apptGrad)" strokeWidth={2} name="Appointments" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl p-5" style={{ background: COLORS.white, border: `1px solid ${COLORS.border}` }}>
          <SectionHead title="Status Distribution" subtitle="Breakdown by appointment status" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                dataKey="value" nameKey="name" paddingAngle={3}>
                {data.pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: COLORS.textMuted }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
        <div className="px-5 py-3" style={{ background: COLORS.primary }}>
          <span className="text-sm font-bold text-white">Appointment Records ({data.total})</span>
        </div>
        <table className="w-full text-sm" style={{ background: COLORS.white }}>
          <thead>
            <tr style={{ background: COLORS.bg, color: COLORS.textMuted, fontSize: 11 }}>
              {['Citizen', 'NIC', 'Service', 'GN Division', 'Date', 'Slot', 'Status'].map(h => (
                <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.appts.slice(0, 10).map((a, i) => {
              const st = (a.status || '').toLowerCase();
              const badge = st === 'completed'
                ? { bg: '#dcfce7', text: '#166534' }
                : st === 'cancelled'
                  ? { bg: '#fee2e2', text: '#991b1b' }
                  : { bg: '#fef9c3', text: '#854d0e' };
              return (
                <tr key={a.id} style={{ borderTop: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : COLORS.bg }}>
                  <td className="px-3 py-2.5 font-medium" style={{ color: COLORS.darkest }}>{a.fullName || '—'}</td>
                  <td className="px-3 py-2.5 text-xs font-mono" style={{ color: COLORS.textMuted }}>{a.nic || '—'}</td>
                  <td className="px-3 py-2.5" style={{ color: COLORS.text }}>{a.service || '—'}</td>
                  <td className="px-3 py-2.5 text-xs" style={{ color: COLORS.textMuted }}>{a.gnDiv || '—'}</td>
                  <td className="px-3 py-2.5 text-xs" style={{ color: COLORS.textMuted }}>{a.date || '—'}</td>
                  <td className="px-3 py-2.5 text-xs" style={{ color: COLORS.textMuted }}>{a.slot || '—'}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                      style={{ background: badge.bg, color: badge.text }}>{a.status || 'unknown'}</span>
                  </td>
                </tr>
              );
            })}
            {data.appts.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-sm" style={{ color: COLORS.textMuted }}>No records in selected range.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-REPORT C: System Usage
// ═══════════════════════════════════════════════════════════════════════════════
function SystemUsageReport({ startDate, endDate, sort }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'activity_logs'));
        let logs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        if (startDate) logs = logs.filter(l => toDate(l.createdAt) >= new Date(startDate));
        if (endDate) { const ed = new Date(endDate); ed.setHours(23, 59, 59); logs = logs.filter(l => toDate(l.createdAt) <= ed); }
        const sortFn = sort === 'oldest' ? (a, b) => (toDate(a.createdAt) || 0) - (toDate(b.createdAt) || 0) : (a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0);
        logs.sort(sortFn);

        // logins only
        const loginLogs = logs.filter(l => (l.action || l.type || '').toLowerCase().includes('login'));
        // unique users per day
        const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (13 - i)); return d.toISOString().slice(0, 10); });
        const daily = days.map(day => {
          const dayLogs = loginLogs.filter(l => toDate(l.createdAt)?.toISOString().slice(0, 10) === day);
          return { date: day.slice(5), logins: dayLogs.length, activeUsers: new Set(dayLogs.map(l => l.uid)).size };
        });

        // Peak hours
        const hourBuckets = Array(24).fill(0);
        logs.forEach(l => {
          const d = toDate(l.createdAt);
          if (d) hourBuckets[d.getHours()]++;
        });
        const peakHours = hourBuckets.map((count, h) => ({
          hour: `${String(h).padStart(2, '0')}:00`,
          activity: count
        })).filter((_, h) => h >= 6 && h <= 22);

        setData({
          logs, loginLogs, daily, peakHours,
          totalLogins: loginLogs.length,
          uniqueUsers: new Set(loginLogs.map(l => l.uid)).size,
          totalActivity: logs.length
        });
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    fetch();
  }, [startDate, endDate, sort]);

  if (loading) return <div className="flex flex-col gap-4"><div className="grid grid-cols-3 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} h={110} />)}</div><Skeleton h={260} /><Skeleton h={260} /></div>;
  if (!data) return <p style={{ color: COLORS.textMuted }}>No data available.</p>;

// Export Function
function handleExport() {
  if (!data) return;

  const exportData = data.logs.map(l => ({
    UserID: l.uid || '',
    Action: l.action || l.type || '',
    Description: l.description || '',
    Date: fmtDate(toDate(l.createdAt))
  }));

  exportToCSV(exportData, "system_usage_report.csv");
}
  return (
    <div className="flex flex-col gap-6">
            {/*Export Button*/}
      <div className="flex justify-between items-center">
        <SectionHead title="System Usage Report" />       
         <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: COLORS.primary, color: COLORS.white }}>
          <Download size={14} /> Export Report
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Logins" value={data.totalLogins} icon={Activity} accent="#FFF3E0" sub="Login events recorded" />
        <StatCard label="Unique Active Users" value={data.uniqueUsers} icon={Users} accent="#FFF3E0" sub="Distinct users logged in" />
        <StatCard label="Total Activity" value={data.totalActivity} icon={BarChart2} accent="#FFF3E0" sub="All tracked events" />
      </div>

      <div className="rounded-xl p-5" style={{ background: COLORS.white, border: `1px solid ${COLORS.border}` }}>
        <SectionHead title="Daily Login Activity" subtitle="Logins and active users per day (last 14 days)" />
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data.daily}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: COLORS.textMuted }} />
            <YAxis tick={{ fontSize: 11, fill: COLORS.textMuted }} />
            <Tooltip contentStyle={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8 }} />
            <Line type="monotone" dataKey="logins" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 3 }} name="Logins" />
            <Line type="monotone" dataKey="activeUsers" stroke={COLORS.accent} strokeWidth={2} dot={{ r: 3 }} name="Active Users" strokeDasharray="5 5" />
            <Legend wrapperStyle={{ fontSize: 12, color: COLORS.textMuted }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl p-5" style={{ background: COLORS.white, border: `1px solid ${COLORS.border}` }}>
        <SectionHead title="Peak Usage Hours" subtitle="System activity distribution by hour (6AM – 10PM)" />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.peakHours} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: COLORS.textMuted }} interval={2} />
            <YAxis tick={{ fontSize: 11, fill: COLORS.textMuted }} />
            <Tooltip contentStyle={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8 }} />
            <Bar dataKey="activity" radius={[4, 4, 0, 0]}>
              {data.peakHours.map((entry, i) => {
                const isPeak = entry.activity === Math.max(...data.peakHours.map(h => h.activity));
                return <Cell key={i} fill={isPeak ? COLORS.accent : COLORS.primary} fillOpacity={isPeak ? 1 : 0.7} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs mt-2" style={{ color: COLORS.textMuted }}>
          <span className="inline-block w-3 h-3 rounded mr-1" style={{ background: COLORS.accent, verticalAlign: 'middle' }} />
          Peak hour highlighted
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-REPORT D: Activity Trend
// ═══════════════════════════════════════════════════════════════════════════════
function ActivityTrendReport({ startDate, endDate, sort }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('daily');

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const [logSnap, apptSnap, userSnap] = await Promise.all([
          getDocs(collection(db, 'activity_logs')),
          getDocs(collection(db, 'appointments')),
          getDocs(collection(db, 'users')),
        ]);
        let logs = logSnap.docs.map(d => ({ ...d.data(), id: d.id }));
        let appts = apptSnap.docs.map(d => ({ ...d.data(), id: d.id }));
        let users = userSnap.docs.map(d => ({ ...d.data(), id: d.id }));

        if (startDate) { logs = logs.filter(l => toDate(l.createdAt) >= new Date(startDate)); appts = appts.filter(a => toDate(a.createdAt) >= new Date(startDate)); users = users.filter(u => toDate(u.createdAt) >= new Date(startDate)); }
        if (endDate) { const ed = new Date(endDate); ed.setHours(23, 59, 59); logs = logs.filter(l => toDate(l.createdAt) <= ed); appts = appts.filter(a => toDate(a.createdAt) <= ed); users = users.filter(u => toDate(u.createdAt) <= ed); }

        const days = Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (29 - i)); return d.toISOString().slice(0, 10); });
        const daily = days.map(day => ({
          date: day.slice(5),
          logs: logs.filter(l => toDate(l.createdAt)?.toISOString().slice(0, 10) === day).length,
          appts: appts.filter(a => toDate(a.createdAt)?.toISOString().slice(0, 10) === day).length,
          users: users.filter(u => toDate(u.createdAt)?.toISOString().slice(0, 10) === day).length,
        }));

        // Weekly aggregation
        const weekly = [];
        for (let i = 0; i < daily.length; i += 7) {
          const chunk = daily.slice(i, i + 7);
          weekly.push({
            date: `Wk${Math.floor(i / 7) + 1}`,
            logs: chunk.reduce((s, c) => s + c.logs, 0),
            appts: chunk.reduce((s, c) => s + c.appts, 0),
            users: chunk.reduce((s, c) => s + c.users, 0),
          });
        }

        setData({ daily, weekly });
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    fetch();
  }, [startDate, endDate, sort]);

  if (loading) return <div className="flex flex-col gap-4"><Skeleton h={40} w={300} /><Skeleton h={280} /></div>;
  if (!data) return <p style={{ color: COLORS.textMuted }}>No data.</p>;

  const chartData = view === 'daily' ? data.daily : data.weekly;

  // Export Function
  function handleExport() {
  if (!data) return;

  const source = view === 'daily' ? data.daily : data.weekly;

  const exportData = source.map(d => ({
    Period: d.date,
    Logs: d.logs,
    Appointments: d.appts,
    NewUsers: d.users
  }));

  exportToCSV(exportData, "activity_trend_report.csv");
}
  return (
    <div className="flex flex-col gap-6">


      {/*Export Button*/}
      <div className="flex justify-between items-center">
        <SectionHead title="Activity Trend Report" />      
          <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: COLORS.primary, color: COLORS.white }}>
          <Download size={14} /> Export Report
        </button>
      </div>

      <div className="rounded-xl p-5" style={{ background: COLORS.white, border: `1px solid ${COLORS.border}` }}>
        <SectionHead title={`${view === 'daily' ? 'Daily (30 days)' : 'Weekly'} Activity Trend`} subtitle="System logs, appointments, and new users" />
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.2} /><stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} /></linearGradient>
              <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.2} /><stop offset="95%" stopColor={COLORS.accent} stopOpacity={0} /></linearGradient>
              <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C8A882" stopOpacity={0.2} /><stop offset="95%" stopColor="#C8A882" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: COLORS.textMuted }} interval={view === 'daily' ? 6 : 0} />
            <YAxis tick={{ fontSize: 11, fill: COLORS.textMuted }} />
            <Tooltip contentStyle={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8 }} />
            <Area type="monotone" dataKey="logs" stroke={COLORS.primary} fill="url(#g1)" strokeWidth={2} name="Activity Logs" />
            <Area type="monotone" dataKey="appts" stroke={COLORS.accent} fill="url(#g2)" strokeWidth={2} name="Appointments" />
            <Area type="monotone" dataKey="users" stroke="#C8A882" fill="url(#g3)" strokeWidth={2} name="New Users" />
            <Legend wrapperStyle={{ fontSize: 12, color: COLORS.textMuted }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Logs (period)', value: data.daily.reduce((s, d) => s + d.logs, 0), color: COLORS.primary },
          { label: 'Total Appointments', value: data.daily.reduce((s, d) => s + d.appts, 0), color: COLORS.accent },
          { label: 'New Registrations', value: data.daily.reduce((s, d) => s + d.users, 0), color: '#C8A882' },
        ].map(item => (
          <div key={item.label} className="rounded-xl p-4 flex items-center gap-4"
            style={{ background: COLORS.white, border: `1px solid ${COLORS.border}` }}>
            <div className="w-2 self-stretch rounded-full" style={{ background: item.color }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>{item.label}</p>
              <p className="text-2xl font-bold" style={{ color: COLORS.darkest }}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-REPORT E: System Health
// ═══════════════════════════════════════════════════════════════════════════════
function SystemHealthReport({ startDate, endDate, sort }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'activity_logs'));
        let logs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        if (startDate) logs = logs.filter(l => toDate(l.createdAt) >= new Date(startDate));
        if (endDate) { const ed = new Date(endDate); ed.setHours(23, 59, 59); logs = logs.filter(l => toDate(l.createdAt) <= ed); }
        const sortFn = sort === 'oldest' ? (a, b) => (toDate(a.createdAt) || 0) - (toDate(b.createdAt) || 0) : (a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0);
        logs.sort(sortFn);

        const errors = logs.filter(l => (l.type || '').toLowerCase().includes('error') || (l.action || '').toLowerCase().includes('error'));
        const successes = logs.filter(l => (l.type || '').toLowerCase().includes('success') || (l.action || '').toLowerCase().includes('success'));
        const uptime = 99.7; // simulated — replace with real monitoring if available

        const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (13 - i)); return d.toISOString().slice(0, 10); });
        const errorTrend = days.map(day => ({
          date: day.slice(5),
          errors: errors.filter(l => toDate(l.createdAt)?.toISOString().slice(0, 10) === day).length,
          events: logs.filter(l => toDate(l.createdAt)?.toISOString().slice(0, 10) === day).length,
        }));

        setData({ logs, errors, successes, uptime, errorTrend });
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    fetch();
  }, [startDate, endDate, sort]);

  if (loading) return <div className="flex flex-col gap-4"><div className="grid grid-cols-3 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} h={110} />)}</div><Skeleton h={260} /></div>;
  if (!data) return <p style={{ color: COLORS.textMuted }}>No data.</p>;

  const errorRate = data.logs.length ? ((data.errors.length / data.logs.length) * 100).toFixed(1) : '0.0';

  // Export Function
function handleExport() {
  if (!data) return;

  const exportData = data.logs.map(l => ({
    Title: l.title || '',
    Action: l.action || '',
    Type: l.type || '',
    Description: l.description || '',
    Date: fmtDate(toDate(l.createdAt))
  }));

  exportToCSV(exportData, "system_health_report.csv");
}
  return (
    <div className="flex flex-col gap-6">
      {/*Export Button*/}
      <div className="flex justify-between items-center">
        <SectionHead title="System Health Report" />        
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: COLORS.primary, color: COLORS.white }}>
          <Download size={14} /> Export Report
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="System Uptime" value={`${data.uptime}%`} icon={Wifi} accent="#dcfce7" sub="Estimated availability" trend="up" />
        <StatCard label="Error Events" value={data.errors.length} icon={AlertCircle} accent="#fee2e2" sub={`${errorRate}% of total logs`} trend="down" />
        <StatCard label="Total Log Events" value={data.logs.length} icon={Database} accent="#FFF3E0" sub="All tracked activity" />
      </div>

      <div className="rounded-xl p-5" style={{ background: COLORS.white, border: `1px solid ${COLORS.border}` }}>
        <SectionHead title="Error vs Total Events (Daily)" subtitle="Detect anomaly spikes in error frequency" />
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data.errorTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: COLORS.textMuted }} />
            <YAxis tick={{ fontSize: 11, fill: COLORS.textMuted }} />
            <Tooltip contentStyle={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8 }} />
            <Line type="monotone" dataKey="events" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 3 }} name="All Events" />
            <Line type="monotone" dataKey="errors" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} name="Errors" strokeDasharray="4 4" />
            <Legend wrapperStyle={{ fontSize: 12, color: COLORS.textMuted }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ background: COLORS.primary }}>
          <span className="text-sm font-bold text-white">Error / Warning Logs</span>
          <span className="text-xs" style={{ color: '#C8A882' }}>{data.errors.length} events</span>
        </div>
        <table className="w-full text-sm" style={{ background: COLORS.white }}>
          <thead>
            <tr style={{ background: COLORS.bg, color: COLORS.textMuted, fontSize: 11 }}>
              {['Title', 'Action', 'Type', 'Description', 'Timestamp'].map(h => (
                <th key={h} className="px-4 py-2 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.errors.length > 0 ? data.errors : data.logs).slice(0, 10).map((l, i) => (
              <tr key={l.id} style={{ borderTop: `1px solid ${COLORS.border}`, background: i % 2 === 0 ? COLORS.white : COLORS.bg }}>
                <td className="px-4 py-2.5 font-medium" style={{ color: COLORS.darkest }}>{l.title || '—'}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: COLORS.text }}>{l.action || '—'}</td>
                <td className="px-4 py-2.5">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                    style={{
                      background: (l.type || '').includes('error') ? '#fee2e2' : '#fef9c3',
                      color: (l.type || '').includes('error') ? '#991b1b' : '#854d0e'
                    }}>
                    {l.type || 'info'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs" style={{ color: COLORS.textMuted, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.description || '—'}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: COLORS.textMuted }}>{fmtDate(toDate(l.createdAt))}</td>
              </tr>
            ))}
            {data.logs.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-sm" style={{ color: COLORS.textMuted }}>No log data available.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminSystemPerformanceReports() {
  const [activeReport, setActiveReport] = useState('user-stats');
  const [sort, setSort] = useState('newest');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [applied, setApplied] = useState({ sort: 'newest', start: '', end: '' });

  function handleApply() {
    setApplied({ sort, start: startDate, end: endDate });
  }
  function handleReset() {
    setSort('newest'); setStartDate(''); setEndDate('');
    setApplied({ sort: 'newest', start: '', end: '' });
  }

  const activeLabel = SUB_REPORTS.find(r => r.id === activeReport)?.label || '';

  const renderReport = () => {
    const props = { startDate, endDate, sort};
    switch (activeReport) {
      case 'user-stats': return <UserStatisticsReport    {...props} />;
      case 'appt-summary': return <AppointmentSummaryReport {...props} />;
      case 'system-usage': return <SystemUsageReport         {...props} />;
      case 'activity-trend': return <ActivityTrendReport       {...props} />;
      case 'system-health': return <SystemHealthReport        {...props} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: COLORS.bg, fontFamily: "'Segoe UI',sans-serif" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
      <Sidebar onLogout={() => { }} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-y-auto px-8 py-6">
          {/* Page Header */}
          <div className="flex items-center gap-2 mb-1 text-xs" style={{ color: COLORS.textMuted }}>
            <span>Reports</span>
            <ChevronRight size={12} />
            <span style={{ color: COLORS.primary, fontWeight: 600 }}>System Performance</span>
          </div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: COLORS.darkest }}>
                System Performance Reports
              </h1>
              <p className="text-sm mt-0.5" style={{ color: COLORS.textMuted }}>
                Monitor overall system behavior, usage patterns, and health metrics
              </p>
            </div>
          </div>

          {/* Sub-Report Dropdown */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.primary }}>
                Select Sub-Report
              </label>
              <div className="relative">
                <select
                  value={activeReport}
                  onChange={e => setActiveReport(e.target.value)}
                  className="pl-4 pr-10 py-2.5 rounded-xl text-sm font-semibold border-2 focus:outline-none focus:ring-2 focus:ring-amber-300 appearance-none cursor-pointer"
                  style={{ borderColor: COLORS.primary, background: COLORS.white, color: COLORS.darkest, minWidth: 320 }}>
                  {SUB_REPORTS.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" color={COLORS.primary} />
              </div>
            </div>

            {/* Quick pill tabs */}
            <div className="flex gap-2 flex-wrap pt-5">
              {SUB_REPORTS.map(r => (
                <button key={r.id} onClick={() => setActiveReport(r.id)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: activeReport === r.id ? COLORS.primary : COLORS.white,
                    color: activeReport === r.id ? COLORS.white : COLORS.textMuted,
                    border: `1px solid ${activeReport === r.id ? COLORS.primary : COLORS.border}`
                  }}>
                  {r.label.split('.')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          {/* Active report title strip */}
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl mb-5"
            style={{ background: COLORS.primary }}>
            <BarChart2 size={18} color={COLORS.accent} />
            <span className="text-sm font-bold text-white">{activeLabel}</span>
            <span className="ml-auto text-xs" style={{ color: '#C8A882' }}>
              {applied.start && applied.end
                ? `${fmtDate(new Date(applied.start))} – ${fmtDate(new Date(applied.end))}`
                : 'All time'}
            </span>
          </div>

          {/* Filters */}
          <DateFilterBar
            sort={sort} setSort={setSort}
            startDate={startDate} setStartDate={setStartDate}
            endDate={endDate} setEndDate={setEndDate}
            onApply={handleApply} onReset={handleReset}
          />

          {/* Report Content */}
          {renderReport()}
        </main>

        {/* Footer */}
        <footer className="text-center text-xs py-4"
          style={{ background: COLORS.cardDark, color: '#C8A882' }}>
          © 2026 Smart Grama Sewa. All rights reserved.
        </footer>
      </div>
    </div>
  );
}