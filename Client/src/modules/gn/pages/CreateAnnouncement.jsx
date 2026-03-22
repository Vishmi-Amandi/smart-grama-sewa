import { useState } from "react";
import GNLayout from "../components/gnlayout";
import { Paperclip, Eye, Send } from "lucide-react";

const CreateAnnouncement = ({ gnStatus }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <GNLayout gnStatus={gnStatus}>

      {/* Page Title */}
      <h1 className="text-2xl font-bold text-[#8B4513] mb-6">Create Announcement</h1>

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl shadow p-8 mb-6">

        {/* Title Field */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
            Announcement Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Upcoming Community Vaccination Drive"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 outline-none focus:border-[#E5A800] transition"
          />
        </div>

        {/* Description Field */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide full details of the announcement, including dates, locations, and requirements..."
            rows={6}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 outline-none focus:border-[#E5A800] transition resize-none"
          />
        </div>

        {/* Expiry Date */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
            Expiry Date
          </label>
          <input
            type="date"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 outline-none focus:border-[#E5A800] transition"
          />
       </div>


        {/* Attachments */}
        <div className="mb-8">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
            Attachments
          </label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-[#E5A800] transition">
            <Paperclip size={28} className="text-gray-400 mb-2" />
            <p className="text-sm font-semibold text-gray-600">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG or DOCX (MAX. 10MB)</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-2 border border-gray-300 text-gray-600 font-semibold px-5 py-2 rounded-xl hover:bg-gray-50 transition">
            <Eye size={16} />
            Preview
          </button>
          <div className="flex items-center gap-4">
            <button className="text-gray-600 font-semibold px-5 py-2 rounded-xl hover:bg-gray-100 transition">
              Save Draft
            </button>
            <button className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold px-6 py-2 rounded-xl flex items-center gap-2 transition">
              <Send size={16} />
              PUBLISH
            </button>
          </div>
        </div>

      </div>

      

    </GNLayout>
  );
};

export default CreateAnnouncement;