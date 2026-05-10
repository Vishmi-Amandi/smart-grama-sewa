import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { CalendarCheck, ClipboardList, Megaphone, TrendingUp, AlertCircle, Clock, ArrowLeftRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from "firebase/firestore";
import { auth, db } from "../../firebase";

const GNDashboard = ({ gnStatus, theme }) => {
  const t = getThemeClasses(theme);

  const [appointmentStats, setAppointmentStats] = useState({ today: 0, pending: 0 });
  const [announcements, setAnnouncements] = useState([]);
  const [announcementStats, setAnnouncementStats] = useState({ total: 0, active: 0 });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // ── Announcements ──
        const q = query(
          collection(db, "announcements"),
          where("createdBy", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(3)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAnnouncements(data);

        // Announcement stats
        const allQ = query(
          collection(db, "announcements"),
          where("createdBy", "==", user.uid)
        );
        const allSnap = await getDocs(allQ);
        const allData = allSnap.docs.map((d) => d.data());
        setAnnouncementStats({
          total: allData.length,
          active: allData.filter((a) => a.status === "Active").length,
        });

        // ── Appointments ──
        const officerSnap = await getDoc(doc(db, "gn_officers", user.uid));
        const divisionName = officerSnap.exists()
          ? officerSnap.data().gnDivisionName || ""
          : "";

        if (divisionName) {
          const today = new Date().toISOString().split("T")[0];
          const apptSnap = await getDocs(
            query(
              collection(db, "appointments"),
              where("gnDiv", "==", divisionName)
            )
          );
          const apptData = apptSnap.docs.map((d) => d.data());
          setAppointmentStats({
            today: apptData.filter((a) => a.date === today).length,
            pending: apptData.filter((a) => a.status === "Pending").length,
          });
        }

      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };
    fetchAll();
  }, []);

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
          <h2 className={`text-4xl font-bold mt-2 ${t.text}`}>{appointmentStats.today}</h2>
          <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
            <TrendingUp size={12} /> Appointments today
          </p>
        </div>

        {/* Card 2 */}
        <div className={`${t.card} rounded-2xl shadow p-5`}>
          <div className="flex items-center justify-between">
            <p className={`text-xs font-semibold uppercase tracking-wide ${t.subtext}`}>Pending Requests</p>
            <ClipboardList size={20} className="text-gray-400" />
          </div>
          <h2 className={`text-4xl font-bold mt-2 ${t.text}`}>{appointmentStats.pending}</h2>
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
          <h2 className={`text-4xl font-bold mt-2 ${t.text}`}>{announcementStats.total}</h2>
          <p className={`text-xs mt-2 ${t.subtext}`}>{announcementStats.active} Active this month</p>
        </div>

      </div>

      {/* Calendar + Quick Actions Row */}
      <div className="grid grid-cols-3 gap-6 mb-6">

        {/* Calendar */}
        <div className={`${t.card} rounded-2xl shadow p-5 col-span-1`}>
          <p className={`text-sm font-semibold mb-3 ${t.text}`}>October 2023</p>
          <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2">
            {["SU","MO","TU","WE","TH","FR","SA"].map(d => (
              <span key={d}>{d}</span>
            ))}
          </div>
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
            <Link to="/transfer-request" className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold rounded-2xl px-6 py-5 flex items-center gap-3 transition">
              <ArrowLeftRight size={22} />
              Transfer Request
            </Link>
          </div>
        </div>

      </div>

      {/* Recent Announcements */}
      <div className={`${t.card} rounded-2xl shadow p-5`}>
        <div className="flex items-center justify-between mb-4">
          <p className={`text-sm font-semibold flex items-center gap-2 ${t.text}`}>
            <Megaphone size={16} className="text-[#8B4513]" />
            Recent Announcements List
          </p>
          <Link to="/announcement-list" className="text-xs text-[#E5A800] font-semibold hover:underline">
            View All →
          </Link>
        </div>

        <div className="space-y-4">
          {announcements.length === 0 ? (
            <p className={`text-sm text-center py-4 ${t.subtext}`}>
              No announcements yet.
            </p>
          ) : (
            announcements.map((item, index) => {
              const isLast = index === announcements.length - 1;
              const createdAt = item.createdAt?.toDate?.() || new Date();
              const timeAgo = Math.floor((new Date() - createdAt) / (1000 * 60 * 60));
              const timeLabel = timeAgo < 1 ? "Just now" :
                timeAgo < 24 ? `${timeAgo} hours ago` :
                `${Math.floor(timeAgo / 24)} days ago`;

              return (
                <div key={item.id} className={`flex items-center gap-4 ${!isLast ? `border-b pb-4 ${t.border}` : ""}`}>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${t.text}`}>{item.title}</p>
                    <p className={`text-xs ${t.subtext}`}>
                      {timeLabel} • {item.status || "Draft"}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full
                    ${item.status === "Active" ? "bg-green-100 text-green-700" :
                      item.status === "Draft" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-500"}`}>
                    {item.status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

    </GNLayout>
  );
};

export default GNDashboard;