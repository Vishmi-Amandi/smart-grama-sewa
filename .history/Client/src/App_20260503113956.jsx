import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';


// Page imports
import Login       from './modules/user/pages/login';
import SignUpSelect  from './modules/user/pages/signupSelect';  // ← role selection screen
import SignUp       from './modules/user/pages/SignUp';
import Dashboard   from './modules/user/pages/dashboard';
import Profile     from './modules/user/pages/Profile';
import Appointments from './modules/user/pages/appointments';
import Announcements from './modules/user/pages/announcements';
import Settings      from './modules/user/pages/settings';

import Home from './modules/home/Home';
import Forms from './modules/forms/Forms';

// Protected route wrapper
// Redirects to /login if Firebase user is not logged in
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase'; // ← adjust path if needed

const ProtectedRoute = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [isAuth,   setIsAuth]   = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAuth(!!user);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  // While checking auth state show a minimal loader
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

  // Not logged in → redirect to login
  return isAuth ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <Router>
      <Routes>

        {/* Public routes (no auth needed) */}
        <Route path="/login"  element={<Login  />} />
        {/* Role selection — shown when user clicks "Sign Up" from Login */}
        <Route path="/signup-select" element={<SignUpSelect />} />
        {/* Citizen signup — reached after selecting "Citizen" on role screen */}
        <Route path="/signup" element={<SignUp />} />

        {/* Protected routes (must be logged in) */}
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

        {/* ── Default redirect ── */}
        {/* Visiting "/" → go to dashboard (which redirects to login if not authed) */}
        <Route path="/"   element={<Navigate to="/dashboard" replace />} />

        {/* ── 404 fallback ── */}
        <Route path="*"   element={<Navigate to="/dashboard" replace />} />

        <Route path="/" element={<Home />} />
        <Route path="/forms" element={<Forms />} />

      </Routes>
    </Router>
  );
};

export default App;
