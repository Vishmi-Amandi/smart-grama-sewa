import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Phone, MapPin, BadgeCheck, Building2, Eye, EyeOff, Lock, CheckCircle2, Loader2 } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";


// ─── Shared Styles ────────────────────────────────────────────────────────────
const inputClass =
  "w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 bg-white outline-none transition focus:border-[#E5A800] placeholder:text-gray-400";

const selectClass =
  "w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 bg-white outline-none transition focus:border-[#E5A800] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

const labelClass = "block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide";

const FieldError = ({ msg }) =>
  msg ? <p className="text-red-500 text-xs mt-1 font-medium">{msg}</p> : null;

// ─── District → DS Division Map ───────────────────────────────────────────────
const DISTRICT_DS_MAP = {
  Colombo:  ["Colombo","Dehiwala","Homagama","Kaduwela","Kesbewa","Kolonnawa","Kotte","Maharagama","Moratuwa","Padukka","Seethawaka","Thimbirigasyaya"],
  Gampaha:  ["Attanagalla","Biyagama","Divulapitiya","Dompe","Gampaha","Ja-Ela","Katana","Kelaniya","Mahara","Minuwangoda","Mirigama","Negombo","Wattala"],
  Kalutara: ["Agalawatta","Bandaragama","Beruwala","Bulathsinhala","Dodangoda","Horana","Ingiriya","Kalutara","Mathugama","Millaniya","Palindanuwara","Panadura","Walallawita"],
  Kandy:    ["Akurana","Delthota","Doluwa","Harispattuwa","Hatharaliyadda","Kandy","Kundasale","Medadumbara","Minipe","Panvila","Pasbage Korale","Pathadumbara","Pathahewaheta","Poojapitiya","Thumpane","Udadumbara","Udapalatha"],
  Matale:   ["Ambanganga Korale","Dambulla","Galewela","Laggala-Pallegama","Matale","Naula","Pallepola","Rattota","Ukuwela","Wilgamuwa","Yatawatta"],
  "Nuwara Eliya": ["Ambagamuwa","Hanguranketha","Kotmale","Nuwara Eliya","Walapane"],
  Galle:    ["Akmeemana","Ambalangoda","Balapitiya","Baddegama","Benthota","Elpitiya","Galle","Hikkaduwa","Imaduwa","Karandeniya","Nagoda","Neluwa","Niyagama"],
  Matara:   ["Akuressa","Athuraliya","Devinuwara","Dickwella","Hakmana","Kamburupitiya","Kotapola","Malimbada","Matara","Mulatiyana","Pasgoda","Pitabeddara","Weligama"],
  Hambantota: ["Ambalantota","Angunakolapelessa","Beliatta","Hambantota","Katuwana","Lunugamvehera","Sooriyawewa","Tangalle","Thissamaharama","Weeraketiya","Walasmulla"],
  Kurunegala: ["Alawwa","Ambanpola","Bingiriya","Dodangaslanda","Galgamuwa","Ganewatta","Ibbagamuwa","Kuliyapitiya East","Kuliyapitiya West","Kurunegala","Mahawa","Narammala","Nikaweratiya","Pannala","Polgahawela","Polpithigama","Wariyapola"],
  Puttalam:   ["Anamaduwa","Arachchikattuwa","Chilaw","Dankotuwa","Kalpitiya","Mundel","Nattandiya","Nawagattegama","Pallama","Puttalam","Wennappuwa"],
  Anuradhapura: ["Eppawala","Galnewa","Horowupotana","Kahatagasdigiliya","Kebithigollewa","Kekirawa","Mahavilachchiya","Medawachchiya","Mihintale","Nochchiyagama","Padaviya","Rajanganaya","Thalawa","Thambuththegama","Thirappane"],
  Polonnaruwa:  ["Dimbulagala","Elahera","Hingurakgoda","Medirigiriya","Polonnaruwa","Thamankaduwa","Welikanda"],
  Badulla:      ["Badulla","Bandarawela","Ella","Hali-Ela","Haputale","Kandaketiya","Lunugala","Mahiyanganaya","Meegahakivula","Passara","Ridimaliyadda","Soranathota","Welimada"],
  Moneragala:   ["Bibile","Buttala","Katharagama","Madulla","Medagama","Moneragala","Siyambalanduwa","Thanamalvila","Wellawaya"],
  Ratnapura:    ["Ayagama","Balangoda","Eheliyagoda","Elapatha","Embilipitiya","Godakawela","Kahawatta","Kalawana","Kiriella","Kolonna","Kuruvita","Nivithigala","Ratnapura","Weligepola"],
  Kegalle:      ["Aranayaka","Bulathkohupitiya","Deraniyagala","Dehiovita","Galigamuwa","Kegalle","Mawanella","Rambukkana","Ruwanwella","Warakapola","Yatiyanthota"],
  Trincomalee:  ["Kantalai","Kinniya","Kuchchaveli","Morawewa","Muttur","Seruwila","Thambalagamuwa","Trincomalee","Verugal"],
  Batticaloa:   ["Eravur Pattu","Eravur Town","Kattankudy","Koralai Pattu","Koralai Pattu North","Koralai Pattu South","Manmunai North","Manmunai West","Porativu Pattu"],
  Ampara:       ["Addalaichenai","Akkaraipattu","Ampara","Damana","Dehiattakandiya","Kalmunai","Lahugala","Mahaoya","Nintavur","Pothuvil","Samanthurai","Thirukovil","Uhana"],
  Jaffna:       ["Delft","Island North","Island South","Jaffna","Karainagar","Nallur","Thenmaradchi","Vadamaradchi East","Vadamaradchi North","Valikamam East","Valikamam North","Valikamam South","Valikamam West"],
  Vavuniya:     ["Vavuniya","Vavuniya North","Vavuniya South","Vengalacheddikulam"],
  Mannar:       ["Madhu","Mannar","Musalai","Nanaddan"],
  Mullaitivu:   ["Maritimepattu","Oddusuddan","Puthukudiyiruppu","Thunukkai","Welioya"],
  Kilinochchi:  ["Kandawalai","Karachchi","Pachchilaipalli","Poonakary"],
};

// ─── Step Tabs ────────────────────────────────────────────────────────────────
const STEPS = ["Personal Info", "Official Details", "Document Upload", "Account Setup"];

const StepTabs = ({ current }) => (
  <div className="flex border-b border-gray-200 mb-6">
    {STEPS.map((label, i) => {
      const idx = i + 1;
      const isActive = current === idx;
      const isDone = current > idx;
      return (
        <div key={idx} className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap
          ${isActive ? "border-[#8B4513] text-[#8B4513]" : "border-transparent text-gray-400"}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black
            ${isActive ? "bg-[#8B4513] text-white" : isDone ? "bg-[#8B4513] text-white" : "bg-gray-200 text-gray-500"}`}>
            {isDone ? "✓" : idx}
          </span>
          {label}
        </div>
      );
    })}
  </div>
);

// ─── Section Card ─────────────────────────────────────────────────────────────
const Section = ({ icon: Icon, title, children }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3">
      <Icon size={15} className="text-[#8B4513]" />
      <h3 className="text-sm font-bold text-gray-700">{title}</h3>
    </div>
    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
      {children}
    </div>
  </div>
);

// ─── STEP 1 — Personal Information ───────────────────────────────────────────
const Step1 = ({ form, update, onNext }) => {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required.";
    if (!form.nic.trim())      e.nic = "NIC is required.";
    else if (!/^(\d{9}[VvXx]|\d{12})$/.test(form.nic.trim())) e.nic = "Enter a valid NIC.";
    if(!form.address.trim())   e.address= "Permanent address is required";
    if (!form.dob)             e.dob = "Date of birth is required.";
    if (!form.gender)          e.gender = "Gender is required.";
    if (!form.mobile.trim())   e.mobile = "Mobile number is required.";
    else if (!/^\d{10}$/.test(form.mobile.trim())) e.mobile = "Enter a valid mobile number (10 digits).";
    if (!form.email.trim())    e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <>
      <h2 className="text-lg font-black text-gray-800 mb-6">Personal Information</h2>

      <Section icon={BadgeCheck} title="Identification Details">
        <div className="mb-4">
          <label className={labelClass}>Full Name</label>
          <input type="text" value={form.fullName} onChange={(e) => update("fullName", e.target.value)}
            placeholder="Enter your full legal name" className={inputClass} />
          <FieldError msg={errors.fullName} />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>Permanent Address</label>
            <input type="text" value={form.address} onChange={(e) => update("address", e.target.value)}
              placeholder="No. 45, Main Street, Colombo 07" className={inputClass} />
              <FieldError msg={errors.address} />
          </div>
          <div>
            <label className={labelClass}>NIC Number</label>
            <input type="text" value={form.nic} onChange={(e) => update("nic", e.target.value)}
              placeholder="984521369V or 199845213690" className={inputClass} />
            <FieldError msg={errors.nic} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Date of Birth</label>
            <input type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} className={inputClass} />
            <FieldError msg={errors.dob} />
          </div>
          <div>
            <label className={labelClass}>Gender</label>
            <select value={form.gender} onChange={(e) => update("gender", e.target.value)} className={selectClass}>
              <option value="">Select…</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <FieldError msg={errors.gender} />
          </div>
        </div>
      </Section>

      <Section icon={Phone} title="Contact Details">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>Mobile Number</label>
            <input type="tel" value={form.mobile} onChange={(e) => update("mobile", e.target.value)}
              placeholder="e.g. 071 123 4567" className={inputClass} />
            <FieldError msg={errors.mobile} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Email Address</label>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
            placeholder="yourname@email.com" className={inputClass} />
          <FieldError msg={errors.email} />
        </div>
      </Section>

      <div className="flex justify-end mt-2">
        <button onClick={() => { if (validate()) onNext(); }}
          className="bg-[#E5A800] hover:bg-[#cc9600] text-[#3d2a00] font-black px-6 py-2.5 rounded-xl flex items-center gap-2 transition shadow text-sm">
          Next Step <ArrowRight size={15} />
        </button>
      </div>
    </>
  );
};

// ─── STEP 2 — Official Details ────────────────────────────────────────────────
const Step2 = ({ form, update, onNext, onBack }) => {
  const [errors, setErrors] = useState({});

  const dsDivisions = form.district ? (DISTRICT_DS_MAP[form.district] || []) : [];
  const handleDistrictChange = (val) => { update("district", val); update("divisionalSecretariat", ""); update("gnDivision", ""); };
  const handleDsChange = (val) => { update("divisionalSecretariat", val); update("gnDivision", ""); };

  const validate = () => {
    const e = {};
    if (!form.gnDivisionName.trim())  e.gnDivisionName = "GN Division name is required.";
    if (!form.gnCode.trim())   e.gnCode = "Gn Code is required.";
    if (!form.province)               e.province = "Province is required.";
    if (!form.district)               e.district = "Please select a district.";
    if (!form.divisionalSecretariat)  e.divisionalSecretariat = "Please select a DS Division.";
    if (!form.officeAddress.trim())   e.officeAddress = "Office address is required.";
    if (!form.officeMobile.trim())    e.officeMobile = "Office mobile is required.";
    else if (!/^\d{10}$/.test(form.officeMobile.trim())) e.officeMobile = "Enter a valid mobile number (10 digits).";
    if (!form.officialEmail.trim())   e.officialEmail = "Official email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.officialEmail)) e.officialEmail = "Enter a valid email.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <>
      <h2 className="text-lg font-black text-gray-800 mb-6">Official Details</h2>

      <Section icon={Building2} title="Grama Niladhari (GN) Division Details">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>GN Division Name</label>
            <input type="text" value={form.gnDivisionName} onChange={(e) => update("gnDivisionName", e.target.value)}
              placeholder="e.g. Colombo Fort East" className={inputClass} />
            <FieldError msg={errors.gnDivisionName} />
          </div>
          <div>
            <label className={labelClass}>GN Code</label>
            <input type="text" value={form.gnCode} onChange={(e) => update("gnCode", e.target.value)}
              placeholder="e.g. A123" className={inputClass} />
            <FieldError msg={errors.gnCode} />
          </div>
        </div>
      </Section>

      <Section icon={MapPin} title="Administrative Area">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>Province</label>
            <select value={form.province} onChange={(e) => update("province", e.target.value)} className={selectClass}>
              <option value="">Select Province…</option>
              {["Western","Central","Southern","Northern","Eastern","North Western","North Central","Uva","Sabaragamuwa"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <FieldError msg={errors.province} />
          </div>
          <div>
            <label className={labelClass}>District</label>
            <select value={form.district} onChange={(e) => handleDistrictChange(e.target.value)} className={selectClass}>
              <option value="">Select District…</option>
              {Object.keys(DISTRICT_DS_MAP).sort().map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <FieldError msg={errors.district} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Divisional Secretariat</label>
            <select value={form.divisionalSecretariat} onChange={(e) => handleDsChange(e.target.value)}
              disabled={!form.district} className={selectClass}>
              <option value="">{form.district ? "Select DS Division…" : "Select District first"}</option>
              {dsDivisions.map((ds) => <option key={ds} value={ds}>{ds}</option>)}
            </select>
            <FieldError msg={errors.divisionalSecretariat} />
          </div>
        </div>
      </Section>

      <Section icon={Phone} title="Office Contact Details">
        <div className="mb-4">
          <label className={labelClass}>Office Address</label>
          <textarea value={form.officeAddress} onChange={(e) => update("officeAddress", e.target.value)}
            placeholder="Enter full office address..." rows={3} className={`${inputClass} resize-none`} />
          <FieldError msg={errors.officeAddress} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Office Mobile No.</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📞</span>
              <input type="tel" value={form.officeMobile} onChange={(e) => update("officeMobile", e.target.value)}
                placeholder="+94 11 234 5678" className={`${inputClass} pl-9`} />
            </div>
            <FieldError msg={errors.officeMobile} />
          </div>
          <div>
            <label className={labelClass}>Official Email Address</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">✉</span>
              <input type="email" value={form.officialEmail} onChange={(e) => update("officialEmail", e.target.value)}
                placeholder="office@gramasewa.gov.lk" className={`${inputClass} pl-9`} />
            </div>
            <FieldError msg={errors.officialEmail} />
          </div>
        </div>
      </Section>
      <div className="grid grid-cols-2 gap-4 mt-4">
</div>



      <div className="flex justify-between mt-2">
        <button onClick={onBack}
          className="border-2 border-[#3B1F0A] text-[#3B1F0A] hover:bg-[#3B1F0A] hover:text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition text-sm">
          <ArrowLeft size={15} /> Previous Step
        </button>
        <button onClick={() => { if (validate()) onNext(); }}
          className="bg-[#E5A800] hover:bg-[#cc9600] text-[#3d2a00] font-black px-6 py-2.5 rounded-xl flex items-center gap-2 transition shadow text-sm">
          Save & Continue <ArrowRight size={15} />
        </button>
      </div>
    </>
  );
};

// ─── STEP 3 — Document Upload ─────────────────────────────────────────────────
const Step3 = ({ form, update, onNext, onBack }) => {
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState({});

  const requiredFields = [
    { fieldName: "appointmentLetter", label: "Appointment Letter" },
    { fieldName: "photograph", label: "Recent Photograph" },
    { fieldName: "nicFront", label: "NIC Front Side" },
    { fieldName: "nicBack", label: "NIC Back Side" },
    { fieldName: "signature", label: "Signature" },
  ];

  const handleUpload = async (file, fieldName) => {
    if (!file) return;

    // Set uploading only for this specific field
    setUploadProgress((prev) => ({ ...prev, [fieldName]: "uploading" }));
    setErrors((prev) => ({ ...prev, [fieldName]: false }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "gn_documents");
      formData.append("cloud_name", "dsi9xh1fd");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dsi9xh1fd/auto/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        update(fieldName, data.secure_url);
        setUploadProgress((prev) => ({ ...prev, [fieldName]: "done" }));
      } else {
        console.error("Upload failed:", data);
        setUploadProgress((prev) => ({ ...prev, [fieldName]: "error" }));
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadProgress((prev) => ({ ...prev, [fieldName]: "error" }));
    }
  };

  const handleNext = () => {
    const newErrors = {};
    requiredFields.forEach(({ fieldName }) => {
      if (uploadProgress[fieldName] !== "done") {
        newErrors[fieldName] = true;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext();
  };

  // True only if at least one field is currently uploading
  const isAnyUploading = Object.values(uploadProgress).some((v) => v === "uploading");

  const DocumentBox = ({ label, fieldName }) => {
    const status = uploadProgress[fieldName]; // "uploading" | "done" | "error" | undefined

    return (
      <div className="flex flex-col gap-2">
        <label className={labelClass}>{label}</label>
        <label
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition
            ${
              errors[fieldName]
                ? "border-red-400 bg-red-50"
                : status === "done"
                ? "border-green-400 bg-green-50"
                : status === "uploading"
                ? "border-yellow-300 bg-yellow-50"
                : "border-gray-200 bg-white hover:border-[#E5A800]"
            }`}
        >
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            disabled={status === "uploading"}
            onChange={(e) => handleUpload(e.target.files[0], fieldName)}
          />

          {status === "done" && (
            <>
              <span className="text-3xl mb-2">✅</span>
              <p className="text-xs font-semibold text-green-600">Uploaded successfully!</p>
              <p className="text-xs text-gray-400 mt-1">Click to replace</p>
            </>
          )}

          {status === "uploading" && (
            <>
              <span className="text-3xl mb-2">⏳</span>
              <p className="text-xs font-semibold text-yellow-600">Uploading...</p>
            </>
          )}

          {status === "error" && (
            <>
              <span className="text-3xl mb-2">❌</span>
              <p className="text-xs font-semibold text-red-500">Upload failed. Click to retry</p>
            </>
          )}

          {!status && (
            <>
              <span className="text-3xl mb-2">{errors[fieldName] ? "⚠️" : "📄"}</span>
              <p className={`text-xs font-semibold text-center ${errors[fieldName] ? "text-red-500" : "text-gray-600"}`}>
                {errors[fieldName] ? "This document is required" : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-gray-400 mt-1 text-center">PNG, JPG or PDF (Max. 5MB)</p>
            </>
          )}
        </label>

        {errors[fieldName] && (
          <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
            ⚠️ Please upload your {label}
          </p>
        )}
      </div>
    );
  };

  const missingDocs = requiredFields.filter(({ fieldName }) => uploadProgress[fieldName] !== "done");

  return (
    <>
      <h2 className="text-lg font-black text-gray-800 mb-6">Document Upload</h2>

      {isAnyUploading && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm font-semibold text-yellow-700 flex items-center gap-2">
          ⏳ Uploading document... please wait
        </div>
      )}

      {Object.keys(errors).length > 0 && missingDocs.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-sm text-red-700">
          <p className="font-bold mb-1">⚠️ Please upload the following documents before continuing:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {missingDocs.map(({ label }) => (
              <li key={label} className="text-xs font-medium">{label}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <DocumentBox label="Appointment Letter" fieldName="appointmentLetter" />
        <DocumentBox label="Recent Photograph" fieldName="photograph" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <DocumentBox label="NIC Front Side" fieldName="nicFront" />
        <DocumentBox label="NIC Back Side" fieldName="nicBack" />
      </div>

      <div className="mb-6">
        <DocumentBox label="Signature" fieldName="signature" />
      </div>

      <div className="flex justify-between mt-2">
        <button
          onClick={onBack}
          className="border-2 border-[#3B1F0A] text-[#3B1F0A] hover:bg-[#3B1F0A] hover:text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition text-sm"
        >
          <ArrowLeft size={15} /> Previous Step
        </button>
        <button
          onClick={handleNext}
          disabled={isAnyUploading}
          className="bg-[#E5A800] hover:bg-[#cc9600] disabled:opacity-60 text-[#3d2a00] font-black px-6 py-2.5 rounded-xl flex items-center gap-2 transition shadow text-sm"
        >
          Save & Continue <ArrowRight size={15} />
        </button>
      </div>
    </>
  );
};
// ─── STEP 4 — Account Setup ───────────────────────────────────────────────────
const Step4 = ({ form, update, onBack, onSubmit }) => {
  const [showPw,   setShowPw]   = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);

  const pw = form.password || "";

  const requirements = [
    { label: "At least 8 characters long",                   met: pw.length >= 8 },
    { label: "Include at least one uppercase letter (A-Z)",  met: /[A-Z]/.test(pw) },
    { label: "Include at least one lowercase letter (a-z)",  met: /[a-z]/.test(pw) },
    { label: "Include at least one numeric digit (0-9)",     met: /[0-9]/.test(pw) },
    { label: "Include one special character (@#$%-&!)",      met: /[^A-Za-z0-9]/.test(pw) },
  ];

  const validate = () => {
    const e = {};
    if (!form.username?.trim()) e.username = "Username is required.";
    if (!pw)                    e.password = "Password is required.";
    else if (pw.length < 8)     e.password = "Password must be at least 8 characters.";
    if (!form.confirm)          e.confirm  = "Please confirm your password.";
    else if (pw !== form.confirm) e.confirm = "Passwords don't match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(credential.user, { displayName: form.username });
      await setDoc(doc(db, "gn_officers", credential.user.uid), {
  uid: credential.user.uid,
  username: form.username || "",
  fullName: form.fullName || "",
  nic: form.nic || "",
  address: form.address || "",
  dob: form.dob || "",
  tribeType: form.tribeType || "",
  gender: form.gender || "",
  mobile: form.mobile || "",
  altMobile: form.altMobile || "",
  email: form.email || "",
  gnDivisionName: form.gnDivisionName || "",
  gnCode: form.gnCode || "",
  province: form.province || "",
  district: form.district || "",
  divisionalSecretariat: form.divisionalSecretariat || "",
  gnDivision: form.gnDivision || "",
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
  createdAt: serverTimestamp(),
});
await setDoc(doc(db, "users", credential.user.uid), {
  role: "gn_officer",
  email: form.email || "",
  status:    "pending",
  createdAt: serverTimestamp(),
});
    
      onSubmit();
    } catch (err) {
      const msg = {
        "auth/email-already-in-use": "This email is already registered.",
        "auth/invalid-email":        "The email address is not valid.",
        "auth/weak-password":        "Password is too weak.",
      }[err.code] || err.message;
      setErrors((p) => ({ ...p, firebase: msg }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-lg font-black text-gray-800 mb-6">Account Setup</h2>

      {errors.firebase && (
        <div className="mb-4 bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-sm font-semibold text-red-700 flex items-center gap-2">
          <span>⚠</span> {errors.firebase}
        </div>
      )}

      <Section icon={Lock} title="Account Credentials">
        <div className="grid grid-cols-2 gap-6">

          {/* Left — input fields */}
          <div className="space-y-4">
            <div>
  <label className={labelClass}>Username</label>
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">👤</span>
    <input type="text" value={form.username || ""}
      onChange={(e) => update("username", e.target.value)}
      placeholder="Choose a unique username"
      className={`${inputClass} pl-9`} />
  </div>
  <FieldError msg={errors.username} />
</div>

            <div>
              <label className={labelClass}>Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
                <input type={showPw ? "text" : "password"} value={form.password || ""}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Create a strong password"
                  className={`${inputClass} pl-9 pr-10`} />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <FieldError msg={errors.password} />
            </div>

            <div>
              <label className={labelClass}>Confirm Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
                <input type={showConf ? "text" : "password"} value={form.confirm || ""}
                  onChange={(e) => update("confirm", e.target.value)}
                  placeholder="Repeat your password"
                  className={`${inputClass} pl-9 pr-10`} />
                <button type="button" onClick={() => setShowConf((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.confirm && form.confirm === pw && (
                <p className="text-green-600 text-xs mt-1 font-semibold">✓ Passwords match</p>
              )}
              <FieldError msg={errors.confirm} />
            </div>
          </div>

          {/* Right — password requirements */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 h-fit">
            <p className="text-xs font-black text-gray-600 uppercase tracking-wider mb-3">
              Password Requirements
            </p>
            <div className="space-y-2.5">
              {requirements.map(({ label, met }) => (
                <div key={label} className="flex items-center gap-2">
                  <CheckCircle2 size={14} className={met ? "text-[#E5A800]" : "text-gray-300"} />
                  <span className={`text-xs font-medium ${met ? "text-gray-700" : "text-gray-400"}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </Section>

      <div className="flex justify-between mt-2">
        <button onClick={onBack}
          className="border-2 border-[#3B1F0A] text-[#3B1F0A] hover:bg-[#3B1F0A] hover:text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition text-sm">
          <ArrowLeft size={15} /> Previous Step
        </button>
        <button onClick={handleSubmit} disabled={loading}
          className="bg-[#E5A800] hover:bg-[#cc9600] disabled:opacity-60 disabled:cursor-not-allowed text-[#3d2a00] font-black px-6 py-2.5 rounded-xl flex items-center gap-2 transition shadow text-sm">
          {loading
            ? <><Loader2 size={15} className="animate-spin" /> Submitting…</>
            : <>Submit and Continue <ArrowRight size={15} /></>}
        </button>
      </div>
    </>
  );
};

// ─── Main SignUp ──────────────────────────────────────────────────────────────
const GNSignUp = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    fullName: "", nic: "", address: "", dob: "", gender: "",
    mobile: "", email: "",
    gnDivisionName: "", gnCode: "", province: "", district: "",
    divisionalSecretariat: "",
    officeAddress: "", officeMobile: "", officialEmail: "",
    appointmentLetter: "", photograph: "", nicFront: "", nicBack: "", signature: "",
    username: "", password: "", confirm: "",
  });

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0DC]">

      <header className="bg-[#8B4513] text-white px-6 py-3 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="logo" className="h-10 w-auto" />
          <div>
            <p className="text-white font-bold text-sm leading-tight">Grama Niladhari</p>
            <p className="text-[#E5A800] font-semibold text-xs">Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-300 text-xs cursor-pointer">🌐 English ▾</span>
          <button onClick={() => navigate("/gn-login")}
            className="bg-[#E5A800] text-[#3d2a00] font-bold px-4 py-1.5 rounded-lg text-xs hover:bg-[#cc9600] transition">
            Sign In
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-[#8B4513] mb-1">Sign Up</h1>
        <p className="text-xs text-gray-500 mb-5">Register as a Grama Niladhari Officer</p>

        <StepTabs current={step} />

        <div className="bg-white rounded-2xl shadow p-6">
          {step === 1 && <Step1 form={form} update={update} onNext={() => setStep(2)} />}
          {step === 2 && <Step2 form={form} update={update} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <Step3 form={form} update={update} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
          {step === 4 && <Step4 form={form} update={update} onBack={() => setStep(3)} onSubmit={() => navigate("/login")} />}
        </div>
      </main>

      <footer className="bg-[#6A2301] text-white text-center py-3.5 text-xs font-semibold">
        © 2026 Smart Grama Sewa. All rights reserved.
      </footer>

    </div>
  );
};

export default GNSignUp;