import { useState } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { Search, Download } from "lucide-react";

const citizens = [
  { initials: "WR", color: "bg-red-200 text-red-700", name: "W. Ranasinghe", address: "22/A, Temple Road, Colombo 07", nic: "198567432109", phone: "077 123 4567", status: "VERIFIED" },
  { initials: "KP", color: "bg-yellow-200 text-yellow-700", name: "K.P. Silva", address: "45, Galle Road, Colombo 03", nic: "198245123980", phone: "071 987 6543", status: "PENDING UPDATE" },
  { initials: "AE", color: "bg-green-200 text-green-700", name: "A. Fazly", address: "88, Flower Road, Colombo 07", nic: "197800112233", phone: "070 555 1122", status: "VERIFIED" },
];

const CitizenSearch = ({ gnStatus, theme }) => {
  const [name, setName] = useState("");
  const [nic, setNic] = useState("");
  const t = getThemeClasses(theme);

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      {/* Page Title */}
      <h1 className="text-2xl font-bold text-[#8B4513] mb-6">Citizen Search</h1>

      {/* Search Bar */}
      <div className={`${t.card} rounded-2xl shadow p-5 mb-6 border-2 border-dashed border-blue-200`}>
        <div className="flex gap-4 items-center">

          {/* Name Input */}
          <div className={`flex-1 flex items-center border ${t.border} rounded-xl px-4 py-2 gap-2`}>
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
              className={`w-full text-sm outline-none ${t.input}`}
            />
          </div>

          {/* NIC Input */}
          <div className={`flex-1 flex items-center border ${t.border} rounded-xl px-4 py-2 gap-2`}>
            <span className="text-gray-400 text-xs">🪪</span>
            <input
              type="text"
              value={nic}
              onChange={(e) => setNic(e.target.value)}
              placeholder="e.g. 199012345678"
              className={`w-full text-sm outline-none ${t.input}`}
            />
          </div>

          {/* Search Button */}
          <button className="bg-[#3B1F0A] text-white font-semibold px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-[#2a1506] transition">
            <Search size={16} />
            Search
          </button>

        </div>
      </div>

      {/* Results Table */}
      <div className={`${t.card} rounded-2xl shadow overflow-hidden`}>

        {/* Table Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${t.border}`}>
          <p className={`text-sm font-semibold ${t.text}`}>Recent Search Results</p>
          <button className="flex items-center gap-2 text-xs text-[#8B4513] font-semibold hover:underline">
            <Download size={14} />
            Download CSV
          </button>
        </div>

        <table className="w-full text-sm">
          <thead className={`${t.tableHead} uppercase text-xs`}>
            <tr>
              <th className="px-6 py-3 text-left">Citizen Details</th>
              <th className="px-6 py-3 text-left">NIC Number</th>
              <th className="px-6 py-3 text-left">Contact Phone</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody className={t.divider}>
            {citizens.map((c, i) => (
              <tr key={i} className={t.tableRow}>

                {/* Citizen Details */}
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${c.color}`}>
                    {c.initials}
                  </div>
                  <div>
                    <p className={`font-semibold ${t.text}`}>{c.name}</p>
                    <p className={`text-xs ${t.subtext}`}>{c.address}</p>
                  </div>
                </td>

                {/* NIC */}
                <td className={`px-6 py-4 ${t.subtext}`}>{c.nic}</td>

                {/* Phone */}
                <td className={`px-6 py-4 ${t.subtext}`}>{c.phone}</td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full
                    ${c.status === "VERIFIED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {c.status}
                  </span>
                </td>

                {/* Action */}
                <td className="px-6 py-4">
                  <button className="border border-[#8B4513] text-[#8B4513] text-xs font-semibold px-4 py-1 rounded-lg hover:bg-[#8B4513] hover:text-white transition">
                    View Profile
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className={`px-6 py-4 flex items-center justify-between border-t ${t.border}`}>
          <p className={`text-xs ${t.subtext}`}>Showing 1 to 3 of 1,248 entries</p>
          <div className="flex items-center gap-2">
            <button className={`w-7 h-7 rounded-full ${t.tableRow} ${t.subtext} text-xs`}>‹</button>
            <button className="w-7 h-7 rounded-full bg-[#E5A800] text-black text-xs font-bold">1</button>
            <button className={`w-7 h-7 rounded-full ${t.tableRow} ${t.subtext} text-xs`}>2</button>
            <button className={`w-7 h-7 rounded-full ${t.tableRow} ${t.subtext} text-xs`}>3</button>
            <button className={`w-7 h-7 rounded-full ${t.tableRow} ${t.subtext} text-xs`}>›</button>
          </div>
        </div>

      </div>

    </GNLayout>
  );
};

export default CitizenSearch;