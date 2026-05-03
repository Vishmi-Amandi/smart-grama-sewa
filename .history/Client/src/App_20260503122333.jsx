import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Page imports
import Login from './modules/user/pages/login';
import SignUpSelect from './modules/user/pages/signupSelect';
import SignUp from './modules/user/pages/SignUp';
import Dashboard from './modules/user/pages/dashboard';
import Profile from './modules/user/pages/Profile';
import Appointments from './modules/user/pages/appointments';
import Announcements from './modules/user/pages/announcements';
import Settings from './modules/user/pages/settings';

// New module import
import Home from './modules/home/Home';

// Protected route wrapper
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase'; 

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

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes (no auth needed) */}
        **<Route path="/" element={<Home />} />**
        <Route path="/login"  element={<Login  />} />
        <Route path="/signup-select" element={<SignUpSelect />} />
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
        **<Route path="/"  element={<Home />} />**

        {/* ── 404 fallback ── */}
        **<Route path="*"  element={<Navigate to="/" replace />} />**

      </Routes>
    </Router>
  );
};

export default App;