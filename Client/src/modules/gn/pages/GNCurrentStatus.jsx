import { useState } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { UserCheck, CalendarDays, Map, RefreshCw, Clock } from "lucide-react";

const GNCurrentStatus = ({ gnStatus, setGnStatus, theme }) => {
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
      <h1 className="text-xl sm:text-2xl font-bold text-[#8B4513] mb-4 sm:mb-6 text-center sm:text-left">Current Status</h1>

      {/* Main Card */}
      <div className={`${t.card} rounded-2xl shadow p-4 sm:p-6 md:p-8`}>
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">

          {/* Left - Circle - Centered on mobile */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <div className={`w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full border-4 flex flex-col items-center justify-center
              ${selected === "Available" ? "border-green-500" : ""}
              ${selected === "In Meeting" ? "border-orange-500" : ""}
              ${selected === "On Field" ? "border-red-500" : ""}
            `}>
              {selected === "Available" && <UserCheck size={28} className="sm:w-8 sm:h-8 md:w-9 md:h-9 text-green-500" />}
              {selected === "In Meeting" && <CalendarDays size={28} className="sm:w-8 sm:h-8 md:w-9 md:h-9 text-orange-500" />}
              {selected === "On Field" && <Map size={28} className="sm:w-8 sm:h-8 md:w-9 md:h-9 text-red-500" />}
              <p className={`text-[10px] sm:text-xs mt-1 text-center ${t.subtext}`}>CURRENTLY</p>
              <p className={`font-bold text-xs sm:text-sm text-center
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
            <h2 className={`text-base sm:text-lg font-bold mb-1 text-center md:text-left ${t.text}`}>Availability Toggle</h2>
            <p className="text-xs sm:text-sm text-orange-500 mb-5 sm:mb-6 text-center md:text-left">
              Selecting a status will update your profile on the Public Citizen Portal immediately.
              Ensure your status reflects your current activity to avoid citizen inconvenience.
            </p>

            {/* Status Options - Responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {statuses.map((status) => (
                <button
                  key={status.label}
                  onClick={() => setSelected(status.label)}
                  className={`flex flex-col items-center justify-center gap-2 border-2 rounded-xl py-3 sm:py-4 transition
                    ${selected === status.label
                      ? `${status.selectedBorder} ${status.selectedBg}`
                      : `${t.border} hover:border-gray-300`
                    }`}
                >
                  <span className={status.color}>{status.icon}</span>
                  <span className={`text-xs sm:text-sm font-semibold text-center ${t.text}`}>{status.label}</span>
                  {selected === status.label && (
                    <span className="text-green-500 text-[10px] sm:text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>

            {/* Bottom Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className={`text-[10px] sm:text-xs flex items-center justify-center gap-1 text-center ${t.subtext}`}>
                <Clock size={12} />
                Last Updated: 10:30 AM
              </p>
              <button
                onClick={() => setGnStatus(selected)}
                className="w-full sm:w-auto bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold px-6 py-2 rounded-xl flex items-center justify-center gap-2 transition">
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

export default GNCurrentStatus;