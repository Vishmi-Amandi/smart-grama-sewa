import { useState, useEffect, useCallback } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { auth, db } from "../../firebase";
import {
  collection, query, where, getDocs, doc, updateDoc,
  getDoc, setDoc,
} from "firebase/firestore";
import {
  ChevronLeft, ChevronRight, CheckCircle, XCircle,
  Loader2, RefreshCw, Plus, Pencil, Trash2, Calendar, Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

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

// ─── DUTY TYPES (translated later inside the component) ─────────────────────
const DUTY_TYPES = [
  { label: "Meeting",  color: "bg-orange-100 text-orange-700 border-orange-200" },
  { label: "On Field", color: "bg-red-100 text-red-700 border-red-200" },
  { label: "Other",    color: "bg-slate-100 text-slate-700 border-slate-200" },
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

// ─── Walk-in Modal ────────────────────────────────────────────────────────────

const WalkInModal = ({ modal, onClose, onSave, onRemove, theme }) => {
  const { t } = useTranslation();
  const tTheme = getThemeClasses(theme);
  const existing = modal?.walkInData;

  const [visitorName,   setVisitorName]   = useState(existing?.visitorName || "");
  const [purpose,       setPurpose]       = useState(existing?.purpose || "");
  const [customPurpose, setCustomPurpose] = useState(
    existing?.purpose && !WALKIN_PURPOSES.includes(existing.purpose) ? existing.purpose : ""
  );
  const [notes,  setNotes]  = useState(existing?.notes || "");
  const [saving, setSaving] = useState(false);

  const WALKIN_PURPOSES = [
    t('walkin_general'),
    t('walkin_document'),
    t('walkin_certificate'),
    t('walkin_complaint'),
    t('walkin_followup'),
    t('walkin_other'),
  ];

  const isCustom    = purpose === t('walkin_other') || (purpose && !WALKIN_PURPOSES.includes(purpose));
  const finalPurpose = isCustom ? customPurpose : purpose;

  const handleSave = async () => {
    setSaving(true);
    await onSave(modal.iso, modal.time, {
      visitorName: visitorName.trim(),
      purpose: finalPurpose.trim() || t('walkin'),
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
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 bg-black/40">
      <div className={`${tTheme.card} w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6`}>
        <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-4 sm:hidden" />

        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-[#F5DEB3] text-[#8B4513] border border-[#8B4513]/20">
              {t('walkin_slot')}
            </span>
            <h2 className={`text-sm font-bold mt-2 ${tTheme.text}`}>
              {fmt24to12(modal.time)} · {modal.iso}
            </h2>
          </div>
          <button onClick={onClose} className={`${tTheme.subtext} p-1`}>
            <XCircle size={20} />
          </button>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className={`text-[10px] font-semibold mb-1 block ${tTheme.subtext}`}>
              {t('visitor_name')} <span className="font-normal opacity-60">{t('visitor_name_optional')}</span>
            </label>
            <input
              type="text"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder={t('visitor_name_placeholder')}
              className={`w-full border ${tTheme.border} rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`}
            />
          </div>

          <div>
            <label className={`text-[10px] font-semibold mb-1.5 block ${tTheme.subtext}`}>{t('purpose')}</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {WALKIN_PURPOSES.map((p) => (
                <button
                  key={p}
                  onClick={() => setPurpose(p)}
                  className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold transition
                    ${purpose === p
                      ? "bg-[#8B4513] text-white border-[#8B4513]"
                      : `border-gray-300 ${tTheme.subtext}`}`}
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
                placeholder={t('custom_purpose_placeholder')}
                className={`w-full border ${tTheme.border} rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`}
              />
            )}
          </div>

          <div>
            <label className={`text-[10px] font-semibold mb-1 block ${tTheme.subtext}`}>
              {t('notes_optional')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('notes_placeholder')}
              rows={2}
              className={`w-full border ${tTheme.border} rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E5A800] resize-none ${tTheme.input}`}
            />
          </div>
        </div>

        <div className="flex gap-2">
          {existing && (
            <button
              onClick={handleRemove}
              disabled={saving}
              className="flex items-center gap-1.5 border border-red-200 text-red-600 font-semibold px-3 py-2.5 rounded-xl text-sm"
            >
              <Trash2 size={13} /> {t('remove')}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#8B4513] text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-60"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
            {saving ? t('saving') : existing ? t('update_slot') : t('reserve_walkin')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Appointment Detail Modal ─────────────────────────────────────────────────

const AppointmentModal = ({ modal, onConfirm, onCancel, onClose, theme }) => {
  const { t } = useTranslation();
  const tTheme = getThemeClasses(theme);
  const appt = modal.appt;
  const statusLabel = t(`status_${appt?.status?.toLowerCase()}`) || appt?.status;

  const statusBadgeClass = appt?.status === "Confirmed" ? "bg-green-100 text-green-700 border-green-200" :
                           appt?.status === "Pending"   ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                           appt?.status === "Cancelled" ? "bg-red-100 text-red-600 border-red-200" :
                           "bg-gray-100 text-gray-500";

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 bg-black/40">
      <div className={`${tTheme.card} w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6`}>
        <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-4 sm:hidden" />

        <div className="flex items-start justify-between mb-4">
          <div>
            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${statusBadgeClass}`}>
              {statusLabel}
            </span>
            <h2 className={`text-base font-bold mt-2 ${tTheme.text}`}>{appt.fullName}</h2>
          </div>
          <button onClick={onClose} className={`${tTheme.subtext} p-1`}>
            <XCircle size={20} />
          </button>
        </div>

        <div className={`space-y-2.5 text-sm mb-5`}>
          {[
            [t('lbl_nic'), appt.nic],
            [t('lbl_service'), appt.service],
            [t('lbl_date'), modal.iso],
            [t('lbl_time'), fmt24to12(modal.time)],
            [t('lbl_phone'), appt.phone || appt.mobile],
          ].filter(([, v]) => v).map(([label, val]) => (
            <div key={label} className={`flex justify-between items-center py-1 border-b last:border-0 ${tTheme.border}`}>
              <span className={`text-xs ${tTheme.subtext}`}>{label}</span>
              <span className={`text-xs font-semibold ${tTheme.text}`}>{val}</span>
            </div>
          ))}
          {appt.notes && (
            <div className={`mt-2 p-3 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"} text-xs italic ${tTheme.subtext}`}>
              "{appt.notes}"
            </div>
          )}
        </div>

        {appt.status === "Pending" && (
          <div className="flex gap-2">
            <button
              onClick={() => onCancel(appt.id)}
              className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-600 font-semibold py-2.5 rounded-xl text-sm"
            >
              <XCircle size={14} /> {t('btn_cancel')}
            </button>
            <button
              onClick={() => onConfirm(appt)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 text-white font-semibold py-2.5 rounded-xl text-sm"
            >
              <CheckCircle size={14} /> {t('btn_confirm')}
            </button>
          </div>
        )}
        {appt.status === "Confirmed" && (
          <div className="flex gap-2">
            <button
              onClick={() => onCancel(appt.id)}
              className="flex-1 border border-red-200 text-red-600 font-semibold py-2.5 rounded-xl text-sm"
            >
              {t('cancel_appointment')}
            </button>
            <button
              onClick={onClose}
              className={`flex-1 border ${tTheme.border} font-semibold py-2.5 rounded-xl text-sm ${tTheme.subtext}`}
            >
              {t('lbl_close')}
            </button>
          </div>
        )}
        {appt.status === "Cancelled" && (
          <button
            onClick={onClose}
            className={`w-full border ${tTheme.border} font-semibold py-2.5 rounded-xl text-sm ${tTheme.subtext}`}
          >
            {t('lbl_close')}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Duty Block Modal ─────────────────────────────────────────────────────────

const DutyBlockModal = ({ modal, onClose, onSave, onRemove, theme }) => {
  const { t } = useTranslation(); // ✅ useTranslation for i18n
  const tTheme = getThemeClasses(theme); // ✅ rename to avoid conflict
  const existing = modal?.existing;

  const [dutyDate,  setDutyDate]  = useState(modal.iso);
  const [dutyType,  setDutyType]  = useState(existing?.type || "Meeting");
  const [allDay,    setAllDay]    = useState(existing?.allDay ?? true);
  const [startTime, setStartTime] = useState(existing?.startTime || "09:00");
  const [endTime,   setEndTime]   = useState(existing?.endTime || "17:00");
  const [note,      setNote]      = useState(existing?.note || "");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  const dateChanged = dutyDate !== modal.iso;

  // Translated duty types
  const dutyTypes = [
    { label: t('duty_meeting'),  color: "bg-orange-100 text-orange-700 border-orange-200" },
    { label: t('duty_on_field'), color: "bg-red-100 text-red-700 border-red-200" },
    { label: t('duty_other'),    color: "bg-slate-100 text-slate-700 border-slate-200" },
  ];

  const handleSave = async () => {
    if (dutyType === t('duty_other') && !note.trim()) {
      setError(t('duty_other_error'));
      return;
    }
    if (!dutyDate) {
      setError(t('duty_date_error'));
      return;
    }
    setError("");
    setSaving(true);
    if (existing && dateChanged) {
      await onRemove(modal.iso);
    }
    await onSave(dutyDate, {
      type: dutyType,
      allDay,
      startTime: allDay ? null : startTime,
      endTime:   allDay ? null : endTime,
      note: dutyType === t('duty_other') ? note.trim() : "",
    });
    setSaving(false);
    onClose();
  };

  const handleRemove = async () => {
    setSaving(true);
    await onRemove(modal.iso);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 bg-black/40">
      <div className={`${tTheme.card} w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6`}>

        <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-4 sm:hidden" />

        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-[#F5DEB3] text-[#8B4513] border border-[#8B4513]/20">
              {t('duty_block_title')}
            </span>
            <h2 className={`text-sm font-bold mt-2 ${tTheme.text}`}>{dutyDate || t('duty_select_date')}</h2>
          </div>
          <button onClick={onClose} className={`${tTheme.subtext} p-1`}>
            <XCircle size={20} />
          </button>
        </div>

        <div className="space-y-3 mb-5">

          {/* Date picker */}
          <div>
            <label className={`text-[10px] font-semibold mb-1 block ${tTheme.subtext}`}>{t('duty_date_label')}</label>
            <input
              type="date"
              value={dutyDate}
              onChange={(e) => { setDutyDate(e.target.value); setError(""); }}
              className={`w-full border ${tTheme.border} rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`}
            />
          </div>

          {/* Type select */}
          <div>
            <label className={`text-[10px] font-semibold mb-1.5 block ${tTheme.subtext}`}>{t('duty_type_label')}</label>
            <div className="flex flex-wrap gap-1.5">
              {dutyTypes.map(({ label, color }) => (
                <button
                  key={label}
                  onClick={() => setDutyType(label)}
                  className={`text-[11px] px-3 py-1.5 rounded-full border font-semibold transition
                    ${dutyType === label
                      ? "bg-[#8B4513] text-white border-[#8B4513]"
                      : `border-gray-300 ${tTheme.subtext}`}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Other → free text, required */}
          {dutyType === t('duty_other') && (
            <div>
              <label className={`text-[10px] font-semibold mb-1 block ${tTheme.subtext}`}>
                {t('duty_other_label')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => { setNote(e.target.value); setError(""); }}
                placeholder={t('duty_other_placeholder')}
                rows={2}
                className={`w-full border ${tTheme.border} rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E5A800] resize-none ${tTheme.input}`}
              />
            </div>
          )}

          {/* All day toggle */}
          <div className="flex items-center justify-between">
            <label className={`text-xs font-semibold ${tTheme.text}`}>{t('duty_all_day')}</label>
            <button
              onClick={() => setAllDay(!allDay)}
              className={`relative w-11 h-6 rounded-full transition ${allDay ? "bg-[#8B4513]" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${allDay ? "translate-x-5" : ""}`} />
            </button>
          </div>

          {/* Time range, only if not all day */}
          {!allDay && (
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`flex-1 border ${tTheme.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`}
              />
              <span className={`text-xs ${tTheme.subtext}`}>{t('duty_to')}</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`flex-1 border ${tTheme.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`}
              />
            </div>
          )}

          {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
        </div>

        <div className="flex gap-2">
          {existing && (
            <button
              onClick={handleRemove}
              disabled={saving}
              className="flex items-center gap-1.5 border border-red-200 text-red-600 font-semibold px-3 py-2.5 rounded-xl text-sm"
            >
              <Trash2 size={13} /> {t('remove')}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#8B4513] text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-60"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
            {saving ? t('saving') : existing ? t('update_block') : t('add_duty_block')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Mobile Day Slot List ─────────────────────────────────────────────────────

const MobileDayView = ({
  days, activeDayIdx, setActiveDayIdx,
  workingHours, getSlotsForDay, getAppointmentAt, getWalkInData, isWalkIn,
  isSlotDutyBlocked, getDutyBlock, setDutyModal,
  setModal, setWalkInModal, theme, today,
}) => {
  const { t } = useTranslation();
  const tTheme = getThemeClasses(theme);
  const day = days[activeDayIdx];
  const dh  = workingHours[day.name];
  const slots = getSlotsForDay(day.name);

  const getDayShort = (dayName) => {
    const map = {
      'Monday': t('day_mon'), 'Tuesday': t('day_tue'),
      'Wednesday': t('day_wed'), 'Thursday': t('day_thu'),
      'Friday': t('day_fri'), 'Saturday': t('day_sat'),
      'Sunday': t('day_sun')
    };
    return map[dayName] || dayName.slice(0, 3).toUpperCase();
  };

  return (
    <div>
      {/* Day strip — horizontal scroll */}
      <div className={`flex gap-1 mb-4 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4`}>
        {days.map((d, i) => {
          const isToday  = d.full === today;
          const isActive = i === activeDayIdx;
          const open     = workingHours[d.name]?.enabled;
          return (
            <button
              key={d.iso}
              onClick={() => setActiveDayIdx(i)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-2xl transition
                ${isActive
                  ? "bg-[#8B4513] text-white shadow"
                  : isToday
                  ? "bg-[#E5A800]/20 text-[#8B4513]"
                  : `${tTheme.card} ${tTheme.subtext}`}
                ${!open && !isActive ? "opacity-40" : ""}`}
            >
              <span className="text-[9px] font-bold uppercase">{getDayShort(d.name)}</span>
              <span className={`text-lg font-bold leading-tight ${isToday && !isActive ? "text-[#E5A800]" : ""}`}>{d.date}</span>
              {isToday && <span className="text-[8px] font-semibold">{t('today_label')}</span>}
            </button>
          );
        })}
      </div>

      {/* Day header */}
      <div className={`${tTheme.card} rounded-2xl px-4 py-3 mb-3 flex items-center justify-between shadow-sm`}>
        <div>
          <p className={`text-xs font-bold ${tTheme.text}`}>{day.name}, {day.iso}</p>
          <p className={`text-[10px] ${tTheme.subtext}`}>
            {dh?.enabled
              ? `${fmt24to12(dh.start)} – ${fmt24to12(dh.end)} · Lunch ${fmt24to12(dh.lunch)}`
              : t('closed_today')}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveDayIdx(Math.max(0, activeDayIdx - 1))}
            disabled={activeDayIdx === 0}
            className={`p-1.5 rounded-lg border ${tTheme.border} disabled:opacity-30`}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setActiveDayIdx(Math.min(6, activeDayIdx + 1))}
            disabled={activeDayIdx === 6}
            className={`p-1.5 rounded-lg border ${tTheme.border} disabled:opacity-30`}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Slot list */}
      {!dh?.enabled ? (
        <div className={`${tTheme.card} rounded-2xl p-8 text-center shadow-sm`}>
          <p className="text-3xl mb-2">🔒</p>
          <p className={`text-sm font-semibold ${tTheme.subtext}`}>{t('closed')}</p>
          <p className={`text-xs mt-1 ${tTheme.subtext}`}>{t('no_working_hours_for_day', { day: day.name })}</p>
        </div>
      ) : slots.length === 0 ? (
        <div className={`${tTheme.card} rounded-2xl p-8 text-center shadow-sm`}>
          <p className={`text-sm ${tTheme.subtext}`}>{t('no_slots_configured')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {slots.map((time) => {
            const appt       = getAppointmentAt(day.iso, time);
            const walkInData = getWalkInData(day.iso, time);

            if (appt) {
              const statusLabel = t(`status_${appt.status?.toLowerCase()}`) || appt.status;
              const statusBadgeClass = appt.status === "Confirmed" ? "bg-green-100 text-green-700 border-green-200" :
                                       appt.status === "Pending"   ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                                       appt.status === "Cancelled" ? "bg-red-100 text-red-600 border-red-200" :
                                       "";
              return (
                <div
                  key={time}
                  onClick={() => setModal({ iso: day.iso, time, appt })}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 cursor-pointer shadow-sm active:brightness-95 ${SLOT_CARD[appt.status] || "bg-gray-50 border-l-4 border-gray-300"}`}
                >
                  <div className="flex-shrink-0 w-14">
                    <p className={`text-[10px] font-bold text-gray-500`}>{fmt24to12(time)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{appt.fullName}</p>
                    <p className="text-[10px] opacity-60 truncate">{appt.service}</p>
                  </div>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border flex-shrink-0 ${statusBadgeClass}`}>
                    {statusLabel}
                  </span>
                </div>
              );
            }

            if (isSlotDutyBlocked(day.iso, time)) {
              const dutyBlock = getDutyBlock(day.iso);
              return (
                <div
                  key={time}
                  onClick={() => setDutyModal({ iso: day.iso, existing: dutyBlock })}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 cursor-pointer shadow-sm bg-gray-100 border-l-4 border-gray-400 active:brightness-95"
                >
                  <div className="flex-shrink-0 w-14">
                    <p className="text-[10px] font-bold text-gray-400">{fmt24to12(time)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">{dutyBlock?.type || "Blocked"}</p>
                    {dutyBlock?.type === t('duty_other') && dutyBlock?.note && (
                      <p className="text-[10px] text-gray-400 truncate">{dutyBlock.note}</p>
                    )}
                  </div>
                  <Pencil size={13} className="text-gray-400 opacity-50 flex-shrink-0" />
                </div>
              );
            }

            if (walkInData) {
              return (
                <div
                  key={time}
                  onClick={() => setWalkInModal({ iso: day.iso, time, walkInData })}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 cursor-pointer shadow-sm bg-[#F5DEB3] border-l-4 border-[#8B4513] active:brightness-95"
                >
                  <div className="flex-shrink-0 w-14">
                    <p className="text-[10px] font-bold text-[#8B4513]">{fmt24to12(time)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-[#8B4513] uppercase">{t('walkin')}</p>
                    {walkInData.visitorName && (
                      <p className="text-xs font-semibold text-[#6A2301] truncate">{walkInData.visitorName}</p>
                    )}
                    <p className="text-[10px] text-[#6A2301] opacity-70 truncate">{walkInData.purpose || t('walkin')}</p>
                  </div>
                  <Pencil size={13} className="text-[#8B4513] opacity-50 flex-shrink-0" />
                </div>
              );
            }

            return (
              <div
                key={time}
                onClick={() => setWalkInModal({ iso: day.iso, time, walkInData: null })}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 cursor-pointer border border-dashed ${tTheme.border} hover:border-[#8B4513] hover:bg-[#F5DEB3]/20 active:bg-[#F5DEB3]/30 transition`}
              >
                <div className="flex-shrink-0 w-14">
                  <p className={`text-[10px] ${tTheme.subtext}`}>{fmt24to12(time)}</p>
                </div>
                <div className="flex-1">
                  <p className={`text-xs ${tTheme.subtext} opacity-50`}>{t('available_slot')}</p>
                </div>
                <Plus size={13} className="text-[#8B4513] opacity-30 flex-shrink-0" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const GNSchedule = ({ gnStatus, theme }) => {
  const { t, i18n } = useTranslation();
  const tTheme = getThemeClasses(theme);
  const navigate = useNavigate();

  const [weekStart,     setWeekStart]     = useState(getMonday(new Date()));
  const [workingHours,  setWorkingHours]  = useState(DEFAULT_WORKING_HOURS);
  const [slotDuration,  setSlotDuration]  = useState(30);
  const [breakBetween,  setBreakBetween]  = useState(5);
  const [gnUid,         setGnUid]         = useState("");
  const [gnDivision,    setGnDivision]    = useState("");
  const [slotOverrides, setSlotOverrides] = useState({});
  const [appointments,  setAppointments]  = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [modal,         setModal]         = useState(null);
  const [walkInModal,   setWalkInModal]   = useState(null);
  const [dutyBlocks,    setDutyBlocks]    = useState({});
  const [dutyModal,     setDutyModal]     = useState(null);

  // Mobile: which day is selected (0 = Monday … 6 = Sunday)
  const todayDayIdx = (() => {
    const js = new Date().getDay(); // 0=Sun
    return js === 0 ? 6 : js - 1;
  })();
  const [activeDayIdx, setActiveDayIdx] = useState(todayDayIdx);

  const days  = getWeekDays(weekStart);
  const today = new Date().toDateString();

  const getTranslatedDay = (dayName) => {
    const map = {
      'Monday': t('day_monday'), 'Tuesday': t('day_tuesday'),
      'Wednesday': t('day_wednesday'), 'Thursday': t('day_thursday'),
      'Friday': t('day_friday'), 'Saturday': t('day_saturday'),
      'Sunday': t('day_sunday')
    };
    return map[dayName] || dayName;
  };

  // ── Load officer profile ──────────────────────────────────────────────────────
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

  // ── Fetch appointments + overrides + duty blocks ─────────────────────────────
  const fetchWeekData = useCallback(async () => {
    if (!gnUid) return;
    setLoading(true);
    try {
      const overrideSnap = await getDoc(doc(db, "gn_schedule", gnUid));
      if (overrideSnap.exists()) {
        setSlotOverrides(overrideSnap.data().overrides || {});
        setDutyBlocks(overrideSnap.data().dutyBlocks || {});
      }

      const officerSnap = await getDoc(doc(db, "gn_officers", gnUid));
      if (!officerSnap.exists()) return;
      const division = officerSnap.data().gnDiv || "";
      if (!division) return;
      setGnDivision(division);

      const q    = query(collection(db, "appointments"), where("gnDiv", "==", division));
      const snap = await getDocs(q);
      setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [gnUid, weekStart]);

  useEffect(() => { if (gnUid) fetchWeekData(); }, [fetchWeekData]);

  // ── Slot helpers ──────────────────────────────────────────────────────────────
  const getSlotsForDay = (dayName) => {
    const dh = workingHours[dayName];
    if (!dh?.enabled) return [];
    return buildDaySlots(dh.start, dh.end, dh.lunch, slotDuration, breakBetween);
  };

  const getAppointmentAt = (iso, time) =>
    appointments.find((a) => {
      if (a.date !== iso) return false;
      if (a.time === time || a.slotTime === time) return true;
      if (a.slot) {
        const [h, m] = time.split(":").map(Number);
        const ampm = h >= 12 ? "PM" : "AM";
        const h12p = `${pad(h % 12 || 12)}:${pad(m)} ${ampm}`;
        const h12u = `${h % 12 || 12}:${pad(m)} ${ampm}`;
        if (a.slot === h12p || a.slot === h12u) return true;
      }
      return false;
    });

  const getWalkInData = (iso, time) => {
    const val = slotOverrides[iso]?.[time];
    if (!val) return null;
    if (val === "walk-in") return { purpose: t('walkin'), visitorName: "", notes: "" };
    if (typeof val === "object") return val;
    return null;
  };

  const isWalkIn = (iso, time) => !!getWalkInData(iso, time);

  const getDutyBlock = (iso) => dutyBlocks[iso] || null;

  const isSlotDutyBlocked = (iso, time) => {
    const block = dutyBlocks[iso];
    if (!block) return false;
    if (block.allDay) return true;
    if (!block.startTime || !block.endTime) return false;
    return time >= block.startTime && time < block.endTime;
  };

  // ── Walk-in save / remove ─────────────────────────────────────────────────────
  const saveWalkIn = async (iso, time, data) => {
    const updated = {
      ...slotOverrides,
      [iso]: { ...(slotOverrides[iso] || {}), [time]: { type: "walk-in", ...data } },
    };
    setSlotOverrides(updated);
    setSaving(true);
    try { await setDoc(doc(db, "gn_schedule", gnUid), { overrides: updated }, { merge: true }); }
    catch (err) { console.error("Walk-in save error:", err); }
    finally { setSaving(false); }
  };

  const removeWalkIn = async (iso, time) => {
    const updated = { ...slotOverrides };
    if (updated[iso]) {
      delete updated[iso][time];
      if (!Object.keys(updated[iso]).length) delete updated[iso];
    }
    setSlotOverrides(updated);
    setSaving(true);
    try { await setDoc(doc(db, "gn_schedule", gnUid), { overrides: updated }, { merge: true }); }
    catch (err) { console.error("Walk-in remove error:", err); }
    finally { setSaving(false); }
  };

  // ── Duty block save / remove ──────────────────────────────────────────────────
  const saveDutyBlock = async (iso, data) => {
    const updated = { ...dutyBlocks, [iso]: data };
    setDutyBlocks(updated);
    setSaving(true);
    try {
      await setDoc(doc(db, "gn_schedule", gnUid), { dutyBlocks: updated }, { merge: true });

      // Auto-update availability status
      let newStatus;
      if (data.allDay) {
        newStatus = "Unavailable";
      } else if (data.type === t('duty_meeting')) {
        newStatus = "In Meeting";
      } else {
        newStatus = "On Field";
      }
      await updateDoc(doc(db, "gn_officers", gnUid), { availability: newStatus });

    } catch (err) {
      console.error("Duty block save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const removeDutyBlock = async (iso) => {
    const updated = { ...dutyBlocks };
    delete updated[iso];
    setDutyBlocks(updated);
    setSaving(true);
    try { await setDoc(doc(db, "gn_schedule", gnUid), { dutyBlocks: updated }, { merge: true }); }
    catch (err) { console.error("Duty block remove error:", err); }
    finally { setSaving(false); }
  };

  // ── Confirm / Cancel ──────────────────────────────────────────────────────────
  const handleConfirm = async (appt) => {
    try {
      await updateDoc(doc(db, "appointments", appt.id), { status: "Confirmed" });
      setAppointments((prev) => prev.map((a) => a.id === appt.id ? { ...a, status: "Confirmed" } : a));
      setModal((m) => m ? { ...m, appt: { ...m.appt, status: "Confirmed" } } : null);
    } catch (err) { console.error("Confirm error:", err); }
  };

  const handleCancel = async (id) => {
    try {
      await updateDoc(doc(db, "appointments", id), { status: "Cancelled" });
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: "Cancelled" } : a));
      setModal((m) => m ? { ...m, appt: { ...m.appt, status: "Cancelled" } } : null);
    } catch (err) { console.error("Cancel error:", err); }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const stats = days.reduce(
    (acc, d) => {
      if (!workingHours[d.name]?.enabled) return acc;
      getSlotsForDay(d.name).forEach((time) => {
        const appt = getAppointmentAt(d.iso, time);
        if (appt?.status === "Confirmed")        acc.confirmed++;
        else if (appt?.status === "Pending")     acc.pending++;
        else if (isSlotDutyBlocked(d.iso, time)) acc.blocked++;
        else if (isWalkIn(d.iso, time))          acc.walkIn++;
        else                                      acc.available++;
      });
      return acc;
    },
    { confirmed: 0, pending: 0, walkIn: 0, available: 0, blocked: 0 }
  );

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); setActiveDayIdx(0); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); setActiveDayIdx(0); };
  const goToday  = () => { setWeekStart(getMonday(new Date())); setActiveDayIdx(todayDayIdx); };

  const allTimeSet = new Set();
  days.forEach((d) => getSlotsForDay(d.name).forEach((tt) => allTimeSet.add(tt)));
  const allTimes = Array.from(allTimeSet).sort();

  const weekDutyEntries = days
    .map((d) => ({ d, block: getDutyBlock(d.iso) }))
    .filter(({ block }) => !!block);

  // Translated duty types for the summary panel
  const dutyTypesMap = {
    'Meeting': t('duty_meeting'),
    'On Field': t('duty_on_field'),
    'Other': t('duty_other'),
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#8B4513]">{t('weekly_schedule')}</h1>
          <p className={`text-[10px] sm:text-xs mt-0.5 ${tTheme.subtext}`}>
            {gnDivision && <span className="font-semibold">{gnDivision} · </span>}
            {slotDuration} {t('min_slots')} · {breakBetween} {t('min_break')}
          </p>
          <div className={`px-5 py-3 border-t ${tTheme.border}`}>
            <p className={`text-xs ${tTheme.subtext}`}>
              ⓘ {t('walkin_info')}{" "}
              <span
                onClick={() => navigate("/gn-settings?tab=hours")}
                className="font-semibold text-[#8B4513] underline underline-offset-2 cursor-pointer"
              >
                {t('settings_weekly_hours')}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {saving && <Loader2 size={12} className="animate-spin text-[#E5A800]" />}
          <button
            onClick={fetchWeekData}
            className={`p-2 rounded-xl border ${tTheme.border} ${tTheme.subtext}`}
            title={t('refresh')}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── Week navigator ── */}
      <div className={`flex items-center justify-between ${tTheme.card} rounded-2xl px-4 py-2.5 mb-4 shadow-sm`}>
        <button onClick={prevWeek} className={`p-1.5 rounded-lg ${tTheme.subtext}`}>
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className={`text-xs font-bold ${tTheme.text}`}>
            {days[0].iso} – {days[6].iso}
          </p>
          <button
            onClick={goToday}
            className="text-[10px] text-[#8B4513] font-semibold underline underline-offset-2"
          >
            {t('jump_to_this_week')}
          </button>
        </div>
        <button onClick={nextWeek} className={`p-1.5 rounded-lg ${tTheme.subtext}`}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ── Duty Blocks (Meeting / On Field / Other) ── */}
      <div className={`${tTheme.card} rounded-2xl shadow-sm border ${tTheme.border} p-4 mb-4`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className={`text-sm font-bold ${tTheme.text}`}>{t('duty_blocks_title')}</p>
            <p className={`text-[10px] ${tTheme.subtext}`}>
              {t('duty_blocks_desc')}
            </p>
          </div>
          <button
            onClick={() => setDutyModal({ iso: days[activeDayIdx]?.iso || days[0].iso, existing: null })}
            className="flex-shrink-0 flex items-center gap-1.5 bg-[#8B4513] text-white text-xs font-semibold px-3 py-2 rounded-xl"
          >
            <Plus size={13} /> {t('add')}
          </button>
        </div>

        {weekDutyEntries.length === 0 ? (
          <p className={`text-xs ${tTheme.subtext} italic`}>{t('no_duty_blocks')}</p>
        ) : (
          <div className="space-y-2">
            {weekDutyEntries.map(({ d, block }) => {
              // Find the translated type label and its color from DUTY_TYPES
              const typeLabel = dutyTypesMap[block.type] || block.type;
              const typeMeta = DUTY_TYPES.find((dt) => dt.label === block.type) || DUTY_TYPES[2];
              return (
                <div
                  key={d.iso}
                  onClick={() => setDutyModal({ iso: d.iso, existing: block })}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer border ${tTheme.border} hover:brightness-95 transition`}
                >
                  <div className="flex-shrink-0 w-16">
                    <p className={`text-[10px] font-bold ${tTheme.text}`}>{d.short}</p>
                    <p className={`text-[10px] ${tTheme.subtext}`}>{d.iso}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border flex-shrink-0 ${typeMeta.color}`}>
                    {typeLabel}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${tTheme.subtext} truncate`}>
                      {block.allDay ? t('full_day') : `${fmt24to12(block.startTime)} – ${fmt24to12(block.endTime)}`}
                      {block.type === 'Other' && block.note ? ` · ${block.note}` : ""}
                    </p>
                  </div>
                  <Pencil size={13} className={`opacity-40 flex-shrink-0 ${tTheme.subtext}`} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Stats — 2×2 on mobile, 4 cols on sm+ ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        {[
          { label: t('available_slots'), count: stats.available, color: "text-gray-500",  dot: "bg-gray-300" },
          { label: t('pending_slots'),   count: stats.pending,   color: "text-[#E5A800]", dot: "bg-[#E5A800]" },
          { label: t('confirmed_slots'), count: stats.confirmed, color: "text-green-600", dot: "bg-green-500" },
          { label: t('walkin_slots'),    count: stats.walkIn,    color: "text-[#8B4513]", dot: "bg-[#8B4513]" },
        ].map(({ label, count, color, dot }) => (
          <div key={label} className={`${tTheme.card} rounded-2xl px-3 py-3 shadow-sm border ${tTheme.border} flex items-center gap-3`}>
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
            <div>
              <p className={`text-xl font-bold leading-none ${color}`}>{count}</p>
              <p className={`text-[10px] ${tTheme.subtext} mt-0.5`}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Mobile: day-by-day view | Desktop: grid table ── */}

      {/* MOBILE */}
      <div className="sm:hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Loader2 size={24} className="animate-spin text-[#E5A800]" />
            <p className={`text-sm ${tTheme.subtext}`}>{t('loading_schedule')}</p>
          </div>
        ) : (
          <MobileDayView
            days={days}
            activeDayIdx={activeDayIdx}
            setActiveDayIdx={setActiveDayIdx}
            workingHours={workingHours}
            getSlotsForDay={getSlotsForDay}
            getAppointmentAt={getAppointmentAt}
            getWalkInData={getWalkInData}
            isWalkIn={isWalkIn}
            isSlotDutyBlocked={isSlotDutyBlocked}
            getDutyBlock={getDutyBlock}
            setDutyModal={setDutyModal}
            setModal={setModal}
            setWalkInModal={setWalkInModal}
            theme={theme}
            today={today}
          />
        )}
      </div>

      {/* DESKTOP */}
      <div className={`hidden sm:block ${tTheme.card} rounded-2xl shadow border ${tTheme.border} overflow-auto`}>

        {/* Legend */}
        <div className={`px-4 py-2.5 flex items-center gap-4 flex-wrap border-b ${tTheme.border}`}>
          <p className={`text-xs font-semibold ${tTheme.subtext}`}>{t('legend')}</p>
          {[
            { label: t('available_slot'), dot: "bg-gray-300" },
            { label: t('pending_slots'),   dot: "bg-[#E5A800]" },
            { label: t('confirmed_slots'), dot: "bg-green-500" },
            { label: t('status_cancelled'), dot: "bg-red-400" },
            { label: t('walkin_slots'),    dot: "bg-[#8B4513]" },
          ].map(({ label, dot }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              <span className={`text-xs ${tTheme.subtext}`}>{label}</span>
            </div>
          ))}
          <p className={`ml-auto text-xs ${tTheme.subtext}`}>
            {t('click_hint')}
          </p>
        </div>

        <table className="w-full text-sm table-fixed">
          <thead className={`sticky top-0 ${tTheme.card} z-10 border-b ${tTheme.border}`}>
            <tr>
              <th className={`w-20 px-3 py-3 text-left text-xs uppercase ${tTheme.subtext}`}>{t('time_col')}</th>
              {days.map((d) => {
                const dc     = workingHours[d.name];
                const isOpen = dc?.enabled;
                const dayLabel = getTranslatedDay(d.name);
                const shortLabel = t(`day_${d.name.toLowerCase().slice(0, 3)}`) || d.short;
                return (
                  <th key={d.iso} className="px-2 py-3 text-center min-w-[130px]">
                    <p className={`text-[10px] uppercase tracking-wide ${tTheme.subtext}`}>{shortLabel}</p>
                    <p className={`text-lg font-bold ${d.full === today ? "text-[#E5A800]" : tTheme.text}`}>{d.date}</p>
                    {d.full === today && (
                      <span className="text-[9px] bg-[#E5A800] text-black px-2 py-0.5 rounded-full font-semibold">{t('today_label')}</span>
                    )}
                    <span className={`text-[9px] ${tTheme.subtext} block mt-0.5`}>
                      {isOpen ? `${fmt24to12(dc.start)} – ${fmt24to12(dc.end)}` : t('closed')}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <Loader2 size={24} className="animate-spin mx-auto text-[#E5A800]" />
                  <p className={`text-sm mt-2 ${tTheme.subtext}`}>{t('loading_schedule')}</p>
                </td>
              </tr>
            ) : allTimes.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <Calendar size={32} className="mx-auto mb-2 opacity-30" />
                  <p className={`text-sm ${tTheme.subtext}`}>
                    {t('no_working_hours')}{" "}
                    <span
                      onClick={() => window.location.href = "/gn-settings?tab=hours"}
                      className="text-[#8B4513] font-semibold cursor-pointer hover:underline"
                    >
                      {t('set_in_settings')}
                    </span>
                  </p>
                </td>
              </tr>
            ) : (
              allTimes.map((time, rowIdx) => (
                <tr key={time} className={rowIdx % 2 !== 0 ? (theme === "dark" ? "bg-white/5" : "bg-gray-50/50") : ""}>
                  <td className={`px-3 py-1 text-xs font-medium whitespace-nowrap align-top pt-2.5 ${tTheme.subtext}`}>
                    {fmt24to12(time)}
                  </td>
                  {days.map((d) => {
                    const isEnabled   = workingHours[d.name]?.enabled;
                    const hasThisSlot = getSlotsForDay(d.name).includes(time);

                    if (!isEnabled || !hasThisSlot) {
                      return (
                        <td key={d.iso} className={`px-1.5 py-1 align-top ${!isEnabled ? (theme === "dark" ? "bg-gray-800/40" : "bg-gray-100/60") : ""}`}>
                          {!isEnabled && (
                            <div className="h-8 flex items-center justify-center">
                              <span className={`text-[9px] ${tTheme.subtext} opacity-40`}>—</span>
                            </div>
                          )}
                        </td>
                      );
                    }

                    const appt       = getAppointmentAt(d.iso, time);
                    const walkInData = getWalkInData(d.iso, time);
                    const dutyBlocked = !appt && isSlotDutyBlocked(d.iso, time);
                    const dutyBlock   = dutyBlocked ? getDutyBlock(d.iso) : null;

                    return (
                      <td key={d.iso} className="px-1.5 py-1 align-top">
                        {appt && (
                          <div
                            onClick={() => setModal({ iso: d.iso, time, appt })}
                            className={`rounded-lg px-2.5 py-1.5 cursor-pointer hover:brightness-95 transition ${SLOT_CARD[appt.status] || "bg-gray-50 border-l-4 border-gray-300"}`}
                          >
                            <p className="text-[9px] font-bold uppercase tracking-wide opacity-60 mb-0.5">
                              {t(`status_${appt.status?.toLowerCase()}`) || appt.status}
                            </p>
                            <p className="text-xs font-semibold leading-tight truncate">{appt.fullName}</p>
                            <p className="text-[10px] opacity-60 truncate">{appt.service}</p>
                          </div>
                        )}
                        {!appt && dutyBlocked && (
                          <div
                            onClick={() => setDutyModal({ iso: d.iso, existing: dutyBlock })}
                            className="h-9 rounded-lg px-2 flex items-center justify-center bg-gray-200/70 border border-gray-300 cursor-pointer hover:brightness-95 transition"
                            title={`${dutyBlock?.type || "Blocked"}${dutyBlock?.note ? " · " + dutyBlock.note : ""}`}
                          >
                            <span className="text-[9px] font-bold uppercase text-gray-500 truncate">
                              {dutyTypesMap[dutyBlock?.type] || "Blocked"}
                            </span>
                          </div>
                        )}
                        {!appt && !dutyBlocked && walkInData && (
                          <div
                            onClick={() => setWalkInModal({ iso: d.iso, time, walkInData })}
                            className="rounded-lg px-2.5 py-1.5 bg-[#F5DEB3] border-l-4 border-[#8B4513] cursor-pointer hover:brightness-95 transition group relative"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-[9px] font-bold text-[#8B4513] uppercase mb-0.5">{t('walkin')}</p>
                              <Pencil size={9} className="text-[#8B4513] opacity-0 group-hover:opacity-60" />
                            </div>
                            {walkInData.visitorName && (
                              <p className="text-[10px] font-semibold text-[#6A2301] leading-tight truncate">{walkInData.visitorName}</p>
                            )}
                            <p className="text-[10px] text-[#6A2301] opacity-70 truncate">{walkInData.purpose || t('walkin')}</p>
                          </div>
                        )}
                        {!appt && !dutyBlocked && !walkInData && (
                          <div
                            onClick={() => setWalkInModal({ iso: d.iso, time, walkInData: null })}
                            className={`h-9 rounded-lg border border-dashed ${tTheme.border} hover:border-[#8B4513] hover:bg-[#F5DEB3]/20 transition cursor-pointer flex items-center justify-center group`}
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
      </div>

      {/* ── Settings link (mobile footer) ── */}
      <div className="sm:hidden mt-4">
        <p className={`text-xs text-center ${tTheme.subtext}`}>
          {t('adjust_hours_in')}{" "}
          <span
            onClick={() => navigate("/gn-settings?tab=hours")}
            className="text-[#8B4513] font-semibold underline underline-offset-2 cursor-pointer"
          >
            {t('settings_weekly_hours')}
          </span>
        </p>
      </div>

      {/* ── Modals ── */}
      {walkInModal && (
        <WalkInModal
          modal={walkInModal}
          onClose={() => setWalkInModal(null)}
          onSave={saveWalkIn}
          onRemove={removeWalkIn}
          theme={theme}
        />
      )}

      {modal?.appt && (
        <AppointmentModal
          modal={modal}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onClose={() => setModal(null)}
          theme={theme}
        />
      )}

      {dutyModal && (
        <DutyBlockModal
          modal={dutyModal}
          onClose={() => setDutyModal(null)}
          onSave={saveDutyBlock}
          onRemove={removeDutyBlock}
          theme={theme}
        />
      )}

    </GNLayout>
  );
};

export default GNSchedule;