import { useState, useEffect } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { doc, getDoc, updateDoc, collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Pencil, Loader2 } from "lucide-react";


const generateInitials = (fullName) => {
  if (!fullName) return "N/A";
  const words = fullName.trim().split(" ");
  if (words.length === 1) return fullName;
  const surname = words[words.length - 1];
  const initials = words.slice(0, -1).map((w) => w.charAt(0).toUpperCase() + ".").join(" ");
  return `${initials} ${surname}`;
};

// ─── Safe string helper — never renders objects ───────────────────────────────
const safeStr = (val, fallback = "N/A") => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val || fallback;
  if (typeof val === "number") return String(val);
  return fallback;
};

// ─── Safe working hours display ───────────────────────────────────────────────
const safeHours = (val, fallback = "N/A") => {
  if (!val) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "object" && (val.start || val.end)) {
    return `${val.start || ""} - ${val.end || ""}`;
  }
  return fallback;
};

const GNProfile = ({ gnStatus, theme }) => {
  const navigate = useNavigate();
  const [activeTab,           setActiveTab]           = useState("personal");
  const [userData,            setUserData]            = useState(null);
  const [loading,             setLoading]             = useState(true);

  // Office address edit
  const [editingLocation,     setEditingLocation]     = useState(false);
  const [locationForm,        setLocationForm]        = useState({ officeAddress: "" });
  const [savingLocation,      setSavingLocation]      = useState(false);

  // Jurisdiction edit
  const [editingJurisdiction, setEditingJurisdiction] = useState(false);
  const [jurisdictionForm,    setJurisdictionForm]    = useState({ totalVillages: "", population: "", totalFamilies: "", villages: [] });
  const [savingJurisdiction,  setSavingJurisdiction]  = useState(false);
  const [villageInput,        setVillageInput]        = useState("");

  // Photo
  const [photoUploading,      setPhotoUploading]      = useState(false);

  //Activity Log
  const [activities,      setActivities]      = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityFilter,  setActivityFilter]  = useState("All");

  const t = getThemeClasses(theme);

 // ─── useEffect 1 — Load user data (keep exactly as before) ───────────────────
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      const docRef  = doc(db, "gn_officers", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (!data.photoURL && data.photograph) {
          await updateDoc(docRef, { photoURL: data.photograph });
          data.photoURL = data.photograph;
        }
        setUserData(data);
      }
    }
    setLoading(false);
  });
  return () => unsubscribe();
}, []);   // ← empty array, no activeTab here

// ─── useEffect 2 — Fetch activity log (separate, new) ────────────────────────
useEffect(() => {
  if (activeTab !== "activity") return;
  const fetchActivities = async () => {
    setActivityLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(
        collection(db, "activity_logs"),
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const snap = await getDocs(q);
      setActivities(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Fetch activities error:", err);
    } finally {
      setActivityLoading(false);
    }
  };
  fetchActivities();
}, [activeTab]);  // ← activeTab dependency here
  



  // ─── Save office address ─────────────────────────────────────────────────────
  const handleSaveLocation = async () => {
    setSavingLocation(true);
    try {
      const user = auth.currentUser;
      await updateDoc(doc(db, "gn_officers", user.uid), {
        officeAddress: locationForm.officeAddress || "",
      });
      setUserData((prev) => ({ ...prev, officeAddress: locationForm.officeAddress }));
      setEditingLocation(false);
    } catch (err) {
      console.error("Save location error:", err);
    } finally {
      setSavingLocation(false);
    }
  };

  // ─── Save jurisdiction ───────────────────────────────────────────────────────
  const handleSaveJurisdiction = async () => {
    setSavingJurisdiction(true);
    try {
      const user = auth.currentUser;
      await updateDoc(doc(db, "gn_officers", user.uid), {
        totalVillages: jurisdictionForm.totalVillages,
        population:    jurisdictionForm.population,
        totalFamilies: jurisdictionForm.totalFamilies,
        villages:      jurisdictionForm.villages,
      });
      setUserData((prev) => ({ ...prev, ...jurisdictionForm }));
      setEditingJurisdiction(false);
    } catch (err) {
      console.error("Save jurisdiction error:", err);
    } finally {
      setSavingJurisdiction(false);
    }
  };



  // ─── Upload photo ────────────────────────────────────────────────────────────
  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "gn_documents");
      formData.append("cloud_name", "dsi9xh1fd");
      const response = await fetch("https://api.cloudinary.com/v1_1/dsi9xh1fd/image/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (data.secure_url) {
        const user = auth.currentUser;
        await updateDoc(doc(db, "gn_officers", user.uid), { photoURL: data.secure_url });
        setUserData((prev) => ({ ...prev, photoURL: data.secure_url }));
      }
    } catch (err) {
      console.error("Photo upload error:", err);
    } finally {
      setPhotoUploading(false);
    }
  };

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

      <h1 className="text-xl sm:text-2xl font-bold text-[#8B4513] mb-4 text-center sm:text-left">Profile</h1>

      {/* Tabs - Responsive */}
      <div className={`flex flex-wrap gap-3 sm:gap-6 border-b ${t.border} mb-6`}>
        {[
          { key: "personal", label: "Personal Info" },
          { key: "office",   label: "Office Details" },
          { key: "activity", label: "Activity Log" },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition
              ${activeTab === tab.key ? "border-[#8B4513] text-[#8B4513]" : `border-transparent ${t.subtext} hover:text-gray-600`}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Personal Info ── */}
      {activeTab === "personal" && (
        <div>
          <h2 className={`text-lg sm:text-xl font-bold mb-4 text-left ${t.text}`}>Personal Information</h2>

          {/* Avatar Card */}
          <div className={`${t.card} rounded-2xl shadow p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 mb-6`}>
            <div className="w-16 h-16 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
              {userData?.photoURL ? (
                <img src={userData.photoURL} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#8B4513] flex items-center justify-center text-white font-bold text-2xl">
                  {userData?.fullName?.charAt(0).toUpperCase() || "G"}
                </div>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h3 className={`text-base sm:text-lg font-bold ${t.text}`}>{safeStr(userData?.fullName)}</h3>
              <p className={`text-xs sm:text-sm ${t.subtext}`}>Grama Niladhari Officer</p>
              <p className={`text-[10px] sm:text-xs ${t.subtext}`}>📍 GN Division: {safeStr(userData?.gnDivisionName)}</p>
            </div>
          </div>

          {/* Personal Info Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            {/* Basic Identification */}
            <div className={`${t.card} rounded-2xl shadow p-4 sm:p-6`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-4 text-left ${t.subtext}`}>👤 Basic Identification</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {[
                  { label: "Full Name",          value: safeStr(userData?.fullName) },
                  { label: "Name with Initials", value: generateInitials(userData?.fullName) },
                  { label: "NIC Number",         value: safeStr(userData?.nic) },
                  { label: "Date of Birth",      value: safeStr(userData?.dob) },
                  { label: "Gender",             value: safeStr(userData?.gender) },
                ].map((item) => (
                  <div key={item.label}>
                    <p className={`text-[10px] sm:text-xs text-left ${t.subtext}`}>{item.label}</p>
                    <p className={`text-xs sm:text-sm font-semibold text-left ${t.text}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Details */}
            <div className={`${t.card} rounded-2xl shadow p-4 sm:p-6`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-4 text-left ${t.subtext}`}>📞 Contact Details</p>
              <div className="space-y-3 sm:space-y-4">
                {[
                  { icon: "📱", label: "Mobile Number",  value: safeStr(userData?.mobile) },
                  { icon: "📞", label: "Office Number",  value: safeStr(userData?.officeMobile) },
                  { icon: "📧", label: "Personal Email", value: safeStr(userData?.email) },
                  { icon: "🏢", label: "Office Email",   value: safeStr(userData?.officialEmail) },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 sm:gap-3">
                    <span className="text-base sm:text-lg">{item.icon}</span>
                    <div>
                      <p className={`text-[10px] sm:text-xs text-left ${t.subtext}`}>{item.label}</p>
                      <p className={`text-xs sm:text-sm font-semibold text-left ${t.text}`}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Residential Address */}
            <div className={`${t.card} rounded-2xl shadow p-4 sm:p-6`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-4 text-left ${t.subtext}`}>🏠 Residential Addresses</p>
              <p className={`text-[10px] sm:text-xs mb-1 text-left ${t.subtext}`}>Permanent Address</p>
              <p className={`text-xs sm:text-sm font-semibold text-left ${t.text}`}>{safeStr(userData?.address)}</p>
            </div>

            {/* System & Status */}
            <div className={`${t.card} rounded-2xl shadow p-4 sm:p-6`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-4 text-left ${t.subtext}`}>⚙️ System & Status</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className={`text-[10px] sm:text-xs text-left ${t.subtext}`}>Current Status</p>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full
                      ${gnStatus === "Available"  ? "bg-green-400"  : ""}
                      ${gnStatus === "In Meeting" ? "bg-orange-400" : ""}
                      ${gnStatus === "On Field"   ? "bg-red-400"    : ""}`} />
                    <span className="text-xs sm:text-sm font-semibold text-right">{gnStatus}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-[10px] sm:text-xs text-left ${t.subtext}`}>Member Since</p>
                  <p className={`text-xs sm:text-sm font-semibold text-right ${t.text}`}>
                    {userData?.createdAt?.seconds
                      ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                      : "N/A"}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-[10px] sm:text-xs text-left ${t.subtext}`}>Last Login</p>
                  <p className={`text-xs sm:text-sm font-semibold text-right ${t.text}`}>
                    {userData?.lastLogin?.seconds
                      ? new Date(userData.lastLogin.seconds * 1000).toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Office Details ── */}
      {activeTab === "office" && (
        <div>
          <h2 className={`text-lg sm:text-xl font-bold mb-4 text-left ${t.text}`}>Office Details</h2>

          {/* GN Division Information */}
          <div className={`${t.card} rounded-2xl shadow p-4 sm:p-6 mb-4 sm:mb-6`}>
            <p className={`text-xs sm:text-sm font-semibold mb-4 text-left ${t.text}`}>🏢 GN Division Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[
                { label: "GN Division Name", value: safeStr(userData?.gnDivisionName) },
                { label: "GN Code",          value: safeStr(userData?.gnCode) },
                { label: "DS Division",      value: safeStr(userData?.divisionalSecretariat) },
                { label: "District",         value: safeStr(userData?.district) },
                { label: "Province",         value: safeStr(userData?.province) },
              ].map((item) => (
                <div key={item.label}>
                  <p className={`text-[10px] sm:text-xs text-left ${t.subtext}`}>{item.label}</p>
                  <p className={`text-xs sm:text-sm font-semibold text-left ${t.text}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

            {/* Jurisdiction Details */}
            <div className={`${t.card} rounded-2xl shadow p-4 sm:p-6`}>
              <div className="flex items-center justify-between mb-4">
                <p className={`text-xs sm:text-sm font-semibold text-left ${t.text}`}>📍 Jurisdiction Details</p>
                <button
                  onClick={() => {
                    setJurisdictionForm({
                      totalVillages: safeStr(userData?.totalVillages, ""),
                      population:    safeStr(userData?.population, ""),
                      totalFamilies: safeStr(userData?.totalFamilies, ""),
                      villages:      Array.isArray(userData?.villages) ? userData.villages : [],
                    });
                    setEditingJurisdiction(true);
                  }}
                  className="flex items-center gap-1 text-[10px] sm:text-xs text-[#8B4513] border border-[#8B4513] px-1.5 sm:px-2 py-1 rounded-lg hover:bg-[#8B4513] hover:text-white transition">
                  <Pencil size={10} /> Edit
                </button>
              </div>

              {editingJurisdiction ? (
                <div className={`p-3 sm:p-4 border ${t.border} rounded-xl space-y-3`}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { key: "totalVillages", label: "Total Villages", placeholder: "e.g. 12" },
                      { key: "population",    label: "Population",     placeholder: "e.g. 5000" },
                      { key: "totalFamilies", label: "Total Families", placeholder: "e.g. 1200" },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <p className={`text-[10px] sm:text-xs font-semibold mb-1 text-left ${t.subtext}`}>{label}</p>
                        <input type="number" value={jurisdictionForm[key]}
                          onChange={(e) => setJurisdictionForm({ ...jurisdictionForm, [key]: e.target.value })}
                          placeholder={placeholder}
                          className={`w-full border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`} />
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className={`text-[10px] sm:text-xs font-semibold mb-1 text-left ${t.subtext}`}>Villages</p>
                    <div className="flex flex-col sm:flex-row gap-2 mb-2">
                      <input type="text" value={villageInput}
                        onChange={(e) => setVillageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && villageInput.trim()) {
                            setJurisdictionForm((p) => ({ ...p, villages: [...p.villages, villageInput.trim()] }));
                            setVillageInput("");
                          }
                        }}
                        placeholder="Type village name and press Enter"
                        className={`flex-1 border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`} />
                      <button
                        onClick={() => {
                          if (villageInput.trim()) {
                            setJurisdictionForm((p) => ({ ...p, villages: [...p.villages, villageInput.trim()] }));
                            setVillageInput("");
                          }
                        }}
                        className="bg-[#E5A800] text-black text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#cc9600] transition">
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {jurisdictionForm.villages.map((v, i) => (
                        <span key={i} className="flex items-center gap-1 bg-[#E5A800] text-black text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 rounded-full">
                          {v}
                          <button onClick={() => setJurisdictionForm((p) => ({ ...p, villages: p.villages.filter((_, idx) => idx !== i) }))}
                            className="ml-1 hover:text-red-700 font-bold">✕</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingJurisdiction(false)}
                      className={`text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-lg border ${t.border} ${t.subtext} hover:bg-gray-100 transition`}>
                      Cancel
                    </button>
                    <button onClick={handleSaveJurisdiction} disabled={savingJurisdiction}
                      className="text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#E5A800] text-black hover:bg-[#cc9600] disabled:opacity-60 transition">
                      {savingJurisdiction ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
                    {[
                      { label: "Total Villages", value: safeStr(userData?.totalVillages) },
                      { label: "Population",     value: safeStr(userData?.population) },
                      { label: "Total Families", value: safeStr(userData?.totalFamilies) },
                    ].map((item) => (
                      <div key={item.label} className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-50"} rounded-xl p-3 text-center`}>
                        <p className={`text-[10px] sm:text-xs text-center ${t.subtext}`}>{item.label}</p>
                        <p className={`text-base sm:text-2xl font-bold text-center ${t.text}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className={`text-[10px] sm:text-xs mb-2 text-left ${t.subtext}`}>Villages under Division:</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(userData?.villages) && userData.villages.length > 0
                      ? userData.villages.map((v, i) => (
                          <span key={i} className="bg-[#E5A800] text-black text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 rounded-full">
                            {safeStr(v)}
                          </span>
                        ))
                      : <span className={`text-[10px] sm:text-xs ${t.subtext}`}>No villages added yet</span>
                    }
                  </div>
                </>
              )}
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-4 sm:gap-6">

              {/* Office Address */}
              <div className={`${t.card} rounded-2xl shadow p-4 sm:p-6`}>
                <div className="flex items-center justify-between mb-3">
                  <p className={`text-xs sm:text-sm font-semibold text-left ${t.text}`}>🏢 Office Details</p>
                  <button
                    onClick={() => {
                      setLocationForm({ officeAddress: typeof userData?.officeAddress === "string" ? userData.officeAddress : "" });
                      setEditingLocation(true);
                    }}
                    className="flex items-center gap-1 text-[10px] sm:text-xs text-[#8B4513] border border-[#8B4513] px-1.5 sm:px-2 py-1 rounded-lg hover:bg-[#8B4513] hover:text-white transition">
                    <Pencil size={10} /> Edit Address
                  </button>
                </div>

                {!editingLocation && (
                  <>
                    <p className={`text-[10px] sm:text-xs text-left ${t.subtext}`}>Office Address</p>
                    <p className={`text-xs sm:text-sm font-semibold text-left ${t.text}`}>{safeStr(userData?.officeAddress, "No address set. Click Edit Address to add.")}</p>
                  </>
                )}

                {editingLocation && (
                  <div className={`p-3 sm:p-4 border ${t.border} rounded-xl space-y-3`}>
                    <div>
                      <p className={`text-[10px] sm:text-xs font-semibold mb-1 text-left ${t.subtext}`}>Office Address</p>
                      <textarea
                        value={locationForm.officeAddress}
                        onChange={(e) => setLocationForm({ ...locationForm, officeAddress: e.target.value })}
                        placeholder="Enter full office address..."
                        rows={3}
                        className={`w-full border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] resize-none ${t.input}`} />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingLocation(false)}
                        className={`text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-lg border ${t.border} ${t.subtext} hover:bg-gray-100 transition`}>
                        Cancel
                      </button>
                      <button onClick={handleSaveLocation} disabled={savingLocation}
                        className="text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#E5A800] text-black hover:bg-[#cc9600] disabled:opacity-60 transition">
                        {savingLocation ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Working Hours */}
              <div className={`${t.card} rounded-2xl shadow p-4 sm:p-6`}>
                <div className="flex items-center justify-between mb-3">
                  <p className={`text-xs sm:text-sm font-semibold text-left ${t.text}`}>⏰ Working Hours</p>
                  <button
  onClick={() => navigate("/gn-settings?tab=hours")}
  className="flex items-center gap-1 text-[10px] sm:text-xs text-[#8B4513] border border-[#8B4513] px-1.5 sm:px-2 py-1 rounded-lg hover:bg-[#8B4513] hover:text-white transition">
  <Pencil size={10} /> Edit
</button>
                </div>


                  <>
                    <table className="w-full text-sm">
  <thead>
    <tr className={`text-[10px] sm:text-xs uppercase ${t.subtext}`}>
      <th className="text-left pb-2">Day</th>
      <th className="text-left pb-2">Hours</th>
    </tr>
  </thead>
  <tbody className={t.divider}>
    {[
      { day: "Monday",    value: userData?.workingHours?.Monday },
      { day: "Tuesday",   value: userData?.workingHours?.Tuesday },
      { day: "Wednesday", value: userData?.workingHours?.Wednesday },
      { day: "Thursday",  value: userData?.workingHours?.Thursday },
      { day: "Friday",    value: userData?.workingHours?.Friday },
      { day: "Saturday",  value: userData?.workingHours?.Saturday },
      { day: "Sunday",    value: userData?.workingHours?.Sunday },
    ].map(({ day, value }) => {
      const display = !value
        ? (day === "Sunday" || day === "Saturday" ? "Closed" : "08:00 - 17:00")
        : value.enabled === false
        ? "Closed"
        : `${value.start || ""} - ${value.end || ""}`;

      return (
        <tr key={day}>
          <td className={`py-2 text-left text-[10px] sm:text-xs ${t.subtext}`}>{day}</td>
          <td className={`py-2 font-semibold text-left text-[10px] sm:text-xs ${display === "Closed" ? "text-red-500" : t.text}`}>
            {display}
          </td>
        </tr>
      );
    })}
  </tbody>
</table>
                    </>
      
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── Activity Log ── */}
{activeTab === "activity" && (
  <div>
    <h2 className={`text-lg sm:text-xl font-bold mb-4 text-left ${t.text}`}>Activity Log</h2>

    {/* Stats - Responsive */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
      {[
        { label: "Total Activities", value: activities.length },
        { label: "Announcements",    value: activities.filter((a) => a.type === "announcement").length },
        { label: "Change GN Division",        value: activities.filter((a) => a.type === "change").length },
      ].map((item) => (
        <div key={item.label} className={`${t.card} rounded-2xl shadow p-4 sm:p-5 text-center sm:text-left`}>
          <p className={`text-[10px] sm:text-xs text-center sm:text-left ${t.subtext} mb-1`}>{item.label}</p>
          <p className={`text-2xl sm:text-3xl font-bold text-[#8B4513] text-center sm:text-left`}>
            {activityLoading ? "—" : item.value}
          </p>
        </div>
      ))}
    </div>

    {/* Filter Tabs - Responsive */}
    <div className="flex flex-wrap gap-2 mb-4">
      {["All", "announcement", "change"].map((f) => (
        <button key={f} onClick={() => setActivityFilter(f)}
          className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold capitalize transition
            ${activityFilter === f
              ? "bg-[#8B4513] text-white"
              : `border ${t.border} ${t.subtext} hover:border-[#8B4513]`}`}>
          {f === "All" ? "All" : f === "announcement" ? "Announcements" : "Changes"}
        </button>
      ))}
    </div>

    {/* Activity Feed */}
    <div className={`${t.card} rounded-2xl shadow p-4 sm:p-5`}>
      {activityLoading ? (
        <div className="flex items-center justify-center py-12 gap-2">
          <Loader2 size={20} className="animate-spin text-[#E5A800]" />
          <p className={`text-sm ${t.subtext}`}>Loading activities...</p>
        </div>
      ) : (activityFilter === "All" ? activities : activities.filter((a) => a.type === activityFilter)).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl sm:text-4xl mb-3">📋</p>
          <p className={`text-xs sm:text-sm font-semibold ${t.subtext}`}>No activities recorded yet.</p>
          <p className={`text-[10px] sm:text-xs mt-1 ${t.subtext}`}>
            Activities will appear here when you publish announcements or submit change Gn division requests.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(activityFilter === "All"
            ? activities
            : activities.filter((a) => a.type === activityFilter)
          ).map((item) => (
            <div key={item.id} className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 border ${t.border} rounded-xl px-3 sm:px-4 py-3`}>
              <p className={`text-[10px] sm:text-xs w-full sm:w-24 flex-shrink-0 text-left sm:text-left ${t.subtext}`}>
                {item.createdAt?.toDate?.()?.toLocaleString("en-US", {
                  month: "short", day: "numeric",
                  hour: "2-digit", minute: "2-digit"
                }) || "—"}
              </p>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                item.type === "announcement" ? "bg-blue-400" :
                item.type === "change"     ? "bg-orange-400" : "bg-gray-300"
              }`} />
              <div className="flex-1">
                <p className={`text-xs sm:text-sm font-semibold text-left ${t.text}`}>{item.title}</p>
                <p className={`text-[10px] sm:text-xs text-left ${t.subtext}`}>{item.description}</p>
              </div>
              <span className={`text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 rounded-full flex-shrink-0 self-start sm:self-center ${
                item.type === "announcement" ? "bg-blue-100 text-blue-600"     :
                item.type === "change"     ? "bg-orange-100 text-orange-600" :
                                               "bg-gray-100 text-gray-600"
              }`}>
                {item.action?.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}

    </GNLayout>
  );
};

export default GNProfile;