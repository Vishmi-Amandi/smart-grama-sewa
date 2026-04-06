import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { Link } from "react-router-dom";
import { Megaphone, Clock, Eye, Pencil, Trash2 } from "lucide-react";

const announcements = [
  { title: "Paddy Subsidy 2024 Registration", section: "Agriculture", date: "2024-05-20", status: "Active" },
  { title: "Village Cleanup Program Notice", section: "Community", date: "2024-05-15", status: "Active" },
  { title: "Vaccination Clinic Schedule Update", section: "Health", date: "2024-05-10", status: "Expired" },
  { title: "Drought Relief Fund Distribution", section: "Social Service", date: "2024-05-05", status: "Expired" },
  { title: "Community Meeting: Local Road Repairs", section: "Infrastructure", date: "2024-04-28", status: "Expired" },
];

const AnnouncementList = ({ gnStatus, theme }) => {
  const t = getThemeClasses(theme);

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#8B4513]">Announcement List</h1>
        <Link to="/create-announcement" className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition">
          ＋ Create New Announcement
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className={`${t.card} rounded-2xl shadow p-5 flex items-center justify-between`}>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${t.subtext}`}>Active Notices</p>
            <h2 className={`text-3xl font-bold mt-1 ${t.text}`}>12</h2>
          </div>
          <Megaphone size={24} className="text-gray-300" />
        </div>
        <div className={`${t.card} rounded-2xl shadow p-5 flex items-center justify-between`}>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${t.subtext}`}>Scheduled</p>
            <h2 className={`text-3xl font-bold mt-1 ${t.text}`}>04</h2>
          </div>
          <Clock size={24} className="text-gray-300" />
        </div>
        <div className={`${t.card} rounded-2xl shadow p-5 flex items-center justify-between`}>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${t.subtext}`}>Total Views</p>
            <h2 className={`text-3xl font-bold mt-1 ${t.text}`}>1,402</h2>
          </div>
          <Eye size={24} className="text-gray-300" />
        </div>
      </div>

      {/* Table */}
      <div className={`${t.card} rounded-2xl shadow overflow-hidden`}>
        <table className="w-full text-sm">

          {/* Table Header */}
          <thead className={`${t.tableHead} uppercase text-xs`}>
            <tr>
              <th className="px-6 py-3 text-left">Title</th>
              <th className="px-6 py-3 text-left">Date Published</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className={t.divider}>
            {announcements.map((item, index) => (
              <tr key={index} className={t.tableRow}>
                <td className="px-6 py-4">
                  <p className={`font-semibold ${t.text}`}>{item.title}</p>
                  <p className={`text-xs ${t.subtext}`}>Section: {item.section}</p>
                </td>
                <td className={`px-6 py-4 ${t.subtext}`}>{item.date}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full
                    ${item.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button className="text-gray-400 hover:text-blue-500 transition">
                      <Pencil size={16} />
                    </button>
                    <button className="text-gray-400 hover:text-red-500 transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className={`px-6 py-4 flex items-center justify-between border-t ${t.border}`}>
          <p className={`text-xs ${t.subtext}`}>Showing 1 to 5 of 24 announcements</p>
          <div className="flex items-center gap-2">
            <button className={`w-7 h-7 rounded-full ${t.tableRow} ${t.subtext} text-xs`}>‹</button>
            <button className="w-7 h-7 rounded-full bg-[#E5A800] text-black text-xs font-bold">1</button>
            <button className={`w-7 h-7 rounded-full ${t.tableRow} ${t.subtext} text-xs`}>2</button>
            <button className={`w-7 h-7 rounded-full ${t.tableRow} ${t.subtext} text-xs`}>3</button>
            <button className={`w-7 h-7 rounded-full ${t.tableRow} ${t.subtext} text-xs`}>»</button>
            <button className={`w-7 h-7 rounded-full ${t.tableRow} ${t.subtext} text-xs`}>›</button>
          </div>
        </div>

      </div>

    </GNLayout>
  );
};

export default AnnouncementList;