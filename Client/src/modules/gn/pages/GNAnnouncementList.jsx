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

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#8B4513]">Announcement List</h1>
        <Link to="/gn-create-announcement"
          className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition">
          ＋ Create New Announcement
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {[
          { label: "Active Notices", value: activeCount,    icon: <Megaphone size={24} className="text-gray-300" /> },
          { label: "Scheduled",      value: scheduledCount, icon: <Clock     size={24} className="text-gray-300" /> },
          { label: "Drafts",         value: draftCount,     icon: <Eye       size={24} className="text-gray-300" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className={`${t.card} rounded-2xl shadow p-5 flex items-center justify-between`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${t.subtext}`}>{label}</p>
              <h2 className={`text-3xl font-bold mt-1 ${t.text}`}>{loading ? "—" : value}</h2>
            </div>
            {icon}
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className={`flex gap-2 mb-4`}>
        {["All", "Active", "Scheduled", "Draft", "Expired"].map((s) => (
          <button key={s} onClick={() => { setFilterStatus(s); setCurrentPage(1); }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition
              ${filterStatus === s
                ? "bg-[#8B4513] text-white"
                : `border ${t.border} ${t.subtext} hover:border-[#8B4513]`}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={`${t.card} rounded-2xl shadow overflow-hidden`}>
        <table className="w-full text-sm">
          <thead className={`${t.tableHead} uppercase text-xs`}>
            <tr>
              <th className="px-6 py-3 text-left">Title</th>
              <th className="px-6 py-3 text-left">Category</th>
              <th className="px-6 py-3 text-left">Published</th>
              <th className="px-6 py-3 text-left">Expires</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className={t.divider}>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Loader2 size={24} className="animate-spin text-[#E5A800] mx-auto mb-2" />
                  <p className={`text-xs ${t.subtext}`}>Loading announcements...</p>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
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
                    <td className="px-6 py-4">
                      <p className={`font-semibold ${t.text}`}>{item.title}</p>
                      <p className={`text-xs ${t.subtext} mt-0.5`}>
                        Priority: <span className={`font-bold ${item.priority === "Urgent" ? "text-red-500" : item.priority === "High" ? "text-orange-500" : "text-gray-500"}`}>
                          {item.priority || "Normal"}
                        </span>
                      </p>
                    </td>
                    <td className={`px-6 py-4 ${t.subtext}`}>{item.category || "General"}</td>
                    <td className={`px-6 py-4 ${t.subtext}`}>{formatDate(item.publishedAt || item.createdAt)}</td>
                    <td className={`px-6 py-4 ${t.subtext}`}>{item.expiresAt ? formatDate(item.expiresAt) : "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyle[status] || "bg-gray-100 text-gray-500"}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
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
  <Pencil size={16} />
</button>
                        <button
                          onClick={() => setConfirmDelete(item.id)}
                          className="text-gray-400 hover:text-red-500 transition">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className={`px-6 py-4 flex items-center justify-between border-t ${t.border}`}>
            <p className={`text-xs ${t.subtext}`}>
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} announcements
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                className={`w-7 h-7 rounded-full ${t.tableRow} ${t.subtext} text-xs disabled:opacity-40`}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-full text-xs font-bold transition
                    ${currentPage === page ? "bg-[#E5A800] text-black" : `${t.tableRow} ${t.subtext}`}`}>
                  {page}
                </button>
              ))}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className={`w-7 h-7 rounded-full ${t.tableRow} ${t.subtext} text-xs disabled:opacity-40`}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className={`${t.card} rounded-2xl shadow-2xl w-full max-w-lg`}>
            <div className={`flex items-center justify-between p-5 border-b ${t.border}`}>
              <h2 className={`text-base font-bold ${t.text}`}>Edit Announcement</h2>
              <button onClick={() => setEditingItem(null)} className={`${t.subtext} hover:text-gray-600`}>
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className={`text-xs font-bold uppercase tracking-wide mb-1 block ${t.subtext}`}>Title</label>
                <input type="text" value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className={`w-full border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`} />
              </div>
              {/* Category + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs font-bold uppercase tracking-wide mb-1 block ${t.subtext}`}>Category</label>
                  <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className={`w-full border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}>
                    {["General","Emergency","Event","Health","Education","Infrastructure","Other"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`text-xs font-bold uppercase tracking-wide mb-1 block ${t.subtext}`}>Priority</label>
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
                <label className={`text-xs font-bold uppercase tracking-wide mb-1 block ${t.subtext}`}>Description</label>
                <textarea value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4} className={`w-full border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] resize-none ${t.input}`} />
              </div>
              {/* Expiry Date */}
              <div>
                <label className={`text-xs font-bold uppercase tracking-wide mb-1 block ${t.subtext}`}>Expiry Date</label>
                <input type="date" value={editForm.expiryDate}
                  onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })}
                  className={`w-full border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`} />
              </div>
            </div>
            <div className={`flex justify-end gap-3 px-5 pb-5`}>
              <button onClick={() => setEditingItem(null)}
                className={`text-sm font-semibold px-4 py-2 rounded-xl border ${t.border} ${t.subtext} hover:bg-gray-100 transition`}>
                Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={saving}
                className="text-sm font-semibold px-4 py-2 rounded-xl bg-[#E5A800] hover:bg-[#cc9600] text-black disabled:opacity-60 flex items-center gap-2 transition">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className={`${t.card} rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center`}>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h2 className={`text-base font-bold mb-2 ${t.text}`}>Delete Announcement?</h2>
            <p className={`text-xs ${t.subtext} mb-5`}>This action cannot be undone. The announcement will be permanently removed.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirmDelete(null)}
                className={`px-5 py-2 rounded-xl border ${t.border} text-sm font-semibold ${t.subtext} hover:bg-gray-100 transition`}>
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={!!deletingId}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2 transition">
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