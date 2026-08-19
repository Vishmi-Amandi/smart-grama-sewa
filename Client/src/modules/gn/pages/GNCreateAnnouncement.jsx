import { useState } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { Paperclip, Eye, Send, Save, X, Clock, Loader2 } from "lucide-react";
import { collection, addDoc, doc, updateDoc, getDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useLocation, useNavigate } from "react-router-dom";
import { logActivity } from "../../../logActivity";
import { useTranslation } from "react-i18next";

const GNCreateAnnouncement = ({ gnStatus, theme }) => {
  const { t, i18n } = useTranslation();
  const tTheme = getThemeClasses(theme);

  //_______read draft data___________________
  const location = useLocation();
  const navigate = useNavigate();
  const draft = location.state?.draft;

  // ─── Form State ─────────────────────────────────────────────────────────────
  const [title, setTitle] = useState(draft?.title || "");
  const [description, setDescription] = useState(draft?.description || "");
  const [category, setCategory] = useState(draft?.category || "General");
  const [priority, setPriority] = useState(draft?.priority || "Normal");
  const [language, setLanguage] = useState(draft?.language || "English");
  const [expiryDate, setExpiryDate] = useState(draft?.expiryDate || "");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  // ─── Loading States ──────────────────────────────────────────────────────────
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // ─── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = t('err_title_required');
    if (!description.trim()) e.description = t('err_description_required');
    if (isScheduled) {
      if (!scheduleDate) e.scheduleDate = t('err_schedule_date_required');
      if (!scheduleTime) e.scheduleTime = t('err_schedule_time_required');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Upload attachment to Cloudinary ─────────────────────────────────────────
  const handleFileUpload = async (files) => {
    if (!files.length) return;
    setUploading(true);
    const uploaded = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setErrors((p) => ({ ...p, file: `${file.name} ${t('exceeds_10mb')}` }));
        continue;
      }
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "gn_documents");
        formData.append("cloud_name", "dsi9xh1fd");

        const res = await fetch("https://api.cloudinary.com/v1_1/dsi9xh1fd/auto/upload", {
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
    setAttachments((prev) => [...prev, ...uploaded]);
    setUploading(false);
  };

  // ─── Build announcement object ────────────────────────────────────────────────
  const buildDoc = async (status) => {
    const user = auth.currentUser;

    const officerSnap = await getDoc(doc(db, "gn_officers", user.uid));
    const officerData = officerSnap.exists() ? officerSnap.data() : {};
    const gnDiv = officerData.gnDiv || "";

    const base = {
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      attachments,
      status,
      createdBy: user?.uid || "",
      createdByUid: user?.uid || "",
      gnDiv: gnDiv,
      createdAt: serverTimestamp(),
      expiresAt: expiryDate
        ? Timestamp.fromDate(new Date(expiryDate))
        : null,
    };

    if (status === "Scheduled" && scheduleDate && scheduleTime) {
      base.publishAt = Timestamp.fromDate(new Date(`${scheduleDate}T${scheduleTime}`));
    } else if (status === "Published") {
      base.publishedAt = serverTimestamp();
    }

    return base;
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setCategory("General");
    setPriority("Normal"); setLanguage("English"); setExpiryDate(""); setScheduleDate("");
    setScheduleTime(""); setIsScheduled(false); setAttachments([]);
    setErrors({});
  };

  // ─── Save as Draft ────────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    if (!title.trim()) { setErrors({ general: t('err_enter_title') }); return; }
    setSavingDraft(true);
    try {
      const user = auth.currentUser;
      if (draft?.id) {
        await updateDoc(doc(db, "announcements", draft.id), {
          title,
          description,
          expiresAt: expiryDate ? Timestamp.fromDate(new Date(expiryDate)) : null,
          expiryDate: expiryDate || "",
          attachments,
          status: "Draft",
          updatedAt: serverTimestamp(),
        });
      } else {
        const officerSnap = await getDoc(doc(db, "gn_officers", user.uid));
        const officerData = officerSnap.exists() ? officerSnap.data() : {};

        await addDoc(collection(db, "announcements"), {
          title,
          description,
          expiryDate,
          category,
          priority,
          language,
          attachments,
          gnDiv: officerData.gnDiv || "",
          status: "Draft",
          createdBy: user.displayName || t('officer'),
          createdByUid: user.uid,
          createdAt: serverTimestamp(),
        });
      }
      await logActivity("announcement", "Draft Saved", title, `Draft saved — Category: ${category}`);
      setSuccessMsg(t('draft_saved_success'));
      setTimeout(() => navigate("/gn-announcement-list"), 1500);
    } catch (err) {
      setErrors({ general: t('err_save_draft_failed') });
      console.error(err);
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) { setErrors({ general: t('err_enter_title') }); return; }
    if (!description.trim()) { setErrors({ general: t('err_enter_description') }); return; }
    setPublishing(true);
    try {
      const user = auth.currentUser;
      if (draft?.id) {
        await updateDoc(doc(db, "announcements", draft.id), {
          title,
          description,
          expiresAt: expiryDate ? Timestamp.fromDate(new Date(expiryDate)) : null,
          expiryDate: expiryDate || "",
          attachments,
          status: "Active",
          publishedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const officerSnap = await getDoc(doc(db, "gn_officers", user.uid));
        const officerData = officerSnap.exists() ? officerSnap.data() : {};
        const gnDiv = officerData.gnDiv || "";

        const docRef = await addDoc(collection(db, "announcements"), {
          title,
          description,
          expiresAt: expiryDate ? Timestamp.fromDate(new Date(expiryDate)) : null,
          expiryDate: expiryDate || "",
          category,
          priority,
          language,
          attachments,
          gnDiv,
          status: "Active",
          createdBy: user.uid,
          createdByUid: user.uid,
          createdAt: serverTimestamp(),
          publishedAt: serverTimestamp(),
        });
        // Trigger FCM push notification to division subscribers
        try {
          await fetch('/api/announcements/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gnDiv, title, description, priority, announcementId: docRef.id }),
          });
        } catch (notifyErr) {
          console.warn('FCM notification failed (non-critical):', notifyErr);
        }
      }
      await logActivity("announcement", "Published", title, `Category: ${category}, Priority: ${priority}`);
      setSuccessMsg(t('publish_success'));
      setTimeout(() => navigate("/gn-announcement-list"), 1500);
    } catch (err) {
      setErrors({ general: t('err_publish_failed') });
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  // ─── Schedule Publish ─────────────────────────────────────────────────────────
  const handleSchedule = async () => {
    if (!validate()) return;
    setScheduling(true);
    try {
      const user = auth.currentUser;

      const officerSnap = await getDoc(doc(db, "gn_officers", user.uid));
      const officerData = officerSnap.exists() ? officerSnap.data() : {};
      const gnDiv = officerData.gnDiv || "";

      await addDoc(collection(db, "announcements"), {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        language,
        attachments,
        status: "Scheduled",
        createdBy: user?.uid || "",
        createdByUid: user?.uid || "",
        gnDiv: gnDiv,
        createdAt: serverTimestamp(),
        publishAt: Timestamp.fromDate(new Date(`${scheduleDate}T${scheduleTime}`)),
        expiresAt: expiryDate ? Timestamp.fromDate(new Date(expiryDate)) : null,
      });

      await logActivity("announcement", "Scheduled", title, `Scheduled for ${scheduleDate} at ${scheduleTime}`);
      showSuccess(t('schedule_success', { date: scheduleDate, time: scheduleTime }));
      resetForm();
    } catch (err) {
      console.error("Schedule error:", err);
      setErrors({ firebase: t('err_schedule_failed') });
    } finally {
      setScheduling(false);
    }
  };

  // ─── Priority badge color ─────────────────────────────────────────────────────
  const priorityColor = {
    Normal: "bg-gray-100 text-gray-600",
    High: "bg-orange-100 text-orange-600",
    Urgent: "bg-red-100 text-red-600",
  };

  // ─── Translated option lists ──────────────────────────────────────────────
  const categoryOptions = [
    { value: "General", label: t('general') },
    { value: "Emergency", label: t('emergency') },
    { value: "Event", label: t('event') },
    { value: "Health", label: t('health') },
    { value: "Education", label: t('education') },
    { value: "Infrastructure", label: t('infrastructure') },
    { value: "Other", label: t('other') },
  ];

  const priorityOptions = [
    { value: "Normal", label: t('priority_normal') },
    { value: "High", label: t('priority_high') },
    { value: "Urgent", label: t('priority_urgent') },
  ];

  const languageOptions = [
    { value: "English", label: t('lang_en') },
    { value: "සිංහල", label: t('lang_si') },
    { value: "தமிழ்", label: t('lang_ta') },
  ];

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      <h1 className="text-xl sm:text-2xl font-bold text-[#8B4513] mb-4 sm:mb-6 text-center sm:text-left">
        {t('create_announcement')}
      </h1>

      {/* Success Message */}
      {successMsg && (
        <div className="mb-4 bg-green-50 border border-green-300 rounded-xl px-4 py-3 text-sm font-semibold text-green-700 flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")}><X size={14} /></button>
        </div>
      )}

      {/* Firebase Error */}
      {(errors.firebase || errors.general) && (
        <div className="mb-4 bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-sm font-semibold text-red-700 flex items-center justify-between">
          <span>⚠ {errors.firebase || errors.general}</span>
          <button onClick={() => setErrors({})}><X size={14} /></button>
        </div>
      )}

      {/* Main Form Card */}
      <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-6 md:p-8 mb-6`}>

        {/* Title */}
        <div className="mb-6">
          <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block text-left ${tTheme.subtext}`}>
            {t('form_title')}
          </label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={t('title_placeholder')}
            className={`w-full border ${errors.title ? "border-red-400" : tTheme.border} rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E5A800] transition ${tTheme.input}`} />
          {errors.title && <p className="text-red-500 text-xs mt-1 text-left">{errors.title}</p>}
        </div>

        {/* Category + Priority + Language */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block text-left ${tTheme.subtext}`}>
              {t('form_category')}
            </label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className={`w-full border ${tTheme.border} rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E5A800] transition ${tTheme.input}`}>
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block text-left ${tTheme.subtext}`}>
              {t('form_priority')}
            </label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}
              className={`w-full border ${tTheme.border} rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E5A800] transition ${tTheme.input}`}>
              {priorityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block text-left ${tTheme.subtext}`}>
              {t('form_language')}
            </label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}
              className={`w-full border ${tTheme.border} rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E5A800] transition ${tTheme.input}`}>
              {languageOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block text-left ${tTheme.subtext}`}>
            {t('form_description')}
          </label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder={t('description_placeholder')}
            rows={6}
            className={`w-full border ${errors.description ? "border-red-400" : tTheme.border} rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E5A800] transition resize-none ${tTheme.input}`} />
          {errors.description && <p className="text-red-500 text-xs mt-1 text-left">{errors.description}</p>}
          <p className={`text-xs mt-1 text-right ${tTheme.subtext}`}>{t('char_count', { count: description.length })}</p>
        </div>

        {/* Expiry Date */}
        <div className="mb-6">
          <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block text-left ${tTheme.subtext}`}>
            {t('form_expiry_date')} <span className="normal-case font-normal">({t('optional')})</span>
          </label>
          <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className={`w-full border ${tTheme.border} rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E5A800] transition ${tTheme.input}`} />
        </div>

        {/* Schedule Toggle */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setIsScheduled((v) => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${isScheduled ? "bg-[#E5A800]" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isScheduled ? "translate-x-5" : "translate-x-0"}`} />
            </button>
            <label className={`text-xs font-semibold uppercase tracking-wide ${tTheme.subtext}`}>
              {t('schedule_later')}
            </label>
          </div>

          {isScheduled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`text-xs font-semibold mb-1 block text-left ${tTheme.subtext}`}>{t('publish_date')}</label>
                <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className={`w-full border ${errors.scheduleDate ? "border-red-400" : tTheme.border} rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E5A800] transition ${tTheme.input}`} />
                {errors.scheduleDate && <p className="text-red-500 text-xs mt-1 text-left">{errors.scheduleDate}</p>}
              </div>
              <div>
                <label className={`text-xs font-semibold mb-1 block text-left ${tTheme.subtext}`}>{t('publish_time')}</label>
                <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)}
                  className={`w-full border ${errors.scheduleTime ? "border-red-400" : tTheme.border} rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E5A800] transition ${tTheme.input}`} />
                {errors.scheduleTime && <p className="text-red-500 text-xs mt-1 text-left">{errors.scheduleTime}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Attachments */}
        <div className="mb-8">
          <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block text-left ${tTheme.subtext}`}>
            {t('form_attachments')} <span className="normal-case font-normal">({t('optional')})</span>
          </label>
          <label className={`border-2 border-dashed ${tTheme.border} rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#E5A800] transition`}>
            <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.docx"
              className="hidden"
              onChange={(e) => handleFileUpload(Array.from(e.target.files))} />
            {uploading ? (
              <Loader2 size={28} className="text-[#E5A800] animate-spin mb-2" />
            ) : (
              <Paperclip size={28} className="text-gray-400 mb-2" />
            )}
            <p className={`text-sm font-semibold text-center ${tTheme.text}`}>
              {uploading ? t('uploading') : t('click_to_upload')}
            </p>
            <p className={`text-xs mt-1 text-center ${tTheme.subtext}`}>{t('file_requirements')}</p>
          </label>
          {errors.file && <p className="text-red-500 text-xs mt-1 text-left">{errors.file}</p>}

          {/* Uploaded files list */}
          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((file, i) => (
                <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-xl border ${tTheme.border} ${tTheme.input}`}>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Paperclip size={14} className="text-[#8B4513] flex-shrink-0" />
                    <a href={file.url} target="_blank" rel="noreferrer"
                      className="text-xs font-semibold text-[#8B4513] hover:underline truncate">
                      {file.name}
                    </a>
                  </div>
                  <button onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-gray-400 hover:text-red-500 transition flex-shrink-0 ml-2">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button onClick={() => setShowPreview(true)}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 border ${tTheme.border} ${tTheme.subtext} font-semibold px-5 py-2 rounded-xl hover:bg-gray-50 transition`}>
            <Eye size={16} /> {t('preview')}
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Save Draft */}
            <button onClick={handleSaveDraft} disabled={savingDraft}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 border ${tTheme.border} ${tTheme.subtext} font-semibold px-5 py-2 rounded-xl hover:bg-gray-100 disabled:opacity-60 transition`}>
              {savingDraft ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {savingDraft ? t('saving_draft') : t('save_draft')}
            </button>

            {/* Schedule or Publish */}
            {isScheduled ? (
              <button onClick={handleSchedule} disabled={scheduling}
                className="w-full sm:w-auto bg-[#3B1F0A] hover:bg-[#2a1506] disabled:opacity-60 text-white font-semibold px-6 py-2 rounded-xl flex items-center justify-center gap-2 transition">
                {scheduling ? <Loader2 size={15} className="animate-spin" /> : <Clock size={15} />}
                {scheduling ? t('scheduling') : t('schedule')}
              </button>
            ) : (
              <button onClick={handlePublish} disabled={publishing}
                className="w-full sm:w-auto bg-[#E5A800] hover:bg-[#cc9600] disabled:opacity-60 text-black font-semibold px-6 py-2 rounded-xl flex items-center justify-center gap-2 transition">
                {publishing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {publishing ? t('publishing') : t('publish_now')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Publishing Guidelines */}
      <div className={`${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-yellow-50 border-yellow-200"} border rounded-2xl p-5 flex gap-4`}>
        <span className="text-yellow-500 mt-0.5 flex-shrink-0">ℹ️</span>
        <div>
          <p className={`text-sm font-semibold mb-1 text-left ${tTheme.text}`}>{t('publishing_guidelines_title')}</p>
          <p className={`text-xs text-left ${tTheme.subtext}`}>
            {t('publishing_guidelines_desc')}
          </p>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className={`${tTheme.card} rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h2 className={`text-base sm:text-lg font-bold text-left ${tTheme.text}`}>{t('preview_announcement')}</h2>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              {/* Priority badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${priorityColor[priority]}`}>
                  {priorityOptions.find(p => p.value === priority)?.label || priority}
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  {categoryOptions.find(c => c.value === category)?.label || category}
                </span>
                <span className="text-xs text-blue-500 font-medium">🌐 {languageOptions.find(l => l.value === language)?.label || language}</span>
              </div>
              <h3 className={`text-lg sm:text-xl font-black mb-3 text-left ${tTheme.text}`}>{title || t('untitled_announcement')}</h3>
              <p className={`text-sm leading-relaxed mb-4 text-left ${tTheme.subtext}`}>{description || t('no_description_provided')}</p>

              {expiryDate && (
                <p className="text-xs text-red-500 font-semibold mb-3 text-left">
                  🗓 {t('expires_on')}: {new Date(expiryDate).toLocaleDateString(i18n.language, { year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}
              {isScheduled && scheduleDate && scheduleTime && (
                <p className="text-xs text-blue-500 font-semibold mb-3 text-left">
                  🕐 {t('scheduled_for')}: {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString(i18n.language, { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
              {attachments.length > 0 && (
                <div className="mt-4">
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-2 text-left ${tTheme.subtext}`}>
                    {t('form_attachments')}
                  </p>
                  <div className="space-y-2">
                    {attachments.map((f, i) => (
                      <a key={i} href={f.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 text-xs text-[#8B4513] font-semibold hover:underline">
                        <Paperclip size={12} /> {f.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex justify-end">
              <button onClick={() => setShowPreview(false)}
                className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold px-6 py-2 rounded-xl transition">
                {t('close_preview')}
              </button>
            </div>
          </div>
        </div>
      )}

    </GNLayout>
  );
};

export default GNCreateAnnouncement;