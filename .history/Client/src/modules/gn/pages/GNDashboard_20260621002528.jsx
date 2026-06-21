import GNLayout, { getThemeClasses } from "../components/gnlayout";
import {
  CalendarCheck, ClipboardList, Megaphone, TrendingUp, AlertCircle,
  Clock, ArrowRightLeft, Bell, ChevronRight, ChevronLeft,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  collection, query, where, getDocs, doc, getDoc, orderBy, limit,
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useTranslation } from "react-i18next";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
// Matches DAY_NAMES order/casing used in GNSchedule.jsx (workingHours is keyed by these)
const DAY_NAMES_BY_JS_INDEX = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

const formatDate = (ts) => {
  if (!ts) return "—";
  const date = ts?.toDate?.() || new Date(ts);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const timeAgo = (ts) => {
  if (!ts) return "";
  const date = ts?.toDate?.() || new Date(ts);
  const hours = Math.floor((new Date() - date) / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(ts);
};

const toYMD = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const fmt24to12 = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(h % 12 || 12)}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Calendar Legend Item
// ─────────────────────────────────────────────────────────────────────────────
const LegendDot = ({ color, label }) => (
  <span className="flex items-center gap-1 text-[10px] text-gray-500">
    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
    {label}
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const GNDashboard = ({ gnStatus, theme }) => {
  const { t, i18n } = useTranslation();
  const tTheme = getThemeClasses(theme);
  const navigate = useNavigate();
  const agendaRef = useRef(null);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const [appointmentStats, setAppointmentStats] = useState({ today: 0, pending: 0 });
  const [announcementStats, setAnnouncementStats] = useState({ total: 0, active: 0 });
  const [divisionRequest, setDivisionRequest] = useState(null);
  const [showDivisionModal, setShowDivisionModal] = useState(false);

  // ── Admin announcements ────────────────────────────────────────────────────
  const [adminAnnouncements, setAdminAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // ── Calendar ───────────────────────────────────────────────────────────────
  // ✅ Only ONE declaration of `now`
  const now = new Date();
  const [calViewYear, setCalViewYear] = useState(now.getFullYear());
  const [calViewMonth, setCalViewMonth] = useState(now.getMonth());
  const [calDayData, setCalDayData] = useState({});
  const [calLoading, setCalLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  // ── Fetch: division change request ────────────────────────────────────────
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const q = query(
          collection(db, "gn_change_gn_division"),
          where("uid", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) setDivisionRequest(snap.docs[0].data());
      } catch (err) {
        console.error("Fetch division request error:", err);
      }
    };
    fetchRequest();
  }, []);

  // ── Fetch: admin announcements ────────────────────────────────────────────
  useEffect(() => {
    const fetchAdminAnnouncements = async () => {
      try {
        setAnnouncementsLoading(true);

        const [snapAll, snapGN] = await Promise.all([
          getDocs(query(collection(db, "announcements"), where("category", "==", "all_users"))),
          getDocs(query(collection(db, "announcements"), where("category", "==", "gn_officers"))),
        ]);
        const allDocs = [
          ...snapAll.docs.map((d) => ({ id: d.id, ...d.data() })),
          ...snapGN.docs.map((d) => ({ id: d.id, ...d.data() })),
        ];
        const valid = allDocs.filter((a) => a.status === "published");
        const seen = new Set();
        const unique = valid
          .filter((a) => { if (seen.has(a.id)) return false; seen.add(a.id); return true; })
          .sort((a, b) => (b.publishedAt?.toDate?.() || 0) - (a.publishedAt?.toDate?.() || 0));
        setAdminAnnouncements(unique);
      } catch (err) {
        console.error("Admin announcements fetch error:", err);
      } finally {
        setAnnouncementsLoading(false);
      }
    };
    fetchAdminAnnouncements();
  }, []);

  // ── Fetch: stats (appointments + own announcements) ───────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const allQ = query(collection(db, "announcements"), where("createdBy", "==", user.uid));
        const allSnap = await getDocs(allQ);
        const allData = allSnap.docs.map((d) => d.data());
        setAnnouncementStats({
          total: allData.length,
          active: allData.filter((a) => a.status === "Active").length,
        });

        const officerSnap = await getDoc(doc(db, "gn_officers", user.uid));
        const divisionName = officerSnap.exists() ? officerSnap.data().gnDiv || "" : "";

        if (divisionName) {
          const today = new Date().toISOString().split("T")[0];
          const apptSnap = await getDocs(
            query(collection(db, "appointments"), where("gnDiv", "==", divisionName))
          );
          const apptData = apptSnap.docs.map((d) => d.data());
          setAppointmentStats({
            today: apptData.filter((a) => a.date === today).length,
            pending: apptData.filter((a) => a.status === "Pending").length,
          });
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };
    fetchAll();
  }, []);

  // ── Fetch: calendar data for current view month ───────────────────────────
  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        setCalLoading(true);
        const user = auth.currentUser;
        if (!user) return;

        const officerSnap = await getDoc(doc(db, "gn_officers", user.uid));
        if (!officerSnap.exists()) return;
        const officerData = officerSnap.data();
        const divisionName = officerData.gnDiv || "";

        let workingHours = {};
        if (officerData.workingHours && typeof officerData.workingHours === "object") {
          workingHours = officerData.workingHours;
        }

        const scheduleSnap = await getDoc(doc(db, "gn_schedule", user.uid));
        const scheduleData = scheduleSnap.exists() ? scheduleSnap.data() : {};
        if (scheduleData.workingHours && Object.keys(workingHours).length === 0) {
          workingHours = scheduleData.workingHours;
        }
        const overrides = scheduleData.overrides || {};
        const dutyBlocks = scheduleData.dutyBlocks || {};

        let appointments = [];
        if (divisionName) {
          const apptSnap = await getDocs(
            query(collection(db, "appointments"), where("gnDiv", "==", divisionName))
          );
          appointments = apptSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }

        const daysInMonth = new Date(calViewYear, calViewMonth + 1, 0).getDate();
        const dayMap = {};

        for (let d = 1; d <= daysInMonth; d++) {
          const ymd = toYMD(calViewYear, calViewMonth, d);
          const weekdayName = DAY_NAMES_BY_JS_INDEX[new Date(calViewYear, calViewMonth, d).getDay()];
          const types = new Set();

          const dayConfig = workingHours[weekdayName];
          if (dayConfig?.enabled) types.add("working");
          else types.add("closed");

          const dayOverrides = overrides[ymd] || {};
          const walkInTimes = Object.keys(dayOverrides).filter(
            (time) => dayOverrides[time]?.type === "walk-in"
          );
          if (walkInTimes.length > 0) types.add("walkin");

          const dayAppts = appointments.filter((a) => a.date === ymd && a.status !== "Cancelled");
          if (dayAppts.length > 0) {
            types.add("appointment");
            if (dayAppts.some((a) => a.status === "Confirmed")) types.add("confirmed");
            if (dayAppts.some((a) => a.status === "Pending")) types.add("pending");
          }

          const dutyBlock = dutyBlocks[ymd] || null;
          if (dutyBlock) types.add("duty");

          if (types.size > 0) {
            dayMap[ymd] = {
              types,
              appointments: dayAppts,
              dayConfig,
              walkInTimes,
              walkInDetails: walkInTimes.map((time) => ({ time, ...dayOverrides[time] })),
              dutyBlock,
            };
          } else {
            dayMap[ymd] = { types, appointments: [], dayConfig, walkInTimes: [], walkInDetails: [], dutyBlock: null };
          }
        }

        setCalDayData(dayMap);
      } catch (err) {
        console.error("Calendar data fetch error:", err);
      } finally {
        setCalLoading(false);
      }
    };
    fetchCalendarData();
  }, [calViewYear, calViewMonth]);

  // ── Calendar nav ──────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (calViewMonth === 0) { setCalViewYear(y => y - 1); setCalViewMonth(11); }
    else setCalViewMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (calViewMonth === 11) { setCalViewYear(y => y + 1); setCalViewMonth(0); }
    else setCalViewMonth(m => m + 1);
    setSelectedDay(null);
  };

  // ── Calendar cell dot colors ──────────────────────────────────────────────
  const getDots = (types) => {
    const dots = [];
    if (types.has("confirmed")) dots.push("bg-green-500");
    if (types.has("pending"))   dots.push("bg-[#E5A800]");
    if (types.has("walkin"))    dots.push("bg-[#8B4513]");
    if (types.has("duty"))      dots.push("bg-purple-500");
    return dots;
  };

  // ── Calendar cell bg ──────────────────────────────────────────────────────
  const getCellStyle = (ymd, isCurrentMonth, isToday) => {
    if (!isCurrentMonth) return "text-gray-300";
    if (isToday) return "bg-[#E5A800] text-white font-bold";
    const data = calDayData[ymd];
    if (!data) return `${tTheme.text}`;
    const { types } = data;
    if (types.has("closed")) return "bg-gray-100/60 text-gray-400";
    if (types.has("working")) return `${tTheme.text} font-medium`;
    return `${tTheme.text}`;
  };

  // ── Build calendar grid ───────────────────────────────────────────────────
  const buildCalendarCells = () => {
    const daysInMonth = new Date(calViewYear, calViewMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(calViewYear, calViewMonth, 1).getDay();
    const prevMonthDays = new Date(calViewYear, calViewMonth, 0).getDate();
    const cells = [];

    for (let i = firstDayOfWeek - 1; i >= 0; i--)
      cells.push({ day: prevMonthDays - i, current: false });
    for (let d = 1; d <= daysInMonth; d++)
      cells.push({ day: d, current: true });
    const remaining = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
    for (let d = 1; d <= remaining; d++)
      cells.push({ day: d, current: false });

    return cells;
  };

  // ── Selected day detail ───────────────────────────────────────────────────
  const selectedDayData = selectedDay ? calDayData[selectedDay] : null;

  // ── Badge styles ──────────────────────────────────────────────────────────
  const priorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":   return "bg-red-100 text-red-700 border border-red-200";
      case "medium": return "bg-orange-100 text-orange-700 border border-orange-200";
      case "low":    return "bg-green-100 text-green-700 border border-green-200";
      default:       return "bg-gray-100 text-gray-500";
    }
  };

  const categoryStyle = (category) =>
    category === "gn_officers" ? "bg-[#8B4513]/10 text-[#8B4513]" : "bg-blue-50 text-blue-700";
  const categoryLabel = (category) =>
    category === "gn_officers" ? t('category_gn_officers') : t('category_all_users');

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  const calCells = buildCalendarCells();
  const monthName = new Date(calViewYear, calViewMonth, 1)
    .toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const todayYMD = toYMD(now.getFullYear(), now.getMonth(), now.getDate());

  const handleDayClick = (ymd, isSelected) => {
    setSelectedDay(isSelected ? null : ymd);
    if (!isSelected) {
      setTimeout(() => {
        agendaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  };

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      {/* Page Title */}
      <h1 className="text-xl sm:text-2xl font-bold text-[#8B4513] mb-4 sm:mb-6 px-1">
        {t('lbl_dashboard')}
      </h1>

      {/* ── Stats Row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <button
          onClick={() => {
            setCalViewYear(now.getFullYear());
            setCalViewMonth(now.getMonth());
            setSelectedDay(todayYMD);
            document.getElementById("dashboard-calendar")?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
          className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-5 text-left transition hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${tTheme.subtext}`}>
              {t('lbl_todays_appointments')}
            </p>
            <CalendarCheck size={18} className="text-gray-400" />
          </div>
          <h2 className={`text-3xl sm:text-4xl font-bold mt-2 ${tTheme.text}`}>{appointmentStats.today}</h2>
          <p className="text-[10px] sm:text-xs text-green-500 mt-2 flex items-center gap-1">
            <TrendingUp size={10} /> {t('lbl_appointments_today')}
          </p>
        </button>

        <button
          onClick={() => navigate("/gn-appointments?status=Pending")}
          className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-5 text-left transition hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${tTheme.subtext}`}>
              {t('lbl_pending_requests')}
            </p>
            <ClipboardList size={18} className="text-gray-400" />
          </div>
          <h2 className={`text-3xl sm:text-4xl font-bold mt-2 ${tTheme.text}`}>{appointmentStats.pending}</h2>
          <p className="text-[10px] sm:text-xs text-orange-500 mt-2 flex items-center gap-1">
            <AlertCircle size={10} /> {t('lbl_requires_attention')}
          </p>
        </button>

        <button
          onClick={() => navigate("/gn-announcement-list")}
          className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-5 text-left transition hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${tTheme.subtext}`}>
              {t('lbl_total_announcements')}
            </p>
            <Megaphone size={18} className="text-gray-400" />
          </div>
          <h2 className={`text-3xl sm:text-4xl font-bold mt-2 ${tTheme.text}`}>{announcementStats.total}</h2>
          <p className={`text-[10px] sm:text-xs mt-2 ${tTheme.subtext}`}>
            {announcementStats.active} Active this month
          </p>
        </button>
      </div>

      {/* ── Calendar + Quick Actions ─────────────────────────────────────────── */}
      <div id="dashboard-calendar" className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">

        {/* Calendar card */}
        <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-5 col-span-1 flex flex-col`}>

          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={prevMonth}
              className={`w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#E5A800]/10 transition ${tTheme.subtext}`}
            >
              <ChevronLeft size={15} />
            </button>
            <p className={`text-sm font-bold ${tTheme.text}`}>{monthName}</p>
            <button
              onClick={nextMonth}
              className={`w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#E5A800]/10 transition ${tTheme.subtext}`}
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 text-center text-[10px] text-gray-400 mb-1">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => <span key={d}>{d}</span>)}
          </div>

          {/* Cells */}
          {calLoading ? (
            <div className="flex-1 flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-[#E5A800] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-y-0.5">
              {calCells.map((cell, i) => {
                const ymd = cell.current ? toYMD(calViewYear, calViewMonth, cell.day) : null;
                const isToday = ymd === todayYMD;
                const isSelected = ymd === selectedDay;
                const data = ymd ? calDayData[ymd] : null;
                const dots = data ? getDots(data.types) : [];
                const cellStyle = getCellStyle(ymd, cell.current, isToday);

                return (
                  <div key={i} className="flex flex-col items-center py-0.5">
                    <button
                      disabled={!cell.current}
                      onClick={() => cell.current && handleDayClick(ymd, isSelected)}
                      className={`w-7 h-7 rounded-full text-[11px] flex items-center justify-center transition-all
                        ${cellStyle}
                        ${isSelected && !isToday ? "ring-2 ring-[#E5A800] ring-offset-1" : ""}
                        ${cell.current && !isToday ? "hover:bg-[#E5A800]/10 cursor-pointer" : ""}
                        ${!cell.current ? "cursor-default" : ""}
                      `}
                    >
                      {cell.day}
                    </button>
                    {/* Dots row */}
                    <div className="flex gap-0.5 mt-0.5 h-1.5">
                      {dots.slice(0, 3).map((color, di) => (
                        <span key={di} className={`w-1 h-1 rounded-full ${color}`} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className={`mt-3 pt-3 border-t ${tTheme.border} flex flex-wrap gap-x-3 gap-y-1.5`}>
            <LegendDot color="bg-[#E5A800]"   label="Today" />
            <LegendDot color="bg-green-500"   label="Confirmed" />
            <LegendDot color="bg-[#E5A800]"   label="Pending" />
            <LegendDot color="bg-[#8B4513]"   label="Walk-in" />
            <LegendDot color="bg-purple-500"  label="Official Duty" />
            <LegendDot color="bg-gray-300"    label="Closed day" />
          </div>
        </div>

        {/* Right column: selected day detail OR quick actions */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-4">

          {/* Selected day panel */}
          {selectedDay && selectedDayData && (
            <div ref={agendaRef} className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-5`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-sm font-bold ${tTheme.text}`}>
                  {new Date(selectedDay + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long", month: "long", day: "numeric", year: "numeric"
                  })}
                </p>
                <button
                  onClick={() => setSelectedDay(null)}
                  className={`text-lg leading-none ${tTheme.subtext} hover:text-gray-600`}
                >✕</button>
              </div>

              {/* Working hours badge */}
              {selectedDayData.types.has("working") && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                  <span className="text-xs text-green-700 font-semibold">
                    Working Day
                    {selectedDayData.dayConfig?.start && selectedDayData.dayConfig?.end
                      ? ` · ${selectedDayData.dayConfig.start} – ${selectedDayData.dayConfig.end}`
                      : ""}
                    {selectedDayData.dayConfig?.lunch
                      ? `  (Lunch: ${selectedDayData.dayConfig.lunch})`
                      : ""}
                  </span>
                </div>
              )}
              {selectedDayData.types.has("closed") && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                  <span className={`text-xs font-semibold ${tTheme.subtext}`}>Closed — no working hours set</span>
                </div>
              )}
              {selectedDayData.types.has("walkin") && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#8B4513] flex-shrink-0" />
                  <span className="text-xs text-[#8B4513] font-semibold">
                    {selectedDayData.walkInTimes.length} Walk-in Slot{selectedDayData.walkInTimes.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
              {selectedDayData.types.has("duty") && selectedDayData.dutyBlock && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                  <span className="text-xs text-purple-700 font-semibold">
                    Official Duty — {selectedDayData.dutyBlock.type}
                    {selectedDayData.dutyBlock.allDay
                      ? " (Full day)"
                      : ` (${fmt24to12(selectedDayData.dutyBlock.startTime)} – ${fmt24to12(selectedDayData.dutyBlock.endTime)})`}
                  </span>
                </div>
              )}

              {/* Duty block detail card */}
              {selectedDayData.dutyBlock && (
                <div className="mt-2 mb-3 rounded-xl px-3 py-2.5 bg-purple-50 border-l-4 border-purple-400">
                  <p className="text-xs font-semibold text-purple-800">
                    {selectedDayData.dutyBlock.type}
                  </p>
                  <p className="text-[10px] text-purple-700 opacity-80">
                    {selectedDayData.dutyBlock.allDay
                      ? "Full day"
                      : `${fmt24to12(selectedDayData.dutyBlock.startTime)} – ${fmt24to12(selectedDayData.dutyBlock.endTime)}`}
                  </p>
                  {selectedDayData.dutyBlock.type === "Other" && selectedDayData.dutyBlock.note && (
                    <p className="text-[10px] text-purple-700 mt-1 italic">{selectedDayData.dutyBlock.note}</p>
                  )}
                </div>
              )}

              {/* Walk-in slots list */}
              {selectedDayData.walkInDetails?.length > 0 && (
                <div className="mt-2 mb-3">
                  <p className={`text-[10px] font-bold uppercase tracking-wide mb-2 ${tTheme.subtext}`}>
                    Walk-in Reservations
                  </p>
                  <div className="flex flex-col gap-2 max-h-32 overflow-y-auto pr-1">
                    {selectedDayData.walkInDetails.map((w) => (
                      <div
                        key={w.time}
                        className="flex items-center justify-between rounded-xl px-3 py-2 bg-[#F5DEB3]/40 border-l-4 border-[#8B4513]"
                      >
                        <div>
                          <p className="text-xs font-semibold text-[#6A2301]">{w.visitorName || "Walk-in"}</p>
                          <p className="text-[10px] text-[#6A2301] opacity-70">{w.purpose || "Walk-in"}</p>
                        </div>
                        <span className="text-[10px] font-bold text-[#8B4513]">{w.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appointments list */}
              {selectedDayData.appointments?.length > 0 ? (
                <div className="mt-2">
                  <p className={`text-[10px] font-bold uppercase tracking-wide mb-2 ${tTheme.subtext}`}>
                    Appointments ({selectedDayData.appointments.length})
                  </p>
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                    {selectedDayData.appointments.map((appt) => (
                      <div
                        key={appt.id}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 ${tTheme.tableRow}`}
                      >
                        <div>
                          <p className={`text-xs font-semibold ${tTheme.text}`}>
                            {appt.fullName || appt.citizenName || appt.name || "Citizen"}
                          </p>
                          <p className={`text-[10px] ${tTheme.subtext}`}>{appt.slot || appt.slotTime || appt.time || "—"}</p>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-1 rounded-lg
                          ${appt.status === "Confirmed"
                            ? "bg-green-100 text-green-700"
                            : appt.status === "Pending"
                            ? "bg-[#FDF0CC] text-[#8B6400]"
                            : appt.status === "Cancelled"
                            ? "bg-red-100 text-red-500"
                            : "bg-gray-100 text-gray-500"
                          }`}>
                          {appt.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                !selectedDayData.types.has("working") &&
                !selectedDayData.types.has("duty") &&
                selectedDayData.walkInDetails?.length === 0 && (
                  <p className={`text-xs ${tTheme.subtext} mt-1`}>No appointments scheduled.</p>
                )
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <p className={`text-sm font-semibold mb-3 flex items-center gap-2 ${tTheme.text}`}>⚡ Quick Actions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Link
                to="/gn-appointments"
                className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold rounded-2xl px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 transition justify-center sm:justify-start"
              >
                <CalendarCheck size={18} /><span className="text-sm sm:text-base">View Appointments</span>
              </Link>
              <Link
                to="/gn-schedule"
                className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold rounded-2xl px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 transition justify-center sm:justify-start"
              >
                <Clock size={18} /><span className="text-sm sm:text-base">Update Schedule</span>
              </Link>
              <Link
                to="/gn-create-announcement"
                className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold rounded-2xl px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 transition justify-center sm:justify-start"
              >
                <Megaphone size={18} /><span className="text-sm sm:text-base">Create Announcement</span>
              </Link>
              <button
                onClick={() => {
                  if (divisionRequest) setShowDivisionModal(true);
                  else navigate("/gn-change-gn-division");
                }}
                className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold rounded-2xl px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 transition justify-center sm:justify-start"
              >
                <ArrowRightLeft size={18} /><span className="text-sm sm:text-base">Change GN Division</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Admin Announcements Panel ─────────────────────────────────────────── */}
      <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#8B4513]/10 flex items-center justify-center">
              <Bell size={16} className="text-[#8B4513]" />
            </div>
            <div>
              <p className={`text-sm font-bold ${tTheme.text}`}>{t('lbl_notices_from_admin')}</p>
              <p className={`text-[10px] ${tTheme.subtext}`}>
                {t('lbl_active_notices', { count: adminAnnouncements.length })}
              </p>
            </div>
          </div>
          {adminAnnouncements.length > 0 && (
            <span className="text-[10px] font-bold bg-[#E5A800] text-[#3d2a00] px-2 py-0.5 rounded-full">
              {t('lbl_new')}
            </span>
          )}
        </div>

        {announcementsLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-xl bg-gray-100 h-16" />
            ))}
          </div>
        ) : adminAnnouncements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-1">
              <Bell size={22} className="text-gray-300" />
            </div>
            <p className={`text-sm font-semibold ${tTheme.subtext}`}>{t('lbl_no_notices')}</p>
            <p className={`text-xs ${tTheme.subtext}`}>{t('lbl_no_notices_desc')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {adminAnnouncements.map((item) => {
              const isExpanded = expandedId === item.id;
              const isHighPriority = item.priority?.toLowerCase() === "high";

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border transition-all duration-200 overflow-hidden
                    ${isHighPriority ? "border-red-200 bg-red-50/40" : `border-gray-100 ${tTheme.tableRow}`}`}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="w-full text-left px-4 py-3 flex items-start gap-3"
                  >
                    <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0
                      ${item.priority?.toLowerCase() === "high"   ? "bg-red-500"    :
                        item.priority?.toLowerCase() === "medium" ? "bg-orange-400" :
                        "bg-green-500"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${priorityStyle(item.priority)}`}>
                          {t(`priority_${item.priority?.toLowerCase() || 'normal'}`)}
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${categoryStyle(item.category)}`}>
                          {categoryLabel(item.category)}
                        </span>
                      </div>
                      <p className={`text-sm font-bold leading-snug ${tTheme.text}`}>{item.title}</p>
                      {!isExpanded && item.description && (
                        <p className={`text-xs mt-0.5 line-clamp-1 ${tTheme.subtext}`}>{item.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[10px] ${tTheme.subtext}`}>{timeAgo(item.publishedAt)}</span>
                      <ChevronRight
                        size={14}
                        className={`text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className={`px-4 pb-4 border-t ${isHighPriority ? "border-red-100" : "border-gray-100"}`}>
                      {item.description && (
                        <p className={`text-sm mt-3 leading-relaxed ${tTheme.text}`}>{item.description}</p>
                      )}
                      <div className={`flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] ${tTheme.subtext}`}>
                        <span>📅 Published: {formatDate(item.publishedAt)}</span>
                        {item.expiresAt && <span>⏳ Expires: {formatDate(item.expiresAt)}</span>}
                        <span>✉ By: {item.createdBy}</span>
                      </div>
                      {item.attachments?.length > 0 && (
                        <div className="mt-3">
                          <p className={`text-[10px] font-bold uppercase tracking-wide mb-1.5 ${tTheme.subtext}`}>
                            {t('lbl_attachments')}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {item.attachments.map((url, i) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 text-xs font-semibold text-[#8B4513] bg-[#8B4513]/10 hover:bg-[#8B4513]/20 px-3 py-1.5 rounded-lg transition"
                              >
                                📎 {t('lbl_attachment', { number: i + 1 })}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Division Request Status Modal ─────────────────────────────────────── */}
      {showDivisionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-3 sm:px-4">
          <div className={`${tTheme.card} rounded-2xl shadow-2xl w-full max-w-[90%] sm:max-w-md p-5 sm:p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-sm sm:text-base font-bold ${tTheme.text}`}>{t('lbl_gn_division_change_request')}</h2>
              <button onClick={() => setShowDivisionModal(false)} className={`${tTheme.subtext} hover:text-gray-600 text-xl`}>✕</button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <div>
                <p className={`text-xs ${tTheme.subtext}`}>{t('lbl_requested_division')}</p>
                <p className={`text-sm font-bold ${tTheme.text}`}>{divisionRequest?.toDivision}</p>
                <p className={`text-xs ${tTheme.subtext}`}>{divisionRequest?.toDistrict}</p>
              </div>
              <span className={`text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-center ${
                divisionRequest?.status === "Pending"  ? "bg-yellow-100 text-yellow-700" :
                divisionRequest?.status === "Approved" ? "bg-green-100 text-green-700"  :
                divisionRequest?.status === "Rejected" ? "bg-red-100 text-red-600"      :
                "bg-gray-100 text-gray-500"
              }`}>
                {divisionRequest?.status === "Pending"  ? `⏳ ${t('status_pending')}` :
                 divisionRequest?.status === "Approved" ? `✅ ${t('status_approved')}` :
                 divisionRequest?.status === "Rejected" ? `❌ ${t('status_rejected')}` :
                 divisionRequest?.status}
              </span>
            </div>

            <p className={`text-xs ${tTheme.subtext} mb-4`}>
              Submitted: {divisionRequest?.createdAt?.toDate?.()?.toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric",
              }) || "—"}
            </p>

            {divisionRequest?.status === "Pending" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 sm:px-4 py-3 mb-4">
                <p className="text-xs text-yellow-700 font-semibold">{t('lbl_under_review')}</p>
              </div>
            )}
            {divisionRequest?.status === "Approved" && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-3 sm:px-4 py-3 mb-4">
                <p className="text-xs text-green-700 font-semibold">{t('lbl_approved_message')}</p>
              </div>
            )}
            {divisionRequest?.status === "Rejected" && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 sm:px-4 py-3 mb-4">
                <p className="text-xs text-red-600 font-semibold">{t('lbl_rejected_message')}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDivisionModal(false)}
                className={`flex-1 border ${tTheme.border} ${tTheme.subtext} font-semibold py-2 rounded-xl hover:bg-gray-50 transition text-sm`}
              >
                Close
              </button>
              {divisionRequest?.status === "Rejected" && (
                <button
                  onClick={() => { setShowDivisionModal(false); navigate("/gn-change-gn-division"); }}
                  className="flex-1 bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold py-2 rounded-xl transition text-sm"
                >
                  New Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </GNLayout>
  );
};

export default GNDashboard;