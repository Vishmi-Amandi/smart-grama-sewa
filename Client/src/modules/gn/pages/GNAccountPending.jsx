import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

const GNAccountPending = () => {
  return (
    <div className="min-h-screen flex flex-col">

      {/* Background */}
      <div className="flex-1 relative flex flex-col"
        style={{ backgroundImage: "url(/background.jpg)", backgroundSize: "cover", backgroundPosition: "center" }}>

        {/* Overlay */}
        <div className="absolute inset-0 bg-white/60 pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 p-5">
          <img src="/logo.png" alt="Smart Grama Sewa" className="h-24 w-auto sm:h-20 md:h-24" />
        </div>

        {/* Centered Card */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-10">

          <h1 className="text-5xl font-black text-[#332421] tracking-tight mb-7 text-center sm:text-4xl md:text-5xl">Account Under Review</h1>

          <div className="w-full max-w-md rounded-3xl p-8 shadow-2xl sm:max-w-[90%] sm:p-6 md:max-w-md md:p-8"
            style={{ backgroundColor: "rgba(106, 35, 1, 0.6)" }}>

            
              

                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 sm:w-16 sm:h-16 md:w-20 md:h-20">
                  <span className="text-4xl sm:text-3xl md:text-4xl">⏳</span>
                </div>

                <p className="text-center text-[#fdf0dc] text-xs font-bold mb-1.5 uppercase tracking-wide sm:text-xs">
                  Your registration has been submitted successfully. Our admin team is reviewing your details and documents.
                  You will be notified once your account is approved.
                </p>

                {/* Status Timeline */}
                <div className="text-left space-y-3 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-sm">✓</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#E5A800]">Registration Submitted</p>
                      <p className="text-xs text-white">Your details have been received</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-yellow-600 text-sm">⏳</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#E5A800]">Admin Review</p>
                      <p className="text-xs text-white">Your account is being reviewed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-400 text-sm">○</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#E5A800]">Account Activated</p>
                      <p className="text-xs text-white">Pending approval</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => signOut(auth).then(() => window.location.href = "/login")}
                  className="w-full bg-[#E5A800] hover:bg-[#cc9600] disabled:opacity-60 disabled:cursor-not-allowed text-[#3B1F0A] font-black text-base py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-l sm:py-3 md:py-3.5">
                  Sign Out
                </button>
              
            
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#6A2301] text-white text-center py-3 text-sm font-semibold">
        © 2026 Smart Grama Sewa. All rights reserved.
      </footer>

    </div>
  );
};

export default GNAccountPending;