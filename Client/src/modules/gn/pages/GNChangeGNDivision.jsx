import { useState } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { logActivity } from "../../../logActivity";

const GNChangeGNDivision = ({ gnStatus, theme }) => {
  const t = getThemeClasses(theme);
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

const handleSubmit = async () => {
  if (!confirmed) { setError("Please confirm the information is correct."); return; }
  if (!form.fromDistrict) { setError("Please select your current district."); return; }
  if (!form.toDivision.trim()) { setError("Please enter target division."); return; }
  if (!form.toDistrict) { setError("Please select target district."); return; }
  if (!form.reason.trim()) { setError("Please provide a reason for transfer."); return; }
  if (!form.effectiveDate) { setError("Please select an effective date."); return; }

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
    setError("Failed to submit request. Please try again.");
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
    <h1 className="text-xl sm:text-2xl font-bold text-[#8B4513] mb-4 sm:mb-6 text-center sm:text-left">Change GN Division</h1>

    {success ? (
      /* Success State - Responsive */
      <div className={`${t.card} rounded-2xl shadow p-8 sm:p-12 text-center`}>
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <span className="text-2xl sm:text-3xl">✅</span>
        </div>
        <h2 className={`text-lg sm:text-xl font-bold mb-2 text-center ${t.text}`}>Request Submitted!</h2>
        <p className={`text-xs sm:text-sm mb-5 sm:mb-6 text-center ${t.subtext}`}>
          Your change GN division request has been submitted successfully. You will be notified once it is reviewed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
  <button
    onClick={() => navigate("/gn-dashboard")}
    className={`border ${t.border} font-semibold px-5 sm:px-6 py-2 rounded-xl text-center ${t.text} transition`}>
    Back to Dashboard
  </button>
  <button
    onClick={() => navigate("/change-gn-request-status")}
    className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold px-5 sm:px-6 py-2 rounded-xl transition text-center">
    View Request Status
  </button>
</div>
      </div>
    ) : (
      <div className={`${t.card} rounded-2xl shadow p-4 sm:p-6 md:p-8`}>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-red-600 text-left">
            ⚠️ {error}
          </div>
        )}

        {/* Transfer Details */}
        <div className="mb-5 sm:mb-6">
          <p className={`text-sm font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-left ${t.text}`}>
            📍 Transfer Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

  {/* From Division */}
  <div>
    <label className={`text-[10px] sm:text-xs font-semibold mb-1 block text-left ${t.subtext}`}>
      From GN Division (Current)
    </label>
    <input
      type="text"
      value={form.fromDivision}
      onChange={(e) => updateForm("fromDivision", e.target.value)}
      placeholder="Your current division"
      className={`w-full border ${t.border} rounded-xl px-3 sm:px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}
    />
  </div>

  {/* From District */}
  <div>
    <label className={`text-[10px] sm:text-xs font-semibold mb-1 block text-left ${t.subtext}`}>
      From District (Current)
    </label>
    <select
      value={form.fromDistrict}
      onChange={(e) => updateForm("fromDistrict", e.target.value)}
      className={`w-full border ${t.border} rounded-xl px-3 sm:px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}>
      <option value="">Select District</option>
      {["Colombo","Gampaha","Kalutara","Kandy","Matale","Nuwara Eliya",
        "Galle","Matara","Hambantota","Jaffna","Kilinochchi","Mannar",
        "Vavuniya","Mullaitivu","Trincomalee","Batticaloa","Ampara",
        "Kurunegala","Puttalam","Anuradhapura","Polonnaruwa","Badulla",
        "Moneragala","Ratnapura","Kegalle"].map((d) => (
        <option key={d} value={d}>{d}</option>
      ))}
    </select>
  </div>

  {/* To Division */}
  <div>
    <label className={`text-[10px] sm:text-xs font-semibold mb-1 block text-left ${t.subtext}`}>
      To GN Division (Requested)
    </label>
    <input
      type="text"
      value={form.toDivision}
      onChange={(e) => updateForm("toDivision", e.target.value)}
      placeholder="Target division name"
      className={`w-full border ${t.border} rounded-xl px-3 sm:px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}
    />
  </div>

  {/* To District */}
  <div>
    <label className={`text-[10px] sm:text-xs font-semibold mb-1 block text-left ${t.subtext}`}>
      To District (Requested)
    </label>
    <select
      value={form.toDistrict}
      onChange={(e) => updateForm("toDistrict", e.target.value)}
      className={`w-full border ${t.border} rounded-xl px-3 sm:px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}>
      <option value="">Select District</option>
      {["Colombo","Gampaha","Kalutara","Kandy","Matale","Nuwara Eliya",
        "Galle","Matara","Hambantota","Jaffna","Kilinochchi","Mannar",
        "Vavuniya","Mullaitivu","Trincomalee","Batticaloa","Ampara",
        "Kurunegala","Puttalam","Anuradhapura","Polonnaruwa","Badulla",
        "Moneragala","Ratnapura","Kegalle"].map((d) => (
        <option key={d} value={d}>{d}</option>
      ))}
    </select>
  </div>

</div> 
        </div>

        <hr className={`${t.border} mb-5 sm:mb-6`} />

        {/* Reasoning & Schedule */}
        <div className="mb-5 sm:mb-6">
          <p className={`text-sm font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-left ${t.text}`}>
            ℹ️ Reasoning & Schedule
          </p>
          <div className="mb-3 sm:mb-4">
            <label className={`text-[10px] sm:text-xs font-semibold mb-1 block text-left ${t.subtext}`}>Effective Date</label>
            <input
              type="date"
              value={form.effectiveDate}
              onChange={(e) => updateForm("effectiveDate", e.target.value)}
              className={`w-full border ${t.border} rounded-xl px-3 sm:px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}
            />
          </div>
          <div>
            <label className={`text-[10px] sm:text-xs font-semibold mb-1 block text-left ${t.subtext}`}>Reason for Transfer</label>
            <textarea
              value={form.reason}
              onChange={(e) => updateForm("reason", e.target.value)}
              placeholder="State your primary reason for requesting this transfer..."
              rows={4}
              className={`w-full border ${t.border} rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm outline-none focus:border-[#E5A800] transition resize-none ${t.input}`}
            />
          </div>
        </div>

        <hr className={`${t.border} mb-5 sm:mb-6`} />

        {/* Supporting Documents */}
<div className="mb-5 sm:mb-6">
  <p className={`text-sm font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-left ${t.text}`}>
    📄 Supporting Documents
  </p>
  <label className={`text-[10px] sm:text-xs font-semibold mb-2 block text-left ${t.subtext}`}>
    Upload Transfer Letter
  </label>
  <label className={`border-2 border-dashed ${t.border} rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#E5A800] transition
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
        <p className="text-[10px] sm:text-xs font-semibold text-yellow-600 text-center">Uploading...</p>
      </>
    ) : transferLetter ? (
      <>
        <span className="text-2xl sm:text-3xl mb-2">✅</span>
        <p className="text-[10px] sm:text-xs font-semibold text-green-600 text-center">Uploaded successfully!</p>
        <p className="text-[10px] sm:text-xs text-gray-400 mt-1 text-center">Click to replace</p>
      </>
    ) : (
      <>
        <Upload size={24} className="sm:w-7 sm:h-7 text-gray-400 mb-2" />
        <p className={`text-xs sm:text-sm font-semibold text-center ${t.text}`}>Click to upload or drag and drop</p>
        <p className={`text-[10px] sm:text-xs mt-1 text-center ${t.subtext}`}>PDF, PNG, JPG (Max. 5MB)</p>
      </>
    )}
  </label>
</div>

<hr className={`${t.border} mb-5 sm:mb-6`} />

        {/* Additional Notes */}
        <div className="mb-5 sm:mb-6">
          <p className={`text-sm font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-left ${t.text}`}>
            📄 Additional Notes
          </p>
          <textarea
            value={form.additionalNotes}
            onChange={(e) => updateForm("additionalNotes", e.target.value)}
            placeholder="Any other information you wish to provide..."
            rows={3}
            className={`w-full border ${t.border} rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm outline-none focus:border-[#E5A800] transition resize-none ${t.input}`}
          />
        </div>

        {/* Confirmation Checkbox */}
        <div className={`border ${t.border} rounded-xl px-3 sm:px-4 py-3 mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3`}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="accent-[#E5A800] self-start sm:self-auto"
          />
          <p className={`text-[10px] sm:text-xs text-left ${t.subtext}`}>
            I confirm that the information provided is true and matches my official transfer order.
            I understand that false information may lead to disciplinary action.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-4">
          <button
            onClick={() => navigate(-1)}
            className={`w-full sm:w-auto font-semibold px-6 py-2 rounded-xl border ${t.border} ${t.text} hover:bg-gray-100 transition text-center`}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!confirmed || loading}
            className={`w-full sm:w-auto font-semibold px-6 py-2 rounded-xl flex items-center justify-center gap-2 transition
              ${confirmed
                ? "bg-[#E5A800] hover:bg-[#cc9600] text-black cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}>
            {loading ? "Submitting..." : "Submit Request →"}
          </button>
        </div>

      </div>
    )}

  </GNLayout>
);
};
export default GNChangeGNDivision;