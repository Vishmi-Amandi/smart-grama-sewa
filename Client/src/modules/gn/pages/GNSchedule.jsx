import { useState, useEffect, useCallback } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { auth, db } from "../../firebase";
import {
  collection, query, where, getDocs, doc, updateDoc,
  getDoc, setDoc,
} from "firebase/firestore";
import {
  ChevronLeft, ChevronRight, CheckCircle, XCircle,
  Loader2, RefreshCw, Plus, Pencil, Trash2,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DEFAULT_WORKING_HOURS = {
  Monday:    { enabled: true,  start: "08:00", end: "17:00", lunch: "12:00" },
  Tuesday:   { enabled: true,  start: "08:00", end: "17:00", lunch: "12:00" },
  Wednesday: { enabled: true,  start: "08:00", end: "17:00", lunch: "12:00" },
  Thursday:  { enabled: true,  start: "08:00", end: "17:00", lunch: "12:00" },
  Friday:    { enabled: true,  start: "08:00", end: "17:00", lunch: "12:00" },
  Saturday:  { enabled: false, start: "09:00", end: "13:00", lunch: "12:00" },
  Sunday:    { enabled: false, start: "09:00", end: "13:00", lunch: "12:00" },
};

const SLOT_CARD = {
  Confirmed: "bg-green-50 border-l-4 border-green-500",
  Pending:   "bg-yellow-50 border-l-4 border-[#E5A800]",
  Cancelled: "bg-red-50 border-l-4 border-red-400 opacity-60",
};

const STATUS_BADGE = {
  Confirmed: "bg-green-100 text-green-700 border-green-200",
  Pending:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  Cancelled: "bg-red-100 text-red-600 border-red-200",
};

// Walk-in purpose presets for quick selection
const WALKIN_PURPOSES = [
  "General inquiry",
  "Document submission",
  "Certificate request",
  "Complaint",
  "Follow-up visit",
  "Other",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, "0");

const fmt24to12 = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${pad(h % 12 || 12)}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
};

const buildDaySlots = (start, end, lunchStart, slotDuration, breakBetween) => {
  const toMins = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  const startMins  = toMins(start);
  const endMins    = toMins(end);
  const lunchBegin = toMins(lunchStart);
  const lunchEnd   = lunchBegin + 60;
  const step       = slotDuration + breakBetween;

  const slots = [];
  for (let m = startMins; m + slotDuration <= endMins; m += step) {
    const slotEnd = m + slotDuration;
    if (m >= lunchBegin && m < lunchEnd) { m = lunchEnd - step; continue; }
    if (slotEnd > lunchBegin && m < lunchEnd) continue;
    slots.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
  }
  return slots;
};

const getWeekDays = (mondayDate) => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + i);
    days.push({
      name:  DAY_NAMES[i],
      short: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
      date:  d.getDate(),
      full:  d.toDateString(),
      iso:   d.toISOString().split("T")[0],
    });
  }
  return days;
};

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── Walk-in Editor Modal ─────────────────────────────────────────────────────

const WalkInModal = ({ modal, onClose, onSave, onRemove, theme }) => {
  const t = getThemeClasses(theme);
  const existing = modal?.walkInData;

  const [visitorName, setVisitorName]   = useState(existing?.visitorName || "");
  const [purpose, setPurpose]           = useState(existing?.purpose || "");
  const [customPurpose, setCustomPurpose] = useState(
    existing?.purpose && !WALKIN_PURPOSES.includes(existing.purpose) ? existing.purpose : ""
  );
  const [notes, setNotes]               = useState(existing?.notes || "");
  const [saving, setSaving]             = useState(false);

  const isCustom = purpose === "Other" || (purpose && !WALKIN_PURPOSES.includes(purpose));
  const finalPurpose = isCustom ? customPurpose : purpose;

  const handleSave = async () => {
    setSaving(true);
    await onSave(modal.iso, modal.time, {
      visitorName: visitorName.trim(),
      purpose: finalPurpose.trim() || "Walk-in",
      notes: notes.trim(),
    });
    setSaving(false);
    onClose();
  };

  const handleRemove = async () => {
    setSaving(true);
    await onRemove(modal.iso, modal.time);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/30">
      <div className={`${t.card} rounded-2xl shadow-2xl p-6 w-full max-w-sm`}>

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-[#F5DEB3] text-[#8B4513] border border-[#8B4513]/20">
              Walk-in Slot
            </span>
            <h2 className={`text-base font-bold mt-2 ${t.text}`}>
              {fmt24to12(modal.time)} · {modal.iso}
            </h2>
          </div>
          <button onClick={onClose} className={`${t.subtext} hover:text-gray-600 mt-1`}>
            <XCircle size={20} />
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-3 mb-5">
          {/* Visitor Name */}
          <div>
            <label className={`text-[10px] font-semibold mb-1 block ${t.subtext}`}>
              Visitor Name <span className="font-normal opacity-60">(optional)</span>
            </label>
            <input
              type="text"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="e.g. Kamala Perera"
              className={`w-full border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}
            />
          </div>

          {/* Purpose */}
          <div>
            <label className={`text-[10px] font-semibold mb-1 block ${t.subtext}`}>Purpose</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {WALKIN_PURPOSES.map((p) => (
                <button
                  key={p}
                  onClick={() => setPurpose(p)}
                  className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold transition
                    ${purpose === p
                      ? "bg-[#8B4513] text-white border-[#8B4513]"
                      : `border-gray-300 ${t.subtext} hover:border-[#8B4513]`
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
            {isCustom && (
              <input
                type="text"
                value={customPurpose}
                onChange={(e) => setCustomPurpose(e.target.value)}
                placeholder="Describe the purpose…"
                className={`w-full border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}
              />
            )}
          </div>

          {/* Notes */}
          <div>
            <label className={`text-[10px] font-semibold mb-1 block ${t.subtext}`}>
              Notes <span className="font-normal opacity-60">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes…"
              rows={2}
              className={`w-full border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] resize-none ${t.input}`}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {existing && (
            <button
              onClick={handleRemove}
              disabled={saving}
              className="flex items-center gap-1.5 border border-red-200 text-red-600 font-semibold px-3 py-2 rounded-xl hover:bg-red-50 transition text-sm"
            >
              <Trash2 size={13} /> Remove
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#8B4513] hover:bg-[#6A2301] text-white font-semibold py-2 rounded-xl transition text-sm disabled:opacity-60"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
            {saving ? "Saving…" : existing ? "Update Slot" : "Reserve Walk-in"}
          </button>
        </div>

      </div>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const GNSchedule = ({ gnStatus, theme }) => {
  const t = getThemeClasses(theme);

  const [weekStart, setWeekStart]         = useState(getMonday(new Date()));
  const [workingHours, setWorkingHours]   = useState(DEFAULT_WORKING_HOURS);
  const [slotDuration, setSlotDuration]   = useState(30);
  const [breakBetween, setBreakBetween]   = useState(5);
  const [gnUid, setGnUid]                 = useState("");
  const [gnDivision, setGnDivision]       = useState("");
  const [slotOverrides, setSlotOverrides] = useState({});
  const [appointments, setAppointments]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [modal, setModal]                 = useState(null);       // appointment detail modal
  const [walkInModal, setWalkInModal]     = useState(null);       // walk-in editor modal

  const days  = getWeekDays(weekStart);
  const today = new Date().toDateString();

  // ── 1. Load officer profile once ────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const user = auth.currentUser;
      if (!user) return;
      setGnUid(user.uid);

      try {
        const snap = await getDoc(doc(db, "gn_officers", user.uid));
        if (!snap.exists()) return;
        const data = snap.data();

        setGnDivision(data.gnDiv || "");

        if (data.workingHours && typeof data.workingHours === "object") {
          const hasNamedKeys = DAY_NAMES.some((d) => d in data.workingHours);
          if (hasNamedKeys) {
            const normalized = {};
            DAY_NAMES.forEach((day) => {
              normalized[day] = {
                enabled: data.workingHours[day]?.enabled ?? DEFAULT_WORKING_HOURS[day].enabled,
                start:   data.workingHours[day]?.start   ?? DEFAULT_WORKING_HOURS[day].start,
                end:     data.workingHours[day]?.end     ?? DEFAULT_WORKING_HOURS[day].end,
                lunch:   data.workingHours[day]?.lunch   ?? DEFAULT_WORKING_HOURS[day].lunch,
              };
            });
            setWorkingHours(normalized);
          }
        }

        if (data.slotDuration)      setSlotDuration(parseInt(data.slotDuration) || 30);
        if (data.breakBetweenSlots) setBreakBetween(parseInt(data.breakBetweenSlots) || 5);
      } catch (err) {
        console.error("Init error:", err);
      }
    };
    init();
  }, []);

  // ── 2. Fetch appointments + walk-in overrides ────────────────────────────────
  const fetchWeekData = useCallback(async () => {
    if (!gnUid) return;
    setLoading(true);
    try {
      const overrideSnap = await getDoc(doc(db, "gn_schedule", gnUid));
      if (overrideSnap.exists()) {
        setSlotOverrides(overrideSnap.data().overrides || {});
      }

      const officerSnap = await getDoc(doc(db, "gn_officers", gnUid));
      if (!officerSnap.exists()) return;
      const division = officerSnap.data().gnDiv || "";
      if (!division) return;

      setGnDivision(division);

      const q = query(
        collection(db, "appointments"),
        where("gnDiv", "==", division)
      );
      const snap = await getDocs(q);
      setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [gnUid, weekStart]);

  useEffect(() => {
    if (gnUid) fetchWeekData();
  }, [fetchWeekData]);

  // ── Slot helpers ─────────────────────────────────────────────────────────────

  const getSlotsForDay = (dayName) => {
    const dh = workingHours[dayName];
    if (!dh?.enabled) return [];
    return buildDaySlots(dh.start, dh.end, dh.lunch, slotDuration, breakBetween);
  };

  const getAppointmentAt = (iso, time) =>
    appointments.find((a) => {
      if (a.date !== iso) return false;
      if (a.time === time) return true;
      if (a.slotTime === time) return true;
      if (a.slot) {
        const [h, m] = time.split(":").map(Number);
        const ampm = h >= 12 ? "PM" : "AM";
        const h12padded   = `${pad(h % 12 || 12)}:${pad(m)} ${ampm}`;
        const h12unpadded = `${h % 12 || 12}:${pad(m)} ${ampm}`;
        if (a.slot === h12padded || a.slot === h12unpadded) return true;
      }
      return false;
    });

  // Walk-in data: can be a string "walk-in" (legacy) or an object with details
  const getWalkInData = (iso, time) => {
    const val = slotOverrides[iso]?.[time];
    if (!val) return null;
    if (val === "walk-in") return { purpose: "Walk-in", visitorName: "", notes: "" }; // legacy
    if (typeof val === "object") return val;
    return null;
  };

  const isWalkIn = (iso, time) => !!getWalkInData(iso, time);

  // ── Save walk-in slot ─────────────────────────────────────────────────────────

  const saveWalkIn = async (iso, time, data) => {
    const updated = {
      ...slotOverrides,
      [iso]: {
        ...(slotOverrides[iso] || {}),
        [time]: { type: "walk-in", ...data },
      },
    };
    setSlotOverrides(updated);
    setSaving(true);
    try {
      await setDoc(doc(db, "gn_schedule", gnUid), { overrides: updated }, { merge: true });
    } catch (err) {
      console.error("Walk-in save error:", err);
    } finally {
      setSaving(false);
    }
  };

  // ── Remove walk-in slot ───────────────────────────────────────────────────────

  const removeWalkIn = async (iso, time) => {
    const updated = { ...slotOverrides };
    if (updated[iso]) {
      delete updated[iso][time];
      if (Object.keys(updated[iso]).length === 0) delete updated[iso];
    }
    setSlotOverrides(updated);
    setSaving(true);
    try {
      await setDoc(doc(db, "gn_schedule", gnUid), { overrides: updated }, { merge: true });
    } catch (err) {
      console.error("Walk-in remove error:", err);
    } finally {
      setSaving(false);
    }
  };

  // ── Confirm / Cancel ─────────────────────────────────────────────────────────

  const handleConfirm = async (appt) => {
    try {
      await updateDoc(doc(db, "appointments", appt.id), { status: "Confirmed" });
      setAppointments((prev) =>
        prev.map((a) => a.id === appt.id ? { ...a, status: "Confirmed" } : a)
      );
      setModal((m) => m ? { ...m, appt: { ...m.appt, status: "Confirmed" } } : null);
    } catch (err) {
      console.error("Confirm error:", err);
    }
  };

  const handleCancel = async (id) => {
    try {
      await updateDoc(doc(db, "appointments", id), { status: "Cancelled" });
      setAppointments((prev) =>
        prev.map((a) => a.id === id ? { ...a, status: "Cancelled" } : a)
      );
      setModal((m) => m ? { ...m, appt: { ...m.appt, status: "Cancelled" } } : null);
    } catch (err) {
      console.error("Cancel error:", err);
    }
  };

  // ── Stats ────────────────────────────────────────────────────────────────────

  const stats = days.reduce(
    (acc, d) => {
      if (!workingHours[d.name]?.enabled) return acc;
      getSlotsForDay(d.name).forEach((time) => {
        const appt = getAppointmentAt(d.iso, time);
        if (appt?.status === "Confirmed")     acc.confirmed++;
        else if (appt?.status === "Pending")  acc.pending++;
        else if (isWalkIn(d.iso, time))       acc.walkIn++;
        else                                  acc.available++;
      });
      return acc;
    },
    { confirmed: 0, pending: 0, walkIn: 0, available: 0 }
  );

  // ── Week navigation ──────────────────────────────────────────────────────────

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };
  const goToday  = () => setWeekStart(getMonday(new Date()));

  const allTimeSet = new Set();
  days.forEach((d) => getSlotsForDay(d.name).forEach((t) => allTimeSet.add(t)));
  const allTimes = Array.from(allTimeSet).sort();

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#8B4513]">Weekly Schedule</h1>
          <p className={`text-xs mt-0.5 ${t.subtext}`}>
            {gnDivision && <span className="font-semibold">{gnDivision} · </span>}
            Slot: {slotDuration} min · Break: {breakBetween} min ·{" "}
            <span
              onClick={() => window.location.href = "/gn-settings?tab=hours"}
              className="text-[#8B4513] font-semibold cursor-pointer hover:underline"
            >
              Edit in Settings →
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {saving && (
            <span className={`flex items-center gap-1 text-xs ${t.subtext}`}>
              <Loader2 size={12} className="animate-spin" /> Saving…
            </span>
          )}
          <button
            onClick={fetchWeekData}
            className={`p-1.5 rounded-lg border ${t.border} ${t.subtext} hover:bg-gray-50 transition`}
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <div className={`flex items-center border ${t.border} rounded-xl overflow-hidden`}>
            <button onClick={prevWeek} className={`px-3 py-1.5 ${t.subtext} hover:bg-gray-100 transition`}>
              <ChevronLeft size={15} />
            </button>
            <button onClick={goToday} className="px-3 py-1.5 bg-[#E5A800] text-black font-semibold text-xs">
              Today
            </button>
            <button onClick={nextWeek} className={`px-3 py-1.5 ${t.subtext} hover:bg-gray-100 transition`}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Available", count: stats.available, color: "text-gray-500",  bg: t.card },
          { label: "Pending",   count: stats.pending,   color: "text-[#E5A800]", bg: "bg-yellow-50" },
          { label: "Confirmed", count: stats.confirmed, color: "text-green-600", bg: "bg-green-50" },
          { label: "Walk-in",   count: stats.walkIn,    color: "text-[#8B4513]", bg: "bg-[#F5DEB3]/50" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl px-4 py-3 shadow-sm border ${t.border}`}>
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className={`text-xs ${t.subtext}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className={`${t.card} rounded-2xl shadow px-4 py-2.5 flex items-center gap-4 flex-wrap mb-4 border ${t.border}`}>
        <p className={`text-xs font-semibold ${t.subtext} mr-1`}>Legend:</p>
        {[
          { label: "Available", dot: "bg-gray-300" },
          { label: "Pending",   dot: "bg-[#E5A800]" },
          { label: "Confirmed", dot: "bg-green-500" },
          { label: "Cancelled", dot: "bg-red-400" },
          { label: "Walk-in",   dot: "bg-[#8B4513]" },
        ].map(({ label, dot }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
            <span className={`text-xs ${t.subtext}`}>{label}</span>
          </div>
        ))}
        <p className={`ml-auto text-xs ${t.subtext} hidden sm:block`}>
          Click empty slot → Reserve walk-in · Click walk-in → Edit
        </p>
      </div>

      {/* Calendar Grid */}
      <div className={`${t.card} rounded-2xl shadow border ${t.border} overflow-auto`}>
        <table className="w-full text-sm table-fixed">

          {/* Day Headers */}
          <thead className={`sticky top-0 ${t.card} z-10 border-b ${t.border}`}>
            <tr>
              <th className={`w-20 px-3 py-3 text-left text-xs uppercase ${t.subtext}`}>Time</th>
              {days.map((d) => {
                const dayConfig = workingHours[d.name];
                const isOpen    = dayConfig?.enabled;
                return (
                  <th key={d.iso} className="px-2 py-3 text-center min-w-[130px]">
                    <p className={`text-[10px] uppercase tracking-wide ${t.subtext}`}>{d.short}</p>
                    <p className={`text-lg font-bold ${d.full === today ? "text-[#E5A800]" : t.text}`}>
                      {d.date}
                    </p>
                    {d.full === today && (
                      <span className="text-[9px] bg-[#E5A800] text-black px-2 py-0.5 rounded-full font-semibold">TODAY</span>
                    )}
                    <span className={`text-[9px] ${t.subtext} block mt-0.5`}>
                      {isOpen
                        ? `${fmt24to12(dayConfig.start)} – ${fmt24to12(dayConfig.end)}`
                        : "Closed"}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Time Rows */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <Loader2 size={24} className="animate-spin mx-auto text-[#E5A800]" />
                  <p className={`text-sm mt-2 ${t.subtext}`}>Loading schedule…</p>
                </td>
              </tr>
            ) : allTimes.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <p className={`text-sm ${t.subtext}`}>
                    No working hours configured.{" "}
                    <span
                      onClick={() => window.location.href = "/gn/settings?tab=hours"}
                      className="text-[#8B4513] font-semibold cursor-pointer hover:underline"
                    >
                      Set them in Settings →
                    </span>
                  </p>
                </td>
              </tr>
            ) : (
              allTimes.map((time, rowIdx) => (
                <tr key={time} className={rowIdx % 2 !== 0 ? (theme === "dark" ? "bg-white/5" : "bg-gray-50/50") : ""}>
                  <td className={`px-3 py-1 text-xs font-medium whitespace-nowrap align-top pt-2.5 ${t.subtext}`}>
                    {fmt24to12(time)}
                  </td>

                  {days.map((d) => {
                    const isEnabled   = workingHours[d.name]?.enabled;
                    const hasThisSlot = getSlotsForDay(d.name).includes(time);

                    if (!isEnabled || !hasThisSlot) {
                      return (
                        <td
                          key={d.iso}
                          className={`px-1.5 py-1 align-top ${!isEnabled ? (theme === "dark" ? "bg-gray-800/40" : "bg-gray-100/60") : ""}`}
                        >
                          {!isEnabled && (
                            <div className="h-8 flex items-center justify-center">
                              <span className={`text-[9px] ${t.subtext} opacity-40`}>—</span>
                            </div>
                          )}
                        </td>
                      );
                    }

                    const appt       = getAppointmentAt(d.iso, time);
                    const walkInData = getWalkInData(d.iso, time);

                    return (
                      <td key={d.iso} className="px-1.5 py-1 align-top">

                        {/* Appointment slot */}
                        {appt && (
                          <div
                            onClick={() => setModal({ iso: d.iso, time, appt })}
                            className={`rounded-lg px-2.5 py-1.5 cursor-pointer hover:brightness-95 transition ${SLOT_CARD[appt.status] || "bg-gray-50 border-l-4 border-gray-300"}`}
                          >
                            <p className="text-[9px] font-bold uppercase tracking-wide opacity-60 mb-0.5">{appt.status}</p>
                            <p className="text-xs font-semibold leading-tight truncate">{appt.fullName}</p>
                            <p className="text-[10px] opacity-60 truncate">{appt.service}</p>
                          </div>
                        )}

                        {/* Walk-in slot — click to edit */}
                        {!appt && walkInData && (
                          <div
                            onClick={() => setWalkInModal({ iso: d.iso, time, walkInData })}
                            className="rounded-lg px-2.5 py-1.5 bg-[#F5DEB3] border-l-4 border-[#8B4513] cursor-pointer hover:brightness-95 transition group relative"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-[9px] font-bold text-[#8B4513] uppercase mb-0.5">Walk-in</p>
                              <Pencil size={9} className="text-[#8B4513] opacity-0 group-hover:opacity-60 transition" />
                            </div>
                            {walkInData.visitorName && (
                              <p className="text-[10px] font-semibold text-[#6A2301] leading-tight truncate">
                                {walkInData.visitorName}
                              </p>
                            )}
                            <p className="text-[10px] text-[#6A2301] opacity-70 truncate">
                              {walkInData.purpose || "Walk-in"}
                            </p>
                          </div>
                        )}

                        {/* Available slot */}
                        {!appt && !walkInData && (
                          <div
                            onClick={() => setWalkInModal({ iso: d.iso, time, walkInData: null })}
                            className={`h-9 rounded-lg border border-dashed ${t.border} hover:border-[#8B4513] hover:bg-[#F5DEB3]/20 transition cursor-pointer flex items-center justify-center group`}
                          >
                            <Plus size={10} className="opacity-0 group-hover:opacity-40 text-[#8B4513]" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className={`px-5 py-3 border-t ${t.border}`}>
          <p className={`text-xs ${t.subtext}`}>
            ⓘ Walk-in slots are reserved for in-person visits and won't appear in online booking.
            Adjust working hours in <span className="font-semibold text-[#8B4513]">Settings → Weekly Hours</span>.
          </p>
        </div>
      </div>

      {/* Walk-in Editor Modal */}
      {walkInModal && (
        <WalkInModal
          modal={walkInModal}
          onClose={() => setWalkInModal(null)}
          onSave={saveWalkIn}
          onRemove={removeWalkIn}
          theme={theme}
        />
      )}

      {/* Appointment Detail Modal */}
      {modal?.appt && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
          <div className={`${t.card} rounded-2xl shadow-2xl p-6 w-full max-w-sm pointer-events-auto`}>

            <div className="flex items-start justify-between mb-4">
              <div>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${STATUS_BADGE[modal.appt.status] || "bg-gray-100 text-gray-500"}`}>
                  {modal.appt.status}
                </span>
                <h2 className={`text-base font-bold mt-2 ${t.text}`}>{modal.appt.fullName}</h2>
              </div>
              <button onClick={() => setModal(null)} className={`${t.subtext} hover:text-gray-600 mt-1`}>
                <XCircle size={20} />
              </button>
            </div>

            <div className={`space-y-2 text-sm ${t.subtext} mb-5`}>
              {[
                ["NIC",     modal.appt.nic],
                ["Service", modal.appt.service],
                ["Date",    modal.iso],
                ["Time",    fmt24to12(modal.time)],
                ["Phone",   modal.appt.phone || modal.appt.mobile],
              ].filter(([, v]) => v).map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span>{label}</span>
                  <span className={`font-semibold ${t.text}`}>{val}</span>
                </div>
              ))}
              {modal.appt.notes && (
                <div className={`mt-2 p-2.5 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"} text-xs italic`}>
                  "{modal.appt.notes}"
                </div>
              )}
            </div>

            {modal.appt.status === "Pending" && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleCancel(modal.appt.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-600 font-semibold py-2 rounded-xl hover:bg-red-50 transition text-sm"
                >
                  <XCircle size={15} /> Cancel
                </button>
                <button
                  onClick={() => handleConfirm(modal.appt)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-xl transition text-sm"
                >
                  <CheckCircle size={15} /> Confirm
                </button>
              </div>
            )}
            {modal.appt.status === "Confirmed" && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleCancel(modal.appt.id)}
                  className="flex-1 border border-red-200 text-red-600 font-semibold py-2 rounded-xl hover:bg-red-50 transition text-sm"
                >
                  Cancel Appointment
                </button>
                <button
                  onClick={() => setModal(null)}
                  className={`flex-1 border ${t.border} ${t.subtext} font-semibold py-2 rounded-xl hover:bg-gray-50 transition text-sm`}
                >
                  Close
                </button>
              </div>
            )}
            {modal.appt.status === "Cancelled" && (
              <button
                onClick={() => setModal(null)}
                className={`w-full border ${t.border} ${t.subtext} font-semibold py-2 rounded-xl hover:bg-gray-50 transition text-sm`}
              >
                Close
              </button>
            )}

          </div>
        </div>
      )}

    </GNLayout>
  );
};

export default GNSchedule;