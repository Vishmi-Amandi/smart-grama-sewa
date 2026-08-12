import { useState, useEffect } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { UserCheck, CalendarDays, Map, RefreshCw, Clock, UserX, Loader2 } from "lucide-react";
import { auth, db } from "../../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";

const GNCurrentStatus = ({ gnStatus, setGnStatus, theme }) => {
  const { t } = useTranslation();
  const tTheme = getThemeClasses(theme);
  const [selected, setSelected] = useState(gnStatus);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get translated status label
  const getStatusLabel = (statusKey) => {
    const map = {
      "Available": t("status_available"),
      "In Meeting": t("status_in_meeting"),
      "On Field": t("status_on_field"),
      "Unavailable": t("status_not_available"),
    };
    return map[statusKey] || statusKey;
  };

  // Status options with translated labels
  const statuses = [
    { label: "Available",    icon: <UserCheck size={24} />,    color: "text-green-600",  selectedBorder: "border-green-500",  selectedBg: theme === "dark" ? "bg-green-900"  : "bg-green-50"  },
    { label: "In Meeting",   icon: <CalendarDays size={24} />, color: "text-orange-500", selectedBorder: "border-orange-500", selectedBg: theme === "dark" ? "bg-orange-900" : "bg-orange-50" },
    { label: "On Field",     icon: <Map size={24} />,          color: "text-red-600",    selectedBorder: "border-red-500",    selectedBg: theme === "dark" ? "bg-red-900"    : "bg-red-50"    },
    { label: "Unavailable",  icon: <UserX size={24} />,        color: "text-slate-500",  selectedBorder: "border-slate-500",  selectedBg: theme === "dark" ? "bg-slate-800"  : "bg-slate-50"  },
  ];

  const handleUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "gn_officers", user.uid), { availability: selected });
      }
      setGnStatus(selected);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const circleBorderColor =
    selected === "Available"   ? "border-green-500"  :
    selected === "In Meeting"  ? "border-orange-500" :
    selected === "On Field"    ? "border-red-500"    :
    "border-slate-500";

  const circleTextColor =
    selected === "Available"   ? "text-green-600"  :
    selected === "In Meeting"  ? "text-orange-500" :
    selected === "On Field"    ? "text-red-600"    :
    "text-slate-500";

  const circleIcon = {
    "Available":   <UserCheck size={28} className="text-green-500" />,
    "In Meeting":  <CalendarDays size={28} className="text-orange-500" />,
    "On Field":    <Map size={28} className="text-red-500" />,
    "Unavailable": <UserX size={28} className="text-slate-500" />,
  }[selected];

  const selectedLabel = getStatusLabel(selected);
  const selectedUpper = selectedLabel.toUpperCase();

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      <h1 className="text-xl sm:text-2xl font-bold text-[#8B4513] mb-4 sm:mb-6 text-center sm:text-left">
        {t("current_status_title")}
      </h1>

      <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-6 md:p-8`}>
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">

          {/* Circle */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <div className={`w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full border-4 flex flex-col items-center justify-center ${circleBorderColor}`}>
              {circleIcon}
              <p className={`text-[10px] sm:text-xs mt-1 text-center ${tTheme.subtext}`}>
                {t("currently_label")}
              </p>
              <p className={`font-bold text-xs sm:text-sm text-center ${circleTextColor}`}>
                {selectedUpper}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h2 className={`text-base sm:text-lg font-bold mb-1 text-center md:text-left ${tTheme.text}`}>
              {t("availability_toggle_title")}
            </h2>
            <p className="text-xs sm:text-sm text-orange-500 mb-5 sm:mb-6 text-center md:text-left">
              {t("availability_toggle_desc")}
            </p>

            {/* Status Options */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {statuses.map((status) => (
                <button
                  key={status.label}
                  onClick={() => setSelected(status.label)}
                  disabled={isUpdating}
                  className={`flex flex-col items-center justify-center gap-2 border-2 rounded-xl py-3 sm:py-4 transition
                    ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}
                    ${selected === status.label
                      ? `${status.selectedBorder} ${status.selectedBg}`
                      : `${tTheme.border} hover:border-gray-300`
                    }`}
                >
                  <span className={status.color}>{status.icon}</span>
                  <span className={`text-xs sm:text-sm font-semibold text-center ${tTheme.text}`}>
                    {getStatusLabel(status.label)}
                  </span>
                  {selected === status.label && (
                    <span className="text-green-500 text-[10px] sm:text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>

            {/* Bottom Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className={`text-[10px] sm:text-xs flex items-center justify-center gap-1 text-center ${tTheme.subtext}`}>
                <Clock size={12} />
                {lastUpdated ? t("last_updated", { time: lastUpdated }) : t("not_updated_yet")}
              </p>
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className={`w-full sm:w-auto text-black font-semibold px-6 py-2 rounded-xl flex items-center justify-center gap-2 transition
                  ${isUpdating
                    ? "bg-[#e5a800]/60 cursor-not-allowed"
                    : "bg-[#E5A800] hover:bg-[#cc9600]"
                  }`}
              >
                {isUpdating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t("updating_status")}
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    {t("update_status_btn")}
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>

    </GNLayout>
  );
};

export default GNCurrentStatus;