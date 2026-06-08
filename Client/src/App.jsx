// Client/src/App.jsx

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// ── User pages ────────────────────────────────────────────────────────────
import Home from './modules/home/Home';
import Login from './modules/user/pages/login';
import SignUpSelect from './modules/user/pages/signupSelect';
import SignUp from './modules/user/pages/SignUp';
import Dashboard from './modules/user/pages/dashboard';
import Profile from './modules/user/pages/Profile';
import Appointments from './modules/user/pages/appointments';
import Announcements from './modules/user/pages/announcements';
import Settings from './modules/user/pages/settings';

// ── Admin pages ───────────────────────────────────────────────────────────
import AdminRoute from "./modules/admin/components/AdminRoute";
import AdminDashboard from './modules/admin/dashboard';
import AdminAnnouncementPage from "./modules/admin/announcementpage";
import AdminRegistrationRequestApproval from "./modules/admin/registrationrequestapproval";
import AdminTransferRequestApproval from "./modules/admin/transferrequestapproval";
import AdminCalendar from './modules/admin/calendar';
import AdminSystemPerformanceReports from './modules/admin/reports/system';
import AdminGNActivityReports from './modules/admin/reports/gnactivity';
import AdminIndividualGNUserAccessReports from './modules/admin/reports/useraccess';

// ─── Spinner (shared loading UI) ──────────────────────────────────────────
const Spinner = () => (
  <div style={{
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f8f6f0',
  }}>
    <div style={{
      width: '44px', height: '44px', borderRadius: '50%',
      border: '4px solid #F5C400', borderTopColor: 'transparent',
      animation: 'spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── ProtectedRoute — any logged-in user ─────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAuth(!!user);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  if (checking) return <Spinner />;
  return isAuth ? children : <Navigate to="/login" replace />;
};

// // ─── AdminRoute — logged-in AND role === "admin" ──────────────────────────
// // Checks uid against gn_officers first, then users collection
// const AdminRoute = ({ children }) => {
//   const [checking, setChecking] = useState(true);
//   const [isAdmin, setIsAdmin] = useState(false);

//   useEffect(() => {
//     const unsub = onAuthStateChanged(auth, async (user) => {
//       if (!user) {
//         setChecking(false);
//         return;
//       }
//        try {
//         // 1. Check gn_officers collection (uid is the document ID)
//         // gn_officers fields: uid, role, fullName, email ...
//         const gnSnap = await getDoc(doc(db, 'gn_officers', user.uid));
//         if (gnSnap.exists() && gnSnap.data().role === 'admin') {
//           setIsAdmin(true);
//           setChecking(false);
//           return;
//         }

//         // 2. Fallback — check users collection
//         // users fields: uid, role, fullName, email ...
//         const userSnap = await getDoc(doc(db, 'users', user.uid));
//         if (userSnap.exists() && userSnap.data().role === 'admin') {
//           setIsAdmin(true);
//           setChecking(false);
//           return;
//         }

//         // Not an admin
//         setIsAdmin(false);
//       } catch (err) {
//         console.error('Admin role check failed:', err.message);
//         setIsAdmin(false);
//       } finally {
//         setChecking(false);
//       }
//     });
//     return () => unsub();
//   }, []);

//   if (checking) return <Spinner />;

//   // Not logged in → login page
//   // Logged in but not admin → their own dashboard
//   return isAdmin
//     ? children
//     : <Navigate to="/login" replace />;
// };

// ─── App ──────────────────────────────────────────────────────────────────
const App = () => {
  return (
    <Router>
      <Routes>

        {/* ── Public routes ── */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup-select" element={<SignUpSelect />} />
        <Route path="/signup" element={<SignUp />} />

        {/* ── Protected user routes ── */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />
        <Route path="/appointments" element={
          <ProtectedRoute><Appointments /></ProtectedRoute>
        } />
        <Route path="/announcements" element={
          <ProtectedRoute><Announcements /></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute><Settings /></ProtectedRoute>
        } />

        {/* ── Protected admin routes ── */}
        <Route path="/admin/dashboard" element={
          <AdminRoute><AdminDashboard /></AdminRoute>
        } />
        <Route path="/admin/announcements" element={
          <AdminRoute><AdminAnnouncementPage /></AdminRoute>
        } />
        <Route path="/admin/registrationrequestapproval" element={
          <AdminRoute><AdminRegistrationRequestApproval /></AdminRoute>
        } />
        <Route path="/admin/transferrequestapproval" element={
          <AdminRoute><AdminTransferRequestApproval /></AdminRoute>
        } />
        <Route path="/admin/calendar" element={
          <AdminRoute><AdminCalendar /></AdminRoute>
        } />
        <Route path="/admin/reports/system" element={
          <AdminRoute><AdminSystemPerformanceReports /></AdminRoute>
        } />
        <Route path="/admin/reports/gnactivity" element={
          <AdminRoute><AdminGNActivityReports /></AdminRoute>
        } />
        <Route path="/admin/reports/useraccess" element={
          <AdminRoute><AdminIndividualGNUserAccessReports /></AdminRoute>
        } />

        {/* ── 404 fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
};

export default App;