import { useState, useEffect } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { Link } from "react-router-dom";
import { Megaphone, Clock, Eye, Pencil, Trash2, X, Loader2, Save } from "lucide-react";
import {
  collection, query, where, orderBy, getDocs,
  deleteDoc, doc, updateDoc, Timestamp
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { logActivity } from "../../../logActivity";

const ITEMS_PER_PAGE = 5;

const GNAnnouncementList = ({ gnStatus, theme }) => {
  const t = getThemeClasses(theme);

  const [announcements, setAnnouncements]   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [currentPage, setCurrentPage]       = useState(1);
  const [filterStatus, setFilterStatus]     = useState("All");

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
      const q = query(
        collection(db, "announcements"),
        where("createdBy", "==", user?.uid || ""),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAnnouncements(data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  // ─── Determine live status ───────────────────────────────────────────────────
  const getStatus = (item) => {
    if (item.status === "Draft")     return "Draft";
    if (item.status === "Scheduled") return "Scheduled";
    if (item.expiresAt) {
      const expiry = item.expiresAt?.toDate?.() || new Date(item.expiresAt);
      if (expiry < new Date()) return "Expired";
    }
    if (item.status === "Published") return "Active";
    return item.status;
  };

  const statusStyle = {
    Active:    "bg-green-100 text-green-700",
    Expired:   "bg-gray-100 text-gray-500",
    Draft:     "bg-yellow-100 text-yellow-700",
    Scheduled: "bg-blue-100 text-blue-700",
  };

  // ─── Stats ───────────────────────────────────────────────────────────────────
  const activeCount    = announcements.filter((a) => getStatus(a) === "Active").length;
  const scheduledCount = announcements.filter((a) => getStatus(a) === "Scheduled").length;
  const draftCount     = announcements.filter((a) => getStatus(a) === "Draft").length;

  // ─── Filter + Paginate ───────────────────────────────────────────────────────
  const filtered = filterStatus === "All"
    ? announcements
    : announcements.filter((a) => getStatus(a) === filterStatus);

  const totalPages  = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated   = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ─── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "announcements", id));
      await logActivity("announcement", "Deleted", item?.title || "Announcement", "Announcement deleted");
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      setConfirmDelete(null);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeletingId(null);
    }
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
      expiresAt:   editForm.expiryDate
        ? Timestamp.fromDate(new Date(editForm.expiryDate))
        : null,
    };

    // ✅ Actually save to Firestore
    await updateDoc(doc(db, "announcements", editingItem.id), updates);
    await logActivity("announcement", "Edited", editForm.title, "Announcement updated");

    // ✅ Update local state
    setAnnouncements((prev) =>
      prev.map((a) => a.id === editingItem.id ? {
        ...a,
        title:       editForm.title,
        description: editForm.description,
        category:    editForm.category,
        priority:    editForm.priority,
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

  const formatDate = (ts) => {
    if (!ts) return "N/A";
    const d = ts?.toDate?.() || new Date(ts);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const navigate = useNavigate();

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#8B4513] text-center sm:text-left">Announcement List</h1>
        <Link to="/gn-create-announcement"
          className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition text-sm sm:text-base">
          ＋ Create New Announcement
        </Link>
      </div>

      {/* Stats Row - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-6">
        {[
          { label: "Active Notices", value: activeCount,    icon: <Megaphone size={24} className="text-gray-300" /> },
          { label: "Scheduled",      value: scheduledCount, icon: <Clock     size={24} className="text-gray-300" /> },
          { label: "Drafts",         value: draftCount,     icon: <Eye       size={24} className="text-gray-300" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className={`${t.card} rounded-2xl shadow p-4 sm:p-5 flex items-center justify-between`}>
            <div>
              <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-left ${t.subtext}`}>{label}</p>
              <h2 className={`text-2xl sm:text-3xl font-bold mt-1 text-left ${t.text}`}>{loading ? "—" : value}</h2>
            </div>
            {icon}
          </div>
        ))}
      </div>

      {/* Filter Tabs - Responsive */}
      <div className={`flex flex-wrap gap-2 mb-4`}>
        {["All", "Active", "Scheduled", "Draft", "Expired"].map((s) => (
          <button key={s} onClick={() => { setFilterStatus(s); setCurrentPage(1); }}
            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition whitespace-nowrap
              ${filterStatus === s
                ? "bg-[#8B4513] text-white"
                : `border ${t.border} ${t.subtext} hover:border-[#8B4513]`}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Table - Mobile responsive with horizontal scroll */}
      <div className={`${t.card} rounded-2xl shadow overflow-x-auto`}>
        <div className="min-w-[700px] md:min-w-full">
        <table className="w-full text-sm">
          <thead className={`${t.tableHead} uppercase text-xs`}>
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left">Title</th>
              <th className="px-3 sm:px-6 py-3 text-left">Category</th>
              <th className="px-3 sm:px-6 py-3 text-left">Published</th>
              <th className="px-3 sm:px-6 py-3 text-left">Expires</th>
              <th className="px-3 sm:px-6 py-3 text-left">Status</th>
              <th className="px-3 sm:px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className={t.divider}>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                  <Loader2 size={24} className="animate-spin text-[#E5A800] mx-auto mb-2" />
                  <p className={`text-xs ${t.subtext}`}>Loading announcements...</p>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                  <Megaphone size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className={`text-sm font-semibold ${t.subtext}`}>No announcements found.</p>
                  <Link to="/create-announcement" className="text-xs text-[#E5A800] font-semibold hover:underline mt-1 inline-block">
                    Create your first announcement →
                  </Link>
                </td>
              </tr>
            ) : (
              paginated.map((item) => {
                const status = getStatus(item);
                return (
                  <tr key={item.id} className={t.tableRow}>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <p className={`font-semibold text-left text-sm sm:text-base ${t.text}`}>{item.title}</p>
                      <p className={`text-[10px] sm:text-xs text-left ${t.subtext} mt-0.5`}>
                        Priority: <span className={`font-bold ${item.priority === "Urgent" ? "text-red-500" : item.priority === "High" ? "text-orange-500" : "text-gray-500"}`}>
                          {item.priority || "Normal"}
                        </span>
                      </p>
                    </td>
                    <td className={`px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm ${t.subtext}`}>{item.category || "General"}</td>
                    <td className={`px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm ${t.subtext}`}>{formatDate(item.publishedAt || item.createdAt)}</td>
                    <td className={`px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm ${t.subtext}`}>{item.expiresAt ? formatDate(item.expiresAt) : "—"}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-left">
                      <span className={`text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 rounded-full whitespace-nowrap ${statusStyle[status] || "bg-gray-100 text-gray-500"}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <button
  onClick={() => navigate("/create-announcement", { 
  state: { 
    draft: {
      ...item,
      expiryDate: item.expiresAt 
        ? new Date(item.expiresAt.seconds * 1000).toISOString().split("T")[0]
        : "",
    } 
  } 
})}
  className="text-gray-400 hover:text-blue-500 transition"
>
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

        {/* Pagination - Responsive */}
        {!loading && filtered.length > 0 && (
          <div className={`px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t ${t.border}`}>
            <p className={`text-[10px] sm:text-xs text-center sm:text-left ${t.subtext}`}>
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} announcements
            </p>
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full ${t.tableRow} ${t.subtext} text-[10px] sm:text-xs disabled:opacity-40`}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[10px] sm:text-xs font-bold transition
                    ${currentPage === page ? "bg-[#E5A800] text-black" : `${t.tableRow} ${t.subtext}`}`}>
                  {page}
                </button>
              ))}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full ${t.tableRow} ${t.subtext} text-[10px] sm:text-xs disabled:opacity-40`}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Edit Modal - Responsive ── */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className={`${t.card} rounded-2xl shadow-2xl w-full max-w-[90%] sm:max-w-lg`}>
            <div className={`flex items-center justify-between p-4 sm:p-5 border-b ${t.border}`}>
              <h2 className={`text-sm sm:text-base font-bold text-left ${t.text}`}>Edit Announcement</h2>
              <button onClick={() => setEditingItem(null)} className={`${t.subtext} hover:text-gray-600`}>
                <X size={18} />
              </button>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              {/* Title */}
              <div>
                <label className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide mb-1 block text-left ${t.subtext}`}>Title</label>
                <input type="text" value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className={`w-full border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`} />
              </div>
              {/* Category + Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide mb-1 block text-left ${t.subtext}`}>Category</label>
                  <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className={`w-full border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}>
                    {["General","Emergency","Event","Health","Education","Infrastructure","Other"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide mb-1 block text-left ${t.subtext}`}>Priority</label>
                  <select value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className={`w-full border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}>
                    {["Normal","High","Urgent"].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Description */}
              <div>
                <label className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide mb-1 block text-left ${t.subtext}`}>Description</label>
                <textarea value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4} className={`w-full border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] resize-none ${t.input}`} />
              </div>
              {/* Expiry Date */}
              <div>
                <label className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide mb-1 block text-left ${t.subtext}`}>Expiry Date</label>
                <input type="date" value={editForm.expiryDate}
                  onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })}
                  className={`w-full border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`} />
              </div>
            </div>
            <div className={`flex justify-end gap-3 px-4 sm:px-5 pb-4 sm:pb-5`}>
              <button onClick={() => setEditingItem(null)}
                className={`text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl border ${t.border} ${t.subtext} hover:bg-gray-100 transition`}>
                Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={saving}
                className="text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl bg-[#E5A800] hover:bg-[#cc9600] text-black disabled:opacity-60 flex items-center gap-2 transition">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal - Responsive ── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className={`${t.card} rounded-2xl shadow-2xl w-full max-w-[90%] sm:max-w-sm p-5 sm:p-6 text-center`}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Trash2 size={18} className="sm:w-[22px] sm:h-[22px] text-red-500" />
            </div>
            <h2 className={`text-sm sm:text-base font-bold mb-2 text-center ${t.text}`}>Delete Announcement?</h2>
            <p className={`text-[10px] sm:text-xs text-center ${t.subtext} mb-4 sm:mb-5`}>This action cannot be undone. The announcement will be permanently removed.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirmDelete(null)}
                className={`px-4 sm:px-5 py-2 rounded-xl border ${t.border} text-xs sm:text-sm font-semibold ${t.subtext} hover:bg-gray-100 transition`}>
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={!!deletingId}
                className="px-4 sm:px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-semibold disabled:opacity-60 flex items-center gap-2 transition">
                {deletingId ? <Loader2 size={14} className="animate-spin" /> : null}
                {deletingId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </GNLayout>
  );
};

export default GNAnnouncementList;