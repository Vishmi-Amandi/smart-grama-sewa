console.log("UPDATED CALENDAR LOADED");
/**
 * AppointmentCalendarPage.jsx
 *
 * Admin calendar with cascading GN Officer filter:
 *   Province → District → DS Division → GN Officer (dropdown)
 *
 * On "Apply filter" → fetches /appointments where gnDiv == selected officer's gnDiv
 *
 * Firebase collections used:
 *   /gn_officers  — province, district, divisionalSecretariat, gnDiv, fullName, gnCode, slotDuration, maxAppointments
 *   /appointments — date, slot ("03:30 PM"), gnDiv, fullName, service, status
 *
 * Required Firestore composite index:
 *   appointments | gnDiv ASC | date ASC
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase";
import {
  LayoutDashboard, UserCheck, ArrowLeftRight, BarChart2,
  User, Activity, Megaphone, LogOut, Search, ChevronDown,
  Bell, Calendar, TrendingUp, Filter, X, ChevronRight,
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

// ─── 15-min slot grid ─────────────────────────────────────────────────────────
const AM_SLOTS = [
  "8:30–8:45","8:45–9:00","9:00–9:15","9:15–9:30",
  "9:30–9:45","9:45–10:00","10:00–10:15","10:15–10:30",
  "10:30–10:45","10:45–11:00","11:00–11:15","11:15–11:30",
  "11:30–11:45","11:45–12:00","12:00–12:15","12:15–12:30",
];
const PM_SLOTS = [
  "1:00–1:15","1:15–1:30","1:30–1:45","1:45–2:00",
  "2:00–2:15","2:15–2:30","2:30–2:45","2:45–3:00",
  "3:00–3:15","3:15–3:30","3:30–3:45","3:45–4:00",
];
const ALL_SLOTS = [...AM_SLOTS, null, ...PM_SLOTS];

const DAY_NAMES = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  booked:    { bg: COLORS.primary, text: COLORS.white,   label: "Booked"   },
  confirmed: { bg: COLORS.dark,    text: COLORS.white,   label: "Confirmed"},
  completed: { bg: COLORS.darker,  text: COLORS.white,   label: "Completed"},
  pending:   { bg: COLORS.accent,  text: COLORS.darkest, label: "Pending"  },
  cancelled: { bg: COLORS.muted,   text: COLORS.white,   label: "Cancelled"},
  "on-field":{ bg: "#E8D5C0",      text: COLORS.darker,  label: "On Field" },
};

function normaliseStatus(raw) {
  return (raw ?? "booked").toLowerCase();
}

// ─── Slot converter: "03:30 PM" → "3:30–3:45" ────────────────────────────────
function convertSlot(slotStr) {
  if (!slotStr || typeof slotStr !== "string") return null;
  const parts = slotStr.trim().split(" ");
  if (parts.length !== 2) return null;
  const [timePart, meridiem] = parts;
  const [hStr, mStr] = timePart.split(":");
  let hours = parseInt(hStr, 10);
  const mins = parseInt(mStr, 10);
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  const start = new Date(2000, 0, 1, hours, mins, 0);
  const end   = new Date(start.getTime() + 15 * 60 * 1000);
  const fmt = (d) => {
    const h12 = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12;
    return `${h12}:${d.getMinutes().toString().padStart(2, "0")}`;
  };
  return `${fmt(start)}–${fmt(end)}`;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
function toDateStr(date) { return date.toISOString().split("T")[0]; }
function isToday(date)   { return toDateStr(date) === toDateStr(new Date()); }
function getWeekDates(anchor) {
  const d = new Date(anchor);
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(mon); dt.setDate(mon.getDate() + i); return dt;
  });
}
function formatMonthYear(dates) {
  const s = dates[0], e = dates[6];
  const sm = MONTHS[s.getMonth()], em = MONTHS[e.getMonth()];
  if (s.getFullYear() !== e.getFullYear()) return `${sm} ${s.getFullYear()} – ${em} ${e.getFullYear()}`;
  if (sm !== em) return `${sm} – ${em} ${s.getFullYear()}`;
  return `${sm} ${s.getFullYear()}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILTER PANEL
// Province → District → DS Division → GN Officer (all cascade from /gn_officers)
// ═══════════════════════════════════════════════════════════════════════════════
function FilterPanel({ officers, onApply, applied }) {
  const [open,     setOpen]     = useState(!applied?.gnDiv); // open by default if no filter yet
  const [province, setProvince] = useState(applied?.province || "");
  const [district, setDistrict] = useState(applied?.district || "");
  const [dsDiv,    setDsDiv]    = useState(applied?.dsDiv    || "");
  const [gnDiv,    setGnDiv]    = useState(applied?.gnDiv    || "");

  // ── Cascading option lists ─────────────────────────────────────────────────
  const provinces = [...new Set(
    officers.map(o => o.province).filter(Boolean)
  )].sort();

  const districts = [...new Set(
    officers
      .filter(o => !province || o.province === province)
      .map(o => o.district).filter(Boolean)
  )].sort();

  // NOTE: /gn_officers uses "divisionalSecretariat", not "dsDiv"
  const dsDivs = [...new Set(
    officers
      .filter(o =>
        (!province || o.province === province) &&
        (!district || o.district === district)
      )
      .map(o => o.divisionalSecretariat).filter(Boolean)
  )].sort();

  const gnOfficers = officers
    .filter(o =>
      (!province || o.province === province) &&
      (!district || o.district === district) &&
      (!dsDiv    || o.divisionalSecretariat === dsDiv)
    )
    .sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));

  // ── Cascade reset handlers ─────────────────────────────────────────────────
  const handleProvince = (v) => { setProvince(v); setDistrict(""); setDsDiv(""); setGnDiv(""); };
  const handleDistrict = (v) => { setDistrict(v); setDsDiv(""); setGnDiv(""); };
  const handleDsDiv    = (v) => { setDsDiv(v);    setGnDiv(""); };

  const handleApply = () => {
    const officer = gnDiv ? gnOfficers.find(o => o.gnDiv === gnDiv) ?? null : null;
    onApply({ province, district, dsDiv, gnDiv, officer });
    setOpen(false);
  };

  const handleClear = (e) => {
    e?.stopPropagation();
    setProvince(""); setDistrict(""); setDsDiv(""); setGnDiv("");
    onApply({ province: "", district: "", dsDiv: "", gnDiv: "", officer: null });
    setOpen(true);
  };

  const hasApplied  = !!applied?.gnDiv;
  const canApply    = !!gnDiv;

  // Breadcrumb label shown in collapsed state
  const collapsedLabel = applied?.officer
    ? `${applied.officer.fullName} — ${applied.gnDiv}`
    : applied?.dsDiv   ? applied.dsDiv
    : applied?.district? applied.district
    : applied?.province? applied.province
    : null;

  // ── Select component (shared) ──────────────────────────────────────────────
  const Select = ({ step, label, value, onChange, options, placeholder, disabled }) => {
    const filled = !!value;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {/* Label with step circle */}
        <label style={{
          fontSize: 10, fontWeight: 700, color: COLORS.muted,
          textTransform: "uppercase", letterSpacing: "0.05em",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{
            width: 17, height: 17, borderRadius: "50%", fontSize: 9,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            background: filled ? COLORS.primary : COLORS.bg,
            color: filled ? COLORS.white : COLORS.muted,
            border: `1.5px solid ${filled ? COLORS.primary : "#DDD0BC"}`,
            fontWeight: 700, flexShrink: 0,
          }}>{step}</span>
          {label}
        </label>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          style={{
            width: "100%", height: 38, padding: "0 28px 0 10px",
            fontSize: 12, fontWeight: filled ? 600 : 400,
            border: `1.5px solid ${filled ? COLORS.primary : "#DDD0BC"}`,
            borderRadius: 10,
            background: disabled ? "#F5F0E8" : COLORS.white,
            color: disabled ? COLORS.muted : COLORS.darkest,
            cursor: disabled ? "not-allowed" : "pointer",
            outline: "none", appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A5C44' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat", backgroundPosition: "right 9px center",
            transition: "border-color 0.15s",
          }}
        >
          <option value="">
            {!disabled && options.length === 0 ? "No options found" : placeholder}
          </option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        background: COLORS.white,
        border: `1.5px solid ${hasApplied ? COLORS.primary : "#DDD0BC"}`,
        borderRadius: 14, overflow: "hidden",
        boxShadow: hasApplied ? `0 0 0 3px ${COLORS.primary}15` : "none",
        transition: "all 0.2s",
      }}>

        {/* ── Collapsed trigger row ── */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: "100%", display: "flex", alignItems: "center",
            justifyContent: "space-between", padding: "12px 16px",
            background: "transparent", border: "none", cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Filter icon box */}
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: hasApplied ? COLORS.primary : COLORS.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "background 0.2s",
            }}>
              <Filter size={15} color={hasApplied ? COLORS.white : COLORS.muted} />
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.darkest, lineHeight: 1.3 }}>
                {collapsedLabel
                  ? <>Viewing: <span style={{ color: COLORS.primary }}>{collapsedLabel}</span></>
                  : "Filter by GN Officer"}
              </div>
              <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
                {collapsedLabel
                  ? "Province → District → DS Division → GN Officer"
                  : "Select province, district, DS division and GN officer"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {hasApplied && (
              <span
                onClick={handleClear}
                style={{
                  background: "#FCEBEB", borderRadius: 7,
                  padding: "4px 10px", fontSize: 11, fontWeight: 600,
                  color: "#A32D2D", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                <X size={11} /> Clear
              </span>
            )}
            <ChevronDown
              size={16} color={COLORS.muted}
              style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
            />
          </div>
        </button>

        {/* ── Expanded body ── */}
        {open && (
          <div style={{ borderTop: `1px solid #DDD0BC`, padding: 16 }}>

            {/* Breadcrumb progress */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
              {[
                { label: "Province",    value: province },
                { label: "District",    value: district },
                { label: "DS Division", value: dsDiv    },
                { label: "GN Officer",  value: gnDiv    },
              ].map(({ label, value }, i) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {i > 0 && <ChevronRight size={12} color={COLORS.muted} />}
                  <div style={{
                    fontSize: 10, fontWeight: 700, padding: "3px 10px",
                    borderRadius: 20,
                    background: value ? COLORS.primary : COLORS.bg,
                    color: value ? COLORS.white : COLORS.muted,
                    border: `1px solid ${value ? COLORS.primary : "#DDD0BC"}`,
                    letterSpacing: "0.03em", whiteSpace: "nowrap",
                  }}>
                    {value || label}
                  </div>
                </div>
              ))}
            </div>

            {/* 4-column cascading selects */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
              gap: 12, marginBottom: 16,
            }}>
              <Select
                step={1} label="Province"
                value={province} onChange={handleProvince}
                options={provinces} placeholder="All provinces"
                disabled={false}
              />
              <Select
                step={2} label="District"
                value={district} onChange={handleDistrict}
                options={districts}
                placeholder={province ? "Select district" : "Select province first"}
                disabled={!province}
              />
              <Select
                step={3} label="DS Division"
                value={dsDiv} onChange={handleDsDiv}
                options={dsDivs}
                placeholder={district ? "Select DS division" : "Select district first"}
                disabled={!district}
              />

              {/* GN Officer — separate because label shows officer count */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{
                  fontSize: 10, fontWeight: 700, color: COLORS.muted,
                  textTransform: "uppercase", letterSpacing: "0.05em",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{
                    width: 17, height: 17, borderRadius: "50%", fontSize: 9,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    background: gnDiv ? COLORS.primary : COLORS.bg,
                    color: gnDiv ? COLORS.white : COLORS.muted,
                    border: `1.5px solid ${gnDiv ? COLORS.primary : "#DDD0BC"}`,
                    fontWeight: 700, flexShrink: 0,
                  }}>4</span>
                  GN Officer
                </label>
                <select
                  value={gnDiv}
                  onChange={e => setGnDiv(e.target.value)}
                  disabled={!dsDiv}
                  style={{
                    width: "100%", height: 38, padding: "0 28px 0 10px",
                    fontSize: 12, fontWeight: gnDiv ? 600 : 400,
                    border: `1.5px solid ${gnDiv ? COLORS.primary : "#DDD0BC"}`,
                    borderRadius: 10,
                    background: !dsDiv ? "#F5F0E8" : COLORS.white,
                    color: !dsDiv ? COLORS.muted : COLORS.darkest,
                    cursor: !dsDiv ? "not-allowed" : "pointer",
                    outline: "none", appearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A5C44' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat", backgroundPosition: "right 9px center",
                    transition: "border-color 0.15s",
                  }}
                >
                  <option value="">
                    {dsDiv
                      ? gnOfficers.length > 0
                        ? `${gnOfficers.length} officer${gnOfficers.length !== 1 ? "s" : ""} — select one`
                        : "No officers found"
                      : "Select DS division first"}
                  </option>
                  {gnOfficers.map(o => (
                    <option key={o.id || o.gnDiv} value={o.gnDiv}>
                      {o.fullName}{o.gnCode ? ` (${o.gnCode})` : ""} — {o.gnDiv}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer: hint + action buttons */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", flexWrap: "wrap", gap: 10,
              paddingTop: 14, borderTop: `1px solid #DDD0BC`,
            }}>
              {/* Contextual hint */}
              <div style={{ fontSize: 12, color: COLORS.muted }}>
                {gnDiv
                  ? <>Will show appointments for <strong style={{ color: COLORS.darkest }}>
                      {gnOfficers.find(o => o.gnDiv === gnDiv)?.fullName ?? gnDiv}
                    </strong></>
                  : dsDiv
                  ? <>{gnOfficers.length} GN officer{gnOfficers.length !== 1 ? "s" : ""} in {dsDiv}</>
                  : district
                  ? <>{dsDivs.length} DS division{dsDivs.length !== 1 ? "s" : ""} in {district}</>
                  : province
                  ? <>{districts.length} district{districts.length !== 1 ? "s" : ""} in {province}</>
                  : "Select a province to begin"}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleClear}
                  style={{
                    background: "transparent", border: `1px solid #DDD0BC`,
                    borderRadius: 9, padding: "8px 16px", fontSize: 12,
                    fontWeight: 500, color: COLORS.muted, cursor: "pointer",
                  }}
                >
                  Clear all
                </button>
                <button
                  onClick={handleApply}
                  disabled={!canApply}
                  style={{
                    background: canApply ? COLORS.primary : "#C8B89A",
                    border: "none", borderRadius: 9,
                    padding: "8px 20px", fontSize: 13, fontWeight: 700,
                    color: COLORS.white, cursor: canApply ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", gap: 7,
                    transition: "background 0.15s",
                  }}
                >
                  <Filter size={13} />
                  {canApply ? "Apply filter" : "Select a GN officer"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAV ITEM
// ═══════════════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════════
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
        <li className="pt-2">
          <NavItem icon={TrendingUp} label="Statistical Changes" bold
            onClick={() => navigate("/admin/staticalchanges")} />
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
      <div className="flex-1 relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" color={COLORS.textMuted} />
        <input
          className="w-full pl-10 pr-4 py-2.5 rounded-full border text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          style={{ borderColor: "#C8B89A", background: "#FFF9F0", color: COLORS.text }}
          placeholder="search..."
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
        />
      </div>
      {/* <button
        className="flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-full border"
        style={{ borderColor: "#C8B89A", color: COLORS.text, background: "#FFF9F0" }}
      >
        English <ChevronDown size={14} />
      </button> */}
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

// ═══════════════════════════════════════════════════════════════════════════════
// LEGEND
// ═══════════════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════════════
// APPOINTMENT CELL
// ═══════════════════════════════════════════════════════════════════════════════
function ApptCell({ appts, isBreak }) {
  const [hov, setHov] = useState(false);

  if (isBreak) return (
    <td style={{ height: 8, background: COLORS.bg,
      borderBottom: `1px dashed ${COLORS.muted}33`, padding: 0 }} />
  );
  if (!appts || appts.length === 0) return (
    <td style={{ height: 34,
      borderBottom: `1px solid ${COLORS.muted}18`,
      borderRight:  `1px solid ${COLORS.muted}18` }} />
  );

  const a   = appts[0];
  const cfg = STATUS_CONFIG[normaliseStatus(a.status)] ?? STATUS_CONFIG.booked;

  return (
    <td
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={`${a.fullName}\n${a.service ?? ""}\nStatus: ${a.status}`}
      style={{
        height: 34, background: cfg.bg,
        borderBottom: `1px solid ${COLORS.muted}18`,
        borderRight:  `1px solid ${COLORS.muted}18`,
        padding: "2px 4px", verticalAlign: "middle", cursor: "pointer",
        position: "relative",
        filter: hov ? "brightness(0.9)" : "none", transition: "filter 0.12s",
      }}
    >
      <div style={{ fontSize: 9.5, fontWeight: 600, color: cfg.text,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {a.fullName}
      </div>
      {a.service && (
        <div style={{ fontSize: 8.5, color: cfg.text, opacity: 0.75,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {a.service}
        </div>
      )}
      {appts.length > 1 && (
        <span style={{ position: "absolute", top: 2, right: 3,
          fontSize: 8, color: cfg.text, fontWeight: 700 }}>
          +{appts.length - 1}
        </span>
      )}
    </td>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR COMPONENT
// Accepts `appliedFilter` from the page — only fetches when gnDiv is set
// ═══════════════════════════════════════════════════════════════════════════════
function AppointmentCalendar({ appliedFilter }) {
  const [currentDate,  setCurrentDate]  = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);

  const weekDates = getWeekDates(currentDate);
  const gnDiv     = appliedFilter?.gnDiv;

  const fetchAppointments = useCallback(async () => {
    if (!gnDiv) { setAppointments([]); return; }
    setLoading(true); setError(null);
    try {
      const startStr = toDateStr(weekDates[0]);
      const endStr   = toDateStr(weekDates[6]);
      const snap = await getDocs(query(
        collection(db, "appointments"),
        where("gnDiv", "==", gnDiv),
        where("date",  ">=", startStr),
        where("date",  "<=", endStr),
      ));
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Firestore error:", err);
      setError("Could not load appointments. Check Firestore indexes.");
    } finally {
      setLoading(false);
    }
  }, [gnDiv, currentDate]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Build lookup map: "YYYY-MM-DD__3:30–3:45" → [appts]
  const apptMap = {};
  appointments.forEach(a => {
    const label = convertSlot(a.slot);
    if (!label) return;
    const k = `${a.date}__${label}`;
    if (!apptMap[k]) apptMap[k] = [];
    apptMap[k].push({ ...a, status: normaliseStatus(a.status) });
  });
  const getAppts = (date, slot) => apptMap[`${toDateStr(date)}__${slot}`] ?? [];

  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate()-7); setCurrentDate(d); };
  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate()+7); setCurrentDate(d); };

  const totalThisWeek  = appointments.length;
  const pendingCount   = appointments.filter(a => normaliseStatus(a.status) === "pending").length;
  const completedCount = appointments.filter(a => normaliseStatus(a.status) === "completed").length;

  // ── Empty state (no officer selected yet) ──────────────────────────────────
  if (!gnDiv) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 14,
        background: COLORS.white, borderRadius: 16, padding: "60px 32px",
        border: `1.5px dashed #DDD0BC`,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: COLORS.bg, border: `2px solid #DDD0BC`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Calendar size={24} color={COLORS.muted} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.darkest, marginBottom: 6 }}>
            No GN officer selected
          </div>
          <div style={{ fontSize: 12, color: COLORS.muted, maxWidth: 340 }}>
            Use the filter above — choose a province, district, DS division and GN officer,
            then click <strong>Apply filter</strong> to load their appointment calendar.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Page title + refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: COLORS.darkest, fontFamily: "Georgia, serif" }}>
            Appointment Calendar
          </h1>
          <p className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
            {formatMonthYear(weekDates)}
            {appliedFilter?.officer && (
              <> · <strong style={{ color: COLORS.primary }}>
                {appliedFilter.officer.fullName}
              </strong> — {gnDiv}</>
            )}
          </p>
        </div>
        {/* <button
          onClick={fetchAppointments}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: COLORS.primary, color: COLORS.white, border: "none", cursor: "pointer" }}
        >
          ↻ Refresh
        </button> */}
      </div>

      {/* Officer info banner */}
      {appliedFilter?.officer && (
        <div style={{
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
          background: COLORS.darkest, borderRadius: 14, padding: "12px 18px",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: COLORS.primary, border: `2px solid ${COLORS.accent}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700, color: COLORS.white, flexShrink: 0,
          }}>
            {(appliedFilter.officer.fullName || "?")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.white, fontFamily: "Georgia, serif" }}>
              {appliedFilter.officer.fullName}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                appliedFilter.officer.gnDiv,
                appliedFilter.officer.divisionalSecretariat,
                appliedFilter.officer.district,
                appliedFilter.officer.province,
                appliedFilter.officer.gnCode && `Code: ${appliedFilter.officer.gnCode}`,
                appliedFilter.officer.email,
              ].filter(Boolean).map((v, i) => (
                <span key={i}>{i > 0 ? "· " : ""}{v}</span>
              ))}
            </div>
          </div>
          {[
            { label: "Slot", value: `${appliedFilter.officer.slotDuration || 15} min` },
            { label: "Max/day", value: appliedFilter.officer.maxAppointments ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: "rgba(255,255,255,0.08)", borderRadius: 9,
              padding: "6px 14px", textAlign: "center",
            }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.accent }}>{value}</div>
            </div>
          ))}
        </div>
      )}

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
                  <th style={{ background: COLORS.darker,
                    borderRight: `2px solid ${COLORS.darkest}55`, padding: "8px 4px" }} />
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
                        borderRight: `2px solid ${COLORS.muted}33`, padding: 0,
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

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE — top-level component exported as default
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminCalendar({ onLogout }) {
  const navigate = useNavigate();

  // All GN officers — loaded once for the filter dropdowns
  const [officers,        setOfficers]        = useState([]);
  const [officersLoading, setOfficersLoading] = useState(true);

  // The filter state that has actually been applied (i.e. "Apply filter" clicked)
  const [appliedFilter, setAppliedFilter] = useState({
    province: "", district: "", dsDiv: "", gnDiv: "", officer: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "gn_officers"));
        setOfficers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to load GN officers:", err);
      } finally {
        setOfficersLoading(false);
      }
    })();
  }, []);

  const handleLogout = async () => {
    if (onLogout) { onLogout(); return; }
    try { await signOut(auth); navigate("/login"); }
    catch (err) { console.error("Logout error:", err); }
  };

  return (
    <div
      className="flex min-h-screen"
      style={{ background: COLORS.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}
    >
      <Sidebar onLogout={handleLogout} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-y-auto px-8 py-6">
          {/* Page heading */}
          <div className="mb-5">
            <h1 className="text-xl font-bold" style={{ color: COLORS.darkest, fontFamily: "Georgia, serif" }}>
              Appointment Calendar
            </h1>
            <p className="text-xs mt-1" style={{ color: COLORS.muted }}>
              Select a GN officer to view their weekly appointment schedule
            </p>
          </div>

          {/* Filter panel */}
          {officersLoading ? (
            <div style={{
              background: COLORS.white, borderRadius: 14, padding: "16px 20px",
              border: `1px solid #DDD0BC`, marginBottom: 16,
              fontSize: 13, color: COLORS.muted,
            }}>
              Loading GN officer data…
            </div>
          ) : (
            <FilterPanel
              officers={officers}
              onApply={setAppliedFilter}
              applied={appliedFilter}
            />
          )}

          {/* Calendar — shows empty state until a GN officer is selected */}
          <AppointmentCalendar appliedFilter={appliedFilter} />
        </main>

        <footer
          className="text-center text-xs py-4"
          style={{ background: COLORS.cardDark, color: "#C8A882" }}
        >
          © 2026 Smart Grama Sewa. All rights reserved.
        </footer>
      </div>
    </div>
  );
}