import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, LogIn, Loader2, ArrowLeft } from "lucide-react";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebase";

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [username, setUsername] = useState(
    localStorage.getItem("rememberedUsername") || ""
  );
  const [password, setPassword] = useState("");
  const [rememberUsername, setRememberUsername] = useState(
    localStorage.getItem("rememberedUsername") ? true : false
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputClass =
    "w-full bg-white text-[#1e1200] border-2 border-transparent rounded-xl px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#E5A800] placeholder:text-gray-400";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError(t("err_enter_username"));
      return;
    }
    if (!password) {
      setError(t("err_enter_password"));
      return;
    }

    setLoading(true);

    if (!navigator.onLine) {
      setError(t("err_no_internet"));
      setLoading(false);
      return;
    }

    try {
      let userEmail = username.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username.trim());

      let gnOfficerData = null;

      if (!isEmail) {
        try {
          // 1️ Try gn_officers first
          const gnQuery = query(
            collection(db, "gn_officers"),
            where("username", "==", username.trim())
          );
          const gnSnapshot = await getDocs(gnQuery);

          if (!gnSnapshot.empty) {
            gnOfficerData = gnSnapshot.docs[0].data();
            userEmail = gnOfficerData.email;

            const officerStatus = gnOfficerData.status;
            if (officerStatus === "Pending") {
              navigate("/gn-account-pending", { replace: true });
              return;
            } else if (officerStatus === "Rejected") {
              navigate("/gn-account-rejected", { replace: true });
              return;
            }
          } else {
            // 2️ Try users collection for citizens
            const citizenQuery = query(
              collection(db, "users"),
              where("username", "==", username.trim()),
              where("role", "==", "citizen")
            );
            const citizenSnapshot = await getDocs(citizenQuery);

            if (!citizenSnapshot.empty) {
              userEmail = citizenSnapshot.docs[0].data().email;
            } else {
              setError(t("err_no_account"));
              setLoading(false);
              return;
            }
          }
        } catch (firestoreErr) {
          if (
            firestoreErr.code === "unavailable" ||
            firestoreErr.message?.includes("network") ||
            !navigator.onLine
          ) {
            setError(t("err_no_internet"));
          } else {
            setError(t("err_network_fail"));
          }
          setLoading(false);
          return;
        }
      }

      // Login with resolved email + password
      const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
      const user = userCredential.user;

      const userRoleDoc = await getDoc(doc(db, "users", user.uid));

      if (userRoleDoc.exists()) {
        const role = userRoleDoc.data().role;
        if (role === "admin") {
          navigate("/admin/dashboard");
        } else if (role === "gn_officer") {
          await updateDoc(doc(db, "gn_officers", user.uid), {
            lastLogin: serverTimestamp(),
          });
          navigate("/gn-dashboard");
        } else if (role === "citizen") {
          navigate("/dashboard");
        } else {
          setError(t("err_unknown_role"));
        }
      } else {
        setError(t("err_no_role"));
      }

      await setPersistence(auth, browserSessionPersistence);

      if (rememberUsername) {
        localStorage.setItem("rememberedUsername", username.trim());
      } else {
        localStorage.removeItem("rememberedUsername");
      }

    } catch (err) {
      if (!navigator.onLine || err.code === "unavailable") {
        setError(t("err_no_internet"));
      } else {
        switch (err.code) {
          case "auth/invalid-email":
            setError(t("err_invalid_email"));
            break;
          case "auth/user-not-found":
            setError(t("err_user_not_found"));
            break;
          case "auth/wrong-password":
            setError(t("err_wrong_password"));
            break;
          case "auth/too-many-requests":
            setError(t("err_too_many_requests"));
            break;
          default:
            setError(t("err_default_creds"));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">

      {/* Background */}
      <div className="flex-1 relative flex flex-col"
        style={{ backgroundImage: "url(/background.jpg)", backgroundSize: "cover", backgroundPosition: "center" }}>

        {/* Overlay */}
        <div className="absolute inset-0 bg-white/60 pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 p-5">
          <img src="/logo2.png" alt="Smart Grama Sewa" className="h-24 w-auto" />
          {/* Back Button */}
          <Link 
            to="/" 
            className="relative group inline-flex items-center justify-center text-[#6A2301] bg-white/60 w-10 h-10 rounded-full transition shadow-sm hover:bg-white hover:shadow-md"
          >
            <ArrowLeft size={20} />
            
            {/* Tooltip */}
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap bg-[#6A2301] text-white text-xs font-semibold px-3 py-1 rounded-full">
              {t("back to home")}
            </span>
          </Link>
        </div>

        {/* Centered Card */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-12">

          <h1 className="text-5xl font-black text-[#332421] tracking-tight mb-7">{t("signin_header")}</h1>

          <div className="w-full max-w-md rounded-3xl p-8 shadow-2xl"
            style={{ backgroundColor: "rgba(106, 35, 1, 0.6)" }}>

            {/* ── Pending Screen ── */}
            {error === "pending" && (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">⏳</div>
                <p className="text-[#fdf0dc] font-black text-lg mb-2">{t("pending_title")}</p>
                <p className="text-[#fdf0dc] text-sm mb-4">{t("pending_desc")}</p>
                <button onClick={() => setError("")}
                  className="text-xs text-[#fdf0dc] underline hover:text-white transition">
                  ← {t("try_again")}
                </button>
              </div>
            )}

            {/*  Rejected Screen  */}
            {error === "rejected" && (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">❌</div>
                <p className="text-[#fdf0dc] font-black text-lg mb-2">{t("rejected_title")}</p>
                <p className="text-[#fdf0dc] text-sm mb-4">{t("rejected_desc")}</p>
                <button onClick={() => setError("")}
                  className="text-xs text-[#fdf0dc] underline hover:text-white transition">
                  ← {t("try_again")}
                </button>
              </div>
            )}

            {/* ── Login Form — hidden when pending/rejected ── */}
            {error !== "pending" && error !== "rejected" && (
              <>
                {/* Normal Error */}
                {error && (
                  <div className="mb-5 bg-white/15 rounded-xl px-4 py-3 text-[#fde8c8] text-sm font-semibold flex items-center gap-2">
                    <span>⚠</span> {error}
                  </div>
                )}

                {/* Username */}
                <div className="mb-4">
                  <label className="block text-[#fdf0dc] text-xs font-bold mb-1.5 uppercase tracking-wide">
                    {t("username_or_email")}
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(""); }}
                    autoComplete="username"
                    placeholder={t("signin_username_placeholder")}
                    className={inputClass}
                  />
                </div>

                {/* Password */}
                <div className="mb-4">
                  <label className="block text-[#fdf0dc] text-xs font-bold mb-1.5 uppercase tracking-wide">
                    {t("password")}
                  </label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      autoComplete="current-password"
                      placeholder={t("signin_password_placeholder")}
                      className={`${inputClass} pr-11`} />
                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between mb-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-semibold text-[#fdf0dc]">
                    <input
                      type="checkbox"
                      checked={rememberUsername}
                      onChange={(e) => setRememberUsername(e.target.checked)}
                      className="w-4 h-4 rounded cursor-pointer accent-[#E5A800]"
                    />
                    {t("remember_username")}
                  </label>
                  <a href="/gn-forgot-password" className="text-sm font-bold text-[#fdf0dc] hover:text-white transition">
                    {t("forgot_password")}
                  </a>
                </div>

                {/* Sign In Button */}
                <button onClick={handleSubmit} disabled={loading}
                  className="w-full bg-[#3B1F0A] hover:bg-[#2a1506] disabled:opacity-60 disabled:cursor-not-allowed text-[#E5A800] font-black text-base py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg mb-5">
                  {loading
                    ? <><Loader2 size={18} className="animate-spin" /> {t("signing_in")}</>
                    : <><LogIn size={18} /> {t("signin_header")}</>
                  }
                </button>

                {/* New here */}
                <p className="text-center text-[#fdf0dc] text-sm font-semibold mb-4">{t("new_here")}</p>

                <Link
                  to="/signup-select"
                  className="block w-full text-center bg-[#E5A800] hover:bg-[#cc9600] text-[#3d2a00] font-black text-base py-3.5 rounded-xl transition shadow-lg"
                >
                  {t("create_your_account")}
                </Link>
              </>
            )}

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#6A2301] text-white text-center py-3.5 text-sm font-semibold">
        © 2026 Smart Grama Sewa. All rights reserved.
      </footer>

    </div>
  );
};

export default Login;