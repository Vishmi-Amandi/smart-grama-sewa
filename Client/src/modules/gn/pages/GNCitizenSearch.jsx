import { useState } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { Search, Download, X, Loader2, User } from "lucide-react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";
import { useTranslation } from "react-i18next";

const ITEMS_PER_PAGE = 10;

// Generate initials from full name
const getInitials = (name) => {
  if (!name) return "?";
  const words = name.trim().split(" ");
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

// Random avatar color based on name
const avatarColor = (name) => {
  const colors = [
    "bg-red-200 text-red-700",
    "bg-yellow-200 text-yellow-700",
    "bg-green-200 text-green-700",
    "bg-blue-200 text-blue-700",
    "bg-purple-200 text-purple-700",
    "bg-pink-200 text-pink-700",
  ];
  const i = (name?.charCodeAt(0) || 0) % colors.length;
  return colors[i];
};

const GNCitizenSearch = ({ gnStatus, theme }) => {
  const { t, i18n } = useTranslation();
  const tTheme = getThemeClasses(theme);

  const [nameInput,    setNameInput]    = useState("");
  const [nicInput,     setNicInput]     = useState("");
  const [results,      setResults]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [searched,     setSearched]     = useState(false);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error,        setError]        = useState("");

  // ─── Search Firestore ────────────────────────────────────────────────────────
  const handleSearch = async () => {
    const nameTrim = nameInput.trim();
    const nicTrim  = nicInput.trim();

    if (!nameTrim && !nicTrim) {
      setError(t('err_enter_name_or_nic'));
      return;
    }

    setError("");
    setLoading(true);
    setSearched(false);
    setResults([]);
    setCurrentPage(1);

    try {
      let snap;

      if (nicTrim) {
        const q = query(
          collection(db, "users"),
          where("role", "==", "citizen"),
          where("nic", "==", nicTrim),
          limit(50)
        );
        snap = await getDocs(q);
      } else {
        const q = query(
          collection(db, "users"),
          where("role", "==", "citizen"),
          where("fullName", ">=", nameTrim),
          where("fullName", "<=", nameTrim + "\uf8ff"),
          orderBy("fullName"),
          limit(50)
        );
        snap = await getDocs(q);
      }

      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setResults(data);
      setSearched(true);
    } catch (err) {
      console.error("Search error:", err);
      if (err.code === "failed-precondition") {
        setError(t('err_index_building'));
      } else {
        setError(t('err_search_failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleSearch(); };

  // ─── Download CSV ─────────────────────────────────────────────────────────────
  const handleDownloadCSV = () => {
    if (!results.length) return;
    const headers = [
      t('csv_full_name'),
      t('csv_nic'),
      t('csv_mobile'),
      t('csv_email'),
      t('csv_address'),
      t('csv_district'),
      t('csv_ds_division'),
      t('csv_gn_division'),
      t('csv_username')
    ];
    const rows = results.map((c) => [
      c.fullName, c.nic, c.mobile, c.email, c.address,
      c.district, c.dsDiv, c.gnDiv, c.username,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "citizens.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Pagination ───────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const paginated  = results.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      <h1 className="text-xl sm:text-2xl font-bold text-[#8B4513] mb-4 sm:mb-6 text-center sm:text-left">
        {t('lbl_citizen_search')}
      </h1>

      {/* Search Bar - Responsive */}
      <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-5 mb-6 border-2 border-dashed border-blue-200`}>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">

          {/* Name Input */}
          <div className={`flex-1 flex items-center border ${tTheme.border} rounded-xl px-4 py-2 gap-2`}>
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <input type="text" value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('search_placeholder_name')}
              className={`w-full text-sm outline-none ${tTheme.input}`} />
          </div>

          {/* NIC Input */}
          <div className={`flex-1 flex items-center border ${tTheme.border} rounded-xl px-4 py-2 gap-2`}>
            <span className="text-gray-400 text-xs flex-shrink-0">🪪</span>
            <input type="text" value={nicInput}
              onChange={(e) => setNicInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('search_placeholder_nic')}
              className={`w-full text-sm outline-none ${tTheme.input}`} />
          </div>

          {/* Search Button */}
          <button onClick={handleSearch} disabled={loading}
            className="bg-[#3B1F0A] text-white font-semibold px-6 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-[#2a1506] disabled:opacity-60 transition">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {loading ? t('searching') : t('btn_search')}
          </button>

        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-xs font-semibold mt-3 flex items-center gap-1 text-left">
            <span>⚠</span> {error}
          </p>
        )}
      </div>

      {/* Results Table - Mobile responsive with horizontal scroll */}
      <div className={`${tTheme.card} rounded-2xl shadow overflow-x-auto`}>

        <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b ${tTheme.border}`}>
          <p className={`text-xs sm:text-sm font-semibold text-center sm:text-left ${tTheme.text}`}>
            {searched
              ? results.length > 0
                ? t('results_found', { count: results.length })
                : t('no_results_found')
              : t('search_results_label')}
          </p>
          {results.length > 0 && (
            <button onClick={handleDownloadCSV}
              className="flex items-center gap-2 text-[10px] sm:text-xs text-[#8B4513] font-semibold hover:underline">
              <Download size={14} /> {t('download_csv')}
            </button>
          )}
        </div>

        <div className="min-w-[800px] md:min-w-full">
        <table className="w-full text-sm">
          <thead className={`${tTheme.tableHead} uppercase text-xs`}>
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left">{t('table_citizen_details')}</th>
              <th className="px-3 sm:px-6 py-3 text-left">{t('table_nic')}</th>
              <th className="px-3 sm:px-6 py-3 text-left">{t('table_contact')}</th>
              <th className="px-3 sm:px-6 py-3 text-left">{t('table_gn_division')}</th>
              <th className="px-3 sm:px-6 py-3 text-left">{t('table_action')}</th>
            </tr>
          </thead>

          <tbody className={tTheme.divider}>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                  <Loader2 size={24} className="animate-spin text-[#E5A800] mx-auto mb-2" />
                  <p className={`text-xs ${tTheme.subtext}`}>{t('searching_citizens')}</p>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                  <User size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className={`text-sm font-semibold ${tTheme.subtext}`}>
                    {searched ? t('no_citizens_found') : t('enter_name_or_nic_to_search')}
                  </p>
                </td>
              </tr>
            ) : (
              paginated.map((c) => (
                <tr key={c.id} className={tTheme.tableRow}>

                  {/* Citizen Details */}
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 ${avatarColor(c.fullName)}`}>
                        {getInitials(c.fullName)}
                      </div>
                      <div>
                        <p className={`font-semibold text-left text-sm sm:text-base ${tTheme.text}`}>{c.fullName || t('na')}</p>
                        <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>{c.address || t('no_address')}</p>
                      </div>
                    </div>
                  </td>

                  {/* NIC */}
                  <td className={`px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm ${tTheme.subtext}`}>{c.nic || t('na')}</td>

                  {/* Contact */}
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-left">
                    <p className={`text-xs sm:text-sm text-left ${tTheme.subtext}`}>{c.mobile || t('na')}</p>
                    <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>{c.email || ""}</p>
                  </td>

                  {/* GN Division */}
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-left">
                    <p className={`text-xs sm:text-sm text-left ${tTheme.subtext}`}>{c.gnDiv || t('na')}</p>
                    <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>{c.dsDiv || ""}</p>
                  </td>

                  {/* Action */}
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <button
                      onClick={() => setSelectedUser(c)}
                      className="border border-[#8B4513] text-[#8B4513] text-[10px] sm:text-xs font-semibold px-2 sm:px-4 py-1 rounded-lg hover:bg-[#8B4513] hover:text-white transition whitespace-nowrap">
                      {t('btn_view_profile')}
                    </button>
                   </td>

                </tr>
              ))
            )}
          </tbody>
         </table>
        </div>

        {/* Pagination - Responsive */}
        {results.length > ITEMS_PER_PAGE && (
          <div className={`px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t ${tTheme.border}`}>
            <p className={`text-[10px] sm:text-xs text-center sm:text-left ${tTheme.subtext}`}>
              {t('showing_results', {
                start: (currentPage - 1) * ITEMS_PER_PAGE + 1,
                end: Math.min(currentPage * ITEMS_PER_PAGE, results.length),
                total: results.length
              })}
            </p>
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full ${tTheme.tableRow} ${tTheme.subtext} text-[10px] sm:text-xs disabled:opacity-40`}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[10px] sm:text-xs font-bold transition
                    ${currentPage === page ? "bg-[#E5A800] text-black" : `${tTheme.tableRow} ${tTheme.subtext}`}`}>
                  {page}
                </button>
              ))}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full ${tTheme.tableRow} ${tTheme.subtext} text-[10px] sm:text-xs disabled:opacity-40`}>›</button>
            </div>
          </div>
        )}

      </div>

      {/* ── Citizen Profile Modal - Responsive ── */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className={`${tTheme.card} rounded-2xl shadow-2xl w-full max-w-[90%] sm:max-w-lg max-h-[90vh] overflow-y-auto`}>

            {/* Modal Header */}
            <div className={`flex items-center justify-between p-4 sm:p-5 border-b ${tTheme.border}`}>
              <h2 className={`text-sm sm:text-base font-bold text-left ${tTheme.text}`}>{t('citizen_profile')}</h2>
              <button onClick={() => setSelectedUser(null)} className={`${tTheme.subtext} hover:text-gray-600`}>
                <X size={18} />
              </button>
            </div>

            {/* Avatar + Name */}
            <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4 flex items-center gap-3 sm:gap-4">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl sm:text-2xl font-black flex-shrink-0 ${avatarColor(selectedUser.fullName)}`}>
                {getInitials(selectedUser.fullName)}
              </div>
              <div>
                <h3 className={`text-base sm:text-lg font-black text-left ${tTheme.text}`}>{selectedUser.fullName || t('na')}</h3>
                <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>@{selectedUser.username || t('na')}</p>
                <span className="text-[10px] sm:text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">{t('role_citizen')}</span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="px-4 sm:px-6 pb-5 sm:pb-6 space-y-3 sm:space-y-4">

              {/* Personal */}
              <div className={`rounded-xl p-3 sm:p-4 ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                <p className={`text-[10px] sm:text-xs font-black uppercase tracking-wide mb-2 sm:mb-3 text-left ${tTheme.subtext}`}>{t('personal_details')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: t('lbl_full_name'), value: selectedUser.fullName },
                    { label: t('lbl_nic'), value: selectedUser.nic },
                    { label: t('lbl_dob'), value: selectedUser.dob },
                    { label: t('lbl_email'), value: selectedUser.email },
                    { label: t('lbl_mobile'), value: selectedUser.mobile },
                    { label: t('lbl_address'), value: selectedUser.address },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>{label}</p>
                      <p className={`text-xs sm:text-sm font-semibold text-left ${tTheme.text} break-words`}>{value || t('na')}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className={`rounded-xl p-3 sm:p-4 ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                <p className={`text-[10px] sm:text-xs font-black uppercase tracking-wide mb-2 sm:mb-3 text-left ${tTheme.subtext}`}>{t('location_details')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: t('lbl_district'), value: selectedUser.district },
                    { label: t('lbl_ds_division'), value: selectedUser.dsDiv },
                    { label: t('lbl_gn_division'), value: selectedUser.gnDiv },
                    { label: t('lbl_gn_code'), value: selectedUser.gnCode || t('na') },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>{label}</p>
                      <p className={`text-xs sm:text-sm font-semibold text-left ${tTheme.text}`}>{value || t('na')}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Info */}
              <div className={`rounded-xl p-3 sm:p-4 ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                <p className={`text-[10px] sm:text-xs font-black uppercase tracking-wide mb-2 sm:mb-3 text-left ${tTheme.subtext}`}>{t('account_info')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>{t('lbl_username')}</p>
                    <p className={`text-xs sm:text-sm font-semibold text-left ${tTheme.text}`}>@{selectedUser.username || t('na')}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>{t('registered')}</p>
                    <p className={`text-xs sm:text-sm font-semibold text-left ${tTheme.text}`}>
                      {selectedUser.createdAt
                        ? (selectedUser.createdAt?.toDate?.() || new Date(selectedUser.createdAt))
                            .toLocaleDateString(i18n.language || 'en-US', { year: "numeric", month: "short", day: "numeric" })
                        : t('na')}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            <div className="px-4 sm:px-6 pb-5 sm:pb-6 flex justify-end">
              <button onClick={() => setSelectedUser(null)}
                className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold px-5 sm:px-6 py-1.5 sm:py-2 rounded-xl transition text-xs sm:text-sm">
                {t('lbl_close')}
              </button>
            </div>

          </div>
        </div>
      )}

    </GNLayout>
  );
};

export default GNCitizenSearch;