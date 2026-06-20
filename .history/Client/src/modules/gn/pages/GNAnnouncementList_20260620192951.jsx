import { useState, useEffect } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { Link } from "react-router-dom";
import { Megaphone, Clock, Eye, Pencil, Trash2, X, Loader2, Save, Paperclip } from "lucide-react";
import {
  collection, query, where, getDocs,
  deleteDoc, doc, updateDoc, Timestamp, getDoc
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { logActivity } from "../../../logActivity";
import { useTranslation } from "react-i18next"; // ✅ make sure this import is present

const ITEMS_PER_PAGE = 5;

const GNAnnouncementList = ({ gnStatus, theme }) => {
  const { t, i18n } = useTranslation(); // ✅ destructure i18n here
  const tTheme = getThemeClasses(theme);

  const [announcements, setAnnouncements]   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [currentPage, setCurrentPage]       = useState(1);
  const [filterStatus, setFilterStatus]     = useState("All");
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // ─── Edit Modal State ────────────────────────────────────────────────────────
  const [editingItem, setEditingItem]       = useState(null);
  const [editForm, setEditForm]             = useState({});
  const [saving, setSaving]                 = useState(false);

  // ─── Delete Confirm State ────────────────────────────────────────────────────
  const [deletingId, setDeletingId]         = useState(null);
  const [confirmDelete, setConfirmDelete]   = useState(null);

  // ─── Fetch from Firestore ────────────────────────────────────────────────────
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      const officerSnap = await getDoc(doc(db, "gn_officers", user.uid));
      const officerData = officerSnap.exists() ? officerSnap.data() : {};
      const gnDiv = officerData.gnDiv || "";

      const myQ = query(
        collection(db, "announcements"),
        where("createdByUid", "==", user.uid)
      );

      const divQ = query(
        collection(db, "announcements"),
        where("gnDiv", "==", gnDiv),
        where("status", "==", "Active")
      );

      const [mySnap, divSnap] = await Promise.all([
        getDocs(myQ),
        gnDiv ? getDocs(divQ) : Promise.resolve({ docs: [] })
      ]);

      const seen = new Set();
      const merged = [];
      for (const d of [...mySnap.docs, ...divSnap.docs]) {
        if (!seen.has(d.id)) {
          seen.add(d.id);
          merged.push({ id: d.id, ...d.data() });
        }
      }

      merged.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));

      setAnnouncements(merged);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchAnnouncements(); }, []);

  // ─── Determine live status ───────────────────────────────────────────────────
  const getStatus = (item) => {
    if (item.status === "Draft")     return t('status_draft');
    if (item.status === "Scheduled") return t('status_scheduled');
    if (item.expiresAt) {
      const expiry = item.expiresAt?.toDate?.() || new Date(item.expiresAt);
      if (expiry < new Date()) return t('status_expired');
    }
    if (item.status === "Published") return t('status_active');
    return item.status;
  };

  const getStatusClass = (statusKey) => {
    const map = {
      [t('status_active')]: "Active",
      [t('status_expired')]: "Expired",
      [t('status_draft')]: "Draft",
      [t('status_scheduled')]: "Scheduled",
    };
    return map[statusKey] || statusKey;
  };

  const statusStyle = {
    Active:    "bg-green-100 text-green-700",
    Expired:   "bg-gray-100 text-gray-500",
    Draft:     "bg-yellow-100 text-yellow-700",
    Scheduled: "bg-blue-100 text-blue-700",
  };

  // ─── Stats ───────────────────────────────────────────────────────────────────
  const activeCount    = announcements.filter((a) => getStatus(a) === t('status_active')).length;
  const scheduledCount = announcements.filter((a) => getStatus(a) === t('status_scheduled')).length;
  const draftCount     = announcements.filter((a) => getStatus(a) === t('status_draft')).length;

  // ─── Filter + Paginate ───────────────────────────────────────────────────────
  const filtered = filterStatus === "All"
    ? announcements
    : announcements.filter((a) => getStatus(a) === filterStatus);

  const totalPages  = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated   = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ─── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeletingId(id);
    const item = announcements.find((a) => a.id === id);
    try {
      await deleteDoc(doc(db, "announcements", id));
      await logActivity("announcement", "Deleted", item?.title || t('announcement'), "Announcement deleted");
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      setConfirmDelete(null);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Open Edit Modal ─────────────────────────────────────────────────────────
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditForm({
      title:       item.title       || "",
      description: item.description || "",
      category:    item.category    || "General",
      priority:    item.priority    || "Normal",
      expiryDate:  item.expiresAt
        ? new Date(
            item.expiresAt?.seconds
              ? item.expiresAt.seconds * 1000
              : item.expiresAt
          ).toISOString().split("T")[0]
        : "",
      attachments: Array.isArray(item.attachments) ? item.attachments : [],
    });
  };

  // ─── Upload Attachment (in edit modal) ───────────────────────────────────────
  const handleAttachmentUpload = async (files) => {
    if (!files.length) return;
    setUploadingAttachment(true);
    const uploaded = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} ${t('exceeds_10mb')}`);
        continue;
      }
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "gn_documents");
        formData.append("cloud_name", "dsi9xh1fd");

        const res  = await fetch("https://api.cloudinary.com/v1_1/dsi9xh1fd/auto/upload", {
          method: "POST", body: formData,
        });
        const data = await res.json();
        if (data.secure_url) {
          uploaded.push({ name: file.name, url: data.secure_url, type: file.type });
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }
    setEditForm((prev) => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...uploaded],
    }));
    setUploadingAttachment(false);
  };

  // ─── Edit Save ───────────────────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const updates = {
        title:       editForm.title,
        description: editForm.description,
        category:    editForm.category,
        priority:    editForm.priority,
        attachments: editForm.attachments || [],
        expiresAt:   editForm.expiryDate
          ? Timestamp.fromDate(new Date(editForm.expiryDate))
          : null,
      };

      await updateDoc(doc(db, "announcements", editingItem.id), updates);
      await logActivity("announcement", "Edited", editForm.title, "Announcement updated");

      setAnnouncements((prev) =>
        prev.map((a) => a.id === editingItem.id ? {
          ...a,
          title:       editForm.title,
          description: editForm.description,
          category:    editForm.category,
          priority:    editForm.priority,
          attachments: editForm.attachments || [],
          expiresAt:   editForm.expiryDate
            ? { toDate: () => new Date(editForm.expiryDate), seconds: new Date(editForm.expiryDate).getTime() / 1000 }
            : null,
        } : a)
      );

      setEditingItem(null);
    } catch (err) {
      console.error("Edit error:", err);
    } finally {
      setSaving(false);
    }
  };

  // ✅ FIX: use i18n.language safely
  const formatDate = (ts) => {
    if (!ts) return t('na');
    const d = ts?.toDate?.() || new Date(ts);
    const lang = i18n?.language || 'en-US';
    return d.toLocaleDateString(lang, { year: "numeric", month: "short", day: "numeric" });
  };

  const getPriorityLabel = (priority) => {
    if (!priority) return t('priority_normal');
    const map = {
      'Normal': t('priority_normal'),
      'High': t('priority_high'),
      'Urgent': t('priority_urgent')
    };
    return map[priority] || priority;
  };

  const getPriorityColor = (priority) => {
    if (priority === "Urgent") return "text-red-500";
    if (priority === "High") return "text-orange-500";
    return "text-gray-500";
  };

  const navigate = useNavigate();

  const filterTabs = [
    { key: "All", label: t('tab_all') },
    { key: t('status_active'), label: t('status_active') },
    { key: t('status_scheduled'), label: t('status_scheduled') },
    { key: t('status_draft'), label: t('status_draft') },
    { key: t('status_expired'), label: t('status_expired') },
  ];

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#8B4513] text-center sm:text-left">{t('announcement_list_title')}</h1>
        <Link to="/gn-create-announcement"
          className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition text-sm sm:text-base">
          ＋ {t('create_new_announcement')}
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-6">
        {[
          { label: t('stats_active_notices'), value: activeCount,    icon: <Megaphone size={24} className="text-gray-300" /> },
          { label: t('stats_scheduled'),      value: scheduledCount, icon: <Clock     size={24} className="text-gray-300" /> },
          { label: t('stats_drafts'),         value: draftCount,     icon: <Eye       size={24} className="text-gray-300" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-5 flex items-center justify-between`}>
            <div>
              <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-left ${tTheme.subtext}`}>{label}</p>
              <h2 className={`text-2xl sm:text-3xl font-bold mt-1 text-left ${tTheme.text}`}>{loading ? "—" : value}</h2>
            </div>
            {icon}
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className={`flex flex-wrap gap-2 mb-4`}>
        {filterTabs.map(({ key, label }) => (
          <button key={key} onClick={() => { setFilterStatus(key); setCurrentPage(1); }}
            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition whitespace-nowrap
              ${filterStatus === key
                ? "bg-[#8B4513] text-white"
                : `border ${tTheme.border} ${tTheme.subtext} hover:border-[#8B4513]`}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={`${tTheme.card} rounded-2xl shadow overflow-x-auto`}>
        <div className="min-w-[700px] md:min-w-full">
          <table className="w-full text-sm">
            <thead className={`${tTheme.tableHead} uppercase text-xs`}>
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left">{t('table_title')}</th>
                <th className="px-3 sm:px-6 py-3 text-left">{t('table_category')}</th>
                <th className="px-3 sm:px-6 py-3 text-left">{t('table_published')}</th>
                <th className="px-3 sm:px-6 py-3 text-left">{t('table_expires')}</th>
                <th className="px-3 sm:px-6 py-3 text-left">{t('table_status')}</th>
                <th className="px-3 sm:px-6 py-3 text-left">{t('table_actions')}</th>
              </tr>
            </thead>
            <tbody className={tTheme.divider}>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                    <Loader2 size={24} className="animate-spin text-[#E5A800] mx-auto mb-2" />
                    <p className={`text-xs ${tTheme.subtext}`}>{t('loading_announcements')}</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                    <Megaphone size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className={`text-sm font-semibold ${tTheme.subtext}`}>{t('no_announcements_found')}</p>
                    <Link to="/gn-create-announcement" className="text-xs text-[#E5A800] font-semibold hover:underline mt-1 inline-block">
                      {t('create_first_announcement')}
                    </Link>
                  </td>
                </tr>
              ) : (
                paginated.map((item) => {
                  const statusKey = getStatus(item);
                  const statusClass = getStatusClass(statusKey);
                  return (
                    <tr key={item.id} className={tTheme.tableRow}>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <p className={`font-semibold text-left text-sm sm:text-base ${tTheme.text}`}>{item.title}</p>
                        <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext} mt-0.5`}>
                          {t('priority_label')}: <span className={`font-bold ${getPriorityColor(item.priority)}`}>
                            {getPriorityLabel(item.priority)}
                          </span>
                        </p>
                      </td>
                      <td className={`px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm ${tTheme.subtext}`}>{item.category || t('general')}</td>
                      <td className={`px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm ${tTheme.subtext}`}>{formatDate(item.publishedAt || item.createdAt)}</td>
                      <td className={`px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm ${tTheme.subtext}`}>{item.expiresAt ? formatDate(item.expiresAt) : "—"}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-left">
                        <span className={`text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 rounded-full whitespace-nowrap ${statusStyle[statusClass] || "bg-gray-100 text-gray-500"}`}>
                          {statusKey}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="text-gray-400 hover:text-blue-500 transition">
                            <Pencil size={14} className="sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(item.id)}
                            className="text-gray-400 hover:text-red-500 transition">
                            <Trash2 size={14} className="sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className={`px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t ${tTheme.border}`}>
            <p className={`text-[10px] sm:text-xs text-center sm:text-left ${tTheme.subtext}`}>
              {t('showing_announcements', {
                start: (currentPage - 1) * ITEMS_PER_PAGE + 1,
                end: Math.min(currentPage * ITEMS_PER_PAGE, filtered.length),
                total: filtered.length
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

      {/* ── Edit Modal ── */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className={`${tTheme.card} rounded-2xl shadow-2xl w-full max-w-[90%] sm:max-w-lg flex flex-col max-h-[90vh]`}>

            {/* Header */}
            <div className={`flex items-center justify-between p-4 sm:p-5 border-b ${tTheme.border} flex-shrink-0`}>
              <h2 className={`text-sm sm:text-base font-bold text-left ${tTheme.text}`}>{t('edit_announcement')}</h2>
              <button onClick={() => setEditingItem(null)} className={`${tTheme.subtext} hover:text-gray-600`}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">

              {/* Title */}
              <div>
                <label className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide mb-1 block text-left ${tTheme.subtext}`}>{t('form_title')}</label>
                <input type="text" value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className={`w-full border ${tTheme.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`} />
              </div>

              {/* Category + Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide mb-1 block text-left ${tTheme.subtext}`}>{t('form_category')}</label>
                  <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className={`w-full border ${tTheme.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`}>
                    {[t('general'), t('emergency'), t('event'), t('health'), t('education'), t('infrastructure'), t('other')].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide mb-1 block text-left ${tTheme.subtext}`}>{t('form_priority')}</label>
                  <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className={`w-full border ${tTheme.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`}>
                    {[t('priority_normal'), t('priority_high'), t('priority_urgent')].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide mb-1 block text-left ${tTheme.subtext}`}>{t('form_description')}</label>
                <textarea value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4} className={`w-full border ${tTheme.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] resize-none ${tTheme.input}`} />
              </div>

              {/* Expiry Date */}
              <div>
                <label className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide mb-1 block text-left ${tTheme.subtext}`}>{t('form_expiry_date')}</label>
                <input type="date" value={editForm.expiryDate}
                  onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })}
                  className={`w-full border ${tTheme.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`} />
              </div>

              {/* Attachments */}
              <div>
                <label className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide mb-2 block text-left ${tTheme.subtext}`}>
                  {t('form_attachments')}
                </label>

                {(editForm.attachments || []).length > 0 && (
                  <div className="space-y-2 mb-3">
                    {editForm.attachments.map((file, i) => (
                      <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-xl border ${tTheme.border} ${tTheme.input}`}>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Paperclip size={13} className="text-[#8B4513] flex-shrink-0" />
                          <a href={file.url} target="_blank" rel="noreferrer"
                            className="text-xs font-semibold text-[#8B4513] hover:underline truncate">
                            {file.name}
                          </a>
                        </div>
                        <button
                          onClick={() =>
                            setEditForm((prev) => ({
                              ...prev,
                              attachments: prev.attachments.filter((_, idx) => idx !== i),
                            }))
                          }
                          className="text-gray-400 hover:text-red-500 transition flex-shrink-0 ml-2">
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className={`border-2 border-dashed ${tTheme.border} rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-[#E5A800] transition`}>
                  <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.docx"
                    className="hidden"
                    onChange={(e) => handleAttachmentUpload(Array.from(e.target.files))} />
                  {uploadingAttachment
                    ? <Loader2 size={20} className="text-[#E5A800] animate-spin mb-1" />
                    : <Paperclip size={20} className="text-gray-400 mb-1" />
                  }
                  <p className={`text-xs font-semibold text-center ${tTheme.text}`}>
                    {uploadingAttachment ? t('uploading') : t('click_to_add_files')}
                  </p>
                  <p className={`text-[10px] mt-0.5 text-center ${tTheme.subtext}`}>{t('file_requirements')}</p>
                </label>
              </div>

            </div>

            {/* Footer */}
            <div className={`flex justify-end gap-3 px-4 sm:px-5 py-4 border-t ${tTheme.border} flex-shrink-0`}>
              <button onClick={() => setEditingItem(null)}
                className={`text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl border ${tTheme.border} ${tTheme.subtext} hover:bg-gray-100 transition`}>
                {t('cancel')}
              </button>
              <button onClick={handleSaveEdit} disabled={saving}
                className="text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl bg-[#E5A800] hover:bg-[#cc9600] text-black disabled:opacity-60 flex items-center gap-2 transition">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? t('saving_changes') : t('save_changes')}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className={`${tTheme.card} rounded-2xl shadow-2xl w-full max-w-[90%] sm:max-w-sm p-5 sm:p-6 text-center`}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Trash2 size={18} className="sm:w-[22px] sm:h-[22px] text-red-500" />
            </div>
            <h2 className={`text-sm sm:text-base font-bold mb-2 text-center ${tTheme.text}`}>{t('delete_confirm_title')}</h2>
            <p className={`text-[10px] sm:text-xs text-center ${tTheme.subtext} mb-4 sm:mb-5`}>{t('delete_confirm_desc')}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirmDelete(null)}
                className={`px-4 sm:px-5 py-2 rounded-xl border ${tTheme.border} text-xs sm:text-sm font-semibold ${tTheme.subtext} hover:bg-gray-100 transition`}>
                {t('cancel')}
              </button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={!!deletingId}
                className="px-4 sm:px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-semibold disabled:opacity-60 flex items-center gap-2 transition">
                {deletingId ? <Loader2 size={14} className="animate-spin" /> : null}
                {deletingId ? t('deleting') : t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

    </GNLayout>
  );
};

export default GNAnnouncementList;