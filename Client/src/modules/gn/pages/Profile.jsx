import { useState, useEffect } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { Pencil } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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
  const [activeTab, setActiveTab]         = useState("personal");
  const [userData, setUserData]           = useState(null);
  const [loading, setLoading]             = useState(true);
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationForm, setLocationForm]   = useState({ officeAddress: "" });
  const [savingLocation, setSavingLocation] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  const t = getThemeClasses(theme);

  const [editingJurisdiction, setEditingJurisdiction] = useState(false);
const [jurisdictionForm, setJurisdictionForm] = useState({
  totalVillages: "",
  population: "",
  totalFamilies: "",
  villages: [],
});
const [savingJurisdiction, setSavingJurisdiction] = useState(false);
const [villageInput, setVillageInput] = useState("");

const [editingHours, setEditingHours] = useState(false);
const [hoursForm, setHoursForm] = useState({
  monFri: "08:30 - 16:30",
  saturday: "09:00 - 13:00",
  sunday: "Closed",
  notes: "", 
});
const [savingHours, setSavingHours] = useState(false);

  // ─── Save office address to Firestore ──────────────────────────────────────
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

  const handleSaveJurisdiction = async () => {
  setSavingJurisdiction(true);
  try {
    const user = auth.currentUser;
    await updateDoc(doc(db, "gn_officers", user.uid), {
      totalVillages:  jurisdictionForm.totalVillages,
      population:     jurisdictionForm.population,
      totalFamilies:  jurisdictionForm.totalFamilies,
      villages:       jurisdictionForm.villages,
    });
    setUserData((prev) => ({ ...prev, ...jurisdictionForm }));
    setEditingJurisdiction(false);
  } catch (err) {
    console.error("Save jurisdiction error:", err);
  } finally {
    setSavingJurisdiction(false);
  }
};

const handleSaveHours = async () => {
  setSavingHours(true);
  try {
    const user = auth.currentUser;
    await updateDoc(doc(db, "gn_officers", user.uid), {
      workingHours: hoursForm,
    });
    setUserData((prev) => ({ ...prev, workingHours: hoursForm }));
    setEditingHours(false);
  } catch (err) {
    console.error("Save hours error:", err);
  } finally {
    setSavingHours(false);
  }
};

  // ─── Upload photo to Cloudinary ────────────────────────────────────────────
  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "gn_documents");
      formData.append("cloud_name", "dsi9xh1fd");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dsi9xh1fd/image/upload",
        { method: "POST", body: formData }
      );
      const data = await response.json();

      if (data.secure_url) {
        const user = auth.currentUser;
        await updateDoc(doc(db, "gn_officers", user.uid), {
          photoURL: data.secure_url,
        });
        setUserData((prev) => ({ ...prev, photoURL: data.secure_url }));
      }
    } catch (err) {
      console.error("Photo upload error:", err);
    } finally {
      setPhotoUploading(false);
    }
  };

  // ─── Load user data ────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "gn_officers", user.uid);
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
          { key: "office",   label: "Office Details" },
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

      {/* ── Personal Info Tab ── */}
      {activeTab === "personal" && (
        <div>
          <h2 className={`text-xl font-bold mb-4 ${t.text}`}>Personal Information</h2>

          <div className={`${t.card} rounded-2xl shadow p-6 flex items-center justify-between mb-6`}>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gray-300 overflow-hidden">
                  {userData?.photoURL ? (
                    <img src={userData.photoURL} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#8B4513] flex items-center justify-center text-white font-bold text-2xl">
                      {userData?.fullName?.charAt(0).toUpperCase() || "G"}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className={`text-lg font-bold ${t.text}`}>{userData?.fullName || "N/A"}</h3>
                <p className={`text-sm ${t.subtext}`}>Grama Niladhari Officer</p>
                <p className={`text-xs ${t.subtext}`}>📍 GN Division: {userData?.gnDivisionName || "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Basic Identification */}
            <div className={`${t.card} rounded-2xl shadow p-6`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-4 ${t.subtext}`}>👤 Basic Identification</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Full Name",          value: userData?.fullName || "N/A" },
                  { label: "Name with Initials", value: generateInitials(userData?.fullName) },
                  { label: "NIC Number",         value: userData?.nic || "N/A" },
                  { label: "Date of Birth",      value: userData?.dob || "N/A" },
                  { label: "Gender",             value: userData?.gender || "N/A" },
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
              <p className={`text-xs font-semibold uppercase tracking-wide mb-4 ${t.subtext}`}>📞 Contact Details</p>
              <div className="space-y-4">
                {[
                  { icon: "📱", label: "Mobile Number",  value: userData?.mobile || "N/A" },
                  { icon: "📞", label: "Office Number",  value: userData?.officeMobile || "N/A" },
                  { icon: "📧", label: "Personal Email", value: userData?.email || "N/A" },
                  { icon: "🏢", label: "Office Email",   value: userData?.officialEmail || "N/A" },
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
            {/* Residential Address */}
            <div className={`${t.card} rounded-2xl shadow p-6`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-4 ${t.subtext}`}>🏠 Residential Addresses</p>
              <div>
                <p className={`text-xs mb-1 ${t.subtext}`}>Permanent Address</p>
                <p className={`text-sm font-semibold ${t.text}`}>{userData?.address || "N/A"}</p>
              </div>
            </div>

            {/* System & Status */}
            <div className={`${t.card} rounded-2xl shadow p-6`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-4 ${t.subtext}`}>⚙️ System & Status</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${t.subtext}`}>Current Status</p>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full
                      ${gnStatus === "Available"  ? "bg-green-400"  : ""}
                      ${gnStatus === "In Meeting" ? "bg-orange-400" : ""}
                      ${gnStatus === "On Field"   ? "bg-red-400"    : ""}`} />
                    <span className="text-sm font-semibold">{gnStatus}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${t.subtext}`}>Member Since</p>
                  <p className={`text-sm font-semibold ${t.text}`}>
                    {userData?.createdAt
                      ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                      : "N/A"}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${t.subtext}`}>Last Login</p>
                  <p className={`text-sm font-semibold ${t.text}`}>
                    {userData?.lastLogin
                      ? new Date(userData.lastLogin.seconds * 1000).toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Office Details Tab ── */}
      {activeTab === "office" && (
        <div>
          <h2 className={`text-xl font-bold mb-4 ${t.text}`}>Office Details</h2>

          {/* GN Division Information */}
          <div className={`${t.card} rounded-2xl shadow p-6 mb-6`}>
            <p className={`text-sm font-semibold mb-4 ${t.text}`}>🏢 GN Division Information</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "GN Division Name", value: userData?.gnDivisionName || "N/A" },
                { label: "GN Code",          value: userData?.gnCode || "N/A" },
                { label: "DS Division",      value: userData?.divisionalSecretariat || "N/A" },
                { label: "District",         value: userData?.district || "N/A" },
                { label: "Province",         value: userData?.province || "N/A" },
              ].map((item) => (
                <div key={item.label}>
                  <p className={`text-xs ${t.subtext}`}>{item.label}</p>
                  <p className={`text-sm font-semibold ${t.text}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-2 gap-6">

            {/* Jurisdiction Details */}
           <div className={`${t.card} rounded-2xl shadow p-6`}>
  <div className="flex items-center justify-between mb-4">
    <p className={`text-sm font-semibold ${t.text}`}>📍 Jurisdiction Details</p>
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          setJurisdictionForm({
            totalVillages: userData?.totalVillages || "",
            population:    userData?.population    || "",
            totalFamilies: userData?.totalFamilies || "",
            villages:      userData?.villages      || [],
          });
          setEditingJurisdiction(true);
        }}
        className="flex items-center gap-1 text-xs text-[#8B4513] border border-[#8B4513] px-2 py-1 rounded-lg hover:bg-[#8B4513] hover:text-white transition"
      >
        <Pencil size={10} />
        Edit
      </button>
    </div>
  </div>

  {/* Edit Form */}
  {editingJurisdiction ? (
    <div className={`p-4 border ${t.border} rounded-xl space-y-3`}>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className={`text-xs font-semibold mb-1 ${t.subtext}`}>Total Villages</p>
          <input type="number" value={jurisdictionForm.totalVillages}
            onChange={(e) => setJurisdictionForm({ ...jurisdictionForm, totalVillages: e.target.value })}
            placeholder="e.g. 12"
            className={`w-full border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`} />
        </div>
        <div>
          <p className={`text-xs font-semibold mb-1 ${t.subtext}`}>Population</p>
          <input type="number" value={jurisdictionForm.population}
            onChange={(e) => setJurisdictionForm({ ...jurisdictionForm, population: e.target.value })}
            placeholder="e.g. 5000"
            className={`w-full border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`} />
        </div>
        <div>
          <p className={`text-xs font-semibold mb-1 ${t.subtext}`}>Total Families</p>
          <input type="number" value={jurisdictionForm.totalFamilies}
            onChange={(e) => setJurisdictionForm({ ...jurisdictionForm, totalFamilies: e.target.value })}
            placeholder="e.g. 1200"
            className={`w-full border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`} />
        </div>
      </div>

      {/* Villages */}
      <div>
        <p className={`text-xs font-semibold mb-1 ${t.subtext}`}>Villages</p>
        <div className="flex gap-2 mb-2">
          <input type="text" value={villageInput}
            onChange={(e) => setVillageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && villageInput.trim()) {
                setJurisdictionForm((prev) => ({
                  ...prev,
                  villages: [...prev.villages, villageInput.trim()],
                }));
                setVillageInput("");
              }
            }}
            placeholder="Type village name and press Enter"
            className={`flex-1 border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`} />
          <button
            onClick={() => {
              if (villageInput.trim()) {
                setJurisdictionForm((prev) => ({
                  ...prev,
                  villages: [...prev.villages, villageInput.trim()],
                }));
                setVillageInput("");
              }
            }}
            className="bg-[#E5A800] text-black text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#cc9600] transition"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {jurisdictionForm.villages.map((v, i) => (
            <span key={i} className="flex items-center gap-1 bg-[#E5A800] text-black text-xs font-semibold px-3 py-1 rounded-full">
              {v}
              <button onClick={() => setJurisdictionForm((prev) => ({
                ...prev,
                villages: prev.villages.filter((_, idx) => idx !== i),
              }))} className="ml-1 hover:text-red-700 font-bold">✕</button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button onClick={() => setEditingJurisdiction(false)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${t.border} ${t.subtext} hover:bg-gray-100 transition`}>
          Cancel
        </button>
        <button onClick={handleSaveJurisdiction} disabled={savingJurisdiction}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#E5A800] text-black hover:bg-[#cc9600] disabled:opacity-60 transition">
          {savingJurisdiction ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  ) : (
    <>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { label: "Total Villages",  value: userData?.totalVillages || "N/A" },
          { label: "Population",      value: userData?.population    || "N/A" },
          { label: "Total Families",  value: userData?.totalFamilies || "N/A" },
        ].map((item) => (
          <div key={item.label} className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-50"} rounded-xl p-3 text-center`}>
            <p className={`text-xs ${t.subtext}`}>{item.label}</p>
            <p className={`text-2xl font-bold ${t.text}`}>{item.value}</p>
          </div>
        ))}
      </div>
      <p className={`text-xs mb-2 ${t.subtext}`}>Villages under Division:</p>
      <div className="flex flex-wrap gap-2">
        {userData?.villages?.length > 0
          ? userData.villages.map((v) => (
              <span key={v} className="bg-[#E5A800] text-black text-xs font-semibold px-3 py-1 rounded-full">{v}</span>
            ))
          : <span className={`text-xs ${t.subtext}`}>No villages added yet</span>
        }
      </div>
    </>
  )}
</div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">

              {/* Office Details Card */}
              <div className={`${t.card} rounded-2xl shadow p-6`}>
                <div className="flex items-center justify-between mb-3">
                  <p className={`text-sm font-semibold ${t.text}`}>🏢 Office Details</p>
                  <button
                    onClick={() => {
                      setLocationForm({ officeAddress: userData?.officeAddress || "" });
                      setEditingLocation(true);
                    }}
                    className="flex items-center gap-1 text-xs text-[#8B4513] border border-[#8B4513] px-2 py-1 rounded-lg hover:bg-[#8B4513] hover:text-white transition"
                  >
                    <Pencil size={10} />
                    Edit Address
                  </button>
                </div>

                {/* Display address */}
                {!editingLocation && (
                  <>
                    <p className={`text-xs ${t.subtext}`}>Office Address</p>
                    <p className={`text-sm font-semibold ${t.text}`}>
                      {userData?.officeAddress || "No address set. Click Edit Address to add."}
                    </p>
                  </>
                )}

                {/* Edit form */}
                {editingLocation && (
                  <div className={`p-4 border ${t.border} rounded-xl space-y-3`}>
                    <div>
                      <p className={`text-xs font-semibold mb-1 ${t.subtext}`}>Office Address</p>
                      <textarea
                        value={locationForm.officeAddress}
                        onChange={(e) => setLocationForm({ ...locationForm, officeAddress: e.target.value })}
                        placeholder="Enter full office address..."
                        rows={3}
                        className={`w-full border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] resize-none ${t.input}`}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingLocation(false)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${t.border} ${t.subtext} hover:bg-gray-100 transition`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveLocation}
                        disabled={savingLocation}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#E5A800] text-black hover:bg-[#cc9600] disabled:opacity-60 transition"
                      >
                        {savingLocation ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Working Hours */}
              <div className={`${t.card} rounded-2xl shadow p-6`}>
  <div className="flex items-center justify-between mb-3">
    <p className={`text-sm font-semibold ${t.text}`}>⏰ Working Hours</p>
    <button
      onClick={() => {
        setHoursForm({
          monFri:   userData?.workingHours?.monFri    || "08:30 - 16:30",
          saturday: userData?.workingHours?.saturday  || "09:00 - 13:00",
          sunday:   userData?.workingHours?.sunday    || "Closed",
          notes:    userData?.workingHours?.notes     || "", 
        });
        setEditingHours(true);
      }}
      className="flex items-center gap-1 text-xs text-[#8B4513] border border-[#8B4513] px-2 py-1 rounded-lg hover:bg-[#8B4513] hover:text-white transition"
    >
      <Pencil size={10} />
      Edit
    </button>
  </div>

  {editingHours ? (
    <div className={`p-4 border ${t.border} rounded-xl space-y-3`}>
      {[
        { label: "Mon - Fri", key: "monFri" },
        { label: "Saturday",  key: "saturday" },
        { label: "Sunday",    key: "sunday" },
      ].map(({ label, key }) => (
        <div key={key} className="flex items-center gap-3">
          <p className={`text-xs font-semibold w-20 ${t.subtext}`}>{label}</p>
          <input
            type="text"
            value={hoursForm[key]}
            onChange={(e) => setHoursForm({ ...hoursForm, [key]: e.target.value })}
            placeholder='e.g. 08:30 - 16:30 or "Closed"'
            className={`flex-1 border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${t.input}`}
          />
        </div>
      ))}

      <div>
  <p className={`text-xs font-semibold mb-1 ${t.subtext}`}>Special Notes</p>
  <textarea
    value={hoursForm.notes}
    onChange={(e) => setHoursForm({ ...hoursForm, notes: e.target.value })}
    placeholder="e.g. Office closed on public holidays. Emergency visits available on request..."
    rows={3}
    className={`w-full border ${t.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] resize-none ${t.input}`}
  />
</div>
      <div className="flex gap-2 justify-end pt-1">
        <button
          onClick={() => setEditingHours(false)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${t.border} ${t.subtext} hover:bg-gray-100 transition`}
        >
          Cancel
        </button>
        <button
          onClick={handleSaveHours}
          disabled={savingHours}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#E5A800] text-black hover:bg-[#cc9600] disabled:opacity-60 transition"
        >
          {savingHours ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  ) : (
    <table className="w-full text-sm">
      <thead>
        <tr className={`text-xs uppercase ${t.subtext}`}>
          <th className="text-left pb-2">Day</th>
          <th className="text-left pb-2">Hours</th>
        </tr>
      </thead>
      <tbody className={t.divider}>
        {[
          { day: "Mon - Fri", value: userData?.workingHours?.monFri    || "08:30 - 16:30" },
          { day: "Saturday",  value: userData?.workingHours?.saturday  || "09:00 - 13:00" },
          { day: "Sunday",    value: userData?.workingHours?.sunday    || "Closed" },
        ].map(({ day, value }) => (
          <tr key={day}>
            <td className={`py-2 ${t.subtext}`}>{day}</td>
            <td className={`py-2 font-semibold ${value === "Closed" ? "text-red-500" : t.text}`}>
              {value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}

  {userData?.workingHours?.notes && (
  <div className={`mt-3 p-3 rounded-xl ${theme === "dark" ? "bg-gray-700" : "bg-amber-50"} border border-[#E5A800]/30`}>
    <p className="text-xs font-bold text-[#8B4513] mb-1">📝 Special Notes</p>
    <p className={`text-xs ${t.subtext}`}>{userData.workingHours.notes}</p>
  </div>
)}
</div>


            </div>
          </div>
        </div>
      )}

      {/* ── Activity Log Tab ── */}
      {activeTab === "activity" && (
        <div>
          <h2 className={`text-xl font-bold mb-4 ${t.text}`}>Activity Log</h2>

          <div className={`${t.card} rounded-2xl shadow p-5 mb-6`}>
            <p className={`text-sm font-semibold mb-4 ${t.text}`}>📅 This Month</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total Appointments", value: "124", change: "+12%", color: "text-green-600", bg: "bg-green-50", width: "w-3/4" },
                { label: "New Announcements",  value: "18",  change: "+5%",  color: "text-green-600", bg: "bg-green-50", width: "w-1/2" },
                { label: "System Logins",      value: "850", change: "-2%",  color: "text-red-500",   bg: "bg-red-50",   width: "w-full" },
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
                { time: "09:30 AM", dot: "bg-yellow-400", title: "Land Deed Certification",       sub: "Applicant: M. Perera",               tag: "APPOINTMENT", tagColor: "bg-orange-100 text-orange-600" },
                { time: "11:15 AM", dot: "bg-blue-400",   title: "Village Council Meeting Notice", sub: "Broadcast to: All Residents",        tag: "ANNOUNCEMENT", tagColor: "bg-blue-100 text-blue-600" },
                { time: "02:00 PM", dot: "bg-gray-300",   title: "Admin System Access",            sub: "Session started from IP: 192.168.1.1", tag: "SYSTEM",      tagColor: "bg-gray-100 text-gray-600" },
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
                { time: "10:00 AM", dot: "bg-yellow-400", title: "Identity Verification",  sub: "Applicant: K. Silva",      tag: "APPOINTMENT", tagColor: "bg-orange-100 text-orange-600" },
                { time: "03:45 PM", dot: "bg-yellow-400", title: "Pensioner Verification", sub: "Applicant: D. Rajapaksa",  tag: "APPOINTMENT", tagColor: "bg-orange-100 text-orange-600" },
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