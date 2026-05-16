import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase";
import { Loader2, Mail, ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const inputClass =
    "w-full bg-white text-[#1e1200] border-2 border-transparent rounded-xl px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#E5A800] placeholder:text-gray-400";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("Please enter your email."); return; }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err) {
      switch (err.code) {
        case "auth/user-not-found":  setError("No account found with this email."); break;
        case "auth/invalid-email":   setError("Invalid email format."); break;
        default:                     setError("Failed to send reset email. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

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

          <h1 className="text-5xl font-black text-[#332421] tracking-tight mb-7">
            Forgot Password
          </h1>

          <div
            className="w-full max-w-md rounded-3xl p-8 shadow-2xl"
            style={{ backgroundColor: "rgba(106, 35, 1, 0.6)" }}
          >
            {!success ? (
              <>
                <p className="text-[#fdf0dc] text-sm mb-6">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                {/* Error */}
                {error && (
                  <div className="mb-5 bg-white/15 rounded-xl px-4 py-3 text-[#fde8c8] text-sm font-semibold flex items-center gap-2">
                    <span>⚠</span> {error}
                  </div>
                )}

                {/* Email */}
                <div className="mb-6">
                  <label className="block text-[#fdf0dc] text-xs font-bold mb-1.5 uppercase tracking-wide">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="Enter your email"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-[#3B1F0A] hover:bg-[#2a1506] disabled:opacity-60 text-[#E5A800] font-black text-base py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg mb-5"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>

                {/* Back to Login */}
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 text-[#fdf0dc] text-sm font-semibold hover:text-white transition"
                >
                  <ArrowLeft size={16} />
                  Back to Sign In
                </Link>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail size={28} className="text-green-600" />
                  </div>
                  <h2 className="text-white font-bold text-lg mb-2">Check your email!</h2>
                  <p className="text-[#fdf0dc] text-sm mb-6">
                    We sent a password reset link to <strong>{email}</strong>. 
                    Check your inbox and follow the instructions.
                  </p>
                  <Link
                    to="/login"
                    className="block w-full text-center bg-[#E5A800] hover:bg-[#cc9600] text-[#3d2a00] font-black text-base py-3.5 rounded-xl transition shadow-lg"
                  >
                    Back to Sign In
                  </Link>
                </div>
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

export default ForgotPassword;