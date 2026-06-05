/**
 * AppointmentCalendarPage.jsx
 *
 * Full integrated page: Sidebar + Topbar + AppointmentCalendar + Footer
 * for the Smart Grama Sewa admin dashboard.
 *
 * Setup:
 *   npm install react-router-dom lucide-react firebase
 *
 * Usage:
 *   // In your router (e.g. App.jsx):
 *   import AppointmentCalendarPage from './AppointmentCalendarPage';
 *   <Route path="/admin/calendar" element={<AppointmentCalendarPage />} />
 *
 * Pass `db` from your Firebase config via props or context as needed.
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';

import {
  LayoutDashboard, UserCheck, ArrowLeftRight, BarChart2,
  User, Activity, Megaphone, LogOut, Search, ChevronDown,
  Bell,
  Calendar,
} from "lucide-react";
import {
  collection, query, where, getDocs,
} from "firebase/firestore";

// ─── Color tokens ─────────────────────────────────────────────────────────────
const COLORS = {
  primary:   "#7B2D00",
  accent:    "#F5A623",
  bg:        "#F5F0E8",
  dark:      "#6B2400",
  darker:    "#3D1500",
  darkest:   "#2C1200",
  muted:     "#7A5C44",
  white:     "#FFFFFF",
  cardDark:  "#3D1500",
  text:      "#2C1200",
  textMuted: "#7A5C44",
};

// ─── Calendar constants ───────────────────────────────────────────────────────
const AM_SLOTS = [
  "8:30–9:00","9:00–9:30","9:30–10:00","10:00–10:30",
  "10:30–11:00","11:00–11:30","11:30–12:00","12:00–12:30",
];
const PM_SLOTS = [
  "1:00–1:30","1:30–2:00","2:00–2:30","2:30–3:00",
  "3:00–3:30","3:30–4:00",
];
const ALL_SLOTS = [...AM_SLOTS, null, ...PM_SLOTS];
const DAY_NAMES = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const STATUS_CONFIG = {
  booked:    { bg: COLORS.primary,  text: COLORS.white,   label: "Booked"    },
  confirmed: { bg: COLORS.dark,     text: COLORS.white,   label: "Confirmed" },
  completed: { bg: COLORS.darker,   text: COLORS.white,   label: "Completed" },
  pending:   { bg: COLORS.accent,   text: COLORS.darkest, label: "Pending"   },
  cancelled: { bg: COLORS.muted,    text: COLORS.white,   label: "Cancelled" },
  "on-field":{ bg: "#E8D5C0",       text: COLORS.darker,  label: "On Field"  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toDateStr(date) {
  return date.toISOString().split("T")[0];
}
function isToday(date) {
  return toDateStr(date) === toDateStr(new Date());
}
function getWeekDates(anchor) {
  const d   = new Date(anchor);
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(mon);
    dt.setDate(mon.getDate() + i);
    return dt;
  });
}
function formatMonthYear(dates) {
  const s  = dates[0], e = dates[6];
  const sm = MONTHS[s.getMonth()], em = MONTHS[e.getMonth()];
  if (s.getFullYear() !== e.getFullYear()) return `${sm} ${s.getFullYear()} – ${em} ${e.getFullYear()}`;
  if (sm !== em) return `${sm} – ${em} ${s.getFullYear()}`;
  return `${sm} ${s.getFullYear()}`;
}

// ─── Nav Item ─────────────────────────────────────────────────────────────
function NavItem({ icon: Icon, label, active, bold, onClick }) {
  return (
    <li onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-all ${
          active ? 'bg-amber-700 text-white font-bold'
          : bold ? 'text-amber-900 font-bold hover:bg-amber-100'
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
        <NavItem icon={LayoutDashboard} label="Dashboard" bold
          onClick={() => navigate('/admin/dashboard')} />

        <li className="px-4 pt-3 pb-1 text-xs font-extrabold" style={{ color: COLORS.primary }}>
          GN management
        </li>
        <NavItem icon={UserCheck} label="Registration Requests"
          onClick={() => navigate('/admin/registrationrequestapproval')} />
        <NavItem icon={ArrowLeftRight} label="Transfer Request"
          onClick={() => navigate('/admin/transferrequestapproval')} />

        <li className="px-4 pt-3 pb-1 text-xs font-extrabold" style={{ color: COLORS.primary }}>
          Reports
        </li>
        <NavItem icon={BarChart2} label="System reports"
          onClick={() => navigate('/admin/reports/system')} />
        <NavItem icon={User} label="Individual user access"
          onClick={() => navigate('/admin/reports/user-access')} />
        <NavItem icon={Activity} label="GN activity reports"
          onClick={() => navigate('/admin/reports/gn-activity')} />

        <li className="pt-4">
          <NavItem icon={Megaphone} label="Announcements" bold 
            onClick={() => navigate('/admin/announcements')} />
        </li>
        <li className="pt-4">
          <NavItem icon={Calendar} label="Appointment Calendar"bold active
            onClick={() => navigate("/admin/calendar")} />
        </li>
        {/* <li className="px-4 pt-1">
          <NavItem icon={Bell} label="Notifications" bold
            onClick={() => navigate('/admin/notifications')} />
        </li> */}
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

// ═══════════════════════════════════════════════════════════════════════════════
// TOPBAR
// ═══════════════════════════════════════════════════════════════════════════════
function Topbar() {
  const [searchVal, setSearchVal] = useState("");
  return (
    <header
      className="flex items-center gap-4 px-6 py-4 border-b sticky top-0 z-20"
      style={{ borderColor: "#DDD0BC", background: COLORS.bg }}
    >
      {/* Search */}
      <div className="flex-1 relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2"
          color={COLORS.textMuted}
        />
        <input
          className="w-full pl-10 pr-4 py-2.5 rounded-full border text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          style={{ borderColor: "#C8B89A", background: "#FFF9F0", color: COLORS.text }}
          placeholder="search..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
        />
      </div>

      {/* Language */}
      <button
        className="flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-full border"
        style={{ borderColor: "#C8B89A", color: COLORS.text, background: "#FFF9F0" }}
      >
        English <ChevronDown size={14} />
      </button>

      {/* Bell */}
      <button
        className="relative w-10 h-10 rounded-full flex items-center justify-center border"
        style={{ borderColor: "#C8B89A", background: "#FFF9F0" }}
      >
        <Bell size={18} color={COLORS.primary} />
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
          style={{ background: COLORS.accent }}
        />
      </button>

      {/* Avatar */}
      <button
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: COLORS.primary }}
      >
        <User size={18} color="#fff" />
      </button>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR — LEGEND
// ═══════════════════════════════════════════════════════════════════════════════
function CalendarLegend({ count }) {
  const items = [
    { key: "booked",    color: COLORS.primary, label: "Booked"    },
    { key: "pending",   color: COLORS.accent,  label: "Pending"   },
    { key: "completed", color: COLORS.darker,  label: "Completed" },
    { key: "on-field",  color: "#E8D5C0",      label: "On Field", border: true },
    { key: "cancelled", color: COLORS.muted,   label: "Cancelled" },
  ];
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3"
      style={{ background: COLORS.white, borderTop: `1px solid ${COLORS.muted}33` }}>
      <div className="flex gap-4 flex-wrap">
        {items.map(({ key, color, label, border }) => (
          <span key={key} className="flex items-center gap-1.5"
            style={{ fontSize: 11, color: COLORS.muted }}>
            <span style={{
              width: 9, height: 9, borderRadius: 3, background: color, flexShrink: 0,
              border: border ? `1px solid ${COLORS.muted}` : "none",
            }} />
            {label}
          </span>
        ))}
      </div>
      <span style={{ fontSize: 11, color: COLORS.muted }}>
        {count} appointment{count !== 1 ? "s" : ""} this week
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR — APPOINTMENT CELL
// ═══════════════════════════════════════════════════════════════════════════════
function ApptCell({ appts, isBreak }) {
  const [hov, setHov] = useState(false);

  if (isBreak) {
    return (
      <td style={{
        height: 8,
        background: `${COLORS.bg}`,
        borderBottom: `1px dashed ${COLORS.muted}33`,
        padding: 0,
      }} />
    );
  }

  if (!appts || appts.length === 0) {
    return (
      <td style={{
        height: 34,
        borderBottom: `1px solid ${COLORS.muted}18`,
        borderRight: `1px solid ${COLORS.muted}18`,
      }} />
    );
  }

  const a   = appts[0];
  const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.booked;

  return (
    <td
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={`${a.fullName}\n${a.service ?? ""}\nStatus: ${a.status}`}
      style={{
        height: 34,
        background: cfg.bg,
        borderBottom: `1px solid ${COLORS.muted}18`,
        borderRight: `1px solid ${COLORS.muted}18`,
        padding: "2px 4px",
        verticalAlign: "middle",
        cursor: "pointer",
        position: "relative",
        filter: hov ? "brightness(0.9)" : "none",
        transition: "filter 0.12s",
      }}
    >
      <div style={{
        fontSize: 9.5, fontWeight: 600, color: cfg.text,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {a.fullName}
      </div>
      {a.service && (
        <div style={{
          fontSize: 8.5, color: cfg.text, opacity: 0.75,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {a.service}
        </div>
      )}
      {appts.length > 1 && (
        <span style={{
          position: "absolute", top: 2, right: 3,
          fontSize: 8, color: cfg.text, fontWeight: 700,
        }}>
          +{appts.length - 1}
        </span>
      )}
    </td>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function AppointmentCalendar({ gnOfficerUid, db }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [view, setView]                 = useState("week");

  const weekDates = getWeekDates(currentDate);

  const fetchAppointments = useCallback(async () => {
    if (!db) return;
    setLoading(true); setError(null);
    try {
      const startStr = toDateStr(weekDates[0]);
      const endStr   = toDateStr(weekDates[6]);
      const ref = collection(db, "appointments");
      const q   = gnOfficerUid
        ? query(ref, where("date",">=",startStr), where("date","<=",endStr), where("uid","==",gnOfficerUid))
        : query(ref, where("date",">=",startStr), where("date","<=",endStr));
      const snap = await getDocs(q);
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      setError("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  }, [db, gnOfficerUid, currentDate]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Build lookup map: "YYYY-MM-DD__slot" → [appts]
  const apptMap = {};
  appointments.forEach(a => {
    const k = `${a.date}__${a.slot}`;
    if (!apptMap[k]) apptMap[k] = [];
    apptMap[k].push(a);
  });
  const getAppts = (date, slot) => apptMap[`${toDateStr(date)}__${slot}`] ?? [];

  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };
  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };

  // ── Page-level summary stats ──
  const totalThisWeek  = appointments.length;
  const pendingCount   = appointments.filter(a => a.status === "pending").length;
  const completedCount = appointments.filter(a => a.status === "completed").length;

  return (
    <div className="flex flex-col gap-5">

      {/* ── Page title row ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: COLORS.darkest, fontFamily: "Georgia, serif" }}>
            Appointment Calendar
          </h1>
          <p className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
            Weekly schedule view — {formatMonthYear(weekDates)}
          </p>
        </div>
        <button
          onClick={fetchAppointments}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ background: COLORS.primary, color: COLORS.white, border: "none", cursor: "pointer" }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* ── Summary stat cards ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total This Week", value: totalThisWeek,   bg: COLORS.darkest, text: COLORS.white,   sub: COLORS.accent },
          { label: "Pending",         value: pendingCount,    bg: "#FFF3DC",       text: COLORS.darkest, sub: COLORS.dark  },
          { label: "Completed",       value: completedCount,  bg: "#EDE8E0",       text: COLORS.darkest, sub: COLORS.muted },
        ].map(({ label, value, bg, text, sub }) => (
          <div key={label} className="rounded-xl px-5 py-4"
            style={{ background: bg, border: `1px solid ${COLORS.muted}22` }}>
            <p style={{ fontSize: 11, color: sub, fontWeight: 600, letterSpacing: "0.04em" }}>
              {label.toUpperCase()}
            </p>
            <p style={{ fontSize: 26, fontWeight: 700, color: text, lineHeight: 1.2, marginTop: 4 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Calendar card ── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ border: `1.5px solid ${COLORS.muted}33`, boxShadow: `0 2px 16px ${COLORS.darkest}10` }}>

        {/* Calendar header */}
        <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-4"
          style={{ background: COLORS.darkest }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: COLORS.white, fontFamily: "Georgia, serif" }}>
              {formatMonthYear(weekDates)}
            </h2>
            <p style={{ fontSize: 11, color: `${COLORS.white}77`, marginTop: 2 }}>
              {toDateStr(weekDates[0])} — {toDateStr(weekDates[6])}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${COLORS.muted}66` }}>
              {["week","month"].map(v => (
                <button key={v} onClick={() => setView(v)}
                  style={{
                    padding: "5px 14px", fontSize: 12, fontWeight: 600,
                    background: view === v ? COLORS.accent : "transparent",
                    color: view === v ? COLORS.darkest : `${COLORS.white}99`,
                    border: "none", cursor: "pointer", transition: "all 0.15s",
                    textTransform: "capitalize",
                  }}>
                  {v}
                </button>
              ))}
            </div>
            {/* Today */}
            <button onClick={() => setCurrentDate(new Date())}
              style={{
                background: "transparent", border: `1px solid ${COLORS.muted}88`,
                borderRadius: 8, padding: "5px 12px", fontSize: 12, color: COLORS.white,
                cursor: "pointer", fontWeight: 500,
              }}>
              Today
            </button>
            {/* Prev / Next */}
            {[{ label: "‹", fn: prevWeek }, { label: "›", fn: nextWeek }].map(({ label, fn }) => (
              <button key={label} onClick={fn}
                style={{
                  background: "transparent", border: `1px solid ${COLORS.muted}88`,
                  borderRadius: 8, width: 32, height: 32, fontSize: 16, color: COLORS.white,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="text-center py-8 text-sm" style={{ color: COLORS.muted, background: COLORS.bg }}>
            Loading appointments…
          </div>
        )}
        {error && (
          <div className="px-5 py-3 text-sm" style={{ background: "#FBEDED", color: "#A32D2D" }}>
            {error}
          </div>
        )}

        {/* Grid */}
        {!loading && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: 72 }} />
                {weekDates.map((_, i) => <col key={i} />)}
              </colgroup>
              <thead>
                <tr>
                  <th style={{ background: COLORS.darker, borderRight: `2px solid ${COLORS.darkest}55`, padding: "8px 4px" }} />
                  {weekDates.map((date, i) => (
                    <th key={i} style={{
                      padding: "7px 3px", textAlign: "center",
                      background: isToday(date) ? COLORS.primary : COLORS.darker,
                      color: isToday(date) ? COLORS.accent : COLORS.white,
                      fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
                      borderRight: `1px solid ${COLORS.darkest}44`,
                    }}>
                      <div style={{ opacity: 0.8, fontSize: 10 }}>{DAY_NAMES[i]}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 1 }}>{date.getDate()}</div>
                      <div style={{ fontSize: 9, opacity: 0.6, marginTop: 1 }}>
                        {MONTHS[date.getMonth()].slice(0, 3)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_SLOTS.map((slot, idx) => (
                  <tr key={idx}>
                    {slot === null ? (
                      <td style={{
                        height: 8, background: COLORS.bg,
                        borderBottom: `1px dashed ${COLORS.muted}33`,
                        borderRight: `2px solid ${COLORS.muted}33`,
                        padding: 0,
                      }} />
                    ) : (
                      <td style={{
                        fontSize: 9, color: COLORS.muted, textAlign: "right",
                        padding: "0 7px 0 3px", whiteSpace: "nowrap",
                        fontFamily: "'DM Mono','Courier New',monospace", fontWeight: 500,
                        height: 34, verticalAlign: "middle",
                        background: COLORS.white,
                        borderBottom: `1px solid ${COLORS.muted}18`,
                        borderRight: `2px solid ${COLORS.muted}33`,
                      }}>
                        {slot}
                      </td>
                    )}
                    {weekDates.map((date, ci) => (
                      <ApptCell
                        key={ci}
                        appts={slot === null ? [] : getAppts(date, slot)}
                        isBreak={slot === null}
                      />
                    ))}
                  </tr>
                ))}
                {/* Trailing empty row */}
                <tr>
                  <td style={{ height: 6, background: COLORS.white, borderRight: `2px solid ${COLORS.muted}33` }} />
                  {weekDates.map((_, i) => <td key={i} style={{ height: 6, background: COLORS.white }} />)}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Legend footer */}
        <CalendarLegend count={appointments.length} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE — full layout assembly
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Props:
 *   db           {object}  Firestore instance from your firebaseConfig
 *   gnOfficerUid {string}  UID of the currently-logged-in GN officer
 *   onLogout     {fn}      Callback to handle logout (e.g. signOut + navigate)
 */
export default function AdminCalendar({ db, gnOfficerUid, onLogout }) {
  const handleLogout = onLogout ?? (() => console.warn("No onLogout handler provided"));

  return (
    <div className="flex h-screen overflow-hidden"
      style={{ background: COLORS.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* Sidebar */}
      <Sidebar onLogout={handleLogout} activePage="calendar" />

      {/* Main column */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Topbar */}
        <Topbar />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <AppointmentCalendar gnOfficerUid={gnOfficerUid} db={db} />
        </main>

        {/* Footer */}
        <footer className="text-center text-xs py-4"
          style={{ background: COLORS.cardDark, color: "#C8A882" }}>
          © 2026 Smart Grama Sewa. All rights reserved.
        </footer>
      </div>
    </div>
  );
}