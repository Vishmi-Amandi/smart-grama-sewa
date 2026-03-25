import { useState } from "react";
import { LayoutDashboard, CalendarDays, Clock, Megaphone, Search, User, Settings, LogOut } from "lucide-react";
import { Link, useLocation } from 'react-router-dom';

  const GNLayout = ({ children, gnStatus }) => {
  const location = useLocation();
  const [showLang, setShowLang] = useState(false);
  const [selectedLang, setSelectedLang] = useState("English");
  const [showAnnouncements, setShowAnnouncements] = useState(false);

  return (
    <div className="flex flex-col h-screen">

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

            <a href="#" className="flex items-center gap-3 text-white px-4 py-2 rounded-lg hover:bg-[#9B4D00]">
              <Search size={18} />
              Citizen Search
            </a>

            {/* Divider */}
            <hr className="border-[#9B4D00] my-2" />

            <a href="#" className="flex items-center gap-3 text-white px-4 py-2 rounded-lg hover:bg-[#9B4D00]">
              <User size={18} />
              Profile
            </a>
            <a href="#" className="flex items-center gap-3 text-white px-4 py-2 rounded-lg hover:bg-[#9B4D00]">
              <Settings size={18} />
              Settings
            </a>
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t border-[#9B4D00]">
            <a href="#" className="flex items-center gap-3 text-white px-4 py-2 rounded-lg hover:bg-[#9B4D00]">
              <LogOut size={18} />
              Sign Out
            </a>
          </div>

        </aside>

        {/* Right Side: Header + Content */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Header */}
          <header className="h-16 bg-white shadow z-10 flex items-center justify-between px-6 flex-shrink-0">

            {/* Search Bar */}
            <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 w-80">
              <Search size={18} className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search citizens or records......"
                className="bg-transparent outline-none text-sm text-gray-600 w-full"
              />
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
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">Officer Perera</p>
                  <p className="text-xs text-[#8B4513]">Grama Niladhari (A12)</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gray-300 overflow-hidden">
                  <img src="/logo.png" alt="avatar" className="w-full h-full object-cover" />
                </div>
              </div>

            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 bg-[#F5F0DC] p-6 overflow-y-auto">
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