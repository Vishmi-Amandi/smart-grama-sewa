import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Phone, MapPin, BadgeCheck, Building2, Eye, EyeOff, Lock, CheckCircle2, Loader2 } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";
import gnDivisionsData from "../../user/data/gnDivisions.json";
import { useTranslation } from "react-i18next";

// ─── Shared Styles ────────────────────────────────────────────────────────────
const inputClass =
  "w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 bg-white outline-none transition focus:border-[#E5A800] placeholder:text-gray-400";

const selectClass =
  "w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 bg-white outline-none transition focus:border-[#E5A800] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

const labelClass = "block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide";

const FieldError = ({ msg }) =>
  msg ? <p className="text-red-500 text-xs mt-1 font-medium">{msg}</p> : null;

// ─── Derived lookup maps from gnDivisions.json ────────────────────────────────
const ALL_DISTRICTS = Object.keys(gnDivisionsData).sort();

const getDsDivisions = (district) =>
  district && gnDivisionsData[district]
    ? Object.keys(gnDivisionsData[district]).sort()
    : [];

const getGnDivisions = (district, ds) =>
  district && ds && gnDivisionsData[district]?.[ds]
    ? [...gnDivisionsData[district][ds]].sort()
    : [];

// ─── Step Tabs ────────────────────────────────────────────────────────────────
const StepTabs = ({ current, t }) => {
  const STEPS = [
    t("step_personal_info"),
    t("step_official_details"),
    t("step_document_upload"),
    t("step_account_setup"),
  ];

  return (
    <div className="flex border-b border-gray-200 mb-6 overflow-x-auto pb-1">
      {STEPS.map((label, i) => {
        const idx = i + 1;
        const isActive = current === idx;
        const isDone = current > idx;
        return (
          <div key={idx} className={`flex items-center gap-1.5 px-2 sm:px-4 py-2.5 text-[10px] sm:text-xs font-bold border-b-2 transition whitespace-nowrap
            ${isActive ? "border-[#8B4513] text-[#8B4513]" : "border-transparent text-gray-400"}`}>
            <span className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-xs font-black
              ${isActive ? "bg-[#8B4513] text-white" : isDone ? "bg-[#8B4513] text-white" : "bg-gray-200 text-gray-500"}`}>
              {isDone ? "✓" : idx}
            </span>
            {label}
          </div>
        );
      })}
    </div>
  );
};

// ─── Section Card ─────────────────────────────────────────────────────────────
const Section = ({ icon: Icon, title, children }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3">
      <Icon size={15} className="text-[#8B4513]" />
      <h3 className="text-sm font-bold text-gray-700">{title}</h3>
    </div>
    <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-100">
      {children}
    </div>
  </div>
);

// ─── STEP 1 — Personal Information ───────────────────────────────────────────
const Step1 = ({ form, update, onNext, t }) => {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = t("err_full_name_required");
    if (!form.nic.trim())      e.nic = t("err_nic_required");
    else if (!/^(\d{9}[VvXx]|\d{12})$/.test(form.nic.trim())) e.nic = t("err_nic_invalid");
    if (!form.address.trim())  e.address = t("err_address_required");
    if (!form.dob)             e.dob = t("err_dob_required");
    if (!form.gender)          e.gender = t("err_gender_required");
    if (!form.mobile.trim())   e.mobile = t("err_mobile_required");
    else if (!/^\d{10}$/.test(form.mobile.trim())) e.mobile = t("err_mobile_invalid");
    if (!form.email.trim())    e.email = t("err_email_required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t("err_email_invalid");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <>
      <h2 className="text-lg font-black text-gray-800 mb-6">{t("personal_info_title")}</h2>

      <Section icon={BadgeCheck} title={t("identification_details")}>
        <div className="mb-4">
          <label className={labelClass}>{t("full_name_label")}</label>
          <input type="text" value={form.fullName} onChange={(e) => update("fullName", e.target.value)}
            placeholder={t("full_name_placeholder")} className={inputClass} />
          <FieldError msg={errors.fullName} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>{t("permanent_address_label")}</label>
            <input type="text" value={form.address} onChange={(e) => update("address", e.target.value)}
              placeholder={t("permanent_address_placeholder")} className={inputClass} />
            <FieldError msg={errors.address} />
          </div>
          <div>
            <label className={labelClass}>{t("nic_label")}</label>
            <input type="text" value={form.nic} onChange={(e) => update("nic", e.target.value)}
              placeholder={t("nic_placeholder")} className={inputClass} />
            <FieldError msg={errors.nic} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>{t("dob_label")}</label>
            <input type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} className={inputClass} />
            <FieldError msg={errors.dob} />
          </div>
          <div>
            <label className={labelClass}>{t("gender_label")}</label>
            <select value={form.gender} onChange={(e) => update("gender", e.target.value)} className={selectClass}>
              <option value="">{t("gender_select")}</option>
              <option value="Male">{t("gender_male")}</option>
              <option value="Female">{t("gender_female")}</option>
              <option value="Other">{t("gender_other")}</option>
            </select>
            <FieldError msg={errors.gender} />
          </div>
        </div>
      </Section>

      <Section icon={Phone} title={t("contact_details_label")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>{t("mobile_label")}</label>
            <input type="tel" value={form.mobile} onChange={(e) => update("mobile", e.target.value)}
              placeholder={t("mobile_placeholder")} className={inputClass} />
            <FieldError msg={errors.mobile} />
          </div>
        </div>
        <div>
          <label className={labelClass}>{t("email_label")}</label>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
            placeholder={t("email_placeholder")} className={inputClass} />
          <FieldError msg={errors.email} />
        </div>
      </Section>

      <div className="flex justify-end mt-2">
        <button onClick={() => { if (validate()) onNext(); }}
          className="bg-[#E5A800] hover:bg-[#cc9600] text-[#3d2a00] font-black px-4 sm:px-6 py-2.5 rounded-xl flex items-center gap-2 transition shadow text-sm">
          {t("next_step_btn")} <ArrowRight size={15} />
        </button>
      </div>
    </>
  );
};

// ─── STEP 2 — Official Details ────────────────────────────────────────────────
const Step2 = ({ form, update, onNext, onBack, t }) => {
  const [errors, setErrors] = useState({});

  const dsDivisions = useMemo(() => getDsDivisions(form.district), [form.district]);
  const gnDivisions = useMemo(() => getGnDivisions(form.district, form.divisionalSecretariat), [form.district, form.divisionalSecretariat]);

  const handleDistrictChange = (val) => {
    update("district", val);
    update("divisionalSecretariat", "");
    update("gnDiv", "");
  };
  const handleDsChange = (val) => {
    update("divisionalSecretariat", val);
    update("gnDiv", "");
  };

  const validate = () => {
    const e = {};
    if (!form.province)               e.province = t("err_province_required");
    if (!form.district)               e.district = t("err_district_required");
    if (!form.divisionalSecretariat)  e.divisionalSecretariat = t("err_ds_required");
    if (!form.gnDiv)                  e.gnDiv = t("err_gn_required");
    if (!form.gnCode.trim())          e.gnCode = t("err_gn_code_required");
    if (!form.officeAddress.trim())   e.officeAddress = t("err_office_address_required");
    if (!form.officeMobile.trim())    e.officeMobile = t("err_office_mobile_required");
    else if (!/^\d{10}$/.test(form.officeMobile.trim())) e.officeMobile = t("err_office_mobile_invalid");
    if (!form.officialEmail.trim())   e.officialEmail = t("err_official_email_required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.officialEmail)) e.officialEmail = t("err_official_email_invalid");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Province list (static)
  const provinces = ["Western","Central","Southern","Northern","Eastern","North Western","North Central","Uva","Sabaragamuwa"];

  return (
    <>
      <h2 className="text-lg font-black text-gray-800 mb-6">{t("official_details_title")}</h2>

      <Section icon={MapPin} title={t("administrative_area_label")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>{t("province_label")}</label>
            <select value={form.province} onChange={(e) => update("province", e.target.value)} className={selectClass}>
              <option value="">{t("select_province_option")}</option>
              {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <FieldError msg={errors.province} />
          </div>
          <div>
            <label className={labelClass}>{t("district_label")}</label>
            <select value={form.district} onChange={(e) => handleDistrictChange(e.target.value)} className={selectClass}>
              <option value="">{t("select_district_option")}</option>
              {ALL_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <FieldError msg={errors.district} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t("ds_division_label")}</label>
            <select
              value={form.divisionalSecretariat}
              onChange={(e) => handleDsChange(e.target.value)}
              disabled={!form.district}
              className={selectClass}
            >
              <option value="">
                {form.district ? t("select_ds_option") : t("select_district_first")}
              </option>
              {dsDivisions.map((ds) => <option key={ds} value={ds}>{ds}</option>)}
            </select>
            <FieldError msg={errors.divisionalSecretariat} />
          </div>

          <div>
            <label className={labelClass}>{t("gn_division_label")}</label>
            <select
              value={form.gnDiv}
              onChange={(e) => update("gnDiv", e.target.value)}
              disabled={!form.divisionalSecretariat}
              className={selectClass}
            >
              <option value="">
                {!form.district
                  ? t("select_district_first")
                  : !form.divisionalSecretariat
                  ? t("select_ds_first")
                  : t("select_gn_option")}
              </option>
              {gnDivisions.map((gn) => <option key={gn} value={gn}>{gn}</option>)}
            </select>
            <FieldError msg={errors.gnDiv} />
          </div>
        </div>
      </Section>

      <Section icon={Building2} title={t("gn_division_details_label")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t("selected_gn_division_label")}</label>
            <input
              type="text"
              value={form.gnDiv}
              readOnly
              placeholder={t("select_gn_from_dropdown")}
              className={`${inputClass} bg-gray-100 cursor-not-allowed text-gray-500`}
            />
          </div>
          <div>
            <label className={labelClass}>{t("gn_code_label")}</label>
            <input
              type="text"
              value={form.gnCode}
              onChange={(e) => update("gnCode", e.target.value)}
              placeholder={t("gn_code_placeholder")}
              className={inputClass}
            />
            <FieldError msg={errors.gnCode} />
          </div>
        </div>
      </Section>

      <Section icon={Phone} title={t("office_contact_label")}>
        <div className="mb-4">
          <label className={labelClass}>{t("office_address_label")}</label>
          <textarea value={form.officeAddress} onChange={(e) => update("officeAddress", e.target.value)}
            placeholder={t("office_address_placeholder")} rows={3} className={`${inputClass} resize-none`} />
          <FieldError msg={errors.officeAddress} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t("office_mobile_label")}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📞</span>
              <input type="tel" value={form.officeMobile} onChange={(e) => update("officeMobile", e.target.value)}
                placeholder={t("office_mobile_placeholder")} className={`${inputClass} pl-9`} />
            </div>
            <FieldError msg={errors.officeMobile} />
          </div>
          <div>
            <label className={labelClass}>{t("official_email_label")}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">✉</span>
              <input type="email" value={form.officialEmail} onChange={(e) => update("officialEmail", e.target.value)}
                placeholder={t("official_email_placeholder")} className={`${inputClass} pl-9`} />
            </div>
            <FieldError msg={errors.officialEmail} />
          </div>
        </div>
      </Section>

      <div className="flex justify-between mt-2">
        <button onClick={onBack}
          className="border-2 border-[#3B1F0A] text-[#3B1F0A] hover:bg-[#3B1F0A] hover:text-white font-bold px-4 sm:px-5 py-2.5 rounded-xl flex items-center gap-2 transition text-sm">
          <ArrowLeft size={15} /> {t("previous_step_btn")}
        </button>
        <button onClick={() => { if (validate()) onNext(); }}
          className="bg-[#E5A800] hover:bg-[#cc9600] text-[#3d2a00] font-black px-4 sm:px-6 py-2.5 rounded-xl flex items-center gap-2 transition shadow text-sm">
          {t("save_continue_btn")} <ArrowRight size={15} />
        </button>
      </div>
    </>
  );
};

// ─── STEP 3 — Document Upload ─────────────────────────────────────────────────
const Step3 = ({ form, update, onNext, onBack, t }) => {
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState({});

  const requiredFields = [
    { fieldName: "appointmentLetter", label: t("doc_appointment_letter") },
    { fieldName: "photograph",        label: t("doc_photograph") },
    { fieldName: "nicFront",          label: t("doc_nic_front") },
    { fieldName: "nicBack",           label: t("doc_nic_back") },
    { fieldName: "signature",         label: t("doc_signature") },
  ];

  const handleUpload = async (file, fieldName) => {
    if (!file) return;
    setUploadProgress((prev) => ({ ...prev, [fieldName]: "uploading" }));
    setErrors((prev) => ({ ...prev, [fieldName]: false }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "gn_documents");
      formData.append("cloud_name", "dsi9xh1fd");
      const response = await fetch("https://api.cloudinary.com/v1_1/dsi9xh1fd/auto/upload", {
        method: "POST", body: formData,
      });
      const data = await response.json();
      if (data.secure_url) {
        update(fieldName, data.secure_url);
        setUploadProgress((prev) => ({ ...prev, [fieldName]: "done" }));
      } else {
        setUploadProgress((prev) => ({ ...prev, [fieldName]: "error" }));
      }
    } catch {
      setUploadProgress((prev) => ({ ...prev, [fieldName]: "error" }));
    }
  };

  const handleNext = () => {
    const newErrors = {};
    requiredFields.forEach(({ fieldName }) => {
      if (uploadProgress[fieldName] !== "done") newErrors[fieldName] = true;
    });
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    onNext();
  };

  const isAnyUploading = Object.values(uploadProgress).some((v) => v === "uploading");

  const DocumentBox = ({ label, fieldName }) => {
    const status = uploadProgress[fieldName];
    return (
      <div className="flex flex-col gap-2">
        <label className={labelClass}>{label}</label>
        <label className={`border-2 border-dashed rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center cursor-pointer transition
          ${errors[fieldName] ? "border-red-400 bg-red-50"
            : status === "done" ? "border-green-400 bg-green-50"
            : status === "uploading" ? "border-yellow-300 bg-yellow-50"
            : "border-gray-200 bg-white hover:border-[#E5A800]"}`}>
          <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden"
            disabled={status === "uploading"}
            onChange={(e) => handleUpload(e.target.files[0], fieldName)} />
          {status === "done" && (<><span className="text-2xl sm:text-3xl mb-2">✅</span><p className="text-xs font-semibold text-green-600">{t("uploaded_success")}</p><p className="text-xs text-gray-400 mt-1">{t("click_to_replace")}</p></>)}
          {status === "uploading" && (<><span className="text-2xl sm:text-3xl mb-2">⏳</span><p className="text-xs font-semibold text-yellow-600">{t("uploading")}</p></>)}
          {status === "error" && (<><span className="text-2xl sm:text-3xl mb-2">❌</span><p className="text-xs font-semibold text-red-500">{t("upload_failed_retry")}</p></>)}
          {!status && (<><span className="text-2xl sm:text-3xl mb-2">{errors[fieldName] ? "⚠️" : "📄"}</span>
            <p className={`text-xs font-semibold text-center ${errors[fieldName] ? "text-red-500" : "text-gray-600"}`}>
              {errors[fieldName] ? t("doc_required") : t("click_to_upload_or_drag")}</p>
            <p className="text-xs text-gray-400 mt-1 text-center">{t("file_requirements")}</p></>)}
        </label>
        {errors[fieldName] && <p className="text-xs text-red-500 font-semibold flex items-center gap-1">⚠️ {t("doc_required_msg", { label })}</p>}
      </div>
    );
  };

  const missingDocs = requiredFields.filter(({ fieldName }) => uploadProgress[fieldName] !== "done");

  return (
    <>
      <h2 className="text-lg font-black text-gray-800 mb-6">{t("document_upload_title")}</h2>
      {isAnyUploading && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm font-semibold text-yellow-700 flex items-center gap-2">
          ⏳ {t("uploading_document_wait")}
        </div>
      )}
      {Object.keys(errors).length > 0 && missingDocs.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-sm text-red-700">
          <p className="font-bold mb-1">{t("doc_required_list_title")}</p>
          <ul className="list-disc list-inside space-y-0.5">
            {missingDocs.map(({ label }) => <li key={label} className="text-xs font-medium">{label}</li>)}
          </ul>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <DocumentBox label={t("doc_appointment_letter")} fieldName="appointmentLetter" />
        <DocumentBox label={t("doc_photograph")}  fieldName="photograph" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <DocumentBox label={t("doc_nic_front")} fieldName="nicFront" />
        <DocumentBox label={t("doc_nic_back")}  fieldName="nicBack" />
      </div>
      <div className="mb-6">
        <DocumentBox label={t("doc_signature")} fieldName="signature" />
      </div>
      <div className="flex justify-between mt-2">
        <button onClick={onBack}
          className="border-2 border-[#3B1F0A] text-[#3B1F0A] hover:bg-[#3B1F0A] hover:text-white font-bold px-4 sm:px-5 py-2.5 rounded-xl flex items-center gap-2 transition text-sm">
          <ArrowLeft size={15} /> {t("previous_step_btn")}
        </button>
        <button onClick={handleNext} disabled={isAnyUploading}
          className="bg-[#E5A800] hover:bg-[#cc9600] disabled:opacity-60 text-[#3d2a00] font-black px-4 sm:px-6 py-2.5 rounded-xl flex items-center gap-2 transition shadow text-sm">
          {t("save_continue_btn")} <ArrowRight size={15} />
        </button>
      </div>
    </>
  );
};

// ─── STEP 4 — Account Setup ───────────────────────────────────────────────────
const Step4 = ({ form, update, onBack, onSubmit, t }) => {
  const [showPw,   setShowPw]   = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);

  const pw = form.password || "";

  const requirements = [
    { label: t("req_min_length"),          met: pw.length >= 8 },
    { label: t("req_uppercase"),            met: /[A-Z]/.test(pw) },
    { label: t("req_lowercase"),            met: /[a-z]/.test(pw) },
    { label: t("req_numeric"),              met: /[0-9]/.test(pw) },
    { label: t("req_special"),              met: /[^A-Za-z0-9]/.test(pw) },
  ];

  const validate = () => {
    const e = {};
    if (!form.username?.trim())   e.username = t("err_username_required");
    else if (form.username.includes(" ")) e.username = t("err_username_no_spaces");
    if (!pw)                      e.password = t("err_password_required");
    else if (pw.length < 8)       e.password = t("err_password_min_length");
    if (!form.confirm)            e.confirm  = t("err_confirm_required");
    else if (pw !== form.confirm) e.confirm  = t("err_confirm_match");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { getDocs, collection, query, where } = await import("firebase/firestore");
      const { db } = await import("../../firebase");

      const nicSnap = await getDocs(query(collection(db, "gn_officers"), where("nic", "==", form.nic.trim())));
      if (!nicSnap.empty) {
        setErrors((p) => ({ ...p, firebase: t("err_nic_already_exists") }));
        setLoading(false); return;
      }

      const emailSnap = await getDocs(query(collection(db, "gn_officers"), where("email", "==", form.email.trim())));
      if (!emailSnap.empty) {
        setErrors((p) => ({ ...p, firebase: t("err_email_already_exists") }));
        setLoading(false); return;
      }

      const credential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(credential.user, { displayName: form.username });
      await setDoc(doc(db, "gn_officers", credential.user.uid), {
        uid: credential.user.uid,
        username: form.username || "",
        fullName: form.fullName || "",
        nic: form.nic || "",
        address: form.address || "",
        dob: form.dob || "",
        gender: form.gender || "",
        mobile: form.mobile || "",
        altMobile: form.altMobile || "",
        email: form.email || "",
        gnDiv: form.gnDiv || "",
        gnCode: form.gnCode || "",
        province: form.province || "",
        district: form.district || "",
        divisionalSecretariat: form.divisionalSecretariat || "",
        officeAddress: form.officeAddress || "",
        officeMobile: form.officeMobile || "",
        officialEmail: form.officialEmail || "",
        appointmentLetter: form.appointmentLetter || "",
        photograph: form.photograph || "",
        photoURL: form.photograph || "",
        nicFront: form.nicFront || "",
        nicBack: form.nicBack || "",
        signature: form.signature || "",
        role: "gn_officer",
        status: "Pending",
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, "users", credential.user.uid), {
        role: "gn_officer",
        email: form.email || "",
        status: "pending",
        createdAt: serverTimestamp(),
      });
      onSubmit();
    } catch (err) {
      const msg = {
        "auth/email-already-in-use": t("err_email_already_in_use"),
        "auth/invalid-email":        t("err_invalid_email"),
        "auth/weak-password":        t("err_weak_password"),
      }[err.code] || err.message;
      setErrors((p) => ({ ...p, firebase: msg }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-lg font-black text-gray-800 mb-6">{t("account_setup_title")}</h2>

      {errors.firebase && (
        <div className="mb-4 bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-sm font-semibold text-red-700 flex items-center gap-2">
          <span>⚠</span> {errors.firebase}
        </div>
      )}

      <Section icon={Lock} title={t("account_credentials_label")}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className={labelClass}>{t("username_label")}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">👤</span>
                <input type="text" value={form.username || ""}
                  onChange={(e) => update("username", e.target.value)}
                  placeholder={t("username_placeholder")}
                  className={`${inputClass} pl-9`} />
              </div>
              <FieldError msg={errors.username} />
            </div>
            <div>
              <label className={labelClass}>{t("password_label")}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
                <input type={showPw ? "text" : "password"} value={form.password || ""}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder={t("password_placeholder")}
                  className={`${inputClass} pl-9 pr-10`} />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <FieldError msg={errors.password} />
            </div>
            <div>
              <label className={labelClass}>{t("confirm_password_label")}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
                <input type={showConf ? "text" : "password"} value={form.confirm || ""}
                  onChange={(e) => update("confirm", e.target.value)}
                  placeholder={t("confirm_password_placeholder")}
                  className={`${inputClass} pl-9 pr-10`} />
                <button type="button" onClick={() => setShowConf((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.confirm && form.confirm === pw && (
                <p className="text-green-600 text-xs mt-1 font-semibold">✓ {t("passwords_match")}</p>
              )}
              <FieldError msg={errors.confirm} />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 h-fit">
            <p className="text-xs font-black text-gray-600 uppercase tracking-wider mb-3">{t("password_requirements_title")}</p>
            <div className="space-y-2.5">
              {requirements.map(({ label, met }) => (
                <div key={label} className="flex items-center gap-2">
                  <CheckCircle2 size={14} className={met ? "text-[#E5A800]" : "text-gray-300"} />
                  <span className={`text-xs font-medium ${met ? "text-gray-700" : "text-gray-400"}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <div className="flex justify-between mt-2">
        <button onClick={onBack}
          className="border-2 border-[#3B1F0A] text-[#3B1F0A] hover:bg-[#3B1F0A] hover:text-white font-bold px-4 sm:px-5 py-2.5 rounded-xl flex items-center gap-1 transition text-sm">
          <ArrowLeft size={15} /> {t("previous_step_btn")}
        </button>
        <button onClick={handleSubmit} disabled={loading}
          className="bg-[#E5A800] hover:bg-[#cc9600] disabled:opacity-60 disabled:cursor-not-allowed text-[#3d2a00] font-black px-4 sm:px-4 py-2.5 rounded-xl flex items-center gap-1 transition shadow text-sm">
          {loading
            ? <><Loader2 size={15} className="animate-spin" /> {t("submitting")}</>
            : <>{t("submit_continue_btn")} <ArrowRight size={15} /></>}
        </button>
      </div>
    </>
  );
};

// ─── Main SignUp ──────────────────────────────────────────────────────────────
const GNSignUp = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    fullName: "", nic: "", address: "", dob: "", gender: "",
    mobile: "", email: "",
    gnDiv: "", gnCode: "", province: "", district: "",
    divisionalSecretariat: "",
    officeAddress: "", officeMobile: "", officialEmail: "",
    appointmentLetter: "", photograph: "", nicFront: "", nicBack: "", signature: "",
    username: "", password: "", confirm: "",
  });

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // Language options (for the header dropdown)
  const languageOptions = [
    { code: "en", label: t("lang_en") },
    { code: "si", label: t("lang_si") },
    { code: "ta", label: t("lang_ta") },
  ];
  const [langOpen, setLangOpen] = useState(false);
  const currentLangLabel = languageOptions.find(l => l.code === i18n.language)?.label || "English";

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0DC]">
      <header className="bg-[#8B4513] text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow">
        <div className="flex items-center gap-2 sm:gap-3">
          <img src="/logo.png" alt={t("app_name")} className="h-8 sm:h-10 w-auto" />
          <div>
            <p className="text-white font-bold text-xs sm:text-sm leading-tight">{t("grama_niladhari")}</p>
            <p className="text-[#E5A800] font-semibold text-[10px] sm:text-xs">{t("portal_label")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 relative">
          {/* Language dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="text-gray-300 text-[10px] sm:text-xs cursor-pointer flex items-center gap-1 hover:text-white transition"
            >
              🌐 {currentLangLabel} ▾
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white text-gray-800 rounded-lg shadow-lg py-1 z-10 min-w-[100px]">
                {languageOptions.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      i18n.changeLanguage(lang.code);
                      setLangOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-xs hover:bg-gray-100 transition ${i18n.language === lang.code ? "font-bold text-[#8B4513]" : ""}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => navigate("/login")}
            className="bg-[#E5A800] text-[#3d2a00] font-bold px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs hover:bg-[#cc9600] transition">
            {t("sign_in_btn")}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <h1 className="text-xl sm:text-2xl font-black text-[#8B4513] mb-1">{t("sign_up_title")}</h1>
        <p className="text-[10px] sm:text-xs text-gray-500 mb-4 sm:mb-5">{t("sign_up_subtitle")}</p>

        <StepTabs current={step} t={t} />

        <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
          {step === 1 && <Step1 form={form} update={update} onNext={() => setStep(2)} t={t} />}
          {step === 2 && <Step2 form={form} update={update} onNext={() => setStep(3)} onBack={() => setStep(1)} t={t} />}
          {step === 3 && <Step3 form={form} update={update} onNext={() => setStep(4)} onBack={() => setStep(2)} t={t} />}
          {step === 4 && <Step4 form={form} update={update} onBack={() => setStep(3)} onSubmit={() => navigate("/login")} t={t} />}
        </div>
      </main>

      <footer className="bg-[#6A2301] text-white text-center py-3 sm:py-3.5 text-[10px] sm:text-xs font-semibold">
        © 2026 {t("app_name")}. {t("all_rights_reserved")}
      </footer>
    </div>
  );
};

export default GNSignUp;