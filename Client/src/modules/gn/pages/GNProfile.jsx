import { useState, useEffect } from "react";
import GNLayout, { getThemeClasses } from "../components/gnlayout";
import { doc, getDoc, updateDoc, collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Pencil, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const generateInitials = (fullName) => {
  if (!fullName) return "N/A";
  const words = fullName.trim().split(" ");
  if (words.length === 1) return fullName;
  const surname = words[words.length - 1];
  const initials = words.slice(0, -1).map((w) => w.charAt(0).toUpperCase() + ".").join(" ");
  return `${initials} ${surname}`;
};

const safeStr = (val, fallback = "N/A") => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val || fallback;
  if (typeof val === "number") return String(val);
  return fallback;
};

const GNProfile = ({ gnStatus, theme }) => {
  const { t: translate, i18n } = useTranslation();
  const tTheme = getThemeClasses(theme);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ✅ Derived from URL — always in sync, no useState
  const activeTab = searchParams.get("tab") || "personal";

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Office address edit
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationForm, setLocationForm] = useState({ officeAddress: "" });
  const [savingLocation, setSavingLocation] = useState(false);

  // Jurisdiction edit
  const [editingJurisdiction, setEditingJurisdiction] = useState(false);
  const [jurisdictionForm, setJurisdictionForm] = useState({ totalVillages: "", population: "", totalFamilies: "", villages: [] });
  const [savingJurisdiction, setSavingJurisdiction] = useState(false);
  const [villageInput, setVillageInput] = useState("");

  // Photo
  const [photoUploading, setPhotoUploading] = useState(false);

  // Activity Log
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityFilter, setActivityFilter] = useState("All");

  // ─── Load user data ───────────────────────────────────────────────────────────
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

  // ─── Fetch activity log when tab is active ────────────────────────────────────
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
  }, [activeTab]);

  // ─── Save office address ──────────────────────────────────────────────────────
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

  // ─── Save jurisdiction ────────────────────────────────────────────────────────
  const handleSaveJurisdiction = async () => {
    setSavingJurisdiction(true);
    try {
      const user = auth.currentUser;
      await updateDoc(doc(db, "gn_officers", user.uid), {
        totalVillages: jurisdictionForm.totalVillages,
        population: jurisdictionForm.population,
        totalFamilies: jurisdictionForm.totalFamilies,
        villages: jurisdictionForm.villages,
      });
      setUserData((prev) => ({ ...prev, ...jurisdictionForm }));
      setEditingJurisdiction(false);
    } catch (err) {
      console.error("Save jurisdiction error:", err);
    } finally {
      setSavingJurisdiction(false);
    }
  };

  // ─── Upload photo ─────────────────────────────────────────────────────────────
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
          <p className={`text-sm ${tTheme.subtext}`}>{translate('loading_profile')}</p>
        </div>
      </GNLayout>
    );
  }

  const tabs = [
    { key: "personal", label: translate('tab_personal') },
    { key: "office", label: translate('tab_office') },
    { key: "activity", label: translate('tab_activity') },
  ];

  const activityFilters = [
    { key: "All", label: translate('filter_all') },
    { key: "announcement", label: translate('filter_announcements') },
    { key: "change", label: translate('filter_changes') },
  ];

  return (
    <GNLayout gnStatus={gnStatus} theme={theme}>

      <h1 className="text-xl sm:text-2xl font-bold text-[#8B4513] mb-4 text-center sm:text-left">
        {translate('profile_title')}
      </h1>

      {/* Tabs */}
      <div className={`flex flex-wrap gap-3 sm:gap-6 border-b ${tTheme.border} mb-6`}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => navigate(`/gn-profile?tab=${tab.key}`, { replace: true })}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition
              ${activeTab === tab.key
                ? "border-[#8B4513] text-[#8B4513]"
                : `border-transparent ${tTheme.subtext} hover:text-gray-600`}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Personal Info ── */}
      {activeTab === "personal" && (
        <div>
          <h2 className={`text-lg sm:text-xl font-bold mb-4 text-left ${tTheme.text}`}>
            {translate('personal_info_title')}
          </h2>

          {/* Avatar Card */}
          <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 mb-6`}>
            <div className="w-16 h-16 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
              {userData?.photoURL ? (
                <img src={userData.photoURL} alt={translate('avatar_alt')} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#8B4513] flex items-center justify-center text-white font-bold text-2xl">
                  {userData?.fullName?.charAt(0).toUpperCase() || "G"}
                </div>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h3 className={`text-base sm:text-lg font-bold ${tTheme.text}`}>{safeStr(userData?.fullName)}</h3>
              <p className={`text-xs sm:text-sm ${tTheme.subtext}`}>{translate('role_gn_officer')}</p>
              <p className={`text-[10px] sm:text-xs ${tTheme.subtext}`}>
                📍 {translate('gn_division_label')}: {safeStr(userData?.gnDiv)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            {/* Basic Identification */}
            <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-6`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-4 text-left ${tTheme.subtext}`}>
                {translate('basic_identification')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {[
                  { label: translate('full_name_label'), value: safeStr(userData?.fullName) },
                  { label: translate('name_with_initials'), value: generateInitials(userData?.fullName) },
                  { label: translate('nic_label'), value: safeStr(userData?.nic) },
                  { label: translate('dob_label'), value: safeStr(userData?.dob) },
                  { label: translate('gender_label'), value: safeStr(userData?.gender) },
                ].map((item) => (
                  <div key={item.label}>
                    <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>{item.label}</p>
                    <p className={`text-xs sm:text-sm font-semibold text-left ${tTheme.text}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Details */}
            <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-6`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-4 text-left ${tTheme.subtext}`}>
                {translate('contact_details_title')}
              </p>
              <div className="space-y-3 sm:space-y-4">
                {[
                  { icon: "📱", label: translate('mobile_label'), value: safeStr(userData?.mobile) },
                  { icon: "📞", label: translate('office_mobile_label'), value: safeStr(userData?.officeMobile) },
                  { icon: "📧", label: translate('personal_email_label'), value: safeStr(userData?.email) },
                  { icon: "🏢", label: translate('office_email_label'), value: safeStr(userData?.officialEmail) },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 sm:gap-3">
                    <span className="text-base sm:text-lg">{item.icon}</span>
                    <div>
                      <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>{item.label}</p>
                      <p className={`text-xs sm:text-sm font-semibold text-left ${tTheme.text}`}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Residential Address */}
            <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-6`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-4 text-left ${tTheme.subtext}`}>
                {translate('residential_addresses')}
              </p>
              <p className={`text-[10px] sm:text-xs mb-1 text-left ${tTheme.subtext}`}>
                {translate('permanent_address')}
              </p>
              <p className={`text-xs sm:text-sm font-semibold text-left ${tTheme.text}`}>{safeStr(userData?.address)}</p>
            </div>

            {/* System & Status */}
            <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-6`}>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-4 text-left ${tTheme.subtext}`}>
                {translate('system_status_title')}
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>
                    {translate('current_status_label')}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full
                      ${gnStatus === "Available" ? "bg-green-400" : ""}
                      ${gnStatus === "In Meeting" ? "bg-orange-400" : ""}
                      ${gnStatus === "On Field" ? "bg-red-400" : ""}`}
                    />
                    <span className="text-xs sm:text-sm font-semibold text-right">
                      {gnStatus ? translate(`status_${gnStatus.toLowerCase().replace(' ', '_')}`) : translate('status_available')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>
                    {translate('member_since_label')}
                  </p>
                  <p className={`text-xs sm:text-sm font-semibold text-right ${tTheme.text}`}>
                    {userData?.createdAt?.seconds
                      ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString(i18n.language || 'en-US', {
                          year: "numeric", month: "long", day: "numeric"
                        })
                      : translate('na')}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>
                    {translate('last_login_label')}
                  </p>
                  <p className={`text-xs sm:text-sm font-semibold text-right ${tTheme.text}`}>
                    {userData?.lastLogin?.seconds
                      ? new Date(userData.lastLogin.seconds * 1000).toLocaleString(i18n.language || 'en-US', {
                          year: "numeric", month: "long", day: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })
                      : translate('na')}
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
          <h2 className={`text-lg sm:text-xl font-bold mb-4 text-left ${tTheme.text}`}>
            {translate('office_details_title')}
          </h2>

          <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-6 mb-4 sm:mb-6`}>
            <p className={`text-xs sm:text-sm font-semibold mb-4 text-left ${tTheme.text}`}>
              {translate('gn_division_info')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[
                { label: translate('gn_division_label'), value: safeStr(userData?.gnDiv) },
                { label: translate('gn_code_label'), value: safeStr(userData?.gnCode) },
                { label: translate('ds_division_label'), value: safeStr(userData?.divisionalSecretariat) },
                { label: translate('district_label'), value: safeStr(userData?.district) },
                { label: translate('province_label'), value: safeStr(userData?.province) },
              ].map((item) => (
                <div key={item.label}>
                  <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>{item.label}</p>
                  <p className={`text-xs sm:text-sm font-semibold text-left ${tTheme.text}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

            {/* Jurisdiction Details */}
            <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-6`}>
              <div className="flex items-center justify-between mb-4">
                <p className={`text-xs sm:text-sm font-semibold text-left ${tTheme.text}`}>
                  {translate('jurisdiction_details')}
                </p>
                <button
                  onClick={() => {
                    setJurisdictionForm({
                      totalVillages: safeStr(userData?.totalVillages, ""),
                      population: safeStr(userData?.population, ""),
                      totalFamilies: safeStr(userData?.totalFamilies, ""),
                      villages: Array.isArray(userData?.villages) ? userData.villages : [],
                    });
                    setEditingJurisdiction(true);
                  }}
                  className="flex items-center gap-1 text-[10px] sm:text-xs text-[#8B4513] border border-[#8B4513] px-1.5 sm:px-2 py-1 rounded-lg hover:bg-[#8B4513] hover:text-white transition"
                >
                  <Pencil size={10} /> {translate('edit_btn')}
                </button>
              </div>

              {editingJurisdiction ? (
                <div className={`p-3 sm:p-4 border ${tTheme.border} rounded-xl space-y-3`}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { key: "totalVillages", label: translate('total_villages'), placeholder: translate('total_villages_placeholder') },
                      { key: "population", label: translate('population'), placeholder: translate('population_placeholder') },
                      { key: "totalFamilies", label: translate('total_families'), placeholder: translate('total_families_placeholder') },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <p className={`text-[10px] sm:text-xs font-semibold mb-1 text-left ${tTheme.subtext}`}>{label}</p>
                        <input
                          type="number"
                          value={jurisdictionForm[key]}
                          onChange={(e) => setJurisdictionForm({ ...jurisdictionForm, [key]: e.target.value })}
                          placeholder={placeholder}
                          className={`w-full border ${tTheme.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className={`text-[10px] sm:text-xs font-semibold mb-1 text-left ${tTheme.subtext}`}>
                      {translate('villages_list')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 mb-2">
                      <input
                        type="text"
                        value={villageInput}
                        onChange={(e) => setVillageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && villageInput.trim()) {
                            setJurisdictionForm((p) => ({ ...p, villages: [...p.villages, villageInput.trim()] }));
                            setVillageInput("");
                          }
                        }}
                        placeholder={translate('village_input_placeholder')}
                        className={`flex-1 border ${tTheme.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] ${tTheme.input}`}
                      />
                      <button
                        onClick={() => {
                          if (villageInput.trim()) {
                            setJurisdictionForm((p) => ({ ...p, villages: [...p.villages, villageInput.trim()] }));
                            setVillageInput("");
                          }
                        }}
                        className="bg-[#E5A800] text-black text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#cc9600] transition"
                      >
                        {translate('add_btn')}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {jurisdictionForm.villages.map((v, i) => (
                        <span key={i} className="flex items-center gap-1 bg-[#E5A800] text-black text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 rounded-full">
                          {v}
                          <button
                            onClick={() => setJurisdictionForm((p) => ({ ...p, villages: p.villages.filter((_, idx) => idx !== i) }))}
                            className="ml-1 hover:text-red-700 font-bold"
                          >✕</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingJurisdiction(false)}
                      className={`text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-lg border ${tTheme.border} ${tTheme.subtext} hover:bg-gray-100 transition`}
                    >
                      {translate('cancel_btn')}
                    </button>
                    <button
                      onClick={handleSaveJurisdiction}
                      disabled={savingJurisdiction}
                      className="text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#E5A800] text-black hover:bg-[#cc9600] disabled:opacity-60 transition"
                    >
                      {savingJurisdiction ? translate('saving') : translate('save_btn')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
                    {[
                      { label: translate('total_villages'), value: safeStr(userData?.totalVillages) },
                      { label: translate('population'), value: safeStr(userData?.population) },
                      { label: translate('total_families'), value: safeStr(userData?.totalFamilies) },
                    ].map((item) => (
                      <div key={item.label} className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-50"} rounded-xl p-3 text-center`}>
                        <p className={`text-[10px] sm:text-xs text-center ${tTheme.subtext}`}>{item.label}</p>
                        <p className={`text-base sm:text-2xl font-bold text-center ${tTheme.text}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className={`text-[10px] sm:text-xs mb-2 text-left ${tTheme.subtext}`}>
                    {translate('villages_under_division')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(userData?.villages) && userData.villages.length > 0
                      ? userData.villages.map((v, i) => (
                          <span key={i} className="bg-[#E5A800] text-black text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 rounded-full">
                            {safeStr(v)}
                          </span>
                        ))
                      : <span className={`text-[10px] sm:text-xs ${tTheme.subtext}`}>{translate('no_villages_added')}</span>
                    }
                  </div>
                </>
              )}
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-4 sm:gap-6">

              {/* Office Address */}
              <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-6`}>
                <div className="flex items-center justify-between mb-3">
                  <p className={`text-xs sm:text-sm font-semibold text-left ${tTheme.text}`}>
                    {translate('office_details_title')}
                  </p>
                  <button
                    onClick={() => {
                      setLocationForm({ officeAddress: typeof userData?.officeAddress === "string" ? userData.officeAddress : "" });
                      setEditingLocation(true);
                    }}
                    className="flex items-center gap-1 text-[10px] sm:text-xs text-[#8B4513] border border-[#8B4513] px-1.5 sm:px-2 py-1 rounded-lg hover:bg-[#8B4513] hover:text-white transition"
                  >
                    <Pencil size={10} /> {translate('edit_address_btn')}
                  </button>
                </div>

                {!editingLocation && (
                  <>
                    <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>
                      {translate('office_address_label')}
                    </p>
                    <p className={`text-xs sm:text-sm font-semibold text-left ${tTheme.text}`}>
                      {safeStr(userData?.officeAddress, translate('no_address_set'))}
                    </p>
                  </>
                )}

                {editingLocation && (
                  <div className={`p-3 sm:p-4 border ${tTheme.border} rounded-xl space-y-3`}>
                    <div>
                      <p className={`text-[10px] sm:text-xs font-semibold mb-1 text-left ${tTheme.subtext}`}>
                        {translate('office_address_label')}
                      </p>
                      <textarea
                        value={locationForm.officeAddress}
                        onChange={(e) => setLocationForm({ ...locationForm, officeAddress: e.target.value })}
                        placeholder={translate('office_address_placeholder')}
                        rows={3}
                        className={`w-full border ${tTheme.border} rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E5A800] resize-none ${tTheme.input}`}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingLocation(false)}
                        className={`text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-lg border ${tTheme.border} ${tTheme.subtext} hover:bg-gray-100 transition`}
                      >
                        {translate('cancel_btn')}
                      </button>
                      <button
                        onClick={handleSaveLocation}
                        disabled={savingLocation}
                        className="text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#E5A800] text-black hover:bg-[#cc9600] disabled:opacity-60 transition"
                      >
                        {savingLocation ? translate('saving') : translate('save_btn')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Working Hours */}
              <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-6`}>
                <div className="flex items-center justify-between mb-3">
                  <p className={`text-xs sm:text-sm font-semibold text-left ${tTheme.text}`}>
                    {translate('working_hours_title')}
                  </p>
                  <button
                    onClick={() => navigate("/gn-settings?tab=hours")}
                    className="flex items-center gap-1 text-[10px] sm:text-xs text-[#8B4513] border border-[#8B4513] px-1.5 sm:px-2 py-1 rounded-lg hover:bg-[#8B4513] hover:text-white transition"
                  >
                    <Pencil size={10} /> {translate('edit_btn')}
                  </button>
                </div>

                <table className="w-full text-sm">
                  <thead>
                    <tr className={`text-[10px] sm:text-xs uppercase ${tTheme.subtext}`}>
                      <th className="text-left pb-2">{translate('day_label')}</th>
                      <th className="text-left pb-2">{translate('hours_label')}</th>
                    </tr>
                  </thead>
                  <tbody className={tTheme.divider}>
                    {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((day) => {
                      const value = userData?.workingHours?.[day];
                      const display = !value
                        ? (day === "Sunday" || day === "Saturday" ? translate('closed') : "08:00 - 17:00")
                        : value.enabled === false
                        ? translate('closed')
                        : `${value.start || ""} - ${value.end || ""}`;
                      return (
                        <tr key={day}>
                          <td className={`py-2 text-left text-[10px] sm:text-xs ${tTheme.subtext}`}>
                            {translate(`day_${day.toLowerCase()}`)}
                          </td>
                          <td className={`py-2 font-semibold text-left text-[10px] sm:text-xs ${display === translate('closed') ? "text-red-500" : tTheme.text}`}>
                            {display}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── Activity Log ── */}
      {activeTab === "activity" && (
        <div>
          <h2 className={`text-lg sm:text-xl font-bold mb-4 text-left ${tTheme.text}`}>
            {translate('activity_log_title')}
          </h2>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {[
              { label: translate('total_activities'), value: activities.length },
              { label: translate('activity_announcements'), value: activities.filter((a) => a.type === "announcement").length },
              { label: translate('activity_changes'), value: activities.filter((a) => a.type === "change").length },
            ].map((item) => (
              <div key={item.label} className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-5 text-center sm:text-left`}>
                <p className={`text-[10px] sm:text-xs text-center sm:text-left ${tTheme.subtext} mb-1`}>{item.label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-[#8B4513] text-center sm:text-left">
                  {activityLoading ? "—" : item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {activityFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActivityFilter(f.key)}
                className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold capitalize transition
                  ${activityFilter === f.key
                    ? "bg-[#8B4513] text-white"
                    : `border ${tTheme.border} ${tTheme.subtext} hover:border-[#8B4513]`}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Activity Feed */}
          <div className={`${tTheme.card} rounded-2xl shadow p-4 sm:p-5`}>
            {activityLoading ? (
              <div className="flex items-center justify-center py-12 gap-2">
                <Loader2 size={20} className="animate-spin text-[#E5A800]" />
                <p className={`text-sm ${tTheme.subtext}`}>{translate('loading_activities')}</p>
              </div>
            ) : (activityFilter === "All" ? activities : activities.filter((a) => a.type === activityFilter)).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-3xl sm:text-4xl mb-3">📋</p>
                <p className={`text-xs sm:text-sm font-semibold ${tTheme.subtext}`}>{translate('no_activities')}</p>
                <p className={`text-[10px] sm:text-xs mt-1 ${tTheme.subtext}`}>
                  {translate('no_activities_desc')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(activityFilter === "All"
                  ? activities
                  : activities.filter((a) => a.type === activityFilter)
                ).map((item) => (
                  <div
                    key={item.id}
                    className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 border ${tTheme.border} rounded-xl px-3 sm:px-4 py-3`}
                  >
                    <p className={`text-[10px] sm:text-xs w-full sm:w-24 flex-shrink-0 text-left ${tTheme.subtext}`}>
                      {item.createdAt?.toDate?.()?.toLocaleString(i18n.language || 'en-US', {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      }) || "—"}
                    </p>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      item.type === "announcement" ? "bg-blue-400" :
                      item.type === "change" ? "bg-orange-400" : "bg-gray-300"
                    }`} />
                    <div className="flex-1">
                      <p className={`text-xs sm:text-sm font-semibold text-left ${tTheme.text}`}>{item.title}</p>
                      <p className={`text-[10px] sm:text-xs text-left ${tTheme.subtext}`}>{item.description}</p>
                    </div>
                    <span className={`text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 rounded-full flex-shrink-0 self-start sm:self-center ${
                      item.type === "announcement" ? "bg-blue-100 text-blue-600" :
                      item.type === "change" ? "bg-orange-100 text-orange-600" :
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