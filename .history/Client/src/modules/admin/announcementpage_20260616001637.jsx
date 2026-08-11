import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../user/components/languageSwitcher';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, orderBy, query, serverTimestamp,
} from "firebase/firestore";

import {
  LayoutDashboard, ArrowLeftRight, BarChart2, UserCheck,
  Activity, Megaphone, Calendar, Bell, Search, ChevronDown, User,
  TrendingUp, Clock, CheckCircle, XCircle, RefreshCw,
  Loader2, AlertCircle, LogOut,
} from 'lucide-react';

// ─── Design tokens (matches your existing COLORS object) ──────────────────────
const COLORS = {
  bg: "#FFF9F0",
  primary: "#92400e",   // amber-800
  accent: "#f59e0b",   // amber-400
  text: "#1c1917",
  textMuted: "#a78b72",
  cardBrown: '#6B2400',
  cardDark: '#3D1500',
};

// ─── Nav Item ─────────────────────────────────────────────────────────────
function NavItem({ icon: Icon, label, active, bold, onClick }) {
  return (
    <li onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-all ${
          active ? 'bg-amber-700 text-white font-bold'
          : bold ? 'text-amber-900 font-bold hover:bg-amber-100'
                 : 'text-amber-800 hover:bg-amber-100'
        }`}
      style={{ fontSize: bold && !Icon ? '0.85rem' : '0.82rem' }}>
      {Icon && <Icon size={16} className={active ? 'text-white' : 'text-amber-700'} />}
      <span>{label}</span>
    </li>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────
function Sidebar({ onLogout }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col py-6 px-3 gap-2 border-r"
      style={{ borderColor: '#DDD0BC', background: COLORS.bg }}>

      {/* Logo */}
      <div className="flex items-center gap-2 px-3 mb-6">
        <img src="/logo2.png" alt="Smart Grama Sewa"></img>
      </div>

      {/* Nav links */}
      <ul className="flex flex-col gap-1 flex-1">
        <NavItem icon={LayoutDashboard} label={t('nav_dashboard', 'Dashboard')} bold
          onClick={() => navigate('/admin/dashboard')} />

        <li className="px-4 pt-3 pb-1 text-xs font-extrabold" style={{ color: COLORS.primary }}>
          {t('nav_gn_management', 'GN management')}
        </li>
        <NavItem icon={UserCheck} label={t('nav_registration_requests', 'Registration Requests')}
          onClick={() => navigate('/admin/registrationrequestapproval')} />
        <NavItem icon={ArrowLeftRight} label={t('nav_transfer_request', 'Transfer Request')}
          onClick={() => navigate('/admin/transferrequestapproval')} />

        <li className="px-4 pt-3 pb-1 text-xs font-extrabold" style={{ color: COLORS.primary }}>
          {t('nav_reports', 'Reports')}
        </li>
        <NavItem icon={BarChart2} label={t('nav_system_reports', 'System reports')}
          onClick={() => navigate('/admin/reports/system')} />
        <NavItem icon={User} label={t('nav_user_access', 'Individual user access')}
          onClick={() => navigate('/admin/reports/useraccess')} />
        <NavItem icon={Activity} label={t('nav_activity_reports', 'GN activity reports')}
          onClick={() => navigate('/admin/reports/gnactivity')} />

        <li className="pt-4">
          <NavItem icon={Megaphone} label={t('nav_announcements', 'Announcements')} bold active
            onClick={() => navigate('/admin/announcements')} />
        </li>
        <li className="pt-4">
          <NavItem icon={Calendar} label={t('nav_appointment_calendar', 'Appointment Calendar')} bold
            onClick={() => navigate("/admin/calendar")} />
        </li>
        <li className="pt-2">
          <NavItem icon={TrendingUp} label={t('nav_statistical_changes', 'Statistical Changes')} bold
            onClick={() => navigate('/admin/statistical-changes')} />
        </li>
      </ul>

      {/* Logout */}
      <div className="px-3 pt-4 border-t" style={{ borderColor: '#DDD0BC' }}>
        <button onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm font-bold transition-all hover:bg-red-50"
          style={{ color: '#991B1B' }}>
          <LogOut size={16} />
          <span>{t('nav_signout', 'Logout')}</span>
        </button>
      </div>
    </aside>
  );
}

// ─── Topbar ──────────────────────────────────────────────────────────────────
function Topbar() {
  const [searchVal, setSearchVal] = useState("");
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
  };

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
          placeholder={t('place_top_search', 'Search for a page or function...')}
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
        />
      </div>

      {/* Embedded Language Switcher Integration */}
      <LanguageSwitcher currentLanguage={i18n.language} onLanguageChange={handleLanguageChange} />

      {/* Bell Notification */}
      <button
        className="relative w-10 h-10 rounded-full flex items-center justify-center border"
        style={{ borderColor: "#C8B89A", background: "#FFF9F0" }}
      >
        <Bell size={18} color={COLORS.primary} />
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
          style={{ background: COLORS.accent }}
        />
      </button>

      {/* Avatar Profile Mock */}
      <button
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: COLORS.primary }}
      >
        <User size={18} color="#fff" />
      </button>
    </header>
  );
}

// ─── Toast Feedback Component ─────────────────────────────────────────────────
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

// ─── Confirm Dialog Overlay Popup ─────────────────────────────────────────────
function ConfirmDialog({ onConfirm, onCancel }) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 border border-gray-100">
        <p className="text-gray-800 font-bold mb-1">{t('confirm_delete_title', 'Delete this announcement?')}</p>
        <p className="text-gray-500 text-sm mb-5">{t('confirm_delete_subtitle', 'This action cannot be undone.')}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
            {t('btn_cancel', 'Cancel')}
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">
            {t('btn_delete', 'Delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Announcement Input Wizard Form ───────────────────────────────────────────
function AnnouncementForm({ initial, onSubmit, onCancel, submitting }) {
  const { t } = useTranslation();
  
  const CATEGORIES = [
    { value: "all_users", label: t('cat_all_users', 'All Users') },
    { value: "residents", label: t('cat_citizens', 'Citizens') },
    { value: "gn_officers", label: t('cat_gn_officers', 'GN Officers') },
  ];

  const PRIORITIES = [
    { value: "low", label: t('priority_low', 'Low') },
    { value: "normal", label: t('priority_normal', 'Normal') },
    { value: "high", label: t('priority_high', 'High') },
    { value: "urgent", label: t('priority_urgent', 'Urgent') },
  ];

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
        {t('nav_announcements', 'Announcement')}
      </h2>

      {/* Category Dropdown Selection Line */}
      <div className="mb-5">
        <label className="block text-[13px] mb-1.5" style={{ color: COLORS.textMuted }}>
          {t('lbl_choose_user_category', 'Choose user category:')}
        </label>
        <div className="relative inline-block">
          <select
            value={form.category}
            onChange={f("category")}
            className="appearance-none pl-3 pr-8 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 min-w-[220px]"
            style={{ borderColor: "#C8B89A", color: COLORS.text }}
          >
            <option value="">{t('place_choose_category_dropdown', 'Choose the user category ▾')}</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown size={12} color={COLORS.textMuted} />
          </div>
        </div>
      </div>

      {/* Announcement Title Text Input Line */}
      <div className="mb-5">
        <label className="block text-[13px] mb-1.5" style={{ color: COLORS.textMuted }}>
          {t('lbl_announcement_title', 'Announcement title :')}
        </label>
        <input
          type="text"
          value={form.title}
          onChange={f("title")}
          placeholder={t('place_type_here', 'Type here...')}
          className="w-full border rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-gray-300"
          style={{ borderColor: "#C8B89A", color: COLORS.text }}
        />
      </div>

      {/* Announcement Description Large Text Area Section */}
      <div className="mb-6">
        <label className="block text-[13px] mb-1.5" style={{ color: COLORS.textMuted }}>
          {t('lbl_announcement_description', 'Announcement description :')}
        </label>
        <textarea
          value={form.description}
          onChange={f("description")}
          placeholder={t('place_type_here', 'Type here...')}
          rows={11}
          className="w-full border rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-gray-300 resize-none"
          style={{ borderColor: "#C8B89A", color: COLORS.text }}
        />
      </div>

      {/* Priority Configurations + Expiry Timeline Management Parameters */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-[13px] mb-1.5" style={{ color: COLORS.textMuted }}>{t('lbl_priority', 'Priority:')}</label>
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
              <ChevronDown size={12} color={COLORS.textMuted} />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-[13px] mb-1.5" style={{ color: COLORS.textMuted }}>
            {t('lbl_expiry_date_optional', 'Expiry date (optional):')}
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

      {/* Submit Action Interface Button Footers */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onSubmit(form)}
          disabled={submitting}
          className="px-12 py-3 text-white font-bold rounded-xl text-sm shadow-sm transition-all active:scale-95 disabled:opacity-60"
          style={{ background: COLORS.accent }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#d97706"}
          onMouseLeave={(e) => e.currentTarget.style.background = COLORS.accent}
        >
          {submitting ? t('btn_saving_progress', 'Saving...') : t('btn_submit', 'Submit')}
        </button>
        <button
          onClick={onCancel}
          className="px-12 py-3 text-white font-bold rounded-xl text-sm shadow-sm transition-all active:scale-95"
          style={{ background: COLORS.accent }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#d97706"}
          onMouseLeave={(e) => e.currentTarget.style.background = COLORS.accent}
        >
          {t('btn_cancel', 'Cancel')}
        </button>
      </div>
    </div>
  );
}

// ─── Announcement Reactive Card Panel Template ─────────────────────────────────
function AnnouncementCard({ ann, onEdit, onDelete, fmtDate }) {
  const { t } = useTranslation();

  const CATEGORY_LABELS = {
    all_users: t('cat_all_users', 'All Users'),
    residents: t('cat_citizens', 'Citizens'),
    gn_officers: t('cat_gn_officers', 'GN Officers'),
  };

  const STATUS_BADGE = {
    published: "bg-green-100 text-green-700 border-green-200",
    draft: "bg-gray-100 text-gray-500 border-gray-200",
    expired: "bg-red-100 text-red-500 border-red-200",
    scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  };

  const PRIORITY_COLOR = {
    urgent: "bg-red-500",
    high: "bg-orange-400",
    normal: "bg-amber-400",
    low: "bg-gray-300",
  };

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
            {t(`status_${ann.status || 'draft'}`, (ann.status || "draft").toUpperCase())}
          </span>
        </div>
        <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">{ann.description}</p>
        <div className="flex flex-wrap gap-3 text-[11px] font-medium" style={{ color: COLORS.primary }}>
          {ann.category && (
            <span>👥 {CATEGORY_LABELS[ann.category] || ann.category}</span>
          )}
          <span>📅 {fmtDate(ann.createdAt)}</span>
          {ann.expiryDate && <span className="text-orange-500">⏳ {t('lbl_expires_prefix', 'Expires')} {ann.expiryDate}</span>}
          {ann.createdBy && <span className="text-gray-400 font-normal">{t('lbl_created_by_author', 'by')} {ann.createdBy}</span>}
        </div>
      </div>
      <div className="flex flex-col gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(ann)}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
          style={{ background: "#fef3c7", color: COLORS.primary }}>
          {t('btn_edit', 'Edit')}
        </button>
        <button onClick={() => onDelete(ann.id)}
          className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors">
          {t('btn_delete', 'Delete')}
        </button>
      </div>
    </div>
  );
}

// ─── Main Portal Dashboard Controller View Page ─────────────────────────────────
export default function AdminAnnouncementPage() {
  const { t } = useTranslation();
  const [activeNav, setActiveNav] = useState("announcements");
  const [view, setView] = useState("form"); 
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // Real-time Firestore sync pipelines
  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => { setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  // Creation & mutation adjustments handler line
  const handleSubmit = async (form) => {
    if (!form.category || !form.title.trim() || !form.description.trim()) {
      showToast(t('toast_fill_required_fields', "Please fill all required fields."), "error"); return;
    }
    setSubmitting(true);
    try {
      const user = auth.currentUser;
      const base = {
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        status: form.status || "published",
        expiryDate: form.expiryDate || null,
        expiresAt: form.expiryDate ? new Date(form.expiryDate) : null,
        updatedAt: serverTimestamp(),
      };
      if (editTarget) {
        await updateDoc(doc(db, "announcements", editTarget.id), base);
        showToast(t('toast_announcement_updated', "Announcement updated!"));
      } else {
        await addDoc(collection(db, "announcements"), {
          ...base,
          createdAt: serverTimestamp(),
          publishedAt: serverTimestamp(),
          createdBy: user?.displayName || user?.email || "Admin",
          createdByUid: user?.uid || "",
          attachments: [],
          gnDivision: "",
        });
        await addDoc(collection(db, "activity_logs"), {
          action: "create_announcement", title: form.title.trim(),
          description: `Created: ${form.title.trim()}`, type: "announcement",
          uid: user?.uid || "", createdAt: serverTimestamp(),
        });
        showToast(t('toast_announcement_published', "Announcement published successfully!"));
      }
      setEditTarget(null);
      setView("list");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Hard removal adjustments pipelines
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "announcements", id));
      await addDoc(collection(db, "activity_logs"), {
        action: "delete_announcement", title: "Deleted",
        description: `Deleted announcement ${id}`, type: "announcement",
        uid: auth.currentUser?.uid || "", createdAt: serverTimestamp(),
      });
      showToast(t('toast_announcement_deleted', "Announcement deleted."));
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

      {/* Sidebar Interface Layout Injection Wireframe */}
      <Sidebar active={activeNav} setActive={handleNavChange} />

      <div className="flex-1 flex flex-col min-w-0">

        {/* Global Topbar Panel */}
        <Topbar />

        <main className="flex-1 px-8 py-8">

          {/* Core Announcements view toggle pipeline */}
          {activeNav === "announcements" && (
            <div>
              {view === "list" && (
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-xl font-extrabold" style={{ fontFamily: "Georgia, serif", color: COLORS.primary }}>
                    {t('nav_announcements', 'Announcements')}
                  </h1>
                  <button
                    onClick={() => { setEditTarget(null); setView("form"); }}
                    className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95"
                    style={{ background: COLORS.accent }}
                  >
                    {t('btn_new_announcement_cta', '+ New Announcement')}
                  </button>
                </div>
              )}

              {view === "form" && announcements.length > 0 && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => { setEditTarget(null); setView("list"); }}
                    className="text-sm font-semibold underline underline-offset-2 transition-colors"
                    style={{ color: COLORS.primary }}
                  >
                    ← {t('btn_view_all_announcements_count', 'View all announcements')} ({announcements.length})
                  </button>
                </div>
              )}

              {/* Input wizard form validation component block */}
              {view === "form" && (
                <AnnouncementForm
                  key={editTarget?.id || "new"}
                  initial={editTarget}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  submitting={submitting}
                />
              )}

              {/* Announcements feed output rendering list */}
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
                      <p className="font-semibold text-sm">{t('lbl_no_announcements_found', 'No announcements yet')}</p>
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

          {/* Under construction module placeholders handler */}
          {activeNav !== "announcements" && (
            <div className="flex flex-col items-center justify-center py-24 gap-3" style={{ color: COLORS.textMuted }}>
              <span className="text-5xl">🚧</span>
              <p className="text-base font-semibold capitalize">
                {activeNav.replace(/-/g, " ")} — {t('lbl_coming_soon_suffix', 'coming soon')}
              </p>
            </div>
          )}
        </main>

        <footer className="text-center text-xs py-4"
          style={{ background: COLORS.cardDark, color: '#C8A882' }}>
          © 2026 Smart Grama Sewa. All rights reserved.
        </footer>
      </div>

      {/* Confirmation overlays modal boxes */}
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