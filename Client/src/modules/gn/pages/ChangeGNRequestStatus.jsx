import { useState, useEffect } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { auth, db } from "../../firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ChangeGNRequestStatus = ({ gnStatus, theme }) => {
  const { t, i18n } = useTranslation();
  const tTheme = getThemeClasses(theme);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        
        const q = query(
          collection(db, "transfer_requests"),
          where("uid", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRequests(data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  
  const getStatusStyle = (status) => {
    const map = {
      Pending:  { bg: "bg-yellow-100", text: "text-yellow-700", icon: "⏳" },
      Approved: { bg: "bg-green-100",  text: "text-green-700",  icon: "✅" },
      Rejected: { bg: "bg-red-100",    text: "text-red-700",    icon: "❌" },
    };
    return map[status] || map.Pending;
  };

  const getStatusLabel = (status) => {
    const map = {
      Pending: t("status_pending"),
      Approved: t("status_approved"),
      Rejected: t("status_rejected"),
    };
    return map[status] || status;
  };

  const formatDate = (ts) => {
    if (!ts) return t("na");
    const d = ts?.toDate?.() || new Date(ts);
    return d.toLocaleDateString(i18n.language || "en-US", {
      year: "numeric", month: "long", day: "numeric"
    });
  };

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#8B4513]">{t("transfer_request_status_title")}</h1>
        <Link
          to="/transfer-request"
          className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition">
          + {t("new_request_btn")}
        </Link>
      </div>

      {/* Loading */}
      {loading ? (
        <div className={`${tTheme.card} rounded-2xl shadow p-12 text-center`}>
          <p className={`text-sm ${tTheme.subtext}`}>{t("loading_requests")}</p>
        </div>

      ) : requests.length === 0 ? (
        /* Empty State */
        <div className={`${tTheme.card} rounded-2xl shadow p-12 text-center`}>
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📋</span>
          </div>
          <h2 className={`text-lg font-bold mb-2 ${tTheme.text}`}>{t("no_requests_title")}</h2>
          <p className={`text-sm mb-6 ${tTheme.subtext}`}>
            {t("no_requests_desc")}
          </p>
          <Link
            to="/transfer-request"
            className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold px-6 py-2 rounded-xl inline-flex items-center gap-2 transition">
            {t("submit_request_btn")} <ArrowRight size={16} />
          </Link>
        </div>

      ) : (
        /* Requests List */
        <div className="space-y-4">
          {requests.map((req) => {
            const style = getStatusStyle(req.status);
            const statusLabel = getStatusLabel(req.status);
            return (
              <div key={req.id} className={`${tTheme.card} rounded-2xl shadow p-6`}>
                <div className="flex items-start justify-between mb-4">

                  {/* Status Badge */}
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${style.bg}`}>
                    <span>{style.icon}</span>
                    <span className={`text-sm font-bold ${style.text}`}>{statusLabel}</span>
                  </div>

                  {/* Date */}
                  <p className={`text-xs ${tTheme.subtext}`}>
                    {t("submitted_label")}: {formatDate(req.createdAt)}
                  </p>

                </div>

                {/* Transfer Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className={`p-4 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                    <p className={`text-xs font-semibold uppercase mb-2 ${tTheme.subtext}`}>{t("from_label")}</p>
                    <p className={`text-sm font-bold ${tTheme.text}`}>{req.fromDivision || t("na")}</p>
                    <p className={`text-xs ${tTheme.subtext}`}>{req.fromDistrict || t("na")} {t("district_label")}</p>
                  </div>
                  <div className={`p-4 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                    <p className={`text-xs font-semibold uppercase mb-2 ${tTheme.subtext}`}>{t("to_label")}</p>
                    <p className={`text-sm font-bold ${tTheme.text}`}>{req.toDivision || t("na")}</p>
                    <p className={`text-xs ${tTheme.subtext}`}>{req.toDistrict || t("na")} {t("district_label")}</p>
                  </div>
                </div>

                {/* Reason */}
                <div className="mb-4">
                  <p className={`text-xs font-semibold uppercase mb-1 ${tTheme.subtext}`}>{t("reason_label")}</p>
                  <p className={`text-sm ${tTheme.text}`}>{req.reason || t("na")}</p>
                </div>

                {/* Effective Date */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-semibold uppercase mb-1 ${tTheme.subtext}`}>{t("effective_date_label")}</p>
                    <p className={`text-sm font-semibold ${tTheme.text}`}>{req.effectiveDate || t("na")}</p>
                  </div>

                  {/* Admin Response */}
                  {req.adminNote && (
                    <div className={`p-3 rounded-xl border ${tTheme.border} max-w-xs`}>
                      <p className={`text-xs font-semibold uppercase mb-1 ${tTheme.subtext}`}>{t("admin_response_label")}</p>
                      <p className={`text-sm ${tTheme.text}`}>{req.adminNote}</p>
                    </div>
                  )}
                </div>

                {/* Transfer Letter */}
                {req.transferLetter && (
                  <div className="mt-4">
                    <a
                      href={req.transferLetter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#E5A800] font-semibold hover:underline flex items-center gap-1">
                      📄 {t("view_transfer_letter")}
                    </a>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </GNLayout>
  );
};

export default ChangeGNRequestStatus;