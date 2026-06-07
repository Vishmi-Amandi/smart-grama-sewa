import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(undefined);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, "gn_officers", u.uid));
          if (snap.exists()) {
            setStatus(snap.data().status || "Approved");
          } else {
            setStatus("Approved");
          }
        } catch {
          setStatus("Approved");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  if (user === undefined || (user && status === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0DC]">
        <div className="text-center">
          <img src="/logo.png" alt="logo" className="h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-[#8B4513] font-semibold text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/gn-login" replace />;
  if (status === "Pending") return <Navigate to="/gn-account-pending" replace />;
  if (status === "Rejected") return <Navigate to="/gn-account-rejected" replace />;
  return children;
};

export default ProtectedRoute;