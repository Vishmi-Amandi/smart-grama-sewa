import { useState, useEffect } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { Pencil } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";

const generateInitials = (fullName) => {
  if (!fullName) return "N/A";
  const words = fullName.trim().split(" ");
  if (words.length === 1) return fullName;
  const surname = words[words.length - 1];
  const initials = words
    .slice(0, -1)
    .map((w) => w.charAt(0).toUpperCase() + ".")
    .join(" ");
  return `${initials} ${surname}`;
};

const Profile = ({ gnStatus, theme }) => {
  const [activeTab, setActiveTab] = useState("personal");
  const t = getThemeClasses(theme);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "gn_officers", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <GNLayout gnStatus={gnStatus} theme={theme}>
        <div className="flex items-center justify-center h-64">
          <p className={`text-sm ${t.subtext}`}>Loading profile...</p>
        </div>
      </GNLayout>
    );
  }

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      {/* Page Title */}
      <h1 className="text-2xl font-bold text-[#8B4513] mb-4">Profile</h1>

      {/* Tabs */}
      <div className={`flex gap-6 border-b ${t.border} mb-6`}>
        {[
          { key: "personal", label: "Personal Info" },
          { key: "office", label: "Office Details" },
          { key: "activity", label: "Activity Log" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 text-sm font-semibold border-b-2 transition
              ${activeTab === tab.key
                ? "border-[#8B4513] text-[#8B4513]"
                : `border-transparent ${t.subtext} hover:text-gray-600`
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Personal Info Tab */}
      {activeTab === "personal" && (
        <div>
          <h2 className={`text-xl font-bold mb-4 ${t.text}`}>Personal Information</h2>
          <div className={`${t.card} rounded-2xl shadow p-6 flex items-center justify-between mb-6`}>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gray-300 overflow-hidden">
                  <img src="/logo.png" alt="avatar" className="w-full h-full object-cover" />
                </div>
                <span className="absolute bottom-0 right-0 w-5 h-5 bg-[#E5A800] rounded-full flex items-center justify-center">
                  <Pencil size={10} className="text-black" />
                </span>
              </div>
              <div>
                <h3 className={`text-lg font-bold ${t.text}`}>{userData?.fullName || "N/A"}</h3>
                <p className={`text-sm ${t.subtext}`}>Grama Niladhari Officer</p>
                <p className={`text-xs ${t.subtext}`}>📍 GN Division: {userData?.gnDivisionName || "N/A"}</p>
              </div>
            </div>
            <button className="bg-[#E5A800] hover:bg-[#cc9600] text-black font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition">
              <Pencil size={14} />
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">

            {/* Basic Identification */}
            <div className={`${t.card} rounded-2xl shadow p-6`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-4 ${t.subtext}`}>
                👤 Basic Identification
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                 { label: "Full Name", value: userData?.fullName || "N/A" },
                 { label: "Name with Initials", value: generateInitials(userData?.fullName) },
                 { label: "NIC Number", value: userData?.nic || "N/A" },
                 { label: "Date of Birth", value: userData?.dob || "N/A" },
                 { label: "Gender", value: userData?.gender || "N/A" }
                ].map((item) => (
                  <div key={item.label}>
                    <p className={`text-xs ${t.subtext}`}>{item.label}</p>
                    <p className={`text-sm font-semibold ${t.text}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Details */}
            <div className={`${t.card} rounded-2xl shadow p-6`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-4 ${t.subtext}`}>
                📞 Contact Details
              </p>
              <div className="space-y-4">
                {[
                  { icon: "📱", label: "Mobile Number", value: userData?.mobile || "N/A" },
                  { icon: "📞", label: "Office Number", value: userData?.officeMobile || "N/A" },
                  { icon: "📧", label: "Personal Email", value: userData?.email || "N/A" },
                  { icon: "🏢", label: "Office Email", value: userData?.officialEmail || "N/A" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <p className={`text-xs ${t.subtext}`}>{item.label}</p>
                      <p className={`text-sm font-semibold ${t.text}`}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="grid grid-cols-2 gap-6">

            {/* Residential Addresses */}
            <div className={`${t.card} rounded-2xl shadow p-6`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-4 ${t.subtext}`}>
                🏠 Residential Addresses
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-xs mb-1 ${t.subtext}`}>Permanent Address</p>
                  <p className={`text-sm font-semibold ${t.text}`}>{userData?.address || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* System & Status */}
            <div className={`${t.card} rounded-2xl shadow p-6`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-4 ${t.subtext}`}>
                ⚙️ System & Status
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${t.subtext}`}>Current Status</p>
                  <div className="flex items-center gap-2 mt-1">
    <span className={`w-2 h-2 rounded-full
      ${gnStatus === "Available" ? "bg-green-400" : ""}
      ${gnStatus === "In Meeting" ? "bg-orange-400" : ""}
      ${gnStatus === "On Field" ? "bg-red-400" : ""}`}>
    </span>
    <span className="text-sm font-semibold">{gnStatus}</span>
  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${t.subtext}`}>Member Since</p>
                  <p className={`text-sm font-semibold ${t.text}`}>January 15, 2022</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${t.subtext}`}>Last Login</p>
                  <p className={`text-sm font-semibold ${t.text}`}>Today, 09:30 AM</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Office Details Tab */}
      {activeTab === "office" && (
        <div>
          <h2 className={`text-xl font-bold mb-4 ${t.text}`}>Office Details</h2>

          <div className={`${t.card} rounded-2xl shadow p-6 mb-6`}>
            <p className={`text-sm font-semibold mb-4 ${t.text}`}>🏢 GN Division Information</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "GN Division Name", value: userData?.gnDivisionName || "N/A" },
                { label: "GN Division Number", value: userData?.serviceNumber || "N/A" },
                { label: "DS Division", value: userData?.divisionalSecretariat || "N/A" },
                { label: "District", value: userData?.district || "N/A" },
                { label: "Province", value: userData?.province || "N/A" },
                { label: "Appointment Date", value: "N/A" },
              ].map((item) => (
                <div key={item.label}>
                  <p className={`text-xs ${t.subtext}`}>{item.label}</p>
                  <p className={`text-sm font-semibold ${t.text}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">

            {/* Jurisdiction Details */}
            <div className={`${t.card} rounded-2xl shadow p-6`}>
              <div className="flex items-center justify-between mb-4">
                <p className={`text-sm font-semibold ${t.text}`}>📍 Jurisdiction Details</p>
                <a href="#" className="text-xs text-[#E5A800] font-semibold hover:underline">View Village Details →</a>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { label: "Total Villages", value: "04" },
                  { label: "Population", value: "2,450" },
                  { label: "Total Families", value: "680" },
                ].map((item) => (
                  <div key={item.label} className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-50"} rounded-xl p-3 text-center`}>
                    <p className={`text-xs ${t.subtext}`}>{item.label}</p>
                    <p className={`text-2xl font-bold ${t.text}`}>{item.value}</p>
                  </div>
                ))}
              </div>
              <p className={`text-xs mb-2 ${t.subtext}`}>Villages under Division:</p>
              <div className="flex flex-wrap gap-2">
                {["Homagama Town", "Galenwattha", "Katuwane West", "Industrial Zone"].map((v) => (
                  <span key={v} className="bg-[#E5A800] text-black text-xs font-semibold px-3 py-1 rounded-full">{v}</span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">

              {/* Office Details */}
              <div className={`${t.card} rounded-2xl shadow p-6`}>
                <p className={`text-sm font-semibold mb-3 ${t.text}`}>🏢 Office Details</p>
                <p className={`text-xs ${t.subtext}`}>Office Address</p>
                <p className={`text-sm font-semibold mb-3 ${t.text}`}>{userData?.officeAddress || "N/A"}</p>
                <button className="w-full bg-[#3B1F0A] text-white font-semibold py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-[#2a1506] transition text-sm">
                  🗺 View on Map
                </button>
              </div>

              {/* Working Hours */}
              <div className={`${t.card} rounded-2xl shadow p-6`}>
                <p className={`text-sm font-semibold mb-3 ${t.text}`}>⏰ Working Hours</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`text-xs uppercase ${t.subtext}`}>
                      <th className="text-left pb-2">Day</th>
                      <th className="text-left pb-2">Hours</th>
                    </tr>
                  </thead>
                  <tbody className={t.divider}>
                    <tr>
                      <td className={`py-2 ${t.subtext}`}>Mon - Fri</td>
                      <td className={`py-2 font-semibold ${t.text}`}>08:30 - 16:30</td>
                    </tr>
                    <tr>
                      <td className={`py-2 ${t.subtext}`}>Saturday</td>
                      <td className={`py-2 font-semibold ${t.text}`}>09:00 - 13:00</td>
                    </tr>
                    <tr>
                      <td className={`py-2 ${t.subtext}`}>Sunday</td>
                      <td className="py-2 font-semibold text-red-500">Closed</td>
                    </tr>
                  </tbody>
                </table>
                <p className={`text-xs mt-3 ${t.subtext}`}>Note: Field visits are typically scheduled on Tuesdays and Thursdays after 2 PM.</p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Activity Log Tab */}
      {activeTab === "activity" && (
        <div>
          <h2 className={`text-xl font-bold mb-4 ${t.text}`}>Activity Log</h2>

          <div className={`${t.card} rounded-2xl shadow p-5 mb-6`}>
            <p className={`text-sm font-semibold mb-4 ${t.text}`}>📅 This Month</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total Appointments", value: "124", change: "+12%", color: "text-green-600", bg: "bg-green-50", width: "w-3/4" },
                { label: "New Announcements", value: "18", change: "+5%", color: "text-green-600", bg: "bg-green-50", width: "w-1/2" },
                { label: "System Logins", value: "850", change: "-2%", color: "text-red-500", bg: "bg-red-50", width: "w-full" },
              ].map((item) => (
                <div key={item.label} className={`border ${t.border} rounded-xl p-4`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-xs ${t.subtext}`}>{item.label}</p>
                    <span className={`text-xs font-semibold ${item.color} ${item.bg} px-2 py-0.5 rounded-full`}>{item.change}</span>
                  </div>
                  <p className={`text-3xl font-bold ${t.text}`}>{item.value}</p>
                  <div className={`h-1 bg-[#E5A800] rounded-full mt-3 ${item.width}`}></div>
                </div>
              ))}
            </div>
          </div>

          <div className={`${t.card} rounded-2xl shadow p-5`}>
            <p className={`text-sm font-semibold mb-4 ${t.text}`}>🕐 Recent Activities</p>

            <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${t.subtext}`}>Today</p>
            <div className="space-y-3 mb-6">
              {[
                { time: "09:30 AM", dot: "bg-yellow-400", title: "Land Deed Certification", sub: "Applicant: M. Perera", tag: "APPOINTMENT", tagColor: "bg-orange-100 text-orange-600" },
                { time: "11:15 AM", dot: "bg-blue-400", title: "Village Council Meeting Notice", sub: "Broadcast to: All Residents", tag: "ANNOUNCEMENT", tagColor: "bg-blue-100 text-blue-600" },
                { time: "02:00 PM", dot: "bg-gray-300", title: "Admin System Access", sub: "Session started from IP: 192.168.1.1", tag: "SYSTEM", tagColor: "bg-gray-100 text-gray-600" },
              ].map((item) => (
                <div key={item.time} className={`flex items-center gap-4 border ${t.border} rounded-xl px-4 py-3`}>
                  <p className={`text-xs w-16 ${t.subtext}`}>{item.time}</p>
                  <span className={`w-2 h-2 rounded-full ${item.dot} flex-shrink-0`}></span>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${t.text}`}>{item.title}</p>
                    <p className={`text-xs ${t.subtext}`}>{item.sub}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${item.tagColor}`}>{item.tag}</span>
                </div>
              ))}
            </div>

            <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${t.subtext}`}>Yesterday</p>
            <div className="space-y-3">
              {[
                { time: "10:00 AM", dot: "bg-yellow-400", title: "Identity Verification", sub: "Applicant: K. Silva", tag: "APPOINTMENT", tagColor: "bg-orange-100 text-orange-600" },
                { time: "03:45 PM", dot: "bg-yellow-400", title: "Pensioner Verification", sub: "Applicant: D. Rajapaksa", tag: "APPOINTMENT", tagColor: "bg-orange-100 text-orange-600" },
              ].map((item) => (
                <div key={item.time} className={`flex items-center gap-4 border ${t.border} rounded-xl px-4 py-3`}>
                  <p className={`text-xs w-16 ${t.subtext}`}>{item.time}</p>
                  <span className={`w-2 h-2 rounded-full ${item.dot} flex-shrink-0`}></span>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${t.text}`}>{item.title}</p>
                    <p className={`text-xs ${t.subtext}`}>{item.sub}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${item.tagColor}`}>{item.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </GNLayout>
  );
};

export default Profile;