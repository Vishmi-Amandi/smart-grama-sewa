import { useState } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TransferRequest = ({ gnStatus, theme }) => {
  const t = getThemeClasses(theme);
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      {/* Page Title */}
      <h1 className="text-2xl font-bold text-[#8B4513] mb-6">Transfer Request</h1>

      <div className={`${t.card} rounded-2xl shadow p-8`}>

        {/* Transfer Details */}
        <div className="mb-6">
          <p className={`text-sm font-semibold mb-4 flex items-center gap-2 ${t.text}`}>
            📍 Transfer Details
          </p>
          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className={`text-xs font-semibold mb-1 block ${t.subtext}`}>From Division (Current)</label>
              <input
                type="text"
                defaultValue="Colombo Central"
                className={`w-full border ${t.border} rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input} text-[#8B4513] font-semibold`}
              />
            </div>

            <div>
              <label className={`text-xs font-semibold mb-1 block ${t.subtext}`}>District</label>
              <select className={`w-full border ${t.border} rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}>
                <option>Select District</option>
                <option>Colombo</option>
                <option>Gampaha</option>
                <option>Kandy</option>
                <option>Galle</option>
              </select>
            </div>

            <div>
              <label className={`text-xs font-semibold mb-1 block ${t.subtext}`}>To Division (Requested)</label>
              <select className={`w-full border ${t.border} rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}>
                <option>Select Target Division</option>
                <option>Homagama</option>
                <option>Nugegoda</option>
                <option>Maharagama</option>
              </select>
            </div>

            <div>
              <label className={`text-xs font-semibold mb-1 block ${t.subtext}`}>GN Division</label>
              <select className={`w-full border ${t.border} rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}>
                <option>Select GN Division</option>
                <option>Division A</option>
                <option>Division B</option>
                <option>Division C</option>
              </select>
            </div>

          </div>
        </div>

        {/* Divider */}
        <hr className={`${t.border} mb-6`} />

        {/* Reasoning & Schedule */}
        <div className="mb-6">
          <p className={`text-sm font-semibold mb-4 flex items-center gap-2 ${t.text}`}>
            ℹ️ Reasoning & Schedule
          </p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={`text-xs font-semibold mb-1 block ${t.subtext}`}>Effective Date</label>
              <input
                type="date"
                className={`w-full border ${t.border} rounded-xl px-4 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}
              />
            </div>
          </div>
          <div>
            <label className={`text-xs font-semibold mb-1 block ${t.subtext}`}>Reason for Transfer</label>
            <textarea
              placeholder="State your primary reason for requesting this transfer..."
              rows={4}
              className={`w-full border ${t.border} rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E5A800] transition resize-none ${t.input}`}
            />
          </div>
        </div>

        {/* Divider */}
        <hr className={`${t.border} mb-6`} />

        {/* Supporting Documents */}
        <div className="mb-6">
          <p className={`text-sm font-semibold mb-4 flex items-center gap-2 ${t.text}`}>
            📄 Supporting Documents
          </p>
          <label className={`text-xs font-semibold mb-2 block ${t.subtext}`}>Upload Transfer Letter</label>
          <div className={`border-2 border-dashed ${t.border} rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-[#E5A800] transition mb-4`}>
            <Upload size={28} className="text-gray-400 mb-2" />
            <p className={`text-sm font-semibold ${t.text}`}>Click to upload or drag and drop</p>
            <p className={`text-xs mt-1 ${t.subtext}`}>PDF, JPG or PNG (Max. 5MB)</p>
          </div>

          <div>
            <label className={`text-xs font-semibold mb-1 block ${t.subtext}`}>Additional Notes</label>
            <textarea
              placeholder="Any other information you wish to provide..."
              rows={3}
              className={`w-full border ${t.border} rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E5A800] transition resize-none ${t.input}`}
            />
          </div>
        </div>

        {/* Confirmation Checkbox */}
        <div className={`border ${t.border} rounded-xl px-4 py-3 mb-6 flex items-start gap-3`}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="accent-[#E5A800] mt-0.5"
          />
          <p className={`text-xs ${t.subtext}`}>
            I confirm that the information provided is true and matches my official transfer order.
            I understand that false information may lead to disciplinary action.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={() => navigate(-1)}
            className={`font-semibold px-6 py-2 rounded-xl border ${t.border} ${t.text} hover:bg-gray-100 transition`}>
            Cancel
          </button>
          <button
            disabled={!confirmed}
            className={`font-semibold px-6 py-2 rounded-xl flex items-center gap-2 transition
              ${confirmed
                ? "bg-[#E5A800] hover:bg-[#cc9600] text-black cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}>
            Submit Request →
          </button>
        </div>

      </div>

    </GNLayout>
  );
};

export default TransferRequest;