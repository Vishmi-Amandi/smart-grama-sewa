import { useState } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { Paperclip, Eye, Send, Save, X, Clock, Loader2 } from "lucide-react";
import { collection, addDoc,doc,updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useLocation, useNavigate } from "react-router-dom";
import { logActivity } from "../../../logActivity";

const GNCreateAnnouncement = ({ gnStatus, theme }) => {
  const t = getThemeClasses(theme);

  //_______read draft data___________________
  const location = useLocation();
  const navigate = useNavigate();
  const draft = location.state?.draft;

  // ─── Form State ─────────────────────────────────────────────────────────────
  const [title, setTitle] = useState(draft?.title || "");
  const [description, setDescription] = useState(draft?.description || "");
  const [category,       setCategory]       = useState("General");
  const [priority,       setPriority]       = useState("Normal");
  const [expiryDate, setExpiryDate] = useState(draft?.expiryDate || "");
  const [scheduleDate,   setScheduleDate]   = useState("");
  const [scheduleTime,   setScheduleTime]   = useState("");
  const [isScheduled,    setIsScheduled]    = useState(false);
  const [attachments,    setAttachments]    = useState([]);
  const [uploading,      setUploading]      = useState(false);
  const [showPreview,    setShowPreview]    = useState(false);
  const [errors,         setErrors]         = useState({});
   const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  // ─── Loading States ──────────────────────────────────────────────────────────
  const [savingDraft,    setSavingDraft]    = useState(false);
  const [publishing,     setPublishing]     = useState(false);
  const [scheduling,     setScheduling]     = useState(false);
  const [successMsg,     setSuccessMsg]     = useState("");

  // ─── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!title.trim())       e.title       = "Title is required.";
    if (!description.trim()) e.description = "Description is required.";
    if (isScheduled) {
      if (!scheduleDate) e.scheduleDate = "Schedule date is required.";
      if (!scheduleTime) e.scheduleTime = "Schedule time is required.";
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
        setErrors((p) => ({ ...p, file: `${file.name} exceeds 10MB limit.` }));
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
    setAttachments((prev) => [...prev, ...uploaded]);
    setUploading(false);
  };

  // ─── Build announcement object ────────────────────────────────────────────────
  const buildDoc = (status) => {
    const user = auth.currentUser;
    const base = {
      title:       title.trim(),
      description: description.trim(),
      category,
      priority,
      attachments,
      status,
      createdBy:   user?.uid || "",
      gnDivision:  user?.displayName || "",
      createdAt:   serverTimestamp(),
      expiresAt:   expiryDate
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
    setPriority("Normal"); setExpiryDate(""); setScheduleDate("");
    setScheduleTime(""); setIsScheduled(false); setAttachments([]);
    setErrors({});
  };

  // ─── Save as Draft ────────────────────────────────────────────────────────────
const handleSaveDraft = async () => {
  if (!title.trim()) { setError("Please enter a title."); return; }
  setLoading(true);
  try {
    const user = auth.currentUser;
if (draft?.id) {
  await updateDoc(doc(db, "announcements", draft.id), {
    title,
    description,
    expiresAt: expiryDate ? Timestamp.fromDate(new Date(expiryDate)) : null,
    expiryDate: expiryDate || "",
    status: "Draft",
    updatedAt: serverTimestamp(),
  });
}else {
      // Create new draft
      await addDoc(collection(db, "announcements"), {
        title,
        description,
        expiryDate,
        status: "Draft",
        createdBy: user.displayName || "Officer",
        createdByUid: user.uid,
        createdAt: serverTimestamp(),
      });
    }
    await logActivity("announcement", "Draft Saved", title, `Draft saved — Category: ${category}`);
    setSuccess("Draft saved successfully!");
    setTimeout(() => navigate("/gn-announcement-list"), 1500);
  } catch (err) {
    setError("Failed to save draft. Please try again.");
    console.error(err);
  } finally {
    setLoading(false);
  }
};

const handlePublish = async () => {
  if (!title.trim()) { setError("Please enter a title."); return; }
  if (!description.trim()) { setError("Please enter a description."); return; }
  setLoading(true);
  try {
    const user = auth.currentUser;
    console.log("Draft ID:", draft?.id);
    console.log("Expiry Date:", expiryDate);
    console.log("Title:", title);
    if (draft?.id) {
  await updateDoc(doc(db, "announcements", draft.id), {
    title,
    description,
    expiresAt: expiryDate ? Timestamp.fromDate(new Date(expiryDate)) : null,
    expiryDate: expiryDate || "",
    status: "Active",
    publishedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
} else {
      // Create new and publish
      await addDoc(collection(db, "announcements"), {
        title,
        description,
        expiresAt: expiryDate ? Timestamp.fromDate(new Date(expiryDate)) : null,
        expiryDate: expiryDate || "",
        status: "Active",
        createdBy: user.uid,
        createdByUid: user.uid,
        createdAt: serverTimestamp(),
        publishedAt: serverTimestamp(),
      });  
    }
    await logActivity("announcement", "Published", title, `Category: ${category}, Priority: ${priority}`);
    setSuccess("Announcement published successfully!");
    setTimeout(() => navigate("/gn-announcement-list"), 1500);
  } catch (err) {
    setError("Failed to publish. Please try again.");
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  // ─── Schedule Publish ─────────────────────────────────────────────────────────
  const handleSchedule = async () => {
    if (!validate()) return;
    setScheduling(true);
    try {
      await addDoc(collection(db, "announcements"), buildDoc("Scheduled"));
      await logActivity("announcement", "Scheduled", title, `Scheduled for ${scheduleDate} at ${scheduleTime}`);
      showSuccess(`🕐 Announcement scheduled for ${scheduleDate} at ${scheduleTime}.`);
      resetForm();
    } catch (err) {
      console.error("Schedule error:", err);
      setErrors({ firebase: "Failed to schedule. Please try again." });
    } finally {
      setScheduling(false);
    }
  };

  // ─── Priority badge color ─────────────────────────────────────────────────────
  const priorityColor = {
    Normal:  "bg-gray-100 text-gray-600",
    High:    "bg-orange-100 text-orange-600",
    Urgent:  "bg-red-100 text-red-600",
  };



  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      <h1 className="text-xl sm:text-2xl font-bold text-[#8B4513] mb-4 sm:mb-6 text-center sm:text-left">Create Announcement</h1>

      {/* Success Message */}
      {successMsg && (
        <div className="mb-4 bg-green-50 border border-green-300 rounded-xl px-4 py-3 text-sm font-semibold text-green-700 flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")}><X size={14} /></button>
        </div>
      )}

      {/* Firebase Error */}
      {errors.firebase && (
        <div className="mb-4 bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-sm font-semibold text-red-700 flex items-center justify-between">
          <span>⚠ {errors.firebase}</span>
          <button onClick={() => setErrors({})}><X size={14} /></button>
        </div>
      )}

      {/* Main Form Card */}
      <div className={`${t.card} rounded-2xl shadow p-4 sm:p-6 md:p-8 mb-6`}>

        {/* Title */}
        <div className="mb-6">
          <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block text-left ${t.subtext}`}>
            Announcement Title
          </label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Upcoming Community Vaccination Drive"
            className={`w-full border ${errors.title ? "border-red-400" : t.border} rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E5A800] transition ${t.input}`} />
          {errors.title && <p className="text-red-500 text-xs mt-1 text-left">{errors.title}</p>}
        </div>

        {/* Category + Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block text-left ${t.subtext}`}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className={`w-full border ${t.border} rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E5A800] transition ${t.input}`}>
              {["General","Emergency","Event","Health","Education","Infrastructure","Other"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block text-left ${t.subtext}`}>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}
              className={`w-full border ${t.border} rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E5A800] transition ${t.input}`}>
              {["Normal","High","Urgent"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block text-left ${t.subtext}`}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide full details of the announcement, including dates, locations, and requirements..."
            rows={6}
            className={`w-full border ${errors.description ? "border-red-400" : t.border} rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E5A800] transition resize-none ${t.input}`} />
          {errors.description && <p className="text-red-500 text-xs mt-1 text-left">{errors.description}</p>}
          <p className={`text-xs mt-1 text-right ${t.subtext}`}>{description.length} characters</p>
        </div>

        {/* Expiry Date */}
        <div className="mb-6">
          <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block text-left ${t.subtext}`}>
            Expiry Date <span className="normal-case font-normal">(optional)</span>
          </label>
          <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className={`w-full border ${t.border} rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E5A800] transition ${t.input}`} />
        </div>

        {/* Schedule Toggle */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setIsScheduled((v) => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${isScheduled ? "bg-[#E5A800]" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isScheduled ? "translate-x-5" : "translate-x-0"}`} />
            </button>
            <label className={`text-xs font-semibold uppercase tracking-wide ${t.subtext}`}>
              Schedule for Later
            </label>
          </div>

          {isScheduled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`text-xs font-semibold mb-1 block text-left ${t.subtext}`}>Publish Date</label>
                <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className={`w-full border ${errors.scheduleDate ? "border-red-400" : t.border} rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E5A800] transition ${t.input}`} />
                {errors.scheduleDate && <p className="text-red-500 text-xs mt-1 text-left">{errors.scheduleDate}</p>}
              </div>
              <div>
                <label className={`text-xs font-semibold mb-1 block text-left ${t.subtext}`}>Publish Time</label>
                <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)}
                  className={`w-full border ${errors.scheduleTime ? "border-red-400" : t.border} rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E5A800] transition ${t.input}`} />
                {errors.scheduleTime && <p className="text-red-500 text-xs mt-1 text-left">{errors.scheduleTime}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Attachments */}
        <div className="mb-8">
          <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block text-left ${t.subtext}`}>
            Attachments <span className="normal-case font-normal">(optional)</span>
          </label>
          <label className={`border-2 border-dashed ${t.border} rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#E5A800] transition`}>
            <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.docx"
              className="hidden"
              onChange={(e) => handleFileUpload(Array.from(e.target.files))} />
            {uploading ? (
              <Loader2 size={28} className="text-[#E5A800] animate-spin mb-2" />
            ) : (
              <Paperclip size={28} className="text-gray-400 mb-2" />
            )}
            <p className={`text-sm font-semibold text-center ${t.text}`}>
              {uploading ? "Uploading..." : "Click to upload or drag and drop"}
            </p>
            <p className={`text-xs mt-1 text-center ${t.subtext}`}>PDF, PNG, JPG or DOCX (MAX. 10MB)</p>
          </label>
          {errors.file && <p className="text-red-500 text-xs mt-1 text-left">{errors.file}</p>}

          {/* Uploaded files list */}
          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((file, i) => (
                <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-xl border ${t.border} ${t.input}`}>
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
            className={`w-full sm:w-auto flex items-center justify-center gap-2 border ${t.border} ${t.subtext} font-semibold px-5 py-2 rounded-xl hover:bg-gray-50 transition`}>
            <Eye size={16} /> Preview
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Save Draft */}
            <button onClick={handleSaveDraft} disabled={savingDraft}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 border ${t.border} ${t.subtext} font-semibold px-5 py-2 rounded-xl hover:bg-gray-100 disabled:opacity-60 transition`}>
              {savingDraft ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {savingDraft ? "Saving..." : "Save Draft"}
            </button>

            {/* Schedule or Publish */}
            {isScheduled ? (
              <button onClick={handleSchedule} disabled={scheduling}
                className="w-full sm:w-auto bg-[#3B1F0A] hover:bg-[#2a1506] disabled:opacity-60 text-white font-semibold px-6 py-2 rounded-xl flex items-center justify-center gap-2 transition">
                {scheduling ? <Loader2 size={15} className="animate-spin" /> : <Clock size={15} />}
                {scheduling ? "Scheduling..." : "Schedule"}
              </button>
            ) : (
              <button onClick={handlePublish} disabled={publishing}
                className="w-full sm:w-auto bg-[#E5A800] hover:bg-[#cc9600] disabled:opacity-60 text-black font-semibold px-6 py-2 rounded-xl flex items-center justify-center gap-2 transition">
                {publishing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {publishing ? "Publishing..." : "Publish Now"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Publishing Guidelines */}
      <div className={`${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-yellow-50 border-yellow-200"} border rounded-2xl p-5 flex gap-4`}>
        <span className="text-yellow-500 mt-0.5 flex-shrink-0">ℹ️</span>
        <div>
          <p className={`text-sm font-semibold mb-1 text-left ${t.text}`}>Publishing Guidelines</p>
          <p className={`text-xs text-left ${t.subtext}`}>
            Announcements will be immediately visible on the citizen mobile app and public portal
            for your division. Ensure all sensitive information is handled according to the
            Ministry of Home Affairs data privacy policies.
          </p>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className={`${t.card} rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h2 className={`text-base sm:text-lg font-bold text-left ${t.text}`}>Preview Announcement</h2>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              {/* Priority badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${priorityColor[priority]}`}>{priority}</span>
                <span className="text-xs text-gray-400 font-medium">{category}</span>
              </div>
              <h3 className={`text-lg sm:text-xl font-black mb-3 text-left ${t.text}`}>{title || "Untitled Announcement"}</h3>
              <p className={`text-sm leading-relaxed mb-4 text-left ${t.subtext}`}>{description || "No description provided."}</p>

              {expiryDate && (
                <p className="text-xs text-red-500 font-semibold mb-3 text-left">
                  🗓 Expires on: {new Date(expiryDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}
              {isScheduled && scheduleDate && scheduleTime && (
                <p className="text-xs text-blue-500 font-semibold mb-3 text-left">
                  🕐 Scheduled: {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
              {attachments.length > 0 && (
                <div className="mt-4">
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-2 text-left ${t.subtext}`}>Attachments</p>
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
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </GNLayout>
  );
};

export default GNCreateAnnouncement;