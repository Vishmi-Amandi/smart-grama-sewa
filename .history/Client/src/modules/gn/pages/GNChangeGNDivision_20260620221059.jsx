import { useState } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { logActivity } from "../../../logActivity";
import { useTranslation } from "react-i18next";

const GNChangeGNDivision = ({ gnStatus, theme }) => {
  const { t } = useTranslation();
  const tTheme = getThemeClasses(theme);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fromDivision: "",
    fromDistrict: "",
    toDivision: "",
    toDistrict: "",
    effectiveDate: "",
    reason: "",
    additionalNotes: "",
  });

  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [transferLetter, setTransferLetter] = useState("");
  const [uploading, setUploading] = useState(false);

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // District list (used for both from and to)
  const districts = [
    "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
    "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
    "Vavuniya", "Mullaitivu", "Trincomalee", "Batticaloa", "Ampara",
    "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
    "Moneragala", "Ratnapura", "Kegalle"
  ];

  const handleSubmit = async () => {
    if (!confirmed) { setError(t("err_confirm_required")); return; }
    if (!form.fromDistrict) { setError(t("err_from_district_required")); return; }
    if (!form.toDivision.trim()) { setError(t("err_to_division_required")); return; }
    if (!form.toDistrict) { setError(t("err_to_district_required")); return; }
    if (!form.reason.trim()) { setError(t("err_reason_required")); return; }
    if (!form.effectiveDate) { setError(t("err_effective_date_required")); return; }

    setLoading(true);
    setError("");
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, "gn_change_gn_division"), {
        uid: user.uid,
        email: user.email,
        fromDivision: form.fromDivision,
        fromDistrict: form.fromDistrict,
        toDivision: form.toDivision,
        toDistrict: form.toDistrict,
        effectiveDate: form.effectiveDate,
        reason: form.reason,
        additionalNotes: form.additionalNotes,
        transferLetter: transferLetter || "",
        status: "Pending",
        createdAt: serverTimestamp(),
      });
      await logActivity(
        "transfer",
        "Submitted",
        `Transfer to ${form.toDivision}`,
        `From ${form.fromDivision} (${form.fromDistrict}) → ${form.toDivision} (${form.toDistrict})`
      );
      setSuccess(true);
    } catch (err) {
      setError(t("err_submit_failed"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "gn_documents");
      formData.append("cloud_name", "dsi9xh1fd");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dsi9xh1fd/auto/upload",
        { method: "POST", body: formData }
      );
      const data = await response.json();
      if (data.secure_url) {
        setTransferLetter(data.secure_url);
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      {/* Page Title */}
      <h1 className="text-xl sm:text-2xl font-bold text-[#8B4513] mb-4 sm:mb-6 text-center sm:text-left">
        {t("change_gn_division_title")}
      </h1>

      {success ? (
        /* Success State - Responsive */
        <div className={`${tTheme.card} rounded-2xl shadow p-8 sm:p-12 text-center`}>
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <span className="text-2xl sm:text-3xl">✅</span>
          </div>
          <h2 className={`text-lg sm:text-xl font-bold mb-2 text-center ${tTheme.text}`}>
            {t("request_submitted_title")}
          </h2>
          <p className={`text-xs sm:text-sm mb-5 sm:mb-6 text-center ${tTheme.subtext}`}>
            {t("request_submitted_desc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/gn-dashboard")}
              className={`border ${tTheme.border} font-semibold px-5 sm:px-6 py-2 rounded-xl text-center ${tTheme.text} transition`}>
              {t("back_to_dashboard")}
            </button>
            <button
              onClick={() => navigate("/change-gn-request-status")}
              className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold px-5 sm:px-6 py-2 rounded-xl transition text-center">
              {t("view_request_status")}
            </button>
          </div>
        </div>
      ) : (
        <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-6 md:p-8`}>

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-red-600 text-left">
              ⚠️ {error}
            </div>
          )}

          {/* Transfer Details */}
          <div className="mb-5 sm:mb-6">
            <p className={`text-sm font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-left ${tTheme.text}`}>
              📍 {t("transfer_details_label")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

              {/* From Division */}
              <div>
                <label className={`text-[10px] sm:text-xs font-semibold mb-1 block text-left ${tTheme.subtext}`}>
                  {t("from_division_label")}
                </label>
                <input
                  type="text"
                  value={form.fromDivision}
                  onChange={(e) => updateForm("fromDivision", e.target.value)}
                  placeholder={t("from_division_placeholder")}
                  className={`w-full border ${tTheme.border} rounded-xl px-3 sm:px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`}
                />
              </div>

              {/* From District */}
              <div>
                <label className={`text-[10px] sm:text-xs font-semibold mb-1 block text-left ${tTheme.subtext}`}>
                  {t("from_district_label")}
                </label>
                <select
                  value={form.fromDistrict}
                  onChange={(e) => updateForm("fromDistrict", e.target.value)}
                  className={`w-full border ${tTheme.border} rounded-xl px-3 sm:px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`}>
                  <option value="">{t("select_district_option")}</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* To Division */}
              <div>
                <label className={`text-[10px] sm:text-xs font-semibold mb-1 block text-left ${tTheme.subtext}`}>
                  {t("to_division_label")}
                </label>
                <input
                  type="text"
                  value={form.toDivision}
                  onChange={(e) => updateForm("toDivision", e.target.value)}
                  placeholder={t("to_division_placeholder")}
                  className={`w-full border ${tTheme.border} rounded-xl px-3 sm:px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`}
                />
              </div>

              {/* To District */}
              <div>
                <label className={`text-[10px] sm:text-xs font-semibold mb-1 block text-left ${tTheme.subtext}`}>
                  {t("to_district_label")}
                </label>
                <select
                  value={form.toDistrict}
                  onChange={(e) => updateForm("toDistrict", e.target.value)}
                  className={`w-full border ${tTheme.border} rounded-xl px-3 sm:px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`}>
                  <option value="">{t("select_district_option")}</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          <hr className={`${tTheme.border} mb-5 sm:mb-6`} />

          {/* Reasoning & Schedule */}
          <div className="mb-5 sm:mb-6">
            <p className={`text-sm font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-left ${tTheme.text}`}>
              ℹ️ {t("reasoning_schedule_label")}
            </p>
            <div className="mb-3 sm:mb-4">
              <label className={`text-[10px] sm:text-xs font-semibold mb-1 block text-left ${tTheme.subtext}`}>
                {t("effective_date_label")}
              </label>
              <input
                type="date"
                value={form.effectiveDate}
                onChange={(e) => updateForm("effectiveDate", e.target.value)}
                className={`w-full border ${tTheme.border} rounded-xl px-3 sm:px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`}
              />
            </div>
            <div>
              <label className={`text-[10px] sm:text-xs font-semibold mb-1 block text-left ${tTheme.subtext}`}>
                {t("reason_label")}
              </label>
              <textarea
                value={form.reason}
                onChange={(e) => updateForm("reason", e.target.value)}
                placeholder={t("reason_placeholder")}
                rows={4}
                className={`w-full border ${tTheme.border} rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm outline-none focus:border-[#E5A800] transition resize-none ${tTheme.input}`}
              />
            </div>
          </div>

          <hr className={`${tTheme.border} mb-5 sm:mb-6`} />

          {/* Supporting Documents */}
          <div className="mb-5 sm:mb-6">
            <p className={`text-sm font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-left ${tTheme.text}`}>
              📄 {t("supporting_documents_label")}
            </p>
            <label className={`text-[10px] sm:text-xs font-semibold mb-2 block text-left ${tTheme.subtext}`}>
              {t("upload_transfer_letter_label")}
            </label>
            <label className={`border-2 border-dashed ${tTheme.border} rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#E5A800] transition
              ${transferLetter ? "border-green-400 bg-green-50" : ""}`}>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files[0])}
              />
              {uploading ? (
                <>
                  <span className="text-2xl sm:text-3xl mb-2">⏳</span>
                  <p className="text-[10px] sm:text-xs font-semibold text-yellow-600 text-center">
                    {t("uploading")}
                  </p>
                </>
              ) : transferLetter ? (
                <>
                  <span className="text-2xl sm:text-3xl mb-2">✅</span>
                  <p className="text-[10px] sm:text-xs font-semibold text-green-600 text-center">
                    {t("uploaded_success")}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-1 text-center">
                    {t("click_to_replace")}
                  </p>
                </>
              ) : (
                <>
                  <Upload size={24} className="sm:w-7 sm:h-7 text-gray-400 mb-2" />
                  <p className={`text-xs sm:text-sm font-semibold text-center ${tTheme.text}`}>
                    {t("click_to_upload")}
                  </p>
                  <p className={`text-[10px] sm:text-xs mt-1 text-center ${tTheme.subtext}`}>
                    {t("file_requirements")}
                  </p>
                </>
              )}
            </label>
          </div>

          <hr className={`${tTheme.border} mb-5 sm:mb-6`} />

          {/* Additional Notes */}
          <div className="mb-5 sm:mb-6">
            <p className={`text-sm font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-left ${tTheme.text}`}>
              📄 {t("additional_notes_label")}
            </p>
            <textarea
              value={form.additionalNotes}
              onChange={(e) => updateForm("additionalNotes", e.target.value)}
              placeholder={t("additional_notes_placeholder")}
              rows={3}
              className={`w-full border ${tTheme.border} rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm outline-none focus:border-[#E5A800] transition resize-none ${tTheme.input}`}
            />
          </div>

          {/* Confirmation Checkbox */}
          <div className={`border ${tTheme.border} rounded-xl px-3 sm:px-4 py-3 mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3`}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="accent-[#E5A800] self-start sm:self-auto"
            />
            <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>
              {t("confirm_checkbox_text")}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4">
            <button
              onClick={() => navigate(-1)}
              className={`w-full sm:w-auto font-semibold px-6 py-2 rounded-xl border ${tTheme.border} ${tTheme.text} hover:bg-gray-100 transition text-center`}>
              {t("cancel_btn")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!confirmed || loading}
              className={`w-full sm:w-auto font-semibold px-6 py-2 rounded-xl flex items-center justify-center gap-2 transition
                ${confirmed
                  ? "bg-[#E5A800] hover:bg-[#cc9600] text-black cursor-pointer"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}>
              {loading ? t("submitting") : t("submit_request_btn")}
            </button>
          </div>

        </div>
      )}

    </GNLayout>
  );
};

export default GNChangeGNDivision;