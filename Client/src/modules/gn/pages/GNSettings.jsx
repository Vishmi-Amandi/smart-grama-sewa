import { useState, useEffect } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { Bell, Palette, Shield, Clock } from "lucide-react";
import { auth, db } from "../../firebase";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useSearchParams } from "react-router-dom";

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
  const t = getThemeClasses(theme);
  const [searchParams] = useSearchParams();
const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "notification");
  const [channels, setChannels] = useState({ email: true, sms: false, push: true });
  const [types, setTypes] = useState({ appointments: true, system: false, citizen: true });
  const [delivery, setDelivery] = useState("hold");
  const [language, setLanguage] = useState("English");

  const tabs = [
    { key: "notification", label: "Notification", icon: <Bell size={14} /> },
    { key: "appearance", label: "Appearance and Language", icon: <Palette size={14} /> },
    { key: "security", label: "Security", icon: <Shield size={14} /> },
    { key: "hours", label: "Weekly Hours", icon: <Clock size={14} /> },
  ];

const [currentPassword, setCurrentPassword] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [passwordError, setPasswordError] = useState("");
const [passwordSuccess, setPasswordSuccess] = useState("");
const [passwordLoading, setPasswordLoading] = useState(false);

const [workingHours, setWorkingHours] = useState({
  Monday:    { enabled: true,  start: "08:00", end: "17:00", lunch: "12:00" },
  Tuesday:   { enabled: true,  start: "08:00", end: "17:00", lunch: "12:00" },
  Wednesday: { enabled: true,  start: "08:00", end: "17:00", lunch: "12:00" },
  Thursday:  { enabled: true,  start: "08:00", end: "17:00", lunch: "12:00" },
  Friday:    { enabled: true,  start: "08:00", end: "17:00", lunch: "12:00" },
  Saturday:  { enabled: false, start: "09:00", end: "13:00", lunch: "12:00" },
  Sunday:    { enabled: false, start: "09:00", end: "13:00", lunch: "12:00" },
});
const [slotDuration, setSlotDuration] = useState("30");
const [breakBetweenSlots, setBreakBetweenSlots] = useState("5");
const [maxAppointments, setMaxAppointments] = useState("12");
const [hoursLoading, setHoursLoading] = useState(false);
const [hoursSuccess, setHoursSuccess] = useState("");
const [hoursError, setHoursError] = useState("");

const handleChangePassword = async () => {
  setPasswordError("");
  setPasswordSuccess("");

  if (!currentPassword) { setPasswordError("Please enter your current password."); return; }
  if (!newPassword)      { setPasswordError("Please enter a new password."); return; }
  if (newPassword.length < 8) { setPasswordError("Password must be at least 8 characters."); return; }
  if (newPassword !== confirmPassword) { setPasswordError("Passwords don't match."); return; }

  setPasswordLoading(true);
  try {
    const user = auth.currentUser;

    // Re-authenticate first
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);

    // Log to Firestore
    await updateDoc(doc(db, "gn_officers", user.uid), {
      passwordChangedAt: serverTimestamp(),
    });

    setPasswordSuccess("Password changed successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

  } catch (err) {
    switch (err.code) {
      case "auth/wrong-password":     setPasswordError("Current password is incorrect."); break;
      case "auth/weak-password":      setPasswordError("New password is too weak."); break;
      case "auth/too-many-requests":  setPasswordError("Too many attempts. Try again later."); break;
      default:                        setPasswordError("Failed to change password. Try again.");
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

        // ✅ Only use fetched hours if it has day keys (not numeric keys)
        if (data.workingHours && typeof data.workingHours === "object") {
          const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
          const isValid = days.some((d) => d in data.workingHours);
          if (isValid) {
            // ✅ Ensure every day has all required fields with fallback defaults
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

const handleSaveHours = async () => {
  setHoursLoading(true);
  setHoursSuccess("");
  setHoursError("");
  try {
    const user = auth.currentUser;

    // ✅ Convert to plain object to avoid Firestore serialization issues
    const hoursToSave = {};
    Object.entries(workingHours).forEach(([day, val]) => {
      hoursToSave[day] = {
        enabled: val.enabled,
        start:   val.start,
        end:     val.end,
        lunch:   val.lunch,
      };
    });

    await updateDoc(doc(db, "gn_officers", user.uid), {
      workingHours:      hoursToSave,
      slotDuration,
      breakBetweenSlots,
      maxAppointments,
      hoursUpdatedAt:    serverTimestamp(),
    });
    setHoursSuccess("Working hours saved successfully!");
  } catch (err) {
    setHoursError("Failed to save. Please try again.");
    console.error(err);
  } finally {
    setHoursLoading(false);
  }
};

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      {/* Page Title */}
      <h1 className="text-xl sm:text-2xl font-bold text-[#8B4513] mb-4 text-center sm:text-left">Settings</h1>

      {/* Tabs - Responsive */}
      <div className={`flex flex-wrap gap-2 sm:gap-6 border-b ${t.border} mb-6`}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1 sm:gap-2 whitespace-nowrap
              ${activeTab === tab.key
                ? "border-[#8B4513] text-[#8B4513]"
                : `border-transparent ${t.subtext} hover:text-gray-600`
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification Tab */}
      {activeTab === "notification" && (
        <div className="space-y-4 sm:space-y-6">
          <h2 className={`text-lg sm:text-xl font-bold text-left ${t.text}`}>Notification Settings</h2>

          {/* Notification Channels */}
          <div className={`${t.card} rounded-2xl shadow p-4 sm:p-6`}>
            <p className={`text-sm font-semibold flex items-center gap-2 mb-1 text-left ${t.text}`}>
              🔔 Notification Channels
            </p>
            <p className={`text-[10px] sm:text-xs mb-4 text-left ${t.subtext}`}>Select where you want to receive notifications.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {[
                { key: "email", label: "Email", sub: "Detailed logs and updates", icon: "📧" },
                { key: "sms", label: "SMS Text", sub: "Urgent mobile alerts", icon: "💬" },
                { key: "push", label: "Push Notifications", sub: "Real-time desktop alerts", icon: "🔔" },
              ].map((ch) => (
                <div
                  key={ch.key}
                  onClick={() => setChannels({ ...channels, [ch.key]: !channels[ch.key] })}
                  className={`border-2 rounded-xl p-3 sm:p-4 cursor-pointer transition relative
                    ${channels[ch.key] ? `border-[#E5A800] ${theme === "dark" ? "bg-yellow-900" : "bg-yellow-50"}` : t.border}`}
                >
                  {channels[ch.key] && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-[#E5A800] rounded-full flex items-center justify-center text-xs">✓</span>
                  )}
                  <span className="text-lg sm:text-xl">{ch.icon}</span>
                  <p className={`text-xs sm:text-sm font-semibold mt-2 text-left ${t.text}`}>{ch.label}</p>
                  <p className={`text-[10px] sm:text-xs text-left ${t.subtext}`}>{ch.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Notification Types */}
          <div className={`${t.card} rounded-2xl shadow p-4 sm:p-6`}>
            <p className={`text-sm font-semibold flex items-center gap-2 mb-1 text-left ${t.text}`}>
              🔔 Notification Types
            </p>
            <p className={`text-[10px] sm:text-xs mb-4 text-left ${t.subtext}`}>Configure alerts for specific activity categories.</p>
            <div className="space-y-3 sm:space-y-4">
              {[
                { key: "appointments", icon: "📅", label: "Appointments", sub: "New bookings, rescheduling, and cancellations." },
                { key: "system", icon: "⚙️", label: "System Updates", sub: "Maintenance windows and feature releases." },
                { key: "citizen", icon: "👤", label: "Citizen Activity", sub: "Profile updates and document submissions." },
              ].map((item) => (
                <div key={item.key} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${t.border} rounded-xl px-3 sm:px-4 py-3`}>
                  <div className="flex items-center gap-3">
                    <span className="text-base sm:text-lg">{item.icon}</span>
                    <div>
                      <p className={`text-xs sm:text-sm font-semibold text-left ${t.text}`}>{item.label}</p>
                      <p className={`text-[10px] sm:text-xs text-left ${t.subtext}`}>{item.sub}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className={`text-[10px] sm:text-xs uppercase ${t.subtext}`}>Status:</span>
                    <Toggle value={types[item.key]} onChange={(v) => setTypes({ ...types, [item.key]: v })} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quiet Hours */}
          <div className={`${t.card} rounded-2xl shadow p-4 sm:p-6`}>
            <p className={`text-sm font-semibold flex items-center gap-2 mb-1 text-left ${t.text}`}>
              🌙 Quiet Hours
            </p>
            <p className={`text-[10px] sm:text-xs mb-4 text-left ${t.subtext}`}>Set times when you do not want to be disturbed.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

              {/* Time Range */}
              <div>
                <p className={`text-[10px] sm:text-xs mb-2 text-left ${t.subtext}`}>Time Range</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <input type="time" defaultValue="22:00"
                    className={`w-full sm:w-auto border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`} />
                  <span className={`text-[10px] sm:text-xs ${t.subtext}`}>to</span>
                  <input type="time" defaultValue="07:00"
                    className={`w-full sm:w-auto border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`} />
                </div>
                <p className={`text-[10px] sm:text-xs mt-3 text-left ${t.subtext}`}>
                  ⓘ Critical alerts will bypass quiet hours automatically.
                </p>
              </div>

              {/* Delivery Preference */}
              <div>
                <p className={`text-[10px] sm:text-xs mb-2 text-left ${t.subtext}`}>Delivery Preference</p>
                <div className="space-y-3">
                  {[
                    { key: "hold", label: "Hold for later", sub: "Send a summary digest at 07:00 AM" },
                    { key: "discard", label: "Discard notifications", sub: "Do not deliver during these hours" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      onClick={() => setDelivery(item.key)}
                      className={`flex items-start gap-3 border-2 rounded-xl px-3 sm:px-4 py-3 cursor-pointer transition
                        ${delivery === item.key ? `border-[#E5A800] ${theme === "dark" ? "bg-yellow-900" : "bg-yellow-50"}` : t.border}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0
                        ${delivery === item.key ? "border-[#E5A800] bg-[#E5A800]" : "border-gray-300"}`} />
                      <div>
                        <p className={`text-xs sm:text-sm font-semibold text-left ${t.text}`}>{item.label}</p>
                        <p className={`text-[10px] sm:text-xs text-left ${t.subtext}`}>{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4">
            <button className={`w-full sm:w-auto font-semibold px-5 py-2 rounded-xl transition text-center ${t.text} ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}>
              Reset to Defaults
            </button>
            <button className="w-full sm:w-auto bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold px-6 py-2 rounded-xl transition text-center">
              Apply Changes
            </button>
          </div>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === "appearance" && (
        <div className="space-y-4 sm:space-y-6">
          <h2 className={`text-lg sm:text-xl font-bold text-left ${t.text}`}>Appearance and Language Settings</h2>

          {/* Theme Selection */}
          <div className={`${t.card} rounded-2xl shadow p-4 sm:p-6`}>
            <p className={`text-sm font-semibold mb-1 text-left ${t.text}`}>🌟 Theme Selection</p>
            <p className={`text-[10px] sm:text-xs mb-4 text-left ${t.subtext}`}>Select your preferred interface color mode.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[
                { key: "light", label: "Light Mode", sub: "Classic bright theme for daytime use.", icon: "☀️" },
                { key: "dark", label: "Night Mode", sub: "Dark theme to reduce eye strain in low light.", icon: "🌙" },
              ].map((item) => (
                <div
                  key={item.key}
                  onClick={() => setTheme(item.key)}
                  className={`border-2 rounded-xl p-3 sm:p-4 cursor-pointer transition relative
                    ${theme === item.key ? `border-[#E5A800] ${theme === "dark" ? "bg-yellow-900" : "bg-yellow-50"}` : t.border}`}
                >
                  {theme === item.key && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-[#E5A800] rounded-full flex items-center justify-center text-xs">✓</span>
                  )}
                  <span className="text-xl sm:text-2xl">{item.icon}</span>
                  <p className={`text-xs sm:text-sm font-semibold mt-2 text-left ${t.text}`}>{item.label}</p>
                  <p className={`text-[10px] sm:text-xs text-left ${t.subtext}`}>{item.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className={`${t.card} rounded-2xl shadow p-4 sm:p-6`}>
            <p className={`text-sm font-semibold mb-1 text-left ${t.text}`}>🔤 Font Size</p>
            <p className={`text-[10px] sm:text-xs mb-4 text-left ${t.subtext}`}>Adjust text size for better readability.</p>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {[
                { key: "small", label: "Small", size: "text-sm" },
                { key: "medium", label: "Medium", size: "text-base" },
                { key: "large", label: "Large", size: "text-lg" },
              ].map((f) => (
                <div
                  key={f.key}
                  onClick={() => setFontSize(f.key)}
                  className={`border-2 rounded-xl p-3 sm:p-4 cursor-pointer transition flex flex-col items-center gap-2
                    ${fontSize === f.key ? `border-[#E5A800] ${theme === "dark" ? "bg-yellow-900" : "bg-yellow-50"}` : t.border}`}
                >
                  <span className={`font-semibold ${t.text} ${f.size}`}>A</span>
                  <span className={`text-[10px] sm:text-xs ${t.subtext}`}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Language Settings */}
          <div className={`${t.card} rounded-2xl shadow p-4 sm:p-6`}>
            <p className={`text-sm font-semibold mb-1 text-left ${t.text}`}>🌐 Language Settings</p>
            <p className={`text-[10px] sm:text-xs mb-4 text-left ${t.subtext}`}>Choose the primary language for the portal content.</p>
            <p className={`text-[10px] sm:text-xs mb-2 text-left ${t.subtext}`}>Select Language</p>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={`w-full sm:w-72 border ${t.border} rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}
            >
              <option value="English">English</option>
              <option value="සිංහල">සිංහල</option>
              <option value="தமிழ்">தமிழ்</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end">
            <button className="w-full sm:w-auto bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold px-6 py-2 rounded-xl transition text-center">
              Apply Changes
            </button>
          </div>
        </div>
      )}

{/* Security Tab - Responsive */}
{activeTab === "security" && (
  <div className="space-y-4 sm:space-y-6">
    <h2 className={`text-lg sm:text-xl font-bold text-left ${t.text}`}>Security Settings</h2>

    {/* Password Management */}
    <div className={`${t.card} rounded-2xl shadow p-4 sm:p-6`}>
      <p className={`text-sm font-semibold mb-4 flex items-center gap-2 text-left ${t.text}`}>
        🔒 Password Management
      </p>

      {/* Error/Success */}
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
          <label className={`text-[10px] sm:text-xs font-semibold mb-1 block text-left ${t.subtext}`}>Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            className={`w-full border ${t.border} rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}
          />
        </div>
        <div>
          <label className={`text-[10px] sm:text-xs font-semibold mb-1 block text-left ${t.subtext}`}>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            className={`w-full border ${t.border} rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}
          />
          <p className={`text-[10px] sm:text-xs mt-1 text-left ${t.subtext}`}>Must be at least 8 characters.</p>
        </div>
        <div>
          <label className={`text-[10px] sm:text-xs font-semibold mb-1 block text-left ${t.subtext}`}>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className={`w-full border ${t.border} rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}
          />
        </div>
        <button
          onClick={handleChangePassword}
          disabled={passwordLoading}
          className="w-full sm:w-auto bg-[#E5A800] hover:bg-[#cc9600] disabled:opacity-60 text-black font-semibold px-6 py-2 rounded-xl transition">
          {passwordLoading ? "Changing..." : "Change Password"}
        </button>
      </div>
    </div>

    {/* Login Sessions */}
    <div className={`${t.card} rounded-2xl shadow p-4 sm:p-6`}>
      <p className={`text-sm font-semibold mb-4 flex items-center gap-2 text-left ${t.text}`}>
        💻 Current Session
      </p>
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${t.border} rounded-xl px-3 sm:px-4 py-3`}>
        <div className="flex items-center gap-3">
          <span className="text-base sm:text-lg">💻</span>
          <div>
            <p className={`text-xs sm:text-sm font-semibold text-left ${t.text}`}>{navigator.userAgent.includes("Chrome") ? "Chrome" : "Browser"}</p>
            <p className={`text-[10px] sm:text-xs text-left ${t.subtext}`}>Current session • Active now</p>
          </div>
        </div>
        <span className="text-[10px] sm:text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full self-start sm:self-center">
          CURRENT SESSION
        </span>
      </div>
    </div>

  </div>
)}

      {/* Weekly Hours Tab - Responsive */}
{activeTab === "hours" && (
  <div className="space-y-4 sm:space-y-6">
    <h2 className={`text-lg sm:text-xl font-bold text-left ${t.text}`}>Weekly Hours Settings</h2>

    {hoursSuccess && (
      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-green-600 text-left">
        ✅ {hoursSuccess}
      </div>
    )}
    {hoursError && (
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-red-600 text-left">
        ⚠️ {hoursError}
      </div>
    )}

    {/* Regular Working Hours */}
    <div className={`${t.card} rounded-2xl shadow p-4 sm:p-6`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <p className={`text-sm font-semibold text-left ${t.text}`}>Regular Working Hours</p>
        <button
  onClick={() => {
    const updated = {};
    Object.keys(workingHours).forEach((day) => {
      updated[day] = {
        ...workingHours[day],
        start: "08:00",
        end: "17:00",
        lunch: "12:00",
      };
    });
    setWorkingHours(updated);
  }}
  className="text-[10px] sm:text-xs text-[#E5A800] font-semibold hover:underline text-left sm:text-right">
  Apply to all days
</button>
      </div>

      <div className="space-y-3">
        {Object.entries(workingHours).map(([day, hours]) => (
          <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hours.enabled}
                onChange={(e) => setWorkingHours({
                  ...workingHours,
                  [day]: { ...hours, enabled: e.target.checked }
                })}
                className="accent-[#E5A800]"
              />
              <span className={`text-[10px] sm:text-xs font-semibold w-24 text-left ${t.text}`}>{day}</span>
            </div>
            {hours.enabled ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="time"
                  value={hours.start}
                  onChange={(e) => setWorkingHours({
                    ...workingHours,
                    [day]: { ...hours, start: e.target.value }
                  })}
                  className={`border ${t.border} rounded-lg px-2 py-1 text-xs outline-none focus:border-[#E5A800] ${t.input}`}
                />
                <span className={`text-[10px] sm:text-xs ${t.subtext}`}>to</span>
                <input
                  type="time"
                  value={hours.end}
                  onChange={(e) => setWorkingHours({
                    ...workingHours,
                    [day]: { ...hours, end: e.target.value }
                  })}
                  className={`border ${t.border} rounded-lg px-2 py-1 text-xs outline-none focus:border-[#E5A800] ${t.input}`}
                />
                <span className={`text-[10px] sm:text-xs ${t.subtext}`}>Lunch</span>
                <select
                  value={hours.lunch}
                  onChange={(e) => setWorkingHours({
                    ...workingHours,
                    [day]: { ...hours, lunch: e.target.value }
                  })}
                  className={`border ${t.border} rounded-lg px-2 py-1 text-xs outline-none focus:border-[#E5A800] ${t.input}`}
                >
                  <option value="12:00">12:00 PM</option>
                  <option value="12:30">12:30 PM</option>
                  <option value="13:00">01:00 PM</option>
                  <option value="13:30">01:30 PM</option>
                </select>
              </div>
            ) : (
              <span className={`text-[10px] sm:text-xs text-left ${t.subtext}`}>Closed</span>
            )}
          </div>
        ))}
      </div>
    </div>

    {/* Appointment Slot Settings */}
    <div className={`${t.card} rounded-2xl shadow p-4 sm:p-6`}>
      <p className={`text-sm font-semibold mb-4 text-left ${t.text}`}>Appointment Slot Settings</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
        <div>
          <p className={`text-[10px] sm:text-xs mb-1 text-left ${t.subtext}`}>Slot Duration</p>
          <select
            value={slotDuration}
            onChange={(e) => setSlotDuration(e.target.value)}
            className={`w-full border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}
          >
            {/* ✅ 10-minute option added */}
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
          </select>
        </div>
        <div>
          <p className={`text-[10px] sm:text-xs mb-1 text-left ${t.subtext}`}>Break Between Slots</p>
          <select
            value={breakBetweenSlots}
            onChange={(e) => setBreakBetweenSlots(e.target.value)}
            className={`w-full border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
          </select>
        </div>
        <div>
          <p className={`text-[10px] sm:text-xs mb-1 text-left ${t.subtext}`}>Max Appointments/Day</p>
          <input
            type="number"
            value={maxAppointments}
            onChange={(e) => setMaxAppointments(e.target.value)}
            className={`w-full border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}
          />
        </div>
      </div>
      <p className={`text-[10px] sm:text-xs text-left ${t.subtext}`}>
        ⓘ Based on your hours and duration you can host up to {Math.floor((8 * 60) / (parseInt(slotDuration) + parseInt(breakBetweenSlots)))} slots per day.
      </p>
    </div>

    {/* Action Buttons */}
    <div className="flex justify-end">
      <button
        onClick={handleSaveHours}
        disabled={hoursLoading}
        className="w-full sm:w-auto bg-[#E5A800] hover:bg-[#cc9600] disabled:opacity-60 text-black font-semibold px-6 py-2 rounded-xl transition text-center">
        {hoursLoading ? "Saving..." : "Apply Changes"}
      </button>
    </div>

  </div>
)}

    </GNLayout>
  );
};

export default GNSettings;