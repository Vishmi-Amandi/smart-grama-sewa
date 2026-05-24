import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';

import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, orderBy, query, serverTimestamp,
} from "firebase/firestore";

import {
  LayoutDashboard, ArrowLeftRight, BarChart2, UserCheck,
  Activity, Megaphone, Bell, Search, ChevronDown, User,
  TrendingUp, Clock, CheckCircle, XCircle, RefreshCw,
  Loader2, AlertCircle, LogOut,
} from 'lucide-react';

// ─── Design tokens (matches your existing COLORS object) ──────────────────────
const COLORS = {
  bg:        "#FFF9F0",
  primary:   "#92400e",   // amber-800
  accent:    "#f59e0b",   // amber-400
  text:      "#1c1917",
  textMuted: "#a78b72",
};

// ─── Data constants ───────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "all_users",   label: "All Users" },
  { value: "residents",   label: "Citizens" },
  { value: "gn_officers", label: "GN Officers" },
  // { value: "ds_officers", label: "DS Officers" },
];

const PRIORITIES = [
  { value: "low",    label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high",   label: "High" },
  { value: "urgent", label: "Urgent" },
];

const PRIORITY_COLOR = {
  urgent: "bg-red-500",
  high:   "bg-orange-400",
  normal: "bg-amber-400",
  low:    "bg-gray-300",
};

const STATUS_BADGE = {
  published: "bg-green-100 text-green-700 border-green-200",
  draft:     "bg-gray-100 text-gray-500 border-gray-200",
  expired:   "bg-red-100 text-red-500 border-red-200",
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
};

// ─── Lucide-style inline SVG icons ───────────────────────────────────────────
const Icon = {
  LayoutDashboard: ({ size = 16, className = "", color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"
      className={className} style={color ? { color } : {}}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  UserCheck: ({ size = 16, className = "", color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" className={className} style={color ? { color } : {}}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  ),
  ArrowLeftRight: ({ size = 16, className = "", color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" className={className} style={color ? { color } : {}}>
      <path d="M8 3 4 7l4 4" /><path d="M4 7h16" />
      <path d="m16 21 4-4-4-4" /><path d="M20 17H4" />
    </svg>
  ),
  BarChart2: ({ size = 16, className = "", color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" className={className} style={color ? { color } : {}}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6"  y1="20" x2="6"  y2="14" />
    </svg>
  ),
  User: ({ size = 16, className = "", color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" className={className} style={color ? { color } : {}}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Activity: ({ size = 16, className = "", color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" className={className} style={color ? { color } : {}}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Megaphone: ({ size = 16, className = "", color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" className={className} style={color ? { color } : {}}>
      <path d="M3 11l18-5v12L3 14v-3z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  ),
  Bell: ({ size = 16, className = "", color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" className={className} style={color ? { color } : {}}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Search: ({ size = 16, className = "", color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" className={className} style={color ? { color } : {}}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  ChevronDown: ({ size = 14, className = "", color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" className={className} style={color ? { color } : {}}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
};

// ─── NavItem — exactly your shared component ──────────────────────────────────
function NavItem({ icon: Icon, label, active, bold, onClick }) {
  return (
    <li
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-all ${
        active ? "bg-amber-700 text-white font-bold"
        : bold  ? "text-amber-900 font-bold hover:bg-amber-100"
                : "text-amber-800 hover:bg-amber-100"
      }`}
      style={{ fontSize: bold && !Icon ? "0.85rem" : "0.82rem" }}
    >
      {Icon && (
        <Icon size={16} color={active ? "#fff" : COLORS.primary} />
      )}
      <span>{label}</span>
    </li>
  );
}

// ─── Sidebar — your shared code, with active-state wiring added ───────────────
function Sidebar({ active, setActive }) {
  const nav = (id) => () => setActive(id);
  return (
    <aside
      className="w-64 flex-shrink-0 flex flex-col py-6 px-3 gap-2 border-r"
      style={{ borderColor: "#DDD0BC", background: COLORS.bg }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 mb-6">
        <img src="/logo2.png"></img>
        {/* <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: COLORS.primary }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="6" width="12" height="18" rx="2" fill="#fff" opacity="0.9" />
            <circle cx="10" cy="21" r="1" fill={COLORS.accent} />
            <path
              d="M18 10 Q24 10 24 16 Q24 22 18 22"
              stroke={COLORS.accent} strokeWidth="2" fill="none" strokeLinecap="round"
            />
            <path
              d="M10 6 Q10 2 14 2 Q18 2 18 6"
              stroke="#fff" strokeWidth="1.5" fill="none"
            />
          </svg>
        </div>
        <div>
          <p className="text-xs font-black" style={{ color: COLORS.primary }}>Smart</p>
          <p className="text-xs font-black" style={{ color: COLORS.accent }}>Grama Sewa</p>
        </div> */}
      </div>

      {/* Nav */}
      <ul className="flex flex-col gap-1">
        <NavItem
          icon={LayoutDashboard} label="Dashboard"
          active={active === "dashboard"} onClick={nav("dashboard")}
        />

        <li className="px-4 pt-3 pb-1 text-xs font-extrabold" style={{ color: COLORS.primary }}>
          GN management
        </li>
        <NavItem
          icon={UserCheck} label="Registration Requests"
          active={active === "registration"} onClick={nav("registration")}
        />
        <NavItem
          icon={ArrowLeftRight} label="Transfer Request"
          active={active === "transfer"} onClick={nav("transfer")}
        />

        <li className="px-4 pt-3 pb-1 text-xs font-extrabold" style={{ color: COLORS.primary }}>
          Reports
        </li>
        <NavItem
          icon={BarChart2} label="System reports"
          active={active === "system-reports"} onClick={nav("system-reports")}
        />
        <NavItem
          icon={User} label="Individual user access"
          active={active === "user-access"} onClick={nav("user-access")}
        />
        <NavItem
          icon={Activity} label="Gn activity reports"
          active={active === "gn-activity"} onClick={nav("gn-activity")}
        />

        <li className="px-4 pt-4">
          <NavItem
            icon={Megaphone} label="Announcements" bold
            active={active === "announcements"} onClick={nav("announcements")}
          />
        </li>
        <li className="px-4 pt-1">
          <NavItem
            icon={Bell} label="Notifications" bold
            active={active === "notifications"} onClick={nav("notifications")}
          />
        </li>
      </ul>
    </aside>
  );
}

// ─── Topbar — exactly your shared code ───────────────────────────────────────
function Topbar() {
  const [searchVal, setSearchVal] = useState("");
  return (
    <header
      className="flex items-center gap-4 px-6 py-4 border-b sticky top-0 z-20"
      style={{ borderColor: "#DDD0BC", background: COLORS.bg }}
    >
      {/* Search */}
      <div className="flex-1 relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2"
          color={COLORS.textMuted}
        />
        <input
          className="w-full pl-10 pr-4 py-2.5 rounded-full border text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          style={{ borderColor: "#C8B89A", background: "#FFF9F0", color: COLORS.text }}
          placeholder="search..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
        />
      </div>

      {/* Language */}
      <button
        className="flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-full border"
        style={{ borderColor: "#C8B89A", color: COLORS.text, background: "#FFF9F0" }}
      >
        English <ChevronDown size={14} />
      </button>

      {/* Bell */}
      <button
        className="relative w-10 h-10 rounded-full flex items-center justify-center border"
        style={{ borderColor: "#C8B89A", background: "#FFF9F0" }}
      >
        <Icon.Bell size={18} color={COLORS.primary} />
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
          style={{ background: COLORS.accent }}
        />
      </button>

      {/* Avatar */}
      <button
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: COLORS.primary }}
      >
        <Icon.User size={18} color="#fff" />
      </button>
    </header>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3300);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5
      rounded-xl shadow-2xl border text-sm font-semibold
      ${type === "success"
        ? "bg-green-50 border-green-200 text-green-800"
        : "bg-red-50 border-red-200 text-red-700"}`}
    >
      <span>{type === "success" ? "✓" : "✕"}</span>
      {msg}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 border border-gray-100">
        <p className="text-gray-800 font-bold mb-1">Delete this announcement?</p>
        <p className="text-gray-500 text-sm mb-5">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Announcement Form ────────────────────────────────────────────────────────
function AnnouncementForm({ initial, onSubmit, onCancel, submitting }) {
  const blank = { category: "", title: "", description: "", priority: "normal", status: "published", expiryDate: "" };
  const [form, setForm] = useState(initial || blank);
  const f = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div
      className="rounded-2xl border shadow p-8 max-w-2xl mx-auto"
      style={{ background: COLORS.bg, borderColor: "#DDD0BC" }}
    >
      <h2
        className="text-center text-[22px] font-extrabold mb-8 tracking-tight"
        style={{ fontFamily: "Georgia, serif", color: COLORS.primary }}
      >
        Announcement
      </h2>

      {/* Category */}
      <div className="mb-5">
        <label className="block text-[13px] mb-1.5" style={{ color: COLORS.textMuted }}>
          Choose user category:
        </label>
        <div className="relative inline-block">
          <select
            value={form.category}
            onChange={f("category")}
            className="appearance-none pl-3 pr-8 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 min-w-[220px]"
            style={{ borderColor: "#C8B89A", color: COLORS.text }}
          >
            <option value="">Choose the user category ▾</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon.ChevronDown size={12} color={COLORS.textMuted} />
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="mb-5">
        <label className="block text-[13px] mb-1.5" style={{ color: COLORS.textMuted }}>
          Announcement title :
        </label>
        <input
          type="text"
          value={form.title}
          onChange={f("title")}
          placeholder="Type here..."
          className="w-full border rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-gray-300"
          style={{ borderColor: "#C8B89A", color: COLORS.text }}
        />
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="block text-[13px] mb-1.5" style={{ color: COLORS.textMuted }}>
          Announcement description :
        </label>
        <textarea
          value={form.description}
          onChange={f("description")}
          placeholder="Type here..."
          rows={11}
          className="w-full border rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-gray-300 resize-none"
          style={{ borderColor: "#C8B89A", color: COLORS.text }}
        />
      </div>

      {/* Priority + Expiry */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-[13px] mb-1.5" style={{ color: COLORS.textMuted }}>Priority:</label>
          <div className="relative">
            <select
              value={form.priority}
              onChange={f("priority")}
              className="w-full appearance-none pl-3 pr-8 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              style={{ borderColor: "#C8B89A", color: COLORS.text }}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icon.ChevronDown size={12} color={COLORS.textMuted} />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-[13px] mb-1.5" style={{ color: COLORS.textMuted }}>
            Expiry date (optional):
          </label>
          <input
            type="date"
            value={form.expiryDate}
            onChange={f("expiryDate")}
            className="w-full border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            style={{ borderColor: "#C8B89A", color: COLORS.text }}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onSubmit(form)}
          disabled={submitting}
          className="px-12 py-3 text-white font-bold rounded-xl text-sm shadow-sm transition-all active:scale-95 disabled:opacity-60"
          style={{ background: COLORS.accent }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#d97706"}
          onMouseLeave={(e) => e.currentTarget.style.background = COLORS.accent}
        >
          {submitting ? "Saving..." : "Submit"}
        </button>
        <button
          onClick={onCancel}
          className="px-12 py-3 text-white font-bold rounded-xl text-sm shadow-sm transition-all active:scale-95"
          style={{ background: COLORS.accent }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#d97706"}
          onMouseLeave={(e) => e.currentTarget.style.background = COLORS.accent}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Announcement Card ────────────────────────────────────────────────────────
function AnnouncementCard({ ann, onEdit, onDelete, fmtDate }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow group flex gap-3 p-4 items-start"
      style={{ borderColor: "#DDD0BC" }}>
      <div className={`mt-1.5 w-1 h-10 rounded-full flex-shrink-0 ${PRIORITY_COLOR[ann.priority] || "bg-gray-300"}`} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start gap-2 mb-1">
          <p className="font-bold text-gray-800 text-sm flex-1 truncate" style={{ fontFamily: "Georgia, serif" }}>
            {ann.title}
          </p>
          <span className={`flex-shrink-0 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_BADGE[ann.status] || STATUS_BADGE.draft}`}>
            {(ann.status || "draft").charAt(0).toUpperCase() + (ann.status || "draft").slice(1)}
          </span>
        </div>
        <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">{ann.description}</p>
        <div className="flex flex-wrap gap-3 text-[11px] font-medium" style={{ color: COLORS.primary }}>
          {ann.category && (
            <span>👥 {CATEGORIES.find((c) => c.value === ann.category)?.label || ann.category}</span>
          )}
          <span>📅 {fmtDate(ann.createdAt)}</span>
          {ann.expiryDate && <span className="text-orange-500">⏳ Expires {ann.expiryDate}</span>}
          {ann.createdBy && <span className="text-gray-400 font-normal">by {ann.createdBy}</span>}
        </div>
      </div>
      <div className="flex flex-col gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(ann)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
          style={{ background: "#fef3c7", color: COLORS.primary }}>
          Edit
        </button>
        <button onClick={() => onDelete(ann.id)}
          className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors">
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminAnnouncementPage() {
  const [activeNav, setActiveNav]   = useState("announcements");
  const [view, setView]             = useState("form"); // "form" | "list"
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [confirmId, setConfirmId]   = useState(null);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // Real-time Firestore listener
  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => { setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  // Create or update
  const handleSubmit = async (form) => {
    if (!form.category || !form.title.trim() || !form.description.trim()) {
      showToast("Please fill all required fields.", "error"); return;
    }
    setSubmitting(true);
    try {
      const user = auth.currentUser;
      const base = {
        category:    form.category,
        title:       form.title.trim(),
        description: form.description.trim(),
        priority:    form.priority,
        status:      form.status || "published",
        expiryDate:  form.expiryDate || null,
        expiresAt:   form.expiryDate ? new Date(form.expiryDate) : null,
        updatedAt:   serverTimestamp(),
      };
      if (editTarget) {
        await updateDoc(doc(db, "announcements", editTarget.id), base);
        showToast("Announcement updated!");
      } else {
        await addDoc(collection(db, "announcements"), {
          ...base,
          createdAt:    serverTimestamp(),
          publishedAt:  serverTimestamp(),
          createdBy:    user?.displayName || user?.email || "Admin",
          createdByUid: user?.uid || "",
          attachments:  [],
          gnDivision:   "",
        });
        await addDoc(collection(db, "activity_logs"), {
          action: "create_announcement", title: form.title.trim(),
          description: `Created: ${form.title.trim()}`, type: "announcement",
          uid: user?.uid || "", createdAt: serverTimestamp(),
        });
        showToast("Announcement published successfully!");
      }
      setEditTarget(null);
      setView("list");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "announcements", id));
      await addDoc(collection(db, "activity_logs"), {
        action: "delete_announcement", title: "Deleted",
        description: `Deleted announcement ${id}`, type: "announcement",
        uid: auth.currentUser?.uid || "", createdAt: serverTimestamp(),
      });
      showToast("Announcement deleted.");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setConfirmId(null);
    }
  };

  const handleEdit = (ann) => {
    setEditTarget(ann); setView("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleCancel = () => {
    setEditTarget(null);
    setView(announcements.length > 0 ? "list" : "form");
  };
  const handleNavChange = (id) => {
    setActiveNav(id);
    if (id === "announcements") { setEditTarget(null); setView("form"); }
  };
  const fmtDate = (ts) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-LK", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#F5EFE0", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Sidebar ── */}
      <Sidebar active={activeNav} setActive={handleNavChange} />

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Topbar ── */}
        <Topbar />

        {/* ── Content ── */}
        <main className="flex-1 px-8 py-8">

          {/* Announcements page */}
          {activeNav === "announcements" && (
            <div>
              {/* List-view header */}
              {view === "list" && (
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-xl font-extrabold" style={{ fontFamily: "Georgia, serif", color: COLORS.primary }}>
                    Announcements
                  </h1>
                  <button
                    onClick={() => { setEditTarget(null); setView("form"); }}
                    className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95"
                    style={{ background: COLORS.accent }}
                  >
                    + New Announcement
                  </button>
                </div>
              )}

              {/* "View all" link above form */}
              {view === "form" && announcements.length > 0 && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => { setEditTarget(null); setView("list"); }}
                    className="text-sm font-semibold underline underline-offset-2 transition-colors"
                    style={{ color: COLORS.primary }}
                  >
                    ← View all announcements ({announcements.length})
                  </button>
                </div>
              )}

              {/* Form */}
              {view === "form" && (
                <AnnouncementForm
                  key={editTarget?.id || "new"}
                  initial={editTarget}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  submitting={submitting}
                />
              )}

              {/* List */}
              {view === "list" && (
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
                    </div>
                  ) : announcements.length === 0 ? (
                    <div className="bg-white rounded-2xl border py-16 flex flex-col items-center gap-3"
                      style={{ borderColor: "#DDD0BC", color: COLORS.textMuted }}>
                      <span className="text-4xl">📢</span>
                      <p className="font-semibold text-sm">No announcements yet</p>
                    </div>
                  ) : (
                    announcements.map((ann) => (
                      <AnnouncementCard
                        key={ann.id} ann={ann}
                        onEdit={handleEdit}
                        onDelete={(id) => setConfirmId(id)}
                        fmtDate={fmtDate}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Placeholder for other nav items */}
          {activeNav !== "announcements" && (
            <div className="flex flex-col items-center justify-center py-24 gap-3" style={{ color: COLORS.textMuted }}>
              <span className="text-5xl">🚧</span>
              <p className="text-base font-semibold capitalize">
                {activeNav.replace(/-/g, " ")} — coming soon
              </p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="py-3 text-center" style={{ background: COLORS.primary }}>
          <p className="text-xs text-amber-200">© 2026 Smart Grama Sewa. All rights reserved.</p>
        </footer>
      </div>

      {/* Overlays */}
      {confirmId && (
        <ConfirmDialog
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}