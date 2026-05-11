import { useState } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { Search, Download, X, Loader2, User } from "lucide-react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";

const ITEMS_PER_PAGE = 10;

// Generate initials from full name
const getInitials = (name) => {
  if (!name) return "?";
  const words = name.trim().split(" ");
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

// Random avatar color based on name
const avatarColor = (name) => {
  const colors = [
    "bg-red-200 text-red-700",
    "bg-yellow-200 text-yellow-700",
    "bg-green-200 text-green-700",
    "bg-blue-200 text-blue-700",
    "bg-purple-200 text-purple-700",
    "bg-pink-200 text-pink-700",
  ];
  const i = (name?.charCodeAt(0) || 0) % colors.length;
  return colors[i];
};

const CitizenSearch = ({ gnStatus, theme }) => {
  const t = getThemeClasses(theme);

  const [nameInput,    setNameInput]    = useState("");
  const [nicInput,     setNicInput]     = useState("");
  const [results,      setResults]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [searched,     setSearched]     = useState(false);
  const [currentPage,  setCurrentPage]  = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error,        setError]        = useState("");

  // ─── Search Firestore ────────────────────────────────────────────────────────
  const handleSearch = async () => {
    const nameTrim = nameInput.trim();
    const nicTrim  = nicInput.trim();

    if (!nameTrim && !nicTrim) {
      setError("Please enter a name or NIC to search.");
      return;
    }

    setError("");
    setLoading(true);
    setSearched(false);
    setResults([]);
    setCurrentPage(1);

    try {
      let snap;

      if (nicTrim) {
        // Search by NIC (exact match)
        const q = query(
          collection(db, "users"),
          where("role", "==", "citizen"),
          where("nic", "==", nicTrim),
          limit(50)
        );
        snap = await getDocs(q);
      } else {
        // Search by fullName (starts with)
        const q = query(
          collection(db, "users"),
          where("role", "==", "citizen"),
          where("fullName", ">=", nameTrim),
          where("fullName", "<=", nameTrim + "\uf8ff"),
          orderBy("fullName"),
          limit(50)
        );
        snap = await getDocs(q);
      }

      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setResults(data);
      setSearched(true);
    } catch (err) {
      console.error("Search error:", err);
      if (err.code === "failed-precondition") {
        setError("Search index is being built. Please try again in a moment, or search by NIC instead.");
      } else {
        setError("Search failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleSearch(); };

  // ─── Download CSV ─────────────────────────────────────────────────────────────
  const handleDownloadCSV = () => {
    if (!results.length) return;
    const headers = ["Full Name","NIC","Mobile","Email","Address","District","DS Division","GN Division","Username"];
    const rows = results.map((c) => [
      c.fullName, c.nic, c.mobile, c.email, c.address,
      c.district, c.dsDiv, c.gnDiv, c.username,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "citizens.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Pagination ───────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const paginated  = results.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      <h1 className="text-2xl font-bold text-[#8B4513] mb-6">Citizen Search</h1>

      {/* Search Bar */}
      <div className={`${t.card} rounded-2xl shadow p-5 mb-6 border-2 border-dashed border-blue-200`}>
        <div className="flex gap-4 items-center">

          {/* Name Input */}
          <div className={`flex-1 flex items-center border ${t.border} rounded-xl px-4 py-2 gap-2`}>
            <Search size={16} className="text-gray-400" />
            <input type="text" value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter full name"
              className={`w-full text-sm outline-none ${t.input}`} />
          </div>

          {/* NIC Input */}
          <div className={`flex-1 flex items-center border ${t.border} rounded-xl px-4 py-2 gap-2`}>
            <span className="text-gray-400 text-xs">🪪</span>
            <input type="text" value={nicInput}
              onChange={(e) => setNicInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 199012345678"
              className={`w-full text-sm outline-none ${t.input}`} />
          </div>

          {/* Search Button */}
          <button onClick={handleSearch} disabled={loading}
            className="bg-[#3B1F0A] text-white font-semibold px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-[#2a1506] disabled:opacity-60 transition">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {loading ? "Searching..." : "Search"}
          </button>

        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-xs font-semibold mt-3 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
      </div>

      {/* Results Table */}
      <div className={`${t.card} rounded-2xl shadow overflow-hidden`}>

        <div className={`flex items-center justify-between px-6 py-4 border-b ${t.border}`}>
          <p className={`text-sm font-semibold ${t.text}`}>
            {searched
              ? results.length > 0
                ? `${results.length} result${results.length > 1 ? "s" : ""} found`
                : "No results found"
              : "Search Results"}
          </p>
          {results.length > 0 && (
            <button onClick={handleDownloadCSV}
              className="flex items-center gap-2 text-xs text-[#8B4513] font-semibold hover:underline">
              <Download size={14} /> Download CSV
            </button>
          )}
        </div>

        <table className="w-full text-sm">
          <thead className={`${t.tableHead} uppercase text-xs`}>
            <tr>
              <th className="px-6 py-3 text-left">Citizen Details</th>
              <th className="px-6 py-3 text-left">NIC Number</th>
              <th className="px-6 py-3 text-left">Contact</th>
              <th className="px-6 py-3 text-left">GN Division</th>
              <th className="px-6 py-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody className={t.divider}>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <Loader2 size={24} className="animate-spin text-[#E5A800] mx-auto mb-2" />
                  <p className={`text-xs ${t.subtext}`}>Searching citizens...</p>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <User size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className={`text-sm font-semibold ${t.subtext}`}>
                    {searched ? "No citizens found matching your search." : "Enter a name or NIC to search."}
                  </p>
                </td>
              </tr>
            ) : (
              paginated.map((c) => (
                <tr key={c.id} className={t.tableRow}>

                  {/* Citizen Details */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${avatarColor(c.fullName)}`}>
                        {getInitials(c.fullName)}
                      </div>
                      <div>
                        <p className={`font-semibold ${t.text}`}>{c.fullName || "N/A"}</p>
                        <p className={`text-xs ${t.subtext}`}>{c.address || "No address"}</p>
                      </div>
                    </div>
                  </td>

                  {/* NIC */}
                  <td className={`px-6 py-4 ${t.subtext}`}>{c.nic || "N/A"}</td>

                  {/* Contact */}
                  <td className="px-6 py-4">
                    <p className={`text-sm ${t.subtext}`}>{c.mobile || "N/A"}</p>
                    <p className={`text-xs ${t.subtext}`}>{c.email || ""}</p>
                  </td>

                  {/* GN Division */}
                  <td className="px-6 py-4">
                    <p className={`text-sm ${t.subtext}`}>{c.gnDiv || "N/A"}</p>
                    <p className={`text-xs ${t.subtext}`}>{c.dsDiv || ""}</p>
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedUser(c)}
                      className="border border-[#8B4513] text-[#8B4513] text-xs font-semibold px-4 py-1 rounded-lg hover:bg-[#8B4513] hover:text-white transition">
                      View Profile
                    </button>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {results.length > ITEMS_PER_PAGE && (
          <div className={`px-6 py-4 flex items-center justify-between border-t ${t.border}`}>
            <p className={`text-xs ${t.subtext}`}>
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, results.length)} of {results.length} results
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                className={`w-7 h-7 rounded-full ${t.tableRow} ${t.subtext} text-xs disabled:opacity-40`}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-full text-xs font-bold transition
                    ${currentPage === page ? "bg-[#E5A800] text-black" : `${t.tableRow} ${t.subtext}`}`}>
                  {page}
                </button>
              ))}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className={`w-7 h-7 rounded-full ${t.tableRow} ${t.subtext} text-xs disabled:opacity-40`}>›</button>
            </div>
          </div>
        )}

      </div>

      {/* ── Citizen Profile Modal ── */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className={`${t.card} rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto`}>

            {/* Modal Header */}
            <div className={`flex items-center justify-between p-5 border-b ${t.border}`}>
              <h2 className={`text-base font-bold ${t.text}`}>Citizen Profile</h2>
              <button onClick={() => setSelectedUser(null)} className={`${t.subtext} hover:text-gray-600`}>
                <X size={18} />
              </button>
            </div>

            {/* Avatar + Name */}
            <div className="px-6 pt-6 pb-4 flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black flex-shrink-0 ${avatarColor(selectedUser.fullName)}`}>
                {getInitials(selectedUser.fullName)}
              </div>
              <div>
                <h3 className={`text-lg font-black ${t.text}`}>{selectedUser.fullName || "N/A"}</h3>
                <p className={`text-xs ${t.subtext}`}>@{selectedUser.username || "N/A"}</p>
                <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">Citizen</span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="px-6 pb-6 space-y-4">

              {/* Personal */}
              <div className={`rounded-xl p-4 ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                <p className={`text-xs font-black uppercase tracking-wide mb-3 ${t.subtext}`}>Personal Details</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Full Name", value: selectedUser.fullName },
                    { label: "NIC",       value: selectedUser.nic },
                    { label: "DOB",       value: selectedUser.dob },
                    { label: "Email",     value: selectedUser.email },
                    { label: "Mobile",    value: selectedUser.mobile },
                    { label: "Address",   value: selectedUser.address },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className={`text-xs ${t.subtext}`}>{label}</p>
                      <p className={`text-sm font-semibold ${t.text} break-words`}>{value || "N/A"}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className={`rounded-xl p-4 ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                <p className={`text-xs font-black uppercase tracking-wide mb-3 ${t.subtext}`}>Location Details</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "District",     value: selectedUser.district },
                    { label: "DS Division",  value: selectedUser.dsDiv },
                    { label: "GN Division",  value: selectedUser.gnDiv },
                    { label: "GN Code",      value: selectedUser.gnCode || "N/A" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className={`text-xs ${t.subtext}`}>{label}</p>
                      <p className={`text-sm font-semibold ${t.text}`}>{value || "N/A"}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Registered */}
              <div className={`rounded-xl p-4 ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                <p className={`text-xs font-black uppercase tracking-wide mb-3 ${t.subtext}`}>Account Info</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className={`text-xs ${t.subtext}`}>Username</p>
                    <p className={`text-sm font-semibold ${t.text}`}>@{selectedUser.username || "N/A"}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${t.subtext}`}>Registered</p>
                    <p className={`text-sm font-semibold ${t.text}`}>
                      {selectedUser.createdAt
                        ? (selectedUser.createdAt?.toDate?.() || new Date(selectedUser.createdAt))
                            .toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            <div className="px-6 pb-6 flex justify-end">
              <button onClick={() => setSelectedUser(null)}
                className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold px-6 py-2 rounded-xl transition text-sm">
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </GNLayout>
  );
};

export default CitizenSearch;