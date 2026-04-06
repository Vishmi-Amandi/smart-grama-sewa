import { useState } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { Bell, Palette, Shield, Clock } from "lucide-react";

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

const Settings = ({ gnStatus, theme, setTheme }) => {
  const t = getThemeClasses(theme);
  const [activeTab, setActiveTab] = useState("notification");
  const [channels, setChannels] = useState({ email: true, sms: false, push: true });
  const [types, setTypes] = useState({ appointments: true, system: false, citizen: true });
  const [delivery, setDelivery] = useState("hold");
  const [fontSize, setFontSize] = useState("medium");
  const [language, setLanguage] = useState("English");

  const tabs = [
    { key: "notification", label: "Notification", icon: <Bell size={14} /> },
    { key: "appearance", label: "Appearance and Language", icon: <Palette size={14} /> },
    { key: "security", label: "Security", icon: <Shield size={14} /> },
    { key: "hours", label: "Weekly Hours", icon: <Clock size={14} /> },
  ];

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      {/* Page Title */}
      <h1 className="text-2xl font-bold text-[#8B4513] mb-4">Settings</h1>

      {/* Tabs */}
      <div className={`flex gap-6 border-b ${t.border} mb-6`}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2
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
        <div className="space-y-6">
          <h2 className={`text-xl font-bold ${t.text}`}>Notification Settings</h2>

          {/* Notification Channels */}
          <div className={`${t.card} rounded-2xl shadow p-6`}>
            <p className={`text-sm font-semibold flex items-center gap-2 mb-1 ${t.text}`}>
              🔔 Notification Channels
            </p>
            <p className={`text-xs mb-4 ${t.subtext}`}>Select where you want to receive notifications.</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: "email", label: "Email", sub: "Detailed logs and updates", icon: "📧" },
                { key: "sms", label: "SMS Text", sub: "Urgent mobile alerts", icon: "💬" },
                { key: "push", label: "Push Notifications", sub: "Real-time desktop alerts", icon: "🔔" },
              ].map((ch) => (
                <div
                  key={ch.key}
                  onClick={() => setChannels({ ...channels, [ch.key]: !channels[ch.key] })}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition relative
                    ${channels[ch.key] ? `border-[#E5A800] ${theme === "dark" ? "bg-yellow-900" : "bg-yellow-50"}` : t.border}`}
                >
                  {channels[ch.key] && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-[#E5A800] rounded-full flex items-center justify-center text-xs">✓</span>
                  )}
                  <span className="text-xl">{ch.icon}</span>
                  <p className={`text-sm font-semibold mt-2 ${t.text}`}>{ch.label}</p>
                  <p className={`text-xs ${t.subtext}`}>{ch.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Notification Types */}
          <div className={`${t.card} rounded-2xl shadow p-6`}>
            <p className={`text-sm font-semibold flex items-center gap-2 mb-1 ${t.text}`}>
              🔔 Notification Types
            </p>
            <p className={`text-xs mb-4 ${t.subtext}`}>Configure alerts for specific activity categories.</p>
            <div className="space-y-4">
              {[
                { key: "appointments", icon: "📅", label: "Appointments", sub: "New bookings, rescheduling, and cancellations." },
                { key: "system", icon: "⚙️", label: "System Updates", sub: "Maintenance windows and feature releases." },
                { key: "citizen", icon: "👤", label: "Citizen Activity", sub: "Profile updates and document submissions." },
              ].map((item) => (
                <div key={item.key} className={`flex items-center justify-between border ${t.border} rounded-xl px-4 py-3`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <p className={`text-sm font-semibold ${t.text}`}>{item.label}</p>
                      <p className={`text-xs ${t.subtext}`}>{item.sub}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs uppercase ${t.subtext}`}>Status:</span>
                    <Toggle value={types[item.key]} onChange={(v) => setTypes({ ...types, [item.key]: v })} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quiet Hours */}
          <div className={`${t.card} rounded-2xl shadow p-6`}>
            <p className={`text-sm font-semibold flex items-center gap-2 mb-1 ${t.text}`}>
              🌙 Quiet Hours
            </p>
            <p className={`text-xs mb-4 ${t.subtext}`}>Set times when you do not want to be disturbed.</p>
            <div className="grid grid-cols-2 gap-6">

              {/* Time Range */}
              <div>
                <p className={`text-xs mb-2 ${t.subtext}`}>Time Range</p>
                <div className="flex items-center gap-2">
                  <input type="time" defaultValue="22:00"
                    className={`border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`} />
                  <span className={`text-xs ${t.subtext}`}>to</span>
                  <input type="time" defaultValue="07:00"
                    className={`border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`} />
                </div>
                <p className={`text-xs mt-3 ${t.subtext}`}>
                  ⓘ Critical alerts will bypass quiet hours automatically.
                </p>
              </div>

              {/* Delivery Preference */}
              <div>
                <p className={`text-xs mb-2 ${t.subtext}`}>Delivery Preference</p>
                <div className="space-y-3">
                  {[
                    { key: "hold", label: "Hold for later", sub: "Send a summary digest at 07:00 AM" },
                    { key: "discard", label: "Discard notifications", sub: "Do not deliver during these hours" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      onClick={() => setDelivery(item.key)}
                      className={`flex items-start gap-3 border-2 rounded-xl px-4 py-3 cursor-pointer transition
                        ${delivery === item.key ? `border-[#E5A800] ${theme === "dark" ? "bg-yellow-900" : "bg-yellow-50"}` : t.border}`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0
                        ${delivery === item.key ? "border-[#E5A800] bg-[#E5A800]" : "border-gray-300"}`} />
                      <div>
                        <p className={`text-sm font-semibold ${t.text}`}>{item.label}</p>
                        <p className={`text-xs ${t.subtext}`}>{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4">
            <button className={`font-semibold px-5 py-2 rounded-xl transition ${t.text} ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}>
              Reset to Defaults
            </button>
            <button className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold px-6 py-2 rounded-xl transition">
              Apply Changes
            </button>
          </div>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === "appearance" && (
        <div className="space-y-6">
          <h2 className={`text-xl font-bold ${t.text}`}>Appearance and Language Settings</h2>

          {/* Theme Selection */}
          <div className={`${t.card} rounded-2xl shadow p-6`}>
            <p className={`text-sm font-semibold mb-1 ${t.text}`}>🌟 Theme Selection</p>
            <p className={`text-xs mb-4 ${t.subtext}`}>Select your preferred interface color mode.</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "light", label: "Light Mode", sub: "Classic bright theme for daytime use.", icon: "☀️" },
                { key: "dark", label: "Night Mode", sub: "Dark theme to reduce eye strain in low light.", icon: "🌙" },
              ].map((item) => (
                <div
                  key={item.key}
                  onClick={() => setTheme(item.key)}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition relative
                    ${theme === item.key ? `border-[#E5A800] ${theme === "dark" ? "bg-yellow-900" : "bg-yellow-50"}` : t.border}`}
                >
                  {theme === item.key && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-[#E5A800] rounded-full flex items-center justify-center text-xs">✓</span>
                  )}
                  <span className="text-2xl">{item.icon}</span>
                  <p className={`text-sm font-semibold mt-2 ${t.text}`}>{item.label}</p>
                  <p className={`text-xs ${t.subtext}`}>{item.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className={`${t.card} rounded-2xl shadow p-6`}>
            <p className={`text-sm font-semibold mb-1 ${t.text}`}>🔤 Font Size</p>
            <p className={`text-xs mb-4 ${t.subtext}`}>Adjust text size for better readability.</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: "small", label: "Small", size: "text-sm" },
                { key: "medium", label: "Medium", size: "text-base" },
                { key: "large", label: "Large", size: "text-lg" },
              ].map((f) => (
                <div
                  key={f.key}
                  onClick={() => setFontSize(f.key)}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition flex flex-col items-center gap-2
                    ${fontSize === f.key ? `border-[#E5A800] ${theme === "dark" ? "bg-yellow-900" : "bg-yellow-50"}` : t.border}`}
                >
                  <span className={`font-semibold ${t.text} ${f.size}`}>A</span>
                  <span className={`text-xs ${t.subtext}`}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Language Settings */}
          <div className={`${t.card} rounded-2xl shadow p-6`}>
            <p className={`text-sm font-semibold mb-1 ${t.text}`}>🌐 Language Settings</p>
            <p className={`text-xs mb-4 ${t.subtext}`}>Choose the primary language for the portal content.</p>
            <p className={`text-xs mb-2 ${t.subtext}`}>Select Language</p>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={`w-72 border ${t.border} rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}
            >
              <option value="English">English</option>
              <option value="සිංහල">සිංහල</option>
              <option value="தமிழ்">தமிழ்</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4">
            <button className={`font-semibold px-5 py-2 rounded-xl transition ${t.text} ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}>
             Reset to Defaults
            </button>
            <button className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold px-6 py-2 rounded-xl transition">
              Apply Changes
            </button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className={`${t.card} rounded-2xl shadow p-6`}>
          <p className={`text-sm ${t.subtext}`}>Security settings coming soon...</p>
        </div>
      )}

      {/* Weekly Hours Tab */}
      {activeTab === "hours" && (
        <div className={`${t.card} rounded-2xl shadow p-6`}>
          <p className={`text-sm ${t.subtext}`}>Weekly Hours settings coming soon...</p>
        </div>
      )}

    </GNLayout>
  );
};

export default Settings;