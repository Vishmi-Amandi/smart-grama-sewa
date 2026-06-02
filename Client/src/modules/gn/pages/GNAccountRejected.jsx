import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth as firebaseAuth } from "../../firebase";
import { X } from "lucide-react";

const GNAccountRejected = () => {
  const [rejectionNote, setRejectionNote] = useState("");

  useEffect(() => {
    const fetchNote = async () => {
      const user = firebaseAuth.currentUser;
      if (user) {
        const snap = await getDoc(doc(db, "gn_officers", user.uid));
        if (snap.exists()) {
          setRejectionNote(snap.data().adminNote || "");
        }
      }
    };
    fetchNote();
  }, []);

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
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-10">
          <h1 className="text-5xl font-black text-red-600 mb-3">Account Rejected</h1>

          <div className="w-full max-w-md rounded-3xl p-8 shadow-2xl"
            style={{ backgroundColor: "rgba(106, 35, 1, 0.9)" }}>

            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                <X className="w-15 h-15 text-red-600" /> 
            </div>
            <p className="text-center text-[#fdf0dc] text-xs font-bold mb-1.5 uppercase tracking-wide">
              Unfortunately your registration has been rejected by the admin.
            </p>
            {rejectionNote && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
                <p className="text-xs font-semibold text-red-600 uppercase mb-1">Admin Note</p>
                <p className="text-sm text-gray-700">{rejectionNote}</p>
              </div>
            )}

            <p className="text-white text-xs mb-6">
              Please contact your divisional office for more information or reapply with correct details.
            </p>

            <button
              onClick={() => signOut(auth).then(() => window.location.href = "/gn-login")}
              className="w-full bg-[#E5A800] hover:bg-[#cc9600] disabled:opacity-60 disabled:cursor-not-allowed text-[#3B1F0A] font-black text-base py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-l">
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

export default GNAccountRejected;