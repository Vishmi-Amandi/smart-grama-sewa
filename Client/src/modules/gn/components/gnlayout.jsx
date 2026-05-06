import { useEffect, useState } from "react";
import { LayoutDashboard, CalendarDays, Clock, Megaphone, Search, User, Settings, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

export const getThemeClasses = (theme) => ({
  bg: theme === "dark" ? "bg-gray-900" : "bg-[#F5F0DC]",
  card: theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-800",
  text: theme === "dark" ? "text-white" : "text-gray-800",
  subtext: theme === "dark" ? "text-gray-300" : "text-gray-500",
  border: theme === "dark" ? "border-gray-700" : "border-gray-200",
  input: theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-600 border-gray-200",
  tableHead: theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-50 text-gray-400",
  tableRow: theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50",
  divider: theme === "dark" ? "divide-gray-700" : "divide-gray-100",
});

const GNLayout = ({ children, gnStatus, theme }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [showLang, setShowLang] = useState(false);
  const [selectedLang, setSelectedLang] = useState("English");
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [userData, setUserData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

const searchPages = [
  { name: "Dashboard", path: "/", icon: <LayoutDashboard size={16} /> },
  { name: "Appointments", path: "/appointments", icon: <CalendarDays size={16} /> },
  { name: "Schedule", path: "/schedule", icon: <Clock size={16} /> },
  { name: "Create Announcement", path: "/create-announcement", icon: <Megaphone size={16} /> },
  { name: "Announcement List", path: "/announcement-list", icon: <Megaphone size={16} /> },
  { name: "Citizen Search", path: "/citizen-search", icon: <Search size={16} /> },
  { name: "Profile", path: "/profile", icon: <User size={16} /> },
  { name: "Settings", path: "/settings", icon: <Settings size={16} /> },
  { name: "Current Status", path: "/current-status", icon: <User size={16} /> },
  { name: "Transfer Request", path: "/transfer-request", icon: <LogOut size={16} /> },
];

const filteredPages = searchQuery.trim()
  ? searchPages.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  : [];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "gn_officers", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className={`flex flex-col h-screen ${theme === "dark" ? "bg-gray-900 text-white" : ""}`}>

      {/* Main Area: Sidebar + Right Side */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-64 bg-[#8B4513] text-white flex flex-col flex-shrink-0 overflow-y-auto">
          {/* Branding */}
          <div className="p-5 text-center border-b border-[#9B4D00]">
            <h1 className="text-white font-bold text-lg">Grama Niladhari</h1>
            <p className="text-[#E5A800] font-semibold text-sm">Portal</p>
            <img
              src="/logo.png"
              alt="Smart Grama Sewa Logo"
              className="w-32 h-32 mx-auto mt-3 object-contain"
            />
          </div>

          {/* Status Badge */}
          <Link to="/current-status" className="mx-4 mt-4 bg-[#9B4D00] rounded-lg px-4 py-3 block hover:bg-[#7a3b00] transition">
  <p className="text-xs text-gray-300">Current Status</p>
  <div className="flex items-center gap-2 mt-1">
    <span className={`w-2 h-2 rounded-full
      ${gnStatus === "Available" ? "bg-green-400" : ""}
      ${gnStatus === "In Meeting" ? "bg-orange-400" : ""}
      ${gnStatus === "On Field" ? "bg-red-400" : ""}
    `}></span>
    <span className="text-white font-semibold text-sm">{gnStatus}</span>
  </div>
</Link>

          {/* Navigation */}
          <nav className="flex-1 mt-6 px-4 space-y-1">
            <Link to="/" className={`flex items-center gap-3 rounded-lg px-4 py-2 ${location.pathname === "/" ? "bg-[#E5A800] text-black font-semibold" : "text-white hover:bg-[#9B4D00]"}`}>
  <LayoutDashboard size={18} />
  Dashboard
</Link>

<Link to="/appointments" className={`flex items-center gap-3 rounded-lg px-4 py-2 ${location.pathname === "/appointments" ? "bg-[#E5A800] text-black font-semibold" : "text-white hover:bg-[#9B4D00]"}`}>
  <CalendarDays size={18} />
  Appointments
</Link>
           <Link to="/schedule" className={`flex items-center gap-3 px-4 py-2 rounded-lg
  ${location.pathname === "/schedule" ? "bg-[#E5A800] text-black font-semibold" : "text-white hover:bg-[#9B4D00]"}`}>
  <Clock size={18} />
  Schedule
</Link>

            {/* Announcements Dropdown */}
            <div>
              <div
  onClick={() => setShowAnnouncements(!showAnnouncements)}
  className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer
    ${location.pathname === "/create-announcement" || location.pathname === "/announcement-list"
      ? "bg-[#E5A800] text-black font-semibold"
      : "text-white hover:bg-[#9B4D00]"
    }`}
>
                <Megaphone size={18} />
                <span className="flex-1">Announcements</span>
                <span className="text-xs">{showAnnouncements ? "▲" : "▼"}</span>
              </div>
              {showAnnouncements && (
                <div className="ml-8 mt-1 space-y-1">
                  <Link to="/create-announcement" className="flex items-center gap-2 text-orange-200 px-4 py-2 rounded-lg hover:bg-[#9B4D00] text-sm">
  Create Announcement
</Link>
                  <Link to="/announcement-list" className="flex items-center gap-2 text-orange-200 px-4 py-2 rounded-lg hover:bg-[#9B4D00] text-sm">
  Announcement List
</Link>
                </div>
              )}
            </div>

           <Link to="/citizen-search" className={`flex items-center gap-3 px-4 py-2 rounded-lg
  ${location.pathname === "/citizen-search" ? "bg-[#E5A800] text-black font-semibold" : "text-white hover:bg-[#9B4D00]"}`}>
  <Search size={18} />
  Citizen Search
</Link>

            {/* Divider */}
            <hr className="border-[#9B4D00] my-2" />

            <Link to="/profile" className={`flex items-center gap-3 px-4 py-2 rounded-lg
  ${location.pathname === "/profile" ? "bg-[#E5A800] text-black font-semibold" : "text-white hover:bg-[#9B4D00]"}`}>
  <User size={18} />
  Profile
</Link>
           <Link to="/settings" className={`flex items-center gap-3 px-4 py-2 rounded-lg
  ${location.pathname === "/settings" ? "bg-[#E5A800] text-black font-semibold" : "text-white hover:bg-[#9B4D00]"}`}>
  <Settings size={18} />
  Settings
</Link>
          </nav>

        <button
  onClick={async () => {
    try {
      await signOut(auth);
      window.location.replace("/login");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  }}
  className="flex items-center gap-3 text-white px-4 py-2 rounded-lg hover:bg-[#9B4D00] w-full"
>
  <LogOut size={18} />
  Sign Out
</button>

        </aside>

        {/* Right Side: Header + Content */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Header */}
          <header className={`h-16 shadow z-10 flex items-center justify-between px-6 flex-shrink-0 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white"}`}>

            {/* Search Bar */}
<div className="relative w-80">
  <div className={`flex items-center rounded-full px-4 py-2 ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}>
    <Search size={18} className="text-gray-400 mr-2" />
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
      onFocus={() => setShowResults(true)}
      onKeyDown={(e) => e.key === "Escape" && setShowResults(false)}
      placeholder="Search pages..."
      className="bg-transparent outline-none text-sm text-gray-600 w-full"
    />
    {searchQuery && (
      <button onClick={() => { setSearchQuery(""); setShowResults(false); }}
        className="text-gray-400 hover:text-gray-600 ml-1">
        ✕
      </button>
    )}
  </div>

  {/* Dropdown Results */}
  {showResults && searchQuery && (
    <div className={`absolute top-12 left-0 w-full rounded-2xl shadow-xl z-50 overflow-hidden border
      ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>

      {filteredPages.length > 0 ? (
        <>
          <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide
            ${theme === "dark" ? "text-gray-400 bg-gray-700" : "text-gray-400 bg-gray-50"}`}>
            Pages
          </div>
          {filteredPages.map((page) => (
            <div
              key={page.path}
              onClick={() => {
                navigate(page.path);
                setSearchQuery("");
                setShowResults(false);
              }}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition
                ${theme === "dark"
                  ? "text-gray-200 hover:bg-gray-700"
                  : "text-gray-700 hover:bg-gray-50"}`}
            >
              <span className="text-[#8B4513]">{page.icon}</span>
              <span className="text-sm font-semibold">{page.name}</span>
              <span className={`ml-auto text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
                → {page.path}
              </span>
            </div>
          ))}
        </>
      ) : (
        <div className={`px-4 py-4 text-sm text-center
          ${theme === "dark" ? "text-gray-400" : "text-gray-400"}`}>
          No results found for "{searchQuery}"
        </div>
      )}

    </div>
  )}

  {/* Click outside to close */}
  {showResults && (
    <div
      className="fixed inset-0 z-40"
      onClick={() => setShowResults(false)}
    />
  )}
</div>

            {/* Right Side */}
            <div className="flex items-center gap-6">

              {/* Language Dropdown */}
              <div className="relative">
                <div
                  onClick={() => setShowLang(!showLang)}
                  className="flex items-center gap-2 border rounded-full px-4 py-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-100"
                >
                  🌐 {selectedLang} ▾
                </div>
                {showLang && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="px-4 py-2 text-xs text-gray-400 uppercase tracking-wide border-b">
                      Selected
                    </div>
                    <div className="px-4 py-2 text-sm text-gray-800 font-bold bg-gray-50">
                      ✓ {selectedLang}
                    </div>
                    <div className="border-t my-1"></div>
                    <div className="px-4 py-2 text-xs text-gray-400 uppercase tracking-wide">
                      Switch to
                    </div>
                    {["English", "සිංහල", "தமிழ்"]
                      .filter((lang) => lang !== selectedLang)
                      .map((lang) => (
                        <div
                          key={lang}
                          onClick={() => {
                            setSelectedLang(lang);
                            setShowLang(false);
                          }}
                          className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 text-gray-700"
                        >
                          {lang}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Notification */}
              <span className="text-gray-500 text-xl cursor-pointer">🔔</span>

              {/* User Info */}
<Link to="/profile" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
  <div className="text-right">
    <p className="text-sm font-semibold text-gray-800">
      {userData?.fullName || "Officer"}
    </p>
    <p className="text-xs text-[#8B4513]">
      {userData?.gnDivisionName || "Grama Niladhari"}
    </p>
  </div>
 <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center font-bold text-white bg-[#8B4513]">
  {userData?.photoURL ? (
    <img
      key={userData.photoURL}
      src={userData.photoURL}
      alt="avatar"
      className="w-full h-full object-cover"
    />
  ) : (
    userData?.fullName?.charAt(0).toUpperCase() || "G"
  )}
</div>
</Link>
            </div>
          </header>

          {/* Main Content */}
          <main className={`flex-1 p-6 overflow-y-auto ${theme === "dark" ? "bg-gray-800" : "bg-[#F5F0DC]"}`}>
            {children}
          </main>

        </div>
        {/* end Right Side */}

      </div>
      {/* end Main Area */}

      {/* Footer */}
      <footer className="bg-[#5C1E00] text-[#E5A800] text-center py-3 text-sm flex-shrink-0">
        © 2026 Smart Grama Sewa. All rights reserved.
      </footer>

    </div>
  );
};

export default GNLayout;