/**
 * AppointmentCalendarPage.jsx  — Fixed version
 *
 * Fixes applied:
 *   1. slot format:   "03:30 PM" → normalized to "3:30–3:45" matching grid labels
 *   2. status case:   "Pending" → "pending" (Firestore stores Title Case)
 *   3. uid filter:    appointments don't carry gnOfficerUid; filter by gnDiv instead
 *   4. slot duration: grid uses 15-min slots, convertSlot now correctly +15 min
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase";
import {
  LayoutDashboard, UserCheck, ArrowLeftRight, BarChart2,
  User, Activity, Megaphone, LogOut, Search, ChevronDown,
  Bell, Calendar,
} from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";

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

// ─── 15-min slot grid (matches Firestore slot duration) ───────────────────────
const AM_SLOTS = [
  "8:30–8:45",  "8:45–9:00",
  "9:00–9:15",  "9:15–9:30",
  "9:30–9:45",  "9:45–10:00",
  "10:00–10:15","10:15–10:30",
  "10:30–10:45","10:45–11:00",
  "11:00–11:15","11:15–11:30",
  "11:30–11:45","11:45–12:00",
  "12:00–12:15","12:15–12:30",
];
const PM_SLOTS = [
  "1:00–1:15",  "1:15–1:30",
  "1:30–1:45",  "1:45–2:00",
  "2:00–2:15",  "2:15–2:30",
  "2:30–2:45",  "2:45–3:00",
  "3:00–3:15",  "3:15–3:30",
  "3:30–3:45",  "3:45–4:00",
];
const ALL_SLOTS = [...AM_SLOTS, null, ...PM_SLOTS];

const DAY_NAMES = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTHS    = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ─── FIX 2: status keys match Firestore Title Case ────────────────────────────
// Firestore stores: "Pending", "Booked", "Completed", "Cancelled", "Confirmed"
// We normalise to lowercase on read (see normaliseStatus below).
const STATUS_CONFIG = {
  booked:    { bg: COLORS.primary, text: COLORS.white,   label: "Booked"    },
  confirmed: { bg: COLORS.dark,    text: COLORS.white,   label: "Confirmed" },
  completed: { bg: COLORS.darker,  text: COLORS.white,   label: "Completed" },
  pending:   { bg: COLORS.accent,  text: COLORS.darkest, label: "Pending"   },
  cancelled: { bg: COLORS.muted,   text: COLORS.white,   label: "Cancelled" },
  "on-field":{ bg: "#E8D5C0",      text: COLORS.darker,  label: "On Field"  },
};

/** Lowercase the status from Firestore ("Pending" → "pending") */
function normaliseStatus(raw) {
  return (raw ?? "booked").toLowerCase();
}

// ─── FIX 1: slot converter ────────────────────────────────────────────────────
/**
 * Converts Firestore slot string to the grid label format.
 *
 * Firestore stores:  "03:30 PM"   (h:mm AM/PM, zero-padded hour)
 * Grid labels use:   "3:30–3:45"  (no leading zero, 15-min range, no AM/PM)
 *
 * Steps:
 *   1. Parse hour + minute + meridiem
 *   2. Convert to 24-hour
 *   3. Add 15 minutes for the end time
 *   4. Format both as "H:MM" (no leading zero, no meridiem)
 *   5. Join with "–"
 */
function convertSlot(slotStr) {
  if (!slotStr || typeof slotStr !== "string") return null;

  const trimmed = slotStr.trim();                        // "03:30 PM"
  const parts   = trimmed.split(" ");                    // ["03:30", "PM"]
  if (parts.length !== 2) return null;

  const [timePart, meridiem] = parts;
  const [hStr, mStr]         = timePart.split(":");
  let hours   = parseInt(hStr, 10);
  const mins  = parseInt(mStr, 10);

  // Convert to 24-hour
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours  = 0;

  // Build start Date object (date doesn't matter, only time)
  const start = new Date(2000, 0, 1, hours, mins, 0);
  const end   = new Date(start.getTime() + 15 * 60 * 1000); // +15 min

  // Format as "H:MM" — no leading zero, no meridiem
  const fmt = (d) => {
    const h = d.getHours();          // 24-hour raw
    const m = d.getMinutes().toString().padStart(2, "0");
    // Convert back to 12-hour WITHOUT leading zero or AM/PM suffix
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${m}`;
  };

  return `${fmt(start)}–${fmt(end)}`;  // e.g. "3:30–3:45"
}

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
  const s = dates[0], e = dates[6];
  const sm = MONTHS[s.getMonth()], em = MONTHS[e.getMonth()];
  if (s.getFullYear() !== e.getFullYear()) return `${sm} ${s.getFullYear()} – ${em} ${e.getFullYear()}`;
  if (sm !== em) return `${sm} – ${em} ${s.getFullYear()}`;
  return `${sm} ${s.getFullYear()}`;
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────
function NavItem({ icon: Icon, label, active, bold, onClick }) {
  return (
    <li
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-all ${
        active ? "bg-amber-700 text-white font-bold"
        : bold  ? "text-amber-900 font-bold hover:bg-amber-100"
                : "text-amber-800 hover:bg-amber-100"
      }`}
      style={{ fontSize: bold && !Icon ? "0.85rem" : "0.82rem" }}
    >
      {Icon && <Icon size={16} className={active ? "text-white" : "text-amber-700"} />}
      <span>{label}</span>
    </li>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ onLogout }) {
  const navigate = useNavigate();
  return (
    <aside
      className="w-64 flex-shrink-0 flex flex-col py-6 px-3 gap-2 border-r"
      style={{ borderColor: "#DDD0BC", background: COLORS.bg }}
    >
      <div className="flex items-center gap-2 px-3 mb-6">
        <img src="/logo2.png" alt="Smart Grama Sewa logo" />
      </div>

      <ul className="flex flex-col gap-1 flex-1">
        <NavItem icon={LayoutDashboard} label="Dashboard" bold
          onClick={() => navigate("/admin/dashboard")} />

        <li className="px-4 pt-3 pb-1 text-xs font-extrabold" style={{ color: COLORS.primary }}>
          GN management
        </li>
        <NavItem icon={UserCheck}      label="Registration Requests"
          onClick={() => navigate("/admin/registrationrequestapproval")} />
        <NavItem icon={ArrowLeftRight} label="Transfer Request"
          onClick={() => navigate("/admin/transferrequestapproval")} />

        <li className="px-4 pt-3 pb-1 text-xs font-extrabold" style={{ color: COLORS.primary }}>
          Reports
        </li>
        <NavItem icon={BarChart2} label="System reports"
          onClick={() => navigate("/admin/reports/system")} />
        <NavItem icon={User}      label="Individual user access"
          onClick={() => navigate("/admin/reports/user-access")} />
        <NavItem icon={Activity}  label="GN activity reports"
          onClick={() => navigate("/admin/reports/gn-activity")} />

        <li className="pt-4">
          <NavItem icon={Megaphone} label="Announcements" bold
            onClick={() => navigate("/admin/announcements")} />
        </li>
        <li className="pt-1">
          <NavItem icon={Calendar} label="Appointment Calendar" bold active
            onClick={() => navigate("/admin/calendar")} />
        </li>
      </ul>

      <div className="px-3 pt-4 border-t" style={{ borderColor: "#DDD0BC" }}>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm font-bold transition-all hover:bg-red-50"
          style={{ color: "#991B1B" }}
        >
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
    <header
      className="flex items-center gap-4 px-6 py-4 border-b sticky top-0 z-20"
      style={{ borderColor: "#DDD0BC", background: COLORS.bg }}
    >
      <div className="flex-1 relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" color={COLORS.textMuted} />
        <input
          className="w-full pl-10 pr-4 py-2.5 rounded-full border text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          style={{ borderColor: "#C8B89A", background: "#FFF9F0", color: COLORS.text }}
          placeholder="search..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
        />
      </div>
      <button
        className="flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-full border"
        style={{ borderColor: "#C8B89A", color: COLORS.text, background: "#FFF9F0" }}
      >
        English <ChevronDown size={14} />
      </button>
      <button
        className="relative w-10 h-10 rounded-full flex items-center justify-center border"
        style={{ borderColor: "#C8B89A", background: "#FFF9F0" }}
      >
        <Bell size={18} color={COLORS.primary} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: COLORS.accent }} />
      </button>
      <button
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: COLORS.primary }}
      >
        <User size={18} color="#fff" />
      </button>
    </header>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function CalendarLegend({ count }) {
  const items = [
    { color: COLORS.primary, label: "Booked"    },
    { color: COLORS.accent,  label: "Pending"   },
    { color: COLORS.darker,  label: "Completed" },
    { color: "#E8D5C0",      label: "On Field", border: true },
    { color: COLORS.muted,   label: "Cancelled" },
  ];
  return (
    <div
      className="flex items-center justify-between flex-wrap gap-3 px-4 py-3"
      style={{ background: COLORS.white, borderTop: `1px solid ${COLORS.muted}33` }}
    >
      <div className="flex gap-4 flex-wrap">
        {items.map(({ color, label, border }) => (
          <span key={label} className="flex items-center gap-1.5" style={{ fontSize: 11, color: COLORS.muted }}>
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

// ─── Appointment cell ─────────────────────────────────────────────────────────
function ApptCell({ appts, isBreak }) {
  const [hov, setHov] = useState(false);

  if (isBreak) {
    return (
      <td style={{
        height: 8, background: COLORS.bg,
        borderBottom: `1px dashed ${COLORS.muted}33`, padding: 0,
      }} />
    );
  }
  if (!appts || appts.length === 0) {
    return (
      <td style={{
        height: 34,
        borderBottom: `1px solid ${COLORS.muted}18`,
        borderRight:  `1px solid ${COLORS.muted}18`,
      }} />
    );
  }

  const a   = appts[0];
  // FIX 2: normalise status before lookup
  const cfg = STATUS_CONFIG[normaliseStatus(a.status)] ?? STATUS_CONFIG.booked;

  return (
    <td
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={`${a.fullName}\n${a.service ?? ""}\nStatus: ${a.status}`}
      style={{
        height: 34,
        background: cfg.bg,
        borderBottom: `1px solid ${COLORS.muted}18`,
        borderRight:  `1px solid ${COLORS.muted}18`,
        padding: "2px 4px",
        verticalAlign: "middle",
        cursor: "pointer",
        position: "relative",
        filter: hov ? "brightness(0.9)" : "none",
        transition: "filter 0.12s",
      }}
    >
      <div style={{ fontSize: 9.5, fontWeight: 600, color: cfg.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {a.fullName}
      </div>
      {a.service && (
        <div style={{ fontSize: 8.5, color: cfg.text, opacity: 0.75, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {a.service}
        </div>
      )}
      {appts.length > 1 && (
        <span style={{ position: "absolute", top: 2, right: 3, fontSize: 8, color: cfg.text, fontWeight: 700 }}>
          +{appts.length - 1}
        </span>
      )}
    </td>
  );
}

// ─── Calendar ─────────────────────────────────────────────────────────────────
/**
 * Props:
 *   gnDiv        {string}  gnDiv of the logged-in GN officer  ← used to filter appointments
 *   gnOfficerUid {string}  uid of the officer (kept for future use / other queries)
 *   db           {object}  Firestore instance
 */
function AppointmentCalendar({ gnDiv, gnOfficerUid, db }) {
  const [currentDate,   setCurrentDate]   = useState(new Date());
  const [appointments,  setAppointments]  = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [view,          setView]          = useState("week");

  const weekDates = getWeekDates(currentDate);

  // ── FIX 3: filter by gnDiv, not uid ────────────────────────────────────────
  const fetchAppointments = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    setError(null);
    try {
      const startStr = toDateStr(weekDates[0]);
      const endStr   = toDateStr(weekDates[6]);
      const ref = collection(db, "appointments");

      // Build the query.  gnDiv is the reliable link between officer and appointment.
      // If gnDiv is not available yet, fall back to fetching the whole week
      // (admin overview) or scope by uid as a secondary option.
      let q;
      if (gnDiv) {
        q = query(
          ref,
          where("date",  ">=", startStr),
          where("date",  "<=", endStr),
          where("gnDiv", "==", gnDiv),   // ← Firestore field that matches the officer
        );
      } else {
        // Admin view — all appointments this week
        q = query(
          ref,
          where("date", ">=", startStr),
          where("date", "<=", endStr),
        );
      }

      const snap = await getDocs(q);
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Firestore error:", err);
      setError("Failed to load appointments. Check Firestore indexes.");
    } finally {
      setLoading(false);
    }
  }, [db, gnDiv, currentDate]); // gnDiv replaces gnOfficerUid in deps

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // ── FIX 1 + 2: build lookup with corrected slot key and normalised status ──
  const apptMap = {};
  appointments.forEach(a => {
    const gridSlot = convertSlot(a.slot);   // "03:30 PM" → "3:30–3:45"
    if (!gridSlot) return;                  // skip if slot is malformed
    const k = `${a.date}__${gridSlot}`;
    if (!apptMap[k]) apptMap[k] = [];
    apptMap[k].push({ ...a, status: normaliseStatus(a.status) }); // normalise here
  });

  const getAppts = (date, slot) => apptMap[`${toDateStr(date)}__${slot}`] ?? [];

  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };
  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };

  const totalThisWeek  = appointments.length;
  const pendingCount   = appointments.filter(a => normaliseStatus(a.status) === "pending").length;
  const completedCount = appointments.filter(a => normaliseStatus(a.status) === "completed").length;

  return (
    <div className="flex flex-col gap-5">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: COLORS.darkest, fontFamily: "Georgia, serif" }}>
            Appointment Calendar
          </h1>
          <p className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
            Weekly schedule view — {formatMonthYear(weekDates)}
            {gnDiv && <span className="ml-2 opacity-60">· {gnDiv}</span>}
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

      {/* Stat cards */}
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

      {/* Calendar card */}
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
            {/* <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${COLORS.muted}66` }}>
              {["week", "month"].map(v => (
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
            </div> */}
            <button
              onClick={() => setCurrentDate(new Date())}
              style={{
                background: "transparent", border: `1px solid ${COLORS.muted}88`,
                borderRadius: 8, padding: "5px 12px", fontSize: 12,
                color: COLORS.white, cursor: "pointer", fontWeight: 500,
              }}
            >
              Today
            </button>
            {[{ label: "‹", fn: prevWeek }, { label: "›", fn: nextWeek }].map(({ label, fn }) => (
              <button key={label} onClick={fn}
                style={{
                  background: "transparent", border: `1px solid ${COLORS.muted}88`,
                  borderRadius: 8, width: 32, height: 32, fontSize: 16,
                  color: COLORS.white, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

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
                <tr>
                  <td style={{ height: 6, background: COLORS.white, borderRight: `2px solid ${COLORS.muted}33` }} />
                  {weekDates.map((_, i) => <td key={i} style={{ height: 6, background: COLORS.white }} />)}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <CalendarLegend count={appointments.length} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
/**
 * How to use:
 *
 *   import AdminCalendar from './AppointmentCalendarPage';
 *
 *   // In your protected route, pull the GN officer profile from context/auth:
 *   const { user, gnOfficerProfile } = useAuth();
 *
 *   <AdminCalendar
 *     gnDiv={gnOfficerProfile?.gnDiv}          // "GN Division 02"
 *     gnOfficerUid={user?.uid}                 // kept for future use
 *     onLogout={handleLogout}
 *   />
 *
 *   Note: db is imported directly from '../../firebase' inside this file.
 */
export default function AdminCalendar({ gnDiv, gnOfficerUid, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (onLogout) { onLogout(); return; }
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: COLORS.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}
    >
      <Sidebar onLogout={handleLogout} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-y-auto px-8 py-6">
          <AppointmentCalendar gnDiv={gnDiv} gnOfficerUid={gnOfficerUid} db={db} />
        </main>

        <footer className="text-center text-xs py-4"
          style={{ background: COLORS.cardDark, color: "#C8A882" }}>
          © 2026 Smart Grama Sewa. All rights reserved.
        </footer>
      </div>
    </div>
  );
}