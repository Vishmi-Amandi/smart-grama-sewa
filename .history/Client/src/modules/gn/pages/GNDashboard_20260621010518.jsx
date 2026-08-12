import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { CalendarCheck, ClipboardList, Megaphone, TrendingUp, AlertCircle, Clock, ArrowRightLeft, Bell, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useTranslation } from "react-i18next";

const GNDashboard = ({ gnStatus, theme }) => {
  const { t, i18n } = useTranslation();
  const tTheme = getThemeClasses(theme);
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

        const valid = allDocs.filter((a) => a.status === "published");

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
    return date.toLocaleDateString(i18n.language, { year: "numeric", month: "short", day: "numeric" });
  };

  const timeAgo = (ts) => {
    if (!ts) return "";
    const date = ts?.toDate?.() || new Date(ts);
    const hours = Math.floor((new Date() - date) / (1000 * 60 * 60));
    if (hours < 1) return t('lbl_just_now');
    if (hours < 24) return t('lbl_hours_ago', { hours });
    const days = Math.floor(hours / 24);
    if (days < 7) return t('lbl_days_ago', { days });
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
    category === "gn_officers" ? t('category_gn_officers') : t('category_all_users');

  // Localized month/year for calendar
  const now = new Date();
  const monthYear = now.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      {/* Page Title */}
      <h1 className="text-xl sm:text-2xl font-bold text-[#8B4513] mb-4 sm:mb-6 px-1">
        {t('lbl_dashboard')}
      </h1>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-5`}>
          <div className="flex items-center justify-between">
            <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${tTheme.subtext}`}>
              {t('lbl_todays_appointments')}
            </p>
            <CalendarCheck size={18} className="text-gray-400" />
          </div>
          <h2 className={`text-3xl sm:text-4xl font-bold mt-2 ${tTheme.text}`}>{appointmentStats.today}</h2>
          <p className="text-[10px] sm:text-xs text-green-500 mt-2 flex items-center gap-1">
            <TrendingUp size={10} /> {t('lbl_appointments_today')}
          </p>
        </div>

        <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-5`}>
          <div className="flex items-center justify-between">
            <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${tTheme.subtext}`}>
              {t('lbl_pending_requests')}
            </p>
            <ClipboardList size={18} className="text-gray-400" />
          </div>
          <h2 className={`text-3xl sm:text-4xl font-bold mt-2 ${tTheme.text}`}>{appointmentStats.pending}</h2>
          <p className="text-[10px] sm:text-xs text-orange-500 mt-2 flex items-center gap-1">
            <AlertCircle size={10} /> {t('lbl_requires_attention')}
          </p>
        </div>

        <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-5`}>
          <div className="flex items-center justify-between">
            <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${tTheme.subtext}`}>
              {t('lbl_total_announcements')}
            </p>
            <Megaphone size={18} className="text-gray-400" />
          </div>
          <h2 className={`text-3xl sm:text-4xl font-bold mt-2 ${tTheme.text}`}>{announcementStats.total}</h2>
          <p className={`text-[10px] sm:text-xs mt-2 ${tTheme.subtext}`}>
            {t('lbl_active_this_month', { count: announcementStats.active })}
          </p>
        </div>
      </div>

      {/* Calendar + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-5 col-span-1`}>
          <p className={`text-sm font-semibold mb-3 ${tTheme.text}`}>{monthYear}</p>
          <div className="grid grid-cols-7 text-center text-[10px] sm:text-xs text-gray-400 mb-2">
            {["SU","MO","TU","WE","TH","FR","SA"].map(d => <span key={d}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 text-center text-xs sm:text-sm">
            {["26","27","28","29","30","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16"].map((d, i) => (
              <span key={i} className={`py-1 rounded-full cursor-pointer
                ${d === "12" ? "bg-[#E5A800] text-white font-bold" : `${tTheme.tableRow} ${tTheme.text}`}
                ${["26","27","28","29","30"].includes(d) && i < 6 ? "text-gray-300" : ""}`}>
                {d}
              </span>
            ))}
          </div>
        </div>

        <div className="col-span-1 lg:col-span-2">
          <p className={`text-sm font-semibold mb-3 flex items-center gap-2 ${tTheme.text}`}>
            ⚡ {t('lbl_quick_actions')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Link to="/gn-appointments" className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold rounded-2xl px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 transition justify-center sm:justify-start">
              <CalendarCheck size={18} /><span className="text-sm sm:text-base">{t('btn_view_appointments')}</span>
            </Link>
            <Link to="/gn-schedule" className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold rounded-2xl px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 transition justify-center sm:justify-start">
              <Clock size={18} /><span className="text-sm sm:text-base">{t('btn_update_schedule')}</span>
            </Link>
            <Link to="/gn-create-announcement" className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold rounded-2xl px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 transition justify-center sm:justify-start">
              <Megaphone size={18} /><span className="text-sm sm:text-base">{t('btn_create_announcement')}</span>
            </Link>
            <button
              onClick={() => { if (divisionRequest) setShowDivisionModal(true); else navigate("/gn-change-gn-division"); }}
              className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold rounded-2xl px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 transition justify-center sm:justify-start">
              <ArrowRightLeft size={18} /><span className="text-sm sm:text-base">{t('btn_change_gn_division')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Admin Announcements Panel ─────────────────────────────────────── */}
      <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-5`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#8B4513]/10 flex items-center justify-center">
              <Bell size={16} className="text-[#8B4513]" />
            </div>
            <div>
              <p className={`text-sm font-bold ${tTheme.text}`}>{t('lbl_notices_from_admin')}</p>
              <p className={`text-[10px] ${tTheme.subtext}`}>
                {t('lbl_active_notices', { count: adminAnnouncements.length })}
              </p>
            </div>
          </div>
          {adminAnnouncements.length > 0 && (
            <span className="text-[10px] font-bold bg-[#E5A800] text-[#3d2a00] px-2 py-0.5 rounded-full">
              {t('lbl_new')}
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
            <p className={`text-sm font-semibold ${tTheme.subtext}`}>{t('lbl_no_notices')}</p>
            <p className={`text-xs ${tTheme.subtext}`}>{t('lbl_no_notices_desc')}</p>
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
                      : `border-gray-100 ${tTheme.tableRow}`}`}
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
                          {t(`priority_${item.priority?.toLowerCase() || 'normal'}`)}
                        </span>
                        {/* Category badge */}
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${categoryStyle(item.category)}`}>
                          {categoryLabel(item.category)}
                        </span>
                      </div>

                      <p className={`text-sm font-bold leading-snug ${tTheme.text}`}>{item.title}</p>

                      {!isExpanded && item.description && (
                        <p className={`text-xs mt-0.5 line-clamp-1 ${tTheme.subtext}`}>
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[10px] ${tTheme.subtext}`}>{timeAgo(item.publishedAt)}</span>
                      <ChevronRight
                        size={14}
                        className={`text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                      />
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className={`px-4 pb-4 border-t ${isHighPriority ? "border-red-100" : "border-gray-100"}`}>
                      {item.description && (
                        <p className={`text-sm mt-3 leading-relaxed ${tTheme.text}`}>{item.description}</p>
                      )}

                      <div className={`flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] ${tTheme.subtext}`}>
                        <span>📅 {t('lbl_published')}: {formatDate(item.publishedAt)}</span>
                        {item.expiresAt && (
                          <span>⏳ {t('lbl_expires')}: {formatDate(item.expiresAt)}</span>
                        )}
                        <span>✉ {t('lbl_by')}: {item.createdBy}</span>
                      </div>

                      {item.attachments?.length > 0 && (
                        <div className="mt-3">
                          <p className={`text-[10px] font-bold uppercase tracking-wide mb-1.5 ${tTheme.subtext}`}>
                            {t('lbl_attachments')}
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
                                📎 {t('lbl_attachment', { number: i + 1 })}
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
          <div className={`${tTheme.card} rounded-2xl shadow-2xl w-full max-w-[90%] sm:max-w-md p-5 sm:p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-sm sm:text-base font-bold ${tTheme.text}`}>{t('lbl_gn_division_change_request')}</h2>
              <button onClick={() => setShowDivisionModal(false)} className={`${tTheme.subtext} hover:text-gray-600 text-xl`}>✕</button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <div>
                <p className={`text-xs ${tTheme.subtext}`}>{t('lbl_requested_division')}</p>
                <p className={`text-sm font-bold ${tTheme.text}`}>{divisionRequest?.toDivision}</p>
                <p className={`text-xs ${tTheme.subtext}`}>{divisionRequest?.toDistrict}</p>
              </div>
              <span className={`text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-center ${
                divisionRequest?.status === "Pending"  ? "bg-yellow-100 text-yellow-700" :
                divisionRequest?.status === "Approved" ? "bg-green-100 text-green-700"  :
                divisionRequest?.status === "Rejected" ? "bg-red-100 text-red-600"      :
                "bg-gray-100 text-gray-500"
              }`}>
                {divisionRequest?.status === "Pending"  ? `⏳ ${t('status_pending')}` :
                 divisionRequest?.status === "Approved" ? `✅ ${t('status_approved')}` :
                 divisionRequest?.status === "Rejected" ? `❌ ${t('status_rejected')}` :
                 divisionRequest?.status}
              </span>
            </div>

            <p className={`text-xs ${tTheme.subtext} mb-4`}>
              {t('lbl_submitted')}: {divisionRequest?.createdAt?.toDate?.()?.toLocaleDateString(i18n.language, {
                year: "numeric", month: "short", day: "numeric"
              }) || "—"}
            </p>

            {divisionRequest?.status === "Pending" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 sm:px-4 py-3 mb-4">
                <p className="text-xs text-yellow-700 font-semibold">{t('lbl_under_review')}</p>
              </div>
            )}
            {divisionRequest?.status === "Approved" && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-3 sm:px-4 py-3 mb-4">
                <p className="text-xs text-green-700 font-semibold">{t('lbl_approved_message')}</p>
              </div>
            )}
            {divisionRequest?.status === "Rejected" && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 sm:px-4 py-3 mb-4">
                <p className="text-xs text-red-600 font-semibold">{t('lbl_rejected_message')}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowDivisionModal(false)}
                className={`flex-1 border ${tTheme.border} ${tTheme.subtext} font-semibold py-2 rounded-xl hover:bg-gray-50 transition text-sm`}>
                {t('lbl_close')}
              </button>
              {divisionRequest?.status === "Rejected" && (
                <button onClick={() => { setShowDivisionModal(false); navigate("/gn-change-gn-division"); }}
                  className="flex-1 bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold py-2 rounded-xl transition text-sm">
                  {t('btn_new_request')}
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