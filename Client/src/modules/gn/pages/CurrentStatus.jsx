import { useState } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { UserCheck, CalendarDays, Map, RefreshCw, Clock } from "lucide-react";

const CurrentStatus = ({ gnStatus, setGnStatus, theme }) => {
  const [selected, setSelected] = useState(gnStatus);
  const t = getThemeClasses(theme);

  const statuses = [
    { label: "Available", icon: <UserCheck size={24} />, color: "text-green-600", selectedBorder: "border-green-500", selectedBg: theme === "dark" ? "bg-green-900" : "bg-green-50" },
    { label: "In Meeting", icon: <CalendarDays size={24} />, color: "text-orange-500", selectedBorder: "border-orange-500", selectedBg: theme === "dark" ? "bg-orange-900" : "bg-orange-50" },
    { label: "On Field", icon: <Map size={24} />, color: "text-red-600", selectedBorder: "border-red-500", selectedBg: theme === "dark" ? "bg-red-900" : "bg-red-50" },
  ];

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      {/* Page Title */}
      <h1 className="text-2xl font-bold text-[#8B4513] mb-6">Current Status</h1>

      {/* Main Card */}
      <div className={`${t.card} rounded-2xl shadow p-8`}>
        <div className="flex gap-10">

          {/* Left - Circle */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <div className={`w-40 h-40 rounded-full border-4 flex flex-col items-center justify-center
              ${selected === "Available" ? "border-green-500" : ""}
              ${selected === "In Meeting" ? "border-orange-500" : ""}
              ${selected === "On Field" ? "border-red-500" : ""}
            `}>
              {selected === "Available" && <UserCheck size={36} className="text-green-500" />}
              {selected === "In Meeting" && <CalendarDays size={36} className="text-orange-500" />}
              {selected === "On Field" && <Map size={36} className="text-red-500" />}
              <p className={`text-xs mt-1 ${t.subtext}`}>CURRENTLY</p>
              <p className={`font-bold text-sm
                ${selected === "Available" ? "text-green-600" : ""}
                ${selected === "In Meeting" ? "text-orange-500" : ""}
                ${selected === "On Field" ? "text-red-600" : ""}
              `}>
                {selected.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Right - Content */}
          <div className="flex-1">

            {/* Title + Description */}
            <h2 className={`text-lg font-bold mb-1 ${t.text}`}>Availability Toggle</h2>
            <p className="text-sm text-orange-500 mb-6">
              Selecting a status will update your profile on the Public Citizen Portal immediately.
              Ensure your status reflects your current activity to avoid citizen inconvenience.
            </p>

            {/* Status Options */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {statuses.map((status) => (
                <button
                  key={status.label}
                  onClick={() => setSelected(status.label)}
                  className={`flex flex-col items-center justify-center gap-2 border-2 rounded-xl py-4 transition
                    ${selected === status.label
                      ? `${status.selectedBorder} ${status.selectedBg}`
                      : `${t.border} hover:border-gray-300`
                    }`}
                >
                  <span className={status.color}>{status.icon}</span>
                  <span className={`text-sm font-semibold ${t.text}`}>{status.label}</span>
                  {selected === status.label && (
                    <span className="text-green-500 text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>

            {/* Bottom Row */}
            <div className="flex items-center justify-between">
              <p className={`text-xs flex items-center gap-1 ${t.subtext}`}>
                <Clock size={12} />
                Last Updated: 10:30 AM
              </p>
              <button
                onClick={() => setGnStatus(selected)}
                className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold px-6 py-2 rounded-xl flex items-center gap-2 transition">
                <RefreshCw size={16} />
                Update Current Status
              </button>
            </div>

          </div>
        </div>
      </div>

    </GNLayout>
  );
};

export default CurrentStatus;