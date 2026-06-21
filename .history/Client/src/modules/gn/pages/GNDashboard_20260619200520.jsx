import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { CalendarCheck, ClipboardList, Megaphone, TrendingUp, AlertCircle, Clock, ArrowRightLeft, Bell, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from "firebase/firestore";
import { auth, db } from "../../firebase";

const GNDashboard = ({ gnStatus, theme }) => {
  const t = getThemeClasses(theme);
  const navigate = useNavigate();

  const [appointmentStats, setAppointmentStats] = useState({ today: 0, pending: 0 });
  const [announcementStats, setAnnouncementStats] = useState({ total: 0, active: 0 });
  const [divisionRequest, setDivisionRequest] = useState(null);
  const [showDivisionModal, setShowDivisionModal] = useState(false);

  // Admin announcements state
  const [adminAnnouncements, setAdminAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // ── Fetch division change request ──────────────────────────────────────────
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const q = query(
          collection(db, "gn_change_gn_division"),
          where("uid", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) setDivisionRequest(snap.docs[0].data());
      } catch (err) {
        console.error("Fetch division request error:", err);
      }
    };
    fetchRequest();
  }, []);

  // ── Fetch admin announcements (all_users + gn_officers, published, not expired) ──
  useEffect(() => {
    const fetchAdminAnnouncements = async () => {
      try {
        setAnnouncementsLoading(true);


        // Use single-field queries only (no composite index needed)
        // Filter status + category in JS
        const [snapAll, snapGN] = await Promise.all([
          getDocs(query(
            collection(db, "announcements"),
            where("category", "==", "all_users")
          )),
          getDocs(query(
            collection(db, "announcements"),
            where("category", "==", "gn_officers")
          )),
        ]);

        const allDocs = [
          ...snapAll.docs.map((d) => ({ id: d.id, ...d.data() })),
          ...snapGN.docs.map((d) => ({ id: d.id, ...d.data() })),
        ];

        // Filter: only show published announcements (expiry managed by admin)
        const valid = allDocs.filter((a) => a.status === "published");

        // Deduplicate + sort by publishedAt descending
        const seen = new Set();
        const unique = valid
          .filter((a) => { if (seen.has(a.id)) return false; seen.add(a.id); return true; })
          .sort((a, b) => (b.publishedAt?.toDate?.() || 0) - (a.publishedAt?.toDate?.() || 0));

        setAdminAnnouncements(unique);
      } catch (err) {
        console.error("Admin announcements fetch error:", err);
      } finally {
        setAnnouncementsLoading(false);
      }
    };
    fetchAdminAnnouncements();
  }, []);

  // ── Fetch appointments + GN officer announcement stats ────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // GN officer's own announcement stats
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

        // Appointments
        const officerSnap = await getDoc(doc(db, "gn_officers", user.uid));
        const divisionName = officerSnap.exists()
          ? officerSnap.data().gnDivisionName || ""
          : "";

        if (divisionName) {
          const today = new Date().toISOString().split("T")[0];
          const apptSnap = await getDocs(
            query(collection(db, "appointments"), where("gnDiv", "==", divisionName))
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

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatDate = (ts) => {
    if (!ts) return "—";
    const date = ts?.toDate?.() || new Date(ts);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const timeAgo = (ts) => {
    if (!ts) return "";
    const date = ts?.toDate?.() || new Date(ts);
    const hours = Math.floor((new Date() - date) / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(ts);
  };

  const priorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":   return "bg-red-100 text-red-700 border border-red-200";
      case "medium": return "bg-orange-100 text-orange-700 border border-orange-200";
      case "low":    return "bg-green-100 text-green-700 border border-green-200";
      default:       return "bg-gray-100 text-gray-500";
    }
  };

  const categoryStyle = (category) =>
    category === "gn_officers"
      ? "bg-[#8B4513]/10 text-[#8B4513]"
      : "bg-blue-50 text-blue-700";

  const categoryLabel = (category) =>
    category === "gn_officers" ? "GN Officers" : "All Users";

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      {/* Page Title */}
      <h1 className="text-xl sm:text-2xl font-bold text-[#8B4513] mb-4 sm:mb-6 px-1">Dashboard</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className={`${t.card} rounded-2xl shadow p-4 sm:p-5`}>
          <div className="flex items-center justify-between">
            <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${t.subtext}`}>Today's Appointments</p>
            <CalendarCheck size={18} className="text-gray-400" />
          </div>
          <h2 className={`text-3xl sm:text-4xl font-bold mt-2 ${t.text}`}>{appointmentStats.today}</h2>
          <p className="text-[10px] sm:text-xs text-green-500 mt-2 flex items-center gap-1">
            <TrendingUp size={10} /> Appointments today
          </p>
        </div>

        <div className={`${t.card} rounded-2xl shadow p-4 sm:p-5`}>
          <div className="flex items-center justify-between">
            <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${t.subtext}`}>Pending Requests</p>
            <ClipboardList size={18} className="text-gray-400" />
          </div>
          <h2 className={`text-3xl sm:text-4xl font-bold mt-2 ${t.text}`}>{appointmentStats.pending}</h2>
          <p className="text-[10px] sm:text-xs text-orange-500 mt-2 flex items-center gap-1">
            <AlertCircle size={10} /> Requires attention
          </p>
        </div>

        <div className={`${t.card} rounded-2xl shadow p-4 sm:p-5`}>
          <div className="flex items-center justify-between">
            <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${t.subtext}`}>Total Announcements</p>
            <Megaphone size={18} className="text-gray-400" />
          </div>
          <h2 className={`text-3xl sm:text-4xl font-bold mt-2 ${t.text}`}>{announcementStats.total}</h2>
          <p className={`text-[10px] sm:text-xs mt-2 ${t.subtext}`}>{announcementStats.active} Active this month</p>
        </div>
      </div>

      {/* Calendar + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className={`${t.card} rounded-2xl shadow p-4 sm:p-5 col-span-1`}>
          <p className={`text-sm font-semibold mb-3 ${t.text}`}>October 2023</p>
          <div className="grid grid-cols-7 text-center text-[10px] sm:text-xs text-gray-400 mb-2">
            {["SU","MO","TU","WE","TH","FR","SA"].map(d => <span key={d}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 text-center text-xs sm:text-sm">
            {["26","27","28","29","30","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16"].map((d, i) => (
              <span key={i} className={`py-1 rounded-full cursor-pointer
                ${d === "12" ? "bg-[#E5A800] text-white font-bold" : `${t.tableRow} ${t.text}`}
                ${["26","27","28","29","30"].includes(d) && i < 6 ? "text-gray-300" : ""}`}>
                {d}
              </span>
            ))}
          </div>
        </div>

        <div className="col-span-1 lg:col-span-2">
          <p className={`text-sm font-semibold mb-3 flex items-center gap-2 ${t.text}`}>⚡ Quick Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Link to="/gn-appointments" className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold rounded-2xl px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 transition justify-center sm:justify-start">
              <CalendarCheck size={18} /><span className="text-sm sm:text-base">View Appointments</span>
            </Link>
            <Link to="/gn-schedule" className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold rounded-2xl px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 transition justify-center sm:justify-start">
              <Clock size={18} /><span className="text-sm sm:text-base">Update Schedule</span>
            </Link>
            <Link to="/gn-create-announcement" className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold rounded-2xl px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 transition justify-center sm:justify-start">
              <Megaphone size={18} /><span className="text-sm sm:text-base">Create Announcement</span>
            </Link>
            <button
              onClick={() => { if (divisionRequest) setShowDivisionModal(true); else navigate("/gn-change-gn-division"); }}
              className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold rounded-2xl px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 transition justify-center sm:justify-start">
              <ArrowRightLeft size={18} /><span className="text-sm sm:text-base">Change GN Division</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Admin Announcements Panel ─────────────────────────────────────── */}
      <div className={`${t.card} rounded-2xl shadow p-4 sm:p-5`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#8B4513]/10 flex items-center justify-center">
              <Bell size={16} className="text-[#8B4513]" />
            </div>
            <div>
              <p className={`text-sm font-bold ${t.text}`}>Notices from Administration</p>
              <p className={`text-[10px] ${t.subtext}`}>
                {adminAnnouncements.length} active notice{adminAnnouncements.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {adminAnnouncements.length > 0 && (
            <span className="text-[10px] font-bold bg-[#E5A800] text-[#3d2a00] px-2 py-0.5 rounded-full">
              {adminAnnouncements.length} New
            </span>
          )}
        </div>

        {/* Content */}
        {announcementsLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-xl bg-gray-100 h-16" />
            ))}
          </div>
        ) : adminAnnouncements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-1">
              <Bell size={22} className="text-gray-300" />
            </div>
            <p className={`text-sm font-semibold ${t.subtext}`}>No notices at the moment</p>
            <p className={`text-xs ${t.subtext}`}>Admin announcements will appear here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {adminAnnouncements.map((item) => {
              const isExpanded = expandedId === item.id;
              const isHighPriority = item.priority?.toLowerCase() === "high";

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border transition-all duration-200 overflow-hidden
                    ${isHighPriority
                      ? "border-red-200 bg-red-50/40"
                      : `border-gray-100 ${t.tableRow}`}`}
                >
                  {/* Row — always visible */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="w-full text-left px-4 py-3 flex items-start gap-3"
                  >
                    {/* Priority indicator dot */}
                    <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0
                      ${item.priority?.toLowerCase() === "high"   ? "bg-red-500"    :
                        item.priority?.toLowerCase() === "medium" ? "bg-orange-400" :
                        "bg-green-500"}`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {/* Priority badge */}
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${priorityStyle(item.priority)}`}>
                          {item.priority || "Normal"}
                        </span>
                        {/* Category badge */}
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${categoryStyle(item.category)}`}>
                          {categoryLabel(item.category)}
                        </span>
                      </div>

                      <p className={`text-sm font-bold leading-snug ${t.text}`}>{item.title}</p>

                      {/* Description preview when collapsed */}
                      {!isExpanded && item.description && (
                        <p className={`text-xs mt-0.5 line-clamp-1 ${t.subtext}`}>
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[10px] ${t.subtext}`}>{timeAgo(item.publishedAt)}</span>
                      <ChevronRight
                        size={14}
                        className={`text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                      />
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className={`px-4 pb-4 border-t ${isHighPriority ? "border-red-100" : "border-gray-100"}`}>
                      {/* Full description */}
                      {item.description && (
                        <p className={`text-sm mt-3 leading-relaxed ${t.text}`}>{item.description}</p>
                      )}

                      {/* Meta row */}
                      <div className={`flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] ${t.subtext}`}>
                        <span>📅 Published: {formatDate(item.publishedAt)}</span>
                        {item.expiresAt && (
                          <span>⏳ Expires: {formatDate(item.expiresAt)}</span>
                        )}
                        <span>✉ By: {item.createdBy}</span>
                      </div>

                      {/* Attachments */}
                      {item.attachments?.length > 0 && (
                        <div className="mt-3">
                          <p className={`text-[10px] font-bold uppercase tracking-wide mb-1.5 ${t.subtext}`}>
                            Attachments
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {item.attachments.map((url, i) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 text-xs font-semibold text-[#8B4513] bg-[#8B4513]/10 hover:bg-[#8B4513]/20 px-3 py-1.5 rounded-lg transition"
                              >
                                📎 Attachment {i + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Division Request Status Modal */}
      {showDivisionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-3 sm:px-4">
          <div className={`${t.card} rounded-2xl shadow-2xl w-full max-w-[90%] sm:max-w-md p-5 sm:p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-sm sm:text-base font-bold ${t.text}`}>GN Division Change Request</h2>
              <button onClick={() => setShowDivisionModal(false)} className={`${t.subtext} hover:text-gray-600 text-xl`}>✕</button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <div>
                <p className={`text-xs ${t.subtext}`}>Requested Division</p>
                <p className={`text-sm font-bold ${t.text}`}>{divisionRequest?.toDivision}</p>
                <p className={`text-xs ${t.subtext}`}>{divisionRequest?.toDistrict}</p>
              </div>
              <span className={`text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-center ${
                divisionRequest?.status === "Pending"  ? "bg-yellow-100 text-yellow-700" :
                divisionRequest?.status === "Approved" ? "bg-green-100 text-green-700"  :
                divisionRequest?.status === "Rejected" ? "bg-red-100 text-red-600"      :
                "bg-gray-100 text-gray-500"
              }`}>
                {divisionRequest?.status === "Pending"  ? "⏳ Pending"  :
                 divisionRequest?.status === "Approved" ? "✅ Approved" :
                 divisionRequest?.status === "Rejected" ? "❌ Rejected" :
                 divisionRequest?.status}
              </span>
            </div>

            <p className={`text-xs ${t.subtext} mb-4`}>
              Submitted: {divisionRequest?.createdAt?.toDate?.()?.toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric"
              }) || "—"}
            </p>

            {divisionRequest?.status === "Pending" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 sm:px-4 py-3 mb-4">
                <p className="text-xs text-yellow-700 font-semibold">Your request is currently under review by the admin.</p>
              </div>
            )}
            {divisionRequest?.status === "Approved" && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-3 sm:px-4 py-3 mb-4">
                <p className="text-xs text-green-700 font-semibold">Your division change has been approved!</p>
              </div>
            )}
            {divisionRequest?.status === "Rejected" && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 sm:px-4 py-3 mb-4">
                <p className="text-xs text-red-600 font-semibold">Your request was rejected. You can submit a new request.</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowDivisionModal(false)}
                className={`flex-1 border ${t.border} ${t.subtext} font-semibold py-2 rounded-xl hover:bg-gray-50 transition text-sm`}>
                Close
              </button>
              {divisionRequest?.status === "Rejected" && (
                <button onClick={() => { setShowDivisionModal(false); navigate("/gn-change-gn-division"); }}
                  className="flex-1 bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold py-2 rounded-xl transition text-sm">
                  New Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </GNLayout>
  );
};

export default GNDashboard;