import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebase";

const GNLogin = () => {
  const [username, setUsername] = useState("");
  const [password,     setPassword]     = useState("");
  const [rememberMe,   setRememberMe]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  const navigate = useNavigate();

  const inputClass =
    "w-full bg-white text-[#1e1200] border-2 border-transparent rounded-xl px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#E5A800] placeholder:text-gray-400";

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  if (!username.trim()) { setError("Please enter your username."); return; }
  if (!password)        { setError("Please enter your password."); return; }

  setLoading(true);
  try {
    // Find officer by username
    const q    = query(collection(db, "gn_officers"), where("username", "==", username.trim()));
    const snap = await getDocs(q);

    if (snap.empty) {
      setError("No account found with this username.");
      setLoading(false);
      return;
    }

    const officerData = snap.docs[0].data();
    const email       = officerData.email;

    // Check approval status
    if (officerData.status === "pending") {
      setError("pending");
      setLoading(false);
      return;
    }

    if (officerData.status === "rejected") {
      setError("rejected");
      setLoading(false);
      return;
    }

    // ✅ Set persistence BEFORE signing in based on rememberMe checkbox
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

    await signInWithEmailAndPassword(auth, email, password);
    navigate("/gn-dashboard");

  } catch (err) {
    switch (err.code) {
      case "auth/wrong-password":    setError("Incorrect password.");                 break;
      case "auth/too-many-requests": setError("Too many attempts. Try again later."); break;
      default:                       setError("Incorrect credentials. Please try again.");
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
          <img src="/logo.png" alt="Smart Grama Sewa" className="h-24 w-auto" />
        </div>

        {/* Centered Card */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-12">

          <h1 className="text-5xl font-black text-[#332421] tracking-tight mb-7">Sign in</h1>

          <div className="w-full max-w-md rounded-3xl p-8 shadow-2xl"
            style={{ backgroundColor: "rgba(106, 35, 1, 0.6)" }}>

            {/* ── Pending Screen ── */}
            {error === "pending" && (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">⏳</div>
                <p className="text-[#fdf0dc] font-black text-lg mb-2">Account Pending Approval</p>
                <p className="text-[#fdf0dc] text-sm mb-4">
                  Your account is awaiting admin approval. You will be able to log in once approved.
                </p>
                <button onClick={() => setError("")}
                  className="text-xs text-[#fdf0dc] underline hover:text-white transition">
                  ← Try again
                </button>
              </div>
            )}

            {/* ── Rejected Screen ── */}
            {error === "rejected" && (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">❌</div>
                <p className="text-[#fdf0dc] font-black text-lg mb-2">Account Rejected</p>
                <p className="text-[#fdf0dc] text-sm mb-4">
                  Your account request was rejected. Please contact the administrator.
                </p>
                <button onClick={() => setError("")}
                  className="text-xs text-[#fdf0dc] underline hover:text-white transition">
                  ← Try again
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
                    Username
                  </label>
                  
<input type="text" value={username}
  onChange={(e) => { setUsername(e.target.value); setError(""); }}
  placeholder="Enter your username"
  className={inputClass} />
                </div>

                {/* Password */}
                <div className="mb-4">
                  <label className="block text-[#fdf0dc] text-xs font-bold mb-1.5 uppercase tracking-wide">
                    Password
                  </label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      autoComplete="current-password"
                      placeholder="Enter your password"
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
                    <input type="checkbox" checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded cursor-pointer accent-[#E5A800]" />
                    Keep me signed in
                  </label>
                  <a href="/gn-forgot-password" className="text-sm font-bold text-[#fdf0dc] hover:text-white transition">
                    Forgot password?
                  </a>
                </div>

                {/* Sign In Button */}
                <button onClick={handleSubmit} disabled={loading}
                  className="w-full bg-[#3B1F0A] hover:bg-[#2a1506] disabled:opacity-60 disabled:cursor-not-allowed text-[#E5A800] font-black text-base py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg mb-5">
                  {loading
                    ? <><Loader2 size={18} className="animate-spin" /> Signing in…</>
                    : <><LogIn size={18} /> Sign in</>
                  }
                </button>

                {/* New here */}
                <p className="text-center text-[#fdf0dc] text-sm font-semibold mb-4">New here?</p>

                <Link
  to="/signup-select"
  className="block w-full text-center bg-[#E5A800] hover:bg-[#cc9600] text-[#3d2a00] font-black text-base py-3.5 rounded-xl transition shadow-lg"
>
  Create your account
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

export default GNLogin;