import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebase";

const GNForgotPassword = () => {
  const [input,   setInput]   = useState("");  // username or email
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [sentTo,  setSentTo]  = useState("");  // email we sent to
  const [error,   setError]   = useState("");
  const navigate = useNavigate();

  const handleReset = async () => {
    if (!input.trim()) { setError("Please enter your username or email."); return; }
    setLoading(true);
    setError("");

    try {
      let emailToReset = input.trim();

      // ─── If input looks like a username (no @), look up email ──────────────
      if (!input.includes("@")) {
        console.log("Searching for username:", input.trim());
        const q    = query(collection(db, "gn_officers"), where("username", "==", input.trim()));
        const snap = await getDocs(q);
        console.log("Docs found:", snap.size);

        if (snap.empty) {
          setError("No account found with this username.");
          setLoading(false);
          return;
        }
        emailToReset = snap.docs[0].data().email;
        console.log("Email found:", emailToReset);
      }

      // ─── Send Firebase reset email ──────────────────────────────────────────
      console.log("Sending reset to:", emailToReset);
      await sendPasswordResetEmail(auth, emailToReset);
      console.log("Reset email sent successfully");
      setSentTo(emailToReset);
      setSent(true);

    } catch (err) {
      console.log("ERROR code:", err.code);
    console.log("ERROR message:", err.message);
      switch (err.code) {
        case "auth/user-not-found":  setError("No account found with this email."); break;
        case "auth/invalid-email":   setError("Please enter a valid email.");        break;
        default:                     setError("Something went wrong. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fefde8]">
      <div className="p-5">
        <img src="/logo.png" alt="Smart Grama Sewa" className="h-24 w-auto" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        <h1 className="text-4xl font-black text-[#332421] tracking-tight mb-7">
          Forgot Password
        </h1>

        <div className="w-full max-w-md rounded-3xl p-8 shadow-2xl"
          style={{ backgroundColor: "rgba(106, 35, 1, 0.6)" }}>

          {!sent ? (
            <>
              {/* Step indicator */}
              <div className="flex items-center gap-3 mb-6">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black
                      ${s === 1 ? "bg-[#E5A800] text-black" : "bg-white/20 text-white"}`}>
                      {s}
                    </div>
                    {s < 3 && <div className="w-8 h-0.5 bg-white/30" />}
                  </div>
                ))}
                <p className="text-[#fdf0dc] text-xs ml-2">Enter your details</p>
              </div>

              <p className="text-[#fdf0dc] text-sm mb-5">
                Enter your username or registered email address. We'll send a password reset link to your email.
              </p>

              {/* Error */}
              {error && (
                <div className="mb-4 bg-white/15 rounded-xl px-4 py-3 text-[#fde8c8] text-sm font-semibold flex items-center gap-2">
                  <span>⚠</span> {error}
                </div>
              )}

              {/* Input */}
              <label className="block text-[#fdf0dc] text-xs font-bold mb-1.5 uppercase tracking-wide">
                Username or Email
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => { setInput(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
                placeholder="Enter your username or email"
                className="w-full bg-white text-[#1e1200] border-2 border-transparent rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#E5A800] mb-5"
              />

              {/* Send Button */}
              <button onClick={handleReset} disabled={loading}
                className="w-full bg-[#3B1F0A] hover:bg-[#2a1506] disabled:opacity-60 text-[#E5A800] font-black py-3 rounded-xl transition mb-4">
                {loading ? "Verifying..." : "Send Reset Link"}
              </button>

              <button onClick={() => navigate("/gn-login")}
                className="w-full text-center text-[#fdf0dc] text-sm font-semibold hover:text-white transition">
                ← Back to Sign In
              </button>
            </>
          ) : (
            <>
              {/* Success Screen */}
              <div className="flex items-center gap-3 mb-6">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black bg-[#E5A800] text-black">
                      ✓
                    </div>
                    {s < 3 && <div className="w-8 h-0.5 bg-[#E5A800]" />}
                  </div>
                ))}
                <p className="text-[#fdf0dc] text-xs ml-2">Link sent!</p>
              </div>

              <div className="text-center mb-6">
                <div className="text-5xl mb-4">📧</div>
                <p className="text-[#fdf0dc] font-black text-lg mb-2">Reset Link Sent!</p>
                <p className="text-[#fdf0dc] text-sm mb-1">We sent a password reset link to:</p>
                <p className="text-[#E5A800] font-black text-sm mb-4">{sentTo}</p>
              </div>

              {/* Instructions */}
              <div className="bg-white/10 rounded-xl p-4 mb-6 space-y-2">
                <p className="text-[#fdf0dc] text-xs font-bold uppercase tracking-wide mb-2">Next Steps:</p>
                {[
                  "1. Open your email inbox",
                  "2. Click the reset link in the email",
                  "3. Create your new password",
                  "4. Sign in with your new password",
                ].map((step) => (
                  <p key={step} className="text-[#fdf0dc] text-xs">{step}</p>
                ))}
              </div>

              <p className="text-[#fdf0dc] text-xs text-center mb-5">
                Didn't receive the email? Check your spam folder or try again.
              </p>

              <button onClick={() => { setSent(false); setInput(""); setSentTo(""); }}
                className="w-full bg-white/20 hover:bg-white/30 text-[#fdf0dc] font-bold py-2.5 rounded-xl transition mb-3 text-sm">
                Try Again
              </button>

              <button onClick={() => navigate("/login")}
                className="w-full bg-[#E5A800] hover:bg-[#cc9600] text-[#3d2a00] font-black py-3 rounded-xl transition">
                Back to Sign In
              </button>
            </>
          )}
        </div>
      </div>

      <footer className="bg-[#6A2301] text-white text-center py-3.5 text-sm font-semibold">
        © 2026 Smart Grama Sewa. All rights reserved.
      </footer>
    </div>
  );
};

export default GNForgotPassword;