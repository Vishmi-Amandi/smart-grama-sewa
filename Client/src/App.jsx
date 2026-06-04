import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import ErrorBoundary from './modules/user/components/errorBoundary';

// ===== GN MODULE IMPORTS =====
import GNDashboard from './modules/gn/pages/GNDashboard.jsx';
import GNAppointmentList from './modules/gn/pages/GNAppointmentList.jsx';
import GNCurrentStatus from './modules/gn/pages/GNCurrentStatus.jsx';
import GNCreateAnnouncement from './modules/gn/pages/GNCreateAnnouncement.jsx';
import GNAnnouncementList from './modules/gn/pages/GNAnnouncementList.jsx';
import GNSchedule from './modules/gn/pages/GNSchedule.jsx';
import GNCitizenSearch from './modules/gn/pages/GNCitizenSearch.jsx';
import GNProfile from './modules/gn/pages/GNProfile.jsx';
import GNSettings from './modules/gn/pages/GNSettings.jsx';
import GNChangeGNDivision from './modules/gn/pages/GNChangeGNDivision.jsx';
import GNLogin from './modules/gn/pages/GNLogin.jsx';
import GNSignUp from './modules/gn/pages/GNSignUp.jsx';
import GNForgotPassword from './modules/gn/pages/GNForgotPassword.jsx';
import SignUpSelect from './modules/gn/pages/SignUpSelect.jsx';
import ChangeGNRequestStatus from './modules/gn/pages/ChangeGNRequestStatus.jsx';
import GNAccountPending from './modules/gn/pages/GNAccountPending.jsx';
import GNAccountRejected from './modules/gn/pages/GNAccountRejected.jsx';

// ===== USER MODULE IMPORTS =====
import Login from './modules/user/pages/login';
import SignUp from './modules/user/pages/SignUp';
import Dashboard from './modules/user/pages/dashboard';
import Profile from './modules/user/pages/profile';
import Appointments from './modules/user/pages/appointments';
import Announcements from './modules/user/pages/announcements';
import Settings from './modules/user/pages/settings';
import ContactGN from './modules/user/pages/contactGN';

// New module import
import Home from './modules/home/Home';
import Forms from './modules/forms/Forms';

// ===== GN PROTECTED ROUTE =====
const GNProtectedRoute = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [isAuth,   setIsAuth]   = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAuth(!!user);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  if (checking) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        backgroundColor: "#f8f6f0",
      }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "50%",
          border: "4px solid #E5A800", borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return isAuth ? children : <Navigate to="/gn-login" replace />;
};

// ===== USER PROTECTED ROUTE =====
const UserProtectedRoute = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAuth(!!user);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#f8f6f0', fontFamily: 'Nunito, sans-serif',
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          border: '4px solid #F5C400', borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return isAuth ? children : <Navigate to="/login" replace />;
};

// ===== MAIN APP COMPONENT =====
function App() {
  const [gnStatus, setGnStatus] = useState("Available");
  const [theme, setTheme] = useState("light");
  const [fontSize, setFontSize] = useState("medium");

  const fontSizeMap = {
    small: "12px",
    medium: "16px",
    large: "18px",
  };

  return (
  
      <ErrorBoundary>
        <div style={{ fontSize: fontSizeMap[fontSize] }}>
          <Routes>
            {/* ===== LANDING PAGE ===== */}
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />

            {/* ===== GN MODULE ROUTES ===== */}
            <Route path="/gn-login" element={<GNLogin />} />
            <Route path="/gn-signup" element={<GNSignUp />} />
            <Route path="/gn-forgot-password" element={<GNForgotPassword />} />
            <Route path="/signup-select" element={<SignUpSelect />} />
            <Route path="/gn-account-pending" element={<GNAccountPending />} />
            <Route path="/gn-account-rejected" element={<GNAccountRejected />} />

            <Route path="/gn-dashboard" element={
              <GNProtectedRoute>
                <GNDashboard gnStatus={gnStatus} theme={theme} />
              </GNProtectedRoute>
            } />
            <Route path="/gn-appointments" element={
              <GNProtectedRoute>
                <GNAppointmentList gnStatus={gnStatus} theme={theme} />
              </GNProtectedRoute>
            } />
            <Route path="/gn-current-status" element={
              <GNProtectedRoute>
                <GNCurrentStatus gnStatus={gnStatus} setGnStatus={setGnStatus} theme={theme} />
              </GNProtectedRoute>
            } />
            <Route path="/gn-create-announcement" element={
              <GNProtectedRoute>
                <GNCreateAnnouncement gnStatus={gnStatus} theme={theme} />
              </GNProtectedRoute>
            } />
            <Route path="/gn-announcement-list" element={
              <GNProtectedRoute>
                <GNAnnouncementList gnStatus={gnStatus} theme={theme} />
              </GNProtectedRoute>
            } />
            <Route path="/gn-schedule" element={
              <GNProtectedRoute>
                <GNSchedule gnStatus={gnStatus} theme={theme} />
              </GNProtectedRoute>
            } />
            <Route path="/gn-citizen-search" element={
              <GNProtectedRoute>
                <GNCitizenSearch gnStatus={gnStatus} theme={theme} />
              </GNProtectedRoute>
            } />
            <Route path="/gn-profile" element={
              <GNProtectedRoute>
                <GNProfile gnStatus={gnStatus} theme={theme} />
              </GNProtectedRoute>
            } />
            <Route path="/gn-settings" element={
              <GNProtectedRoute>
                <GNSettings gnStatus={gnStatus} theme={theme} setTheme={setTheme} fontSize={fontSize} setFontSize={setFontSize} />
              </GNProtectedRoute>
            } />
            <Route path="/gn-change-gn-division" element={
              <GNProtectedRoute>
                <GNChangeGNDivision gnStatus={gnStatus} theme={theme} />
              </GNProtectedRoute>
            } />

            <Route path="/change-gn-request-status" element={
              <GNProtectedRoute><ChangeGNRequestStatus gnStatus={gnStatus} theme={theme} />
              </GNProtectedRoute>} />

            {/* ===== USER MODULE ROUTES ===== */}
            <Route path="/login" element={<Login />} />
            <Route path="/user-signup" element={<SignUp />} />

            <Route path="/dashboard" element={
              <UserProtectedRoute>
                <Dashboard />
              </UserProtectedRoute>
            } />
            <Route path="/profile" element={
              <UserProtectedRoute>
                <Profile />
              </UserProtectedRoute>
            } />
            <Route path="/appointments" element={
              <UserProtectedRoute>
                <Appointments />
              </UserProtectedRoute>
            } />
            <Route path="/announcements" element={
              <UserProtectedRoute>
                <Announcements />
              </UserProtectedRoute>
            } />
            <Route path="/settings" element={
              <UserProtectedRoute>
                <Settings />
              </UserProtectedRoute>
            } />
            <Route path="/contact-gn" element={
              <UserProtectedRoute>
                <ContactGN />
              </UserProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </ErrorBoundary>
    
  );
}

export default App;