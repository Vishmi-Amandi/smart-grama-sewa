import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { CalendarCheck, ClipboardList, Megaphone, TrendingUp, AlertCircle, Clock, ArrowLeftRight } from "lucide-react";
import { Link } from "react-router-dom";

const GNDashboard = ({ gnStatus, theme }) => {
  const t = getThemeClasses(theme);

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      {/* Page Title */}
      <h1 className="text-2xl font-bold text-[#8B4513] mb-6">Dashboard</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-6 mb-6">

        {/* Card 1 */}
        <div className={`${t.card} rounded-2xl shadow p-5`}>
          <div className="flex items-center justify-between">
            <p className={`text-xs font-semibold uppercase tracking-wide ${t.subtext}`}>Today's Appointments</p>
            <CalendarCheck size={20} className="text-gray-400" />
          </div>
          <h2 className={`text-4xl font-bold mt-2 ${t.text}`}>08</h2>
          <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
            <TrendingUp size={12} /> +2% from yesterday
          </p>
        </div>

        {/* Card 2 */}
        <div className={`${t.card} rounded-2xl shadow p-5`}>
          <div className="flex items-center justify-between">
            <p className={`text-xs font-semibold uppercase tracking-wide ${t.subtext}`}>Pending Requests</p>
            <ClipboardList size={20} className="text-gray-400" />
          </div>
          <h2 className={`text-4xl font-bold mt-2 ${t.text}`}>12</h2>
          <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">
            <AlertCircle size={12} /> Requires attention
          </p>
        </div>

        {/* Card 3 */}
        <div className={`${t.card} rounded-2xl shadow p-5`}>
          <div className="flex items-center justify-between">
            <p className={`text-xs font-semibold uppercase tracking-wide ${t.subtext}`}>Total Announcements</p>
            <Megaphone size={20} className="text-gray-400" />
          </div>
          <h2 className={`text-4xl font-bold mt-2 ${t.text}`}>24</h2>
          <p className={`text-xs mt-2 ${t.subtext}`}>Active in this month</p>
        </div>

      </div>

      {/* Calendar + Quick Actions Row */}
      <div className="grid grid-cols-3 gap-6 mb-6">

        {/* Calendar */}
        <div className={`${t.card} rounded-2xl shadow p-5 col-span-1`}>
          <p className={`text-sm font-semibold mb-3 ${t.text}`}>October 2023</p>

          {/* Day Headers */}
          <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2">
            {["SU","MO","TU","WE","TH","FR","SA"].map(d => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-7 text-center text-sm">
            {["26","27","28","29","30","1","2",
              "3","4","5","6","7","8","9",
              "10","11","12","13","14","15","16"].map((d, i) => (
              <span
                key={i}
                className={`py-1 rounded-full cursor-pointer
                  ${d === "12" ? "bg-[#E5A800] text-white font-bold" : `${t.tableRow} ${t.text}`}
                  ${["26","27","28","29","30"].includes(d) && i < 6 ? "text-gray-300" : ""}
                `}
              >
                {d}
              </span>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="col-span-2">
          <p className={`text-sm font-semibold mb-3 flex items-center gap-2 ${t.text}`}>
            ⚡ Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/appointments" className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold rounded-2xl px-6 py-5 flex items-center gap-3 transition">
              <CalendarCheck size={22} />
              View Appointments
            </Link>
            <Link to="/schedule" className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold rounded-2xl px-6 py-5 flex items-center gap-3 transition">
              <Clock size={22} />
              Update Schedule
            </Link>
            <Link to="/create-announcement" className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold rounded-2xl px-6 py-5 flex items-center gap-3 transition">
              <Megaphone size={22} />
              Create Announcement
            </Link>
            <button className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold rounded-2xl px-6 py-5 flex items-center gap-3 transition">
              <ArrowLeftRight size={22} />
              Transfer Request
            </button>
          </div>
        </div>

      </div>

      {/* Recent Announcements */}
      <div className={`${t.card} rounded-2xl shadow p-5`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p className={`text-sm font-semibold flex items-center gap-2 ${t.text}`}>
            <Megaphone size={16} className="text-[#8B4513]" />
            Recent Announcements List
          </p>
          <a href="#" className="text-xs text-[#E5A800] font-semibold hover:underline">
            View All →
          </a>
        </div>

        {/* Announcement Items */}
        <div className="space-y-4">

          {/* Item 1 */}
          <div className={`flex items-center gap-4 border-b pb-4 ${t.border}`}>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              💧
            </div>
            <div>
              <p className={`text-sm font-semibold ${t.text}`}>Scheduled Water Maintenance - Zone B</p>
              <p className={`text-xs ${t.subtext}`}>Published 2 hours ago • By Admin</p>
            </div>
          </div>

          {/* Item 2 */}
          <div className={`flex items-center gap-4 border-b pb-4 ${t.border}`}>
            <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center flex-shrink-0">
              🛡️
            </div>
            <div>
              <p className={`text-sm font-semibold ${t.text}`}>Monthly Vaccination Clinic Announcement</p>
              <p className={`text-xs ${t.subtext}`}>Published 1 day ago • By Officer Perera</p>
            </div>
          </div>

          {/* Item 3 */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
              💰
            </div>
            <div>
              <p className={`text-sm font-semibold ${t.text}`}>Elderly Benefit Distribution - October 2023</p>
              <p className={`text-xs ${t.subtext}`}>Published 3 days ago • By Admin</p>
            </div>
          </div>

        </div>
      </div>

    </GNLayout>
  );
};

export default GNDashboard;