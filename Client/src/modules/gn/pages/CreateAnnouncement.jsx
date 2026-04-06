import { useState } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { Paperclip, Eye, Send } from "lucide-react";

const CreateAnnouncement = ({ gnStatus, theme }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const t = getThemeClasses(theme);

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      {/* Page Title */}
      <h1 className="text-2xl font-bold text-[#8B4513] mb-6">Create Announcement</h1>

      {/* Main Form Card */}
      <div className={`${t.card} rounded-2xl shadow p-8 mb-6`}>

        {/* Title Field */}
        <div className="mb-6">
          <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${t.subtext}`}>
            Announcement Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Upcoming Community Vaccination Drive"
            className={`w-full border ${t.border} rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E5A800] transition ${t.input}`}
          />
        </div>

        {/* Description Field */}
        <div className="mb-6">
          <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${t.subtext}`}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide full details of the announcement, including dates, locations, and requirements..."
            rows={6}
            className={`w-full border ${t.border} rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E5A800] transition resize-none ${t.input}`}
          />
        </div>

        {/* Expiry Date */}
        <div className="mb-6">
          <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${t.subtext}`}>
            Expiry Date
          </label>
          <input
            type="date"
            className={`w-full border ${t.border} rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E5A800] transition ${t.input}`}
          />
        </div>

        {/* Attachments */}
        <div className="mb-8">
          <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${t.subtext}`}>
            Attachments
          </label>
          <div className={`border-2 border-dashed ${t.border} rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-[#E5A800] transition`}>
            <Paperclip size={28} className="text-gray-400 mb-2" />
            <p className={`text-sm font-semibold ${t.text}`}>Click to upload or drag and drop</p>
            <p className={`text-xs mt-1 ${t.subtext}`}>PDF, PNG, JPG or DOCX (MAX. 10MB)</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button className={`flex items-center gap-2 border ${t.border} ${t.subtext} font-semibold px-5 py-2 rounded-xl hover:bg-gray-50 transition`}>
            <Eye size={16} />
            Preview
          </button>
          <div className="flex items-center gap-4">
            <button className={`${t.subtext} font-semibold px-5 py-2 rounded-xl hover:bg-gray-100 transition`}>
              Save Draft
            </button>
            <button className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold px-6 py-2 rounded-xl flex items-center gap-2 transition">
              <Send size={16} />
              PUBLISH
            </button>
          </div>
        </div>

      </div>

      {/* Publishing Guidelines */}
      <div className={`${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-yellow-50 border-yellow-200"} border rounded-2xl p-5 flex gap-4`}>
        <span className="text-yellow-500 mt-0.5">ℹ️</span>
        <div>
          <p className={`text-sm font-semibold mb-1 ${t.text}`}>Publishing Guidelines</p>
          <p className={`text-xs ${t.subtext}`}>
            Announcements will be immediately visible on the citizen mobile app and public portal
            for your division. Ensure all sensitive information is handled according to the
            Ministry of Home Affairs data privacy policies.
          </p>
        </div>
      </div>

    </GNLayout>
  );
};

export default CreateAnnouncement;