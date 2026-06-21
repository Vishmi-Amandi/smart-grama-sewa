import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useTranslation } from "react-i18next";

const GNForgotPassword = () => {
  const { t } = useTranslation();
  const [input,   setInput]   = useState("");  // username or email
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [sentTo,  setSentTo]  = useState("");  // email we sent to
  const [error,   setError]   = useState("");
  const navigate = useNavigate();

  const handleReset = async () => {
    if (!input.trim()) { setError(t("err_enter_username_or_email")); return; }
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
          setError(t("err_no_account_username"));
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
        case "auth/user-not-found":  setError(t("err_user_not_found")); break;
        case "auth/invalid-email":   setError(t("err_invalid_email"));  break;
        default:                     setError(t("err_general"));
      }
    } finally {
      setLoading(false);
    }
  };

  // Step instructions (translated)
  const steps = [
    t("step_open_email"),
    t("step_click_reset_link"),
    t("step_create_password"),
    t("step_sign_in_new"),
  ];

  return (
    <div className="min-h-screen flex-1 relative flex flex-col">
      {/* Background */}
      <div className="flex-1 relative flex flex-col"
        style={{ backgroundImage: "url(/background.jpg)", backgroundSize: "cover", backgroundPosition: "center" }}>

        {/* Overlay */}
        <div className="absolute inset-0 bg-white/60 pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 p-5">
          <img src="/logo2.png" alt={t("app_name")} className="h-24 w-auto" />
        </div>

        {/* Centered Card */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-12 sm:pb-16">

          <h1 className="text-5xl sm:text-4xl md:text-5xl font-black text-[#332421] tracking-tight mb-7 text-center">
            {t("forgot_password_title")}
          </h1>
          <div className="w-full max-w-[90%] sm:max-w-md rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl"
            style={{ backgroundColor: "rgba(106, 35, 1, 0.6)" }}>

            {!sent ? (
              <>
                {/* Step indicator */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-1 sm:gap-2">
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black
                        ${s === 1 ? "bg-[#E5A800] text-black" : "bg-white/20 text-white"}`}>
                        {s}
                      </div>
                      {s < 3 && <div className="w-4 sm:w-8 h-0.5 bg-white/30" />}
                    </div>
                  ))}
                  <p className="block text-[#fdf0dc] text-xs font-bold mb-1.5 tracking-wide">
                    {t("enter_details_label")}
                  </p>
                </div>

                <p className="text-[#fdf0dc] text-xs sm:text-sm mb-4 sm:mb-5">
                  {t("forgot_password_instruction")}
                </p>

                {/* Error */}
                {error && (
                  <div className="mb-4 bg-white/15 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-[#fde8c8] text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <span>⚠</span> {error}
                  </div>
                )}

                {/* Input */}
                <label className="block text-[#fdf0dc] text-[10px] sm:text-xs font-bold mb-1.5 uppercase tracking-wide">
                  {t("username_or_email_label")}
                </label>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => { setInput(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                  placeholder={t("username_or_email_placeholder")}
                  className="w-full bg-white text-[#1e1200] border-2 border-transparent rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold outline-none focus:border-[#E5A800] mb-4 sm:mb-5"
                />

                {/* Send Button */}
                <button onClick={handleReset} disabled={loading}
                  className="w-full bg-[#3B1F0A] hover:bg-[#2a1506] disabled:opacity-60 text-[#E5A800] font-black py-2.5 sm:py-3 rounded-xl transition mb-3 sm:mb-4 text-sm sm:text-base">
                  {loading ? t("verifying") : t("send_reset_link_btn")}
                </button>

                <button onClick={() => navigate("/login")}
                  className="w-full text-center text-[#fdf0dc] text-xs sm:text-sm font-semibold hover:text-white transition">
                  ← {t("back_to_sign_in")}
                </button>
              </>
            ) : (
              <>
                {/* Success Screen */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-1 sm:gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black bg-[#E5A800] text-black">
                        ✓
                      </div>
                      {s < 3 && <div className="w-4 sm:w-8 h-0.5 bg-[#E5A800]" />}
                    </div>
                  ))}
                  <p className="text-[#fdf0dc] text-[10px] sm:text-xs ml-1 sm:ml-2">
                    {t("link_sent_label")}
                  </p>
                </div>

                <div className="text-center mb-4 sm:mb-6">
                  <div className="text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4">📧</div>
                  <p className="text-[#fdf0dc] font-black text-base sm:text-lg mb-2">
                    {t("reset_link_sent_title")}
                  </p>
                  <p className="text-[#fdf0dc] text-xs sm:text-sm mb-1">
                    {t("reset_link_sent_desc")}
                  </p>
                  <p className="text-[#E5A800] font-black text-xs sm:text-sm mb-3 sm:mb-4 break-words">{sentTo}</p>
                </div>

                {/* Instructions */}
                <div className="bg-white/10 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 space-y-1.5 sm:space-y-2">
                  <p className="text-[#fdf0dc] text-[10px] sm:text-xs font-bold uppercase tracking-wide mb-1 sm:mb-2">
                    {t("next_steps_label")}
                  </p>
                  {steps.map((step, index) => (
                    <p key={index} className="text-[#fdf0dc] text-[10px] sm:text-xs">
                      {step}
                    </p>
                  ))}
                </div>

                <p className="text-[#fdf0dc] text-[10px] sm:text-xs text-center mb-4 sm:mb-5">
                  {t("did_not_receive_email")}
                </p>

                <button onClick={() => { setSent(false); setInput(""); setSentTo(""); }}
                  className="w-full bg-white/20 hover:bg-white/30 text-[#fdf0dc] font-bold py-2 sm:py-2.5 rounded-xl transition mb-2 sm:mb-3 text-xs sm:text-sm">
                  {t("try_again_btn")}
                </button>

                <button onClick={() => navigate("/login")}
                  className="w-full bg-[#E5A800] hover:bg-[#cc9600] text-[#3d2a00] font-black py-2.5 sm:py-3 rounded-xl transition text-sm sm:text-base">
                  {t("back_to_sign_in")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <footer className="bg-[#6A2301] text-white text-center py-3.5 text-xs font-semibold">
        © 2026 {t("app_name")}. {t("all_rights_reserved")}
      </footer>
    </div>
  );
};

export default GNForgotPassword;