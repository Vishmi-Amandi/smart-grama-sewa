import { useState, useEffect } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { Bell, Palette, Shield, Clock, Loader2 } from "lucide-react";
import { auth, db } from "../../firebase";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Toggle = ({ value, onChange }) => (
  <div
    onClick={() => onChange(!value)}
    className={`w-11 h-6 rounded-full cursor-pointer transition-colors flex items-center px-1
      ${value ? "bg-[#E5A800]" : "bg-gray-300"}`}
  >
    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform
      ${value ? "translate-x-5" : "translate-x-0"}`}
    />
  </div>
);

const GNSettings = ({ gnStatus, theme, setTheme, fontSize, setFontSize }) => {
  const { t, i18n } = useTranslation();
  const tTheme = getThemeClasses(theme);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [savingAppearance, setSavingAppearance] = useState(false);

  const activeTab = searchParams.get("tab") || "notification";

  const [channels, setChannels] = useState({ email: true, sms: false, push: true });
  const [types, setTypes] = useState({ appointments: true, system: false, citizen: true });
  const [delivery, setDelivery] = useState("hold");
  const [language, setLanguage] = useState(i18n.language || "en");

  const tabs = [
    { key: "notification", label: t("tab_notification"), icon: <Bell size={14} /> },
    { key: "appearance",   label: t("tab_appearance"),   icon: <Palette size={14} /> },
    { key: "security",     label: t("tab_security"),     icon: <Shield size={14} /> },
    { key: "hours",        label: t("tab_hours"),        icon: <Clock size={14} /> },
  ];

  const [currentPassword,  setCurrentPassword]  = useState("");
  const [newPassword,      setNewPassword]      = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [passwordError,    setPasswordError]    = useState("");
  const [passwordSuccess,  setPasswordSuccess]  = useState("");
  const [passwordLoading,  setPasswordLoading]  = useState(false);

  const [workingHours, setWorkingHours] = useState({
    Monday:    { enabled: true,  start: "08:00", end: "17:00", lunch: "12:00" },
    Tuesday:   { enabled: true,  start: "08:00", end: "17:00", lunch: "12:00" },
    Wednesday: { enabled: true,  start: "08:00", end: "17:00", lunch: "12:00" },
    Thursday:  { enabled: true,  start: "08:00", end: "17:00", lunch: "12:00" },
    Friday:    { enabled: true,  start: "08:00", end: "17:00", lunch: "12:00" },
    Saturday:  { enabled: false, start: "09:00", end: "13:00", lunch: "12:00" },
    Sunday:    { enabled: false, start: "09:00", end: "13:00", lunch: "12:00" },
  });
  const [slotDuration,      setSlotDuration]      = useState("30");
  const [breakBetweenSlots, setBreakBetweenSlots] = useState("5");
  const [maxAppointments,   setMaxAppointments]   = useState("12");
  const [hoursLoading,      setHoursLoading]      = useState(false);
  const [hoursSuccess,      setHoursSuccess]      = useState("");
  const [hoursError,        setHoursError]        = useState("");

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword)                         { setPasswordError(t("err_current_password_required")); return; }
    if (!newPassword)                             { setPasswordError(t("err_new_password_required")); return; }
    if (newPassword.length < 8)                   { setPasswordError(t("err_password_min_length")); return; }
    if (newPassword !== confirmPassword)          { setPasswordError(t("err_passwords_dont_match")); return; }

    setPasswordLoading(true);
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      await updateDoc(doc(db, "gn_officers", user.uid), { passwordChangedAt: serverTimestamp() });
      setPasswordSuccess(t("password_changed_success"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      switch (err.code) {
        case "auth/wrong-password":    setPasswordError(t("err_wrong_password")); break;
        case "auth/weak-password":     setPasswordError(t("err_weak_password")); break;
        case "auth/too-many-requests": setPasswordError(t("err_too_many_attempts")); break;
        default:                       setPasswordError(t("err_password_change_failed"));
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    const fetchWorkingHours = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const snap = await getDoc(doc(db, "gn_officers", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.workingHours && typeof data.workingHours === "object") {
            const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
            const isValid = days.some((d) => d in data.workingHours);
            if (isValid) {
              const normalized = {};
              days.forEach((day) => {
                normalized[day] = {
                  enabled: data.workingHours[day]?.enabled ?? (day !== "Saturday" && day !== "Sunday"),
                  start:   data.workingHours[day]?.start   ?? "08:00",
                  end:     data.workingHours[day]?.end     ?? "17:00",
                  lunch:   data.workingHours[day]?.lunch   ?? "12:00",
                };
              });
              setWorkingHours(normalized);
            }
          }
          if (data.slotDuration)      setSlotDuration(data.slotDuration);
          if (data.breakBetweenSlots) setBreakBetweenSlots(data.breakBetweenSlots);
          if (data.maxAppointments)   setMaxAppointments(data.maxAppointments);
        }
      } catch (err) {
        console.error("Fetch hours error:", err);
      }
    };
    fetchWorkingHours();
  }, []);

  const handleApplyAppearance = async () => {
    setSavingAppearance(true);
    try {
      // Apply theme via parent's setTheme
      setTheme(theme); // already set, but just for consistency
      // Apply font size via parent's setFontSize
      setFontSize(fontSize);
      // Apply language via i18n
      await i18n.changeLanguage(language);
      // Optionally persist to backend if needed
      // For now just simulate a small delay
      await new Promise((res) => setTimeout(res, 300));
    } finally {
      setSavingAppearance(false);
    }
  };

  const handleSaveHours = async () => {
    setHoursLoading(true);
    setHoursSuccess("");
    setHoursError("");
    try {
      const user = auth.currentUser;
      const hoursToSave = {};
      Object.entries(workingHours).forEach(([day, val]) => {
        hoursToSave[day] = { enabled: val.enabled, start: val.start, end: val.end, lunch: val.lunch };
      });
      await updateDoc(doc(db, "gn_officers", user.uid), {
        workingHours:      hoursToSave,
        slotDuration,
        breakBetweenSlots,
        maxAppointments,
        hoursUpdatedAt:    serverTimestamp(),
      });
      setHoursSuccess(t("hours_saved_success"));
    } catch (err) {
      setHoursError(t("hours_save_error"));
      console.error(err);
    } finally {
      setHoursLoading(false);
    }
  };

  // Translate day names for display
  const getDayLabel = (day) => {
    const map = {
      Monday: t("day_monday"),
      Tuesday: t("day_tuesday"),
      Wednesday: t("day_wednesday"),
      Thursday: t("day_thursday"),
      Friday: t("day_friday"),
      Saturday: t("day_saturday"),
      Sunday: t("day_sunday"),
    };
    return map[day] || day;
  };

  // Map language display names
  const languageOptions = [
    { value: "en", label: t("lang_en") },
    { value: "si", label: t("lang_si") },
    { value: "ta", label: t("lang_ta") },
  ];

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      <h1 className="text-xl sm:text-2xl font-bold text-[#8B4513] mb-4 text-center sm:text-left">
        {t("settings_title")}
      </h1>

      {/* Tabs */}
      <div className={`flex flex-wrap gap-2 sm:gap-6 border-b ${tTheme.border} mb-6`}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => navigate(`/gn-settings?tab=${tab.key}`, { replace: true })}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1 sm:gap-2 whitespace-nowrap
              ${activeTab === tab.key
                ? "border-[#8B4513] text-[#8B4513]"
                : `border-transparent ${tTheme.subtext} hover:text-gray-600`}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Notification Tab ── */}
      {activeTab === "notification" && (
        <div className="space-y-4 sm:space-y-6">
          <h2 className={`text-lg sm:text-xl font-bold text-left ${tTheme.text}`}>
            {t("notification_title")}
          </h2>

          <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-6`}>
            <p className={`text-sm font-semibold flex items-center gap-2 mb-1 text-left ${tTheme.text}`}>
              🔔 {t("notification_channels")}
            </p>
            <p className={`text-[10px] sm:text-xs mb-4 text-left ${tTheme.subtext}`}>
              {t("notification_channels_desc")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {[
                { key: "email", label: t("channel_email"), sub: t("channel_email_sub"), icon: "📧" },
                { key: "sms",   label: t("channel_sms"),   sub: t("channel_sms_sub"),   icon: "💬" },
                { key: "push",  label: t("channel_push"),  sub: t("channel_push_sub"),  icon: "🔔" },
              ].map((ch) => (
                <div
                  key={ch.key}
                  onClick={() => setChannels({ ...channels, [ch.key]: !channels[ch.key] })}
                  className={`border-2 rounded-xl p-3 sm:p-4 cursor-pointer transition relative
                    ${channels[ch.key] ? `border-[#E5A800] ${theme === "dark" ? "bg-yellow-900" : "bg-yellow-50"}` : tTheme.border}`}
                >
                  {channels[ch.key] && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-[#E5A800] rounded-full flex items-center justify-center text-xs">✓</span>
                  )}
                  <span className="text-lg sm:text-xl">{ch.icon}</span>
                  <p className={`text-xs sm:text-sm font-semibold mt-2 text-left ${tTheme.text}`}>{ch.label}</p>
                  <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>{ch.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-6`}>
            <p className={`text-sm font-semibold flex items-center gap-2 mb-1 text-left ${tTheme.text}`}>
              🔔 {t("notification_types")}
            </p>
            <p className={`text-[10px] sm:text-xs mb-4 text-left ${tTheme.subtext}`}>
              {t("notification_types_desc")}
            </p>
            <div className="space-y-3 sm:space-y-4">
              {[
                { key: "appointments", icon: "📅", label: t("type_appointments"), sub: t("type_appointments_sub") },
                { key: "system",       icon: "⚙️", label: t("type_system"),       sub: t("type_system_sub") },
                { key: "citizen",      icon: "👤", label: t("type_citizen"),      sub: t("type_citizen_sub") },
              ].map((item) => (
                <div key={item.key} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${tTheme.border} rounded-xl px-3 sm:px-4 py-3`}>
                  <div className="flex items-center gap-3">
                    <span className="text-base sm:text-lg">{item.icon}</span>
                    <div>
                      <p className={`text-xs sm:text-sm font-semibold text-left ${tTheme.text}`}>{item.label}</p>
                      <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>{item.sub}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className={`text-[10px] sm:text-xs uppercase ${tTheme.subtext}`}>{t("status_label")}</span>
                    <Toggle value={types[item.key]} onChange={(v) => setTypes({ ...types, [item.key]: v })} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-6`}>
            <p className={`text-sm font-semibold flex items-center gap-2 mb-1 text-left ${tTheme.text}`}>
              🌙 {t("quiet_hours")}
            </p>
            <p className={`text-[10px] sm:text-xs mb-4 text-left ${tTheme.subtext}`}>
              {t("quiet_hours_desc")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <p className={`text-[10px] sm:text-xs mb-2 text-left ${tTheme.subtext}`}>{t("quiet_hours_range")}</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <input type="time" defaultValue="22:00"
                    className={`w-full sm:w-auto border ${tTheme.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`} />
                  <span className={`text-[10px] sm:text-xs ${tTheme.subtext}`}>{t("to_label")}</span>
                  <input type="time" defaultValue="07:00"
                    className={`w-full sm:w-auto border ${tTheme.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`} />
                </div>
                <p className={`text-[10px] sm:text-xs mt-3 text-left ${tTheme.subtext}`}>
                  ⓘ {t("quiet_hours_note")}
                </p>
              </div>
              <div>
                <p className={`text-[10px] sm:text-xs mb-2 text-left ${tTheme.subtext}`}>{t("delivery_preference")}</p>
                <div className="space-y-3">
                  {[
                    { key: "hold",    label: t("delivery_hold"),    sub: t("delivery_hold_sub") },
                    { key: "discard", label: t("delivery_discard"), sub: t("delivery_discard_sub") },
                  ].map((item) => (
                    <div
                      key={item.key}
                      onClick={() => setDelivery(item.key)}
                      className={`flex items-start gap-3 border-2 rounded-xl px-3 sm:px-4 py-3 cursor-pointer transition
                        ${delivery === item.key ? `border-[#E5A800] ${theme === "dark" ? "bg-yellow-900" : "bg-yellow-50"}` : tTheme.border}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0
                        ${delivery === item.key ? "border-[#E5A800] bg-[#E5A800]" : "border-gray-300"}`} />
                      <div>
                        <p className={`text-xs sm:text-sm font-semibold text-left ${tTheme.text}`}>{item.label}</p>
                        <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4">
            <button className={`w-full sm:w-auto font-semibold px-5 py-2 rounded-xl transition text-center ${tTheme.text} ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}>
              {t("reset_defaults")}
            </button>
            <button
              onClick={handleApplyAppearance}
              disabled={savingAppearance}
              className="w-full sm:w-auto bg-[#E5A800] hover:bg-[#cc9600] disabled:opacity-60 text-black font-semibold px-6 py-2 rounded-xl transition text-center flex items-center justify-center gap-2"
            >
              {savingAppearance ? (
                <><Loader2 size={15} className="animate-spin" /> {t("applying")}</>
              ) : (
                t("apply_changes")
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Appearance Tab ── */}
      {activeTab === "appearance" && (
        <div className="space-y-4 sm:space-y-6">
          <h2 className={`text-lg sm:text-xl font-bold text-left ${tTheme.text}`}>
            {t("appearance_title")}
          </h2>

          <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-6`}>
            <p className={`text-sm font-semibold mb-1 text-left ${tTheme.text}`}>
              🌟 {t("theme_selection")}
            </p>
            <p className={`text-[10px] sm:text-xs mb-4 text-left ${tTheme.subtext}`}>
              {t("theme_selection_desc")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[
                { key: "light", label: t("theme_light"), sub: t("theme_light_sub"), icon: "☀️" },
                { key: "dark",  label: t("theme_dark"),  sub: t("theme_dark_sub"),  icon: "🌙" },
              ].map((item) => (
                <div
                  key={item.key}
                  onClick={() => setTheme(item.key)}
                  className={`border-2 rounded-xl p-3 sm:p-4 cursor-pointer transition relative
                    ${theme === item.key ? `border-[#E5A800] ${theme === "dark" ? "bg-yellow-900" : "bg-yellow-50"}` : tTheme.border}`}
                >
                  {theme === item.key && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-[#E5A800] rounded-full flex items-center justify-center text-xs">✓</span>
                  )}
                  <span className="text-xl sm:text-2xl">{item.icon}</span>
                  <p className={`text-xs sm:text-sm font-semibold mt-2 text-left ${tTheme.text}`}>{item.label}</p>
                  <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>{item.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-6`}>
            <p className={`text-sm font-semibold mb-1 text-left ${tTheme.text}`}>
              🔤 {t("font_size")}
            </p>
            <p className={`text-[10px] sm:text-xs mb-4 text-left ${tTheme.subtext}`}>
              {t("font_size_desc")}
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {[
                { key: "small",  label: t("font_small"),  size: "text-sm"   },
                { key: "medium", label: t("font_medium"), size: "text-base"  },
                { key: "large",  label: t("font_large"),  size: "text-lg"   },
              ].map((f) => (
                <div
                  key={f.key}
                  onClick={() => setFontSize(f.key)}
                  className={`border-2 rounded-xl p-3 sm:p-4 cursor-pointer transition flex flex-col items-center gap-2
                    ${fontSize === f.key ? `border-[#E5A800] ${theme === "dark" ? "bg-yellow-900" : "bg-yellow-50"}` : tTheme.border}`}
                >
                  <span className={`font-semibold ${tTheme.text} ${f.size}`}>A</span>
                  <span className={`text-[10px] sm:text-xs ${tTheme.subtext}`}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-6`}>
            <p className={`text-sm font-semibold mb-1 text-left ${tTheme.text}`}>
              🌐 {t("language_settings")}
            </p>
            <p className={`text-[10px] sm:text-xs mb-4 text-left ${tTheme.subtext}`}>
              {t("language_settings_desc")}
            </p>
            <p className={`text-[10px] sm:text-xs mb-2 text-left ${tTheme.subtext}`}>
              {t("select_language")}
            </p>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={`w-full sm:w-72 border ${tTheme.border} rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`}
            >
              {languageOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleApplyAppearance}
              disabled={savingAppearance}
              className="w-full sm:w-auto bg-[#E5A800] hover:bg-[#cc9600] disabled:opacity-60 text-black font-semibold px-6 py-2 rounded-xl transition text-center flex items-center justify-center gap-2"
            >
              {savingAppearance ? (
                <><Loader2 size={15} className="animate-spin" /> {t("applying")}</>
              ) : (
                t("apply_changes")
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Security Tab ── */}
      {activeTab === "security" && (
        <div className="space-y-4 sm:space-y-6">
          <h2 className={`text-lg sm:text-xl font-bold text-left ${tTheme.text}`}>
            {t("security_title")}
          </h2>

          <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-6`}>
            <p className={`text-sm font-semibold mb-4 flex items-center gap-2 text-left ${tTheme.text}`}>
              🔒 {t("password_management")}
            </p>
            {passwordError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-red-600 text-left">
                ⚠️ {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-green-600 text-left">
                ✅ {passwordSuccess}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className={`text-[10px] sm:text-xs font-semibold mb-1 block text-left ${tTheme.subtext}`}>
                  {t("current_password")}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full border ${tTheme.border} rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`}
                />
              </div>
              <div>
                <label className={`text-[10px] sm:text-xs font-semibold mb-1 block text-left ${tTheme.subtext}`}>
                  {t("new_password")}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full border ${tTheme.border} rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`}
                />
                <p className={`text-[10px] sm:text-xs mt-1 text-left ${tTheme.subtext}`}>
                  {t("new_password_hint")}
                </p>
              </div>
              <div>
                <label className={`text-[10px] sm:text-xs font-semibold mb-1 block text-left ${tTheme.subtext}`}>
                  {t("confirm_password")}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full border ${tTheme.border} rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`}
                />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="w-full sm:w-auto bg-[#E5A800] hover:bg-[#cc9600] disabled:opacity-60 text-black font-semibold px-6 py-2 rounded-xl transition"
              >
                {passwordLoading ? t("changing") : t("change_password_btn")}
              </button>
            </div>
          </div>

          <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-6`}>
            <p className={`text-sm font-semibold mb-4 flex items-center gap-2 text-left ${tTheme.text}`}>
              💻 {t("current_session")}
            </p>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${tTheme.border} rounded-xl px-3 sm:px-4 py-3`}>
              <div className="flex items-center gap-3">
                <span className="text-base sm:text-lg">💻</span>
                <div>
                  <p className={`text-xs sm:text-sm font-semibold text-left ${tTheme.text}`}>
                    {navigator.userAgent.includes("Chrome") ? "Chrome" : t("browser")}
                  </p>
                  <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>
                    {t("current_session_active")}
                  </p>
                </div>
              </div>
              <span className="text-[10px] sm:text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full self-start sm:self-center">
                {t("current_session_badge")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Weekly Hours Tab ── */}
      {activeTab === "hours" && (
        <div className="space-y-4 sm:space-y-6">
          <h2 className={`text-lg sm:text-xl font-bold text-left ${tTheme.text}`}>
            {t("weekly_hours_title")}
          </h2>

          <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-6`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <p className={`text-sm font-semibold text-left ${tTheme.text}`}>
                {t("working_hours_label")}
              </p>
              <button
                onClick={() => {
                  const updated = {};
                  Object.keys(workingHours).forEach((day) => {
                    updated[day] = { ...workingHours[day], start: "08:00", end: "17:00", lunch: "12:00" };
                  });
                  setWorkingHours(updated);
                }}
                className="text-[10px] sm:text-xs text-[#E5A800] font-semibold hover:underline text-left sm:text-right"
              >
                {t("apply_to_all_days")}
              </button>
            </div>

            <div className="space-y-3">
              {Object.entries(workingHours).map(([day, hours]) => (
                <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={hours.enabled}
                      onChange={(e) => setWorkingHours({ ...workingHours, [day]: { ...hours, enabled: e.target.checked } })}
                      className="accent-[#E5A800]"
                    />
                    <span className={`text-[10px] sm:text-xs font-semibold w-24 text-left ${tTheme.text}`}>
                      {getDayLabel(day)}
                    </span>
                  </div>
                  {hours.enabled ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="time"
                        value={hours.start}
                        onChange={(e) => setWorkingHours({ ...workingHours, [day]: { ...hours, start: e.target.value } })}
                        className={`border ${tTheme.border} rounded-lg px-2 py-1 text-xs outline-none focus:border-[#E5A800] ${tTheme.input}`}
                      />
                      <span className={`text-[10px] sm:text-xs ${tTheme.subtext}`}>{t("to_label")}</span>
                      <input
                        type="time"
                        value={hours.end}
                        onChange={(e) => setWorkingHours({ ...workingHours, [day]: { ...hours, end: e.target.value } })}
                        className={`border ${tTheme.border} rounded-lg px-2 py-1 text-xs outline-none focus:border-[#E5A800] ${tTheme.input}`}
                      />
                      <span className={`text-[10px] sm:text-xs ${tTheme.subtext}`}>{t("lunch_label")}</span>
                      <select
                        value={hours.lunch}
                        onChange={(e) => setWorkingHours({ ...workingHours, [day]: { ...hours, lunch: e.target.value } })}
                        className={`border ${tTheme.border} rounded-lg px-2 py-1 text-xs outline-none focus:border-[#E5A800] ${tTheme.input}`}
                      >
                        <option value="12:00">12:00 PM</option>
                        <option value="12:30">12:30 PM</option>
                        <option value="13:00">01:00 PM</option>
                        <option value="13:30">01:30 PM</option>
                      </select>
                    </div>
                  ) : (
                    <span className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>{t("closed_label")}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-6`}>
            <p className={`text-sm font-semibold mb-4 text-left ${tTheme.text}`}>
              {t("appointment_slot_settings")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
              <div>
                <p className={`text-[10px] sm:text-xs mb-1 text-left ${tTheme.subtext}`}>
                  {t("slot_duration")}
                </p>
                <select
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(e.target.value)}
                  className={`w-full border ${tTheme.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`}
                >
                  <option value="10">{t("slot_10")}</option>
                  <option value="15">{t("slot_15")}</option>
                  <option value="30">{t("slot_30")}</option>
                  <option value="45">{t("slot_45")}</option>
                  <option value="60">{t("slot_60")}</option>
                </select>
              </div>
              <div>
                <p className={`text-[10px] sm:text-xs mb-1 text-left ${tTheme.subtext}`}>
                  {t("break_between_slots")}
                </p>
                <select
                  value={breakBetweenSlots}
                  onChange={(e) => setBreakBetweenSlots(e.target.value)}
                  className={`w-full border ${tTheme.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`}
                >
                  <option value="5">{t("break_5")}</option>
                  <option value="10">{t("break_10")}</option>
                  <option value="15">{t("break_15")}</option>
                </select>
              </div>
              <div>
                <p className={`text-[10px] sm:text-xs mb-1 text-left ${tTheme.subtext}`}>
                  {t("max_appointments_per_day")}
                </p>
                <input
                  type="number"
                  value={maxAppointments}
                  onChange={(e) => setMaxAppointments(e.target.value)}
                  className={`w-full border ${tTheme.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`}
                />
              </div>
            </div>
            <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>
              ⓘ {t("slot_calculation_note", {
                slots: Math.floor((8 * 60) / (parseInt(slotDuration) + parseInt(breakBetweenSlots)))
              })}
            </p>
          </div>

          {/* ── Apply Changes row ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
            {hoursSuccess && (
              <p className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                ✅ {hoursSuccess}
              </p>
            )}
            {hoursError && (
              <p className="flex items-center gap-1.5 text-xs text-red-600 font-semibold">
                ⚠️ {hoursError}
              </p>
            )}
            <button
              onClick={handleSaveHours}
              disabled={hoursLoading}
              className="w-full sm:w-auto bg-[#E5A800] hover:bg-[#cc9600] disabled:opacity-60 text-black font-semibold px-6 py-2 rounded-xl transition text-center"
            >
              {hoursLoading ? t("saving_hours") : t("apply_changes")}
            </button>
          </div>
        </div>
      )}

    </GNLayout>
  );
};

export default GNSettings;