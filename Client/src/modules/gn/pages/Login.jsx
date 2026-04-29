import { useState } from "react";
import { Link,useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";

const Login = () => {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [rememberMe, setRememberMe]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("Please enter your username or email."); return; }
    if (!password)     { setError("Please enter your password.");          return; }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
const user = userCredential.user;

// Check role in Firestore
const { getDoc, doc } = await import("firebase/firestore");
const { db } = await import("../../firebase");

const userDoc = await getDoc(doc(db, "users", user.uid));

if (userDoc.exists()) {
  const role = userDoc.data().role;
  if (role === "gn") {
    navigate("/");
  } else if (role === "citizen") {
    navigate("/citizen-dashboard");
  } else {
    setError("Unknown role. Please contact support.");
  }
} else {
  setError("User profile not found. Please contact support.");
}
    } catch (err) {
      switch (err.code) {
        case "auth/invalid-email":       setError("Invalid email format.");                        break;
        case "auth/user-not-found":      setError("No account found with this email.");            break;
        case "auth/wrong-password":      setError("Incorrect password.");                          break;
        case "auth/too-many-requests":   setError("Too many failed attempts. Try again later.");   break;
        default:                         setError("Incorrect credentials. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-white text-[#1e1200] border-2 border-transparent rounded-xl px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#E5A800] placeholder:text-gray-400";

  return (
    <div className="min-h-screen flex flex-col">

      {/* Background */}
      <div
        className="flex-1 relative flex flex-col"
        style={{
          backgroundImage: "url(/background.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-white/60 pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 p-5">
          <img src="/logo.png" alt="Smart Grama Sewa" className="h-24 w-auto" />
        </div>

        {/* Centered Card */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-12">

          {/* Title */}
          <h1 className="text-5xl font-black text-[#332421] tracking-tight mb-7">
            Sign in
          </h1>

          {/* Card */}
          <div
            className="w-full max-w-md rounded-3xl p-8 shadow-2xl"
            style={{ backgroundColor: "rgba(106, 35, 1, 0.6)" }}
          >

            {/* Error Banner */}
            {error && (
              <div className="mb-5 bg-white/15 rounded-xl px-4 py-3 text-[#fde8c8] text-sm font-semibold flex items-center gap-2">
                <span>⚠</span> {error}
              </div>
            )}

            {/* Email */}
            <div className="mb-4">
              <label className="block text-[#fdf0dc] text-xs font-bold mb-1.5 uppercase tracking-wide">
                Username or Email
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                autoComplete="username"
                placeholder="Enter your email"
                className={inputClass}
              />
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block text-[#fdf0dc] text-xs font-bold mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-semibold text-[#fdf0dc]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer accent-[#E5A800]"
                />
                Keep me signed in
              </label>
              <a
                href="/forgot-password"
                className="text-sm font-bold text-[#fdf0dc] hover:text-white transition"
              >
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#3B1F0A] hover:bg-[#2a1506] disabled:opacity-60 disabled:cursor-not-allowed text-[#E5A800] font-black text-base py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg mb-5"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign in
                </>
              )}
            </button>

            {/* Divider */}
            <p className="text-center text-[#fdf0dc] text-sm font-semibold mb-4">
              New here?
            </p>

            {/* Create Account */}

<Link
  to="/signup"
  className="block w-full text-center bg-[#E5A800] hover:bg-[#cc9600] text-[#3d2a00] font-black text-base py-3.5 rounded-xl transition shadow-lg"
>
  Create your account
</Link>

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