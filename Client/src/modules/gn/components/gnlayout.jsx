import { useEffect, useState } from "react";
import { LayoutDashboard, CalendarDays, Clock, Megaphone, Search, User, Settings, LogOut, ArrowRightLeft, Menu, X } from "lucide-react";
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

const searchPages = [
  { name: "Dashboard", path: "/gn-dashboard", icon: <LayoutDashboard size={16} /> },
  { name: "Appointments", path: "/gn-appointments", icon: <CalendarDays size={16} /> },
  { name: "Schedule", path: "/gn-schedule", icon: <Clock size={16} /> },
  { name: "Create Announcement", path: "/gn-create-announcement", icon: <Megaphone size={16} /> },
  { name: "Announcement List", path: "/gn-announcement-list", icon: <Megaphone size={16} /> },
  { name: "Citizen Search", path: "/gn-citizen-search", icon: <Search size={16} /> },
  { name: "Profile", path: "/gn-profile", icon: <User size={16} /> },
  { name: "Settings", path: "/gn-settings", icon: <Settings size={16} /> },
  { name: "Current Status", path: "/gn-current-status", icon: <User size={16} /> },
  { name: "Change GN Division", path: "/gn-change-gn-division", icon: <LogOut size={16} /> },
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

  // Mobile bottom navigation items (including Sign Out)
  const mobileNavItems = [
    { name: "Dashboard", path: "/gn-dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Appointments", path: "/gn-appointments", icon: <CalendarDays size={20} /> },
    { name: "Citizen Search", path: "/gn-citizen-search", icon: <Search size={20} /> },
    { name: "Profile", path: "/gn-profile", icon: <User size={20} /> },
    { name: "Sign Out", action: "signout", icon: <LogOut size={20} /> }, // Sign out button
  ];

  const handleMobileAction = (action) => {
    if (action === "signout") {
      signOut(auth).then(() => navigate("/home"));
    }
  };

  return (
    <div className={`flex flex-col h-screen ${theme === "dark" ? "bg-gray-900 text-white" : ""}`}>

      {/* Main Area: Sidebar + Right Side */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <aside className={`w-64 bg-[#8B4513] text-white flex flex-col flex-shrink-0 overflow-y-auto fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          {/* Close button on mobile */}
          <button 
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 text-white p-1"
          >
            <X size={24} />
          </button>

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
          <Link to="/gn-current-status" className="mx-4 mt-4 bg-[#9B4D00] rounded-lg px-4 py-3 block hover:bg-[#7a3b00] transition" onClick={() => setMobileSidebarOpen(false)}>
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
            <Link to="/gn-dashboard" className={`flex items-center gap-3 rounded-lg px-4 py-2 ${location.pathname === "/gn-dashboard" ? "bg-[#E5A800] text-black font-semibold" : "text-white hover:bg-[#9B4D00]"}`} onClick={() => setMobileSidebarOpen(false)}>
  <LayoutDashboard size={18} />
  Dashboard
</Link>

<Link to="/gn-appointments" className={`flex items-center gap-3 rounded-lg px-4 py-2 ${location.pathname === "/gn-appointments" ? "bg-[#E5A800] text-black font-semibold" : "text-white hover:bg-[#9B4D00]"}`} onClick={() => setMobileSidebarOpen(false)}>
  <CalendarDays size={18} />
  Appointments
</Link>
           <Link to="/gn-schedule" className={`flex items-center gap-3 px-4 py-2 rounded-lg
  ${location.pathname === "/gn-schedule" ? "bg-[#E5A800] text-black font-semibold" : "text-white hover:bg-[#9B4D00]"}`} onClick={() => setMobileSidebarOpen(false)}>
  <Clock size={18} />
  Schedule
</Link>

            {/* Announcements Dropdown */}
            <div>
              <div
  onClick={() => setShowAnnouncements(!showAnnouncements)}
  className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer
    ${location.pathname === "/gn-create-announcement" || location.pathname === "/gn-announcement-list"
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
                  <Link to="/gn-create-announcement" className="flex items-center gap-2 text-orange-200 px-4 py-2 rounded-lg hover:bg-[#9B4D00] text-sm" onClick={() => setMobileSidebarOpen(false)}>
  Create Announcement
</Link>
                  <Link to="/gn-announcement-list" className="flex items-center gap-2 text-orange-200 px-4 py-2 rounded-lg hover:bg-[#9B4D00] text-sm" onClick={() => setMobileSidebarOpen(false)}>
  Announcement List
</Link>
                </div>
              )}
            </div>

           <Link to="/gn-citizen-search" className={`flex items-center gap-3 px-4 py-2 rounded-lg
  ${location.pathname === "/gn-citizen-search" ? "bg-[#E5A800] text-black font-semibold" : "text-white hover:bg-[#9B4D00]"}`} onClick={() => setMobileSidebarOpen(false)}>
  <Search size={18} />
  Citizen Search
</Link>

            {/* Divider */}
            <hr className="border-[#9B4D00] my-2" />

            <Link to="/gn-profile" className={`flex items-center gap-3 px-4 py-2 rounded-lg
  ${location.pathname === "/gn-profile" ? "bg-[#E5A800] text-black font-semibold" : "text-white hover:bg-[#9B4D00]"}`} onClick={() => setMobileSidebarOpen(false)}>
  <User size={18} />
  Profile
</Link>
           <Link to="/gn-settings" className={`flex items-center gap-3 px-4 py-2 rounded-lg
  ${location.pathname === "/gn-settings" ? "bg-[#E5A800] text-black font-semibold" : "text-white hover:bg-[#9B4D00]"}`} onClick={() => setMobileSidebarOpen(false)}>
  <Settings size={18} />
  Settings
</Link>
          </nav>

        <button
  onClick={() => signOut(auth).then(() => navigate("/home"))}
  className="flex items-center gap-3 text-white px-4 py-2 rounded-lg hover:bg-[#9B4D00] w-full"
>
  <LogOut size={18} />
  Sign Out
</button>

        </aside>

        {/* Overlay for mobile sidebar */}
        {mobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Right Side: Header + Content */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Header */}
          <header className={`h-16 shadow z-10 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white"}`}>

            {/* Mobile Menu Button + Search Bar */}
            <div className="flex items-center gap-3 flex-1">
              {/* Hamburger Menu Button - Mobile Only */}
              <button 
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu size={24} className="text-gray-600" />
              </button>

              {/* Search Bar - Responsive width */}
              <div className="relative flex-1 sm:w-80 sm:flex-none">
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
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3 sm:gap-6">

              {/* Language Dropdown */}
              <div className="relative">
                <div
                  onClick={() => setShowLang(!showLang)}
                  className="flex items-center gap-2 border rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 cursor-pointer hover:bg-gray-100"
                >
                  🌐 <span className="hidden sm:inline">{selectedLang}</span> ▾
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
              <span className="text-gray-500 text-base sm:text-xl cursor-pointer">🔔</span>

              {/* User Info - Hide name on mobile */}
<Link to="/gn-profile" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
  <div className="text-right hidden sm:block">
    <p className="text-sm font-semibold text-gray-800">
      {userData?.fullName || "Officer"}
    </p>
    <p className="text-xs text-[#8B4513]">
      {userData?.gnDivisionName || "Grama Niladhari"}
    </p>
  </div>
 <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden flex items-center justify-center font-bold text-white bg-[#8B4513]">
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

          {/* Main Content - Add bottom padding for mobile bottom nav */}
          <main className={`flex-1 p-4 sm:p-6 overflow-y-auto pb-20 lg:pb-6 ${theme === "dark" ? "bg-gray-800" : "bg-[#F5F0DC]"}`}>
            {children}
          </main>

        </div>
        {/* end Right Side */}

      </div>
      {/* end Main Area */}

      {/* BOTTOM NAVIGATION BAR - Mobile Only (with Sign Out) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.1)] z-50">
        <div className="flex justify-around items-center py-2 px-2">
          {mobileNavItems.map((item, index) => (
            item.action ? (
              // Sign Out button with action
              <button
                key={index}
                onClick={() => handleMobileAction(item.action)}
                className="flex flex-col items-center py-1 px-3 rounded-lg transition-colors text-gray-500 hover:text-red-600"
              >
                <span className="text-xl sm:text-2xl">{item.icon}</span>
                <span className="text-[10px] sm:text-xs mt-1 font-medium">{item.name}</span>
              </button>
            ) : (
              // Regular navigation link
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
                  location.pathname === item.path 
                    ? 'text-[#E5A800]' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="text-xl sm:text-2xl">{item.icon}</span>
                <span className="text-[10px] sm:text-xs mt-1 font-medium">{item.name}</span>
              </Link>
            )
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#5C1E00] text-[#E5A800] text-center py-3 text-sm flex-shrink-0 hidden lg:block">
        © 2026 Smart Grama Sewa. All rights reserved.
      </footer>

    </div>
  );
};

export default GNLayout;