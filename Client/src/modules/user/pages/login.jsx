// Client/src/modules/user/pages/login.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';

const Login = () => {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [rememberMe, setRememberMe]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your username or email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      console.log('Login successful:', userCredential.user.email);

      // Step 2: Check gn_officers collection first (uid is the document ID)
      // gn_officers fields: uid, role, fullName, email, gnDiv, district ...
      const gnOfficerSnap = await getDoc(doc(db, 'gn_officers', uid));
      if (gnOfficerSnap.exists()) {
        const gnData = gnOfficerSnap.data();
        if (gnData.role === 'admin') {
          navigate('/admin/dashboard');
          return;
        }
      }

      // Step 3: Check users collection (uid is the document ID)
      // users fields: uid, role, fullName, email, gnDiv, district ...
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.role === 'admin') {
          navigate('/admin/dashboard');
          return;
        }
        // Any other role → regular user dashboard
        navigate('/dashboard');
        return;
      }

      // Step 4: Document not found in either collection
      setError('Account not found. Please contact support.');

    } catch (err) {
      console.error('Login error:', err);
      switch (err.code) {
        case 'auth/invalid-email':
          setError('Invalid email format');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Try again later');
          break;
        default:
          setError('Incorrect credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    backgroundColor: '#ffffff',
    color: '#1e1200',
    border: '2.5px solid transparent',
    borderRadius: '12px',
    padding: '13px 16px',
    fontSize: '15px',
    fontWeight: '600',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  return (
    <div className="min-h-screen flex flex-col">

      {/* Background */}
      <div style={{
        flex: 1,
        backgroundImage: 'url(/background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 10, padding: '20px 24px' }}>
          <img
            src="/logo.png"
            alt="Smart Grama Sewa"
            style={{ height: '100px', width: 'auto' }}
          />
        </div>

        {/* Centered card section */}
        <div style={{
          position: 'relative', zIndex: 10, flex: 1,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 16px 48px',
        }}>

          {/* Title */}
          <h1 style={{
            fontSize: '48px', fontWeight: 900, color: '#332421',
            letterSpacing: '-1px', marginBottom: '28px', textAlign: 'center',
          }}>
            Sign in
          </h1>

          {/* Card */}
          <div style={{
            width: '100%', maxWidth: '440px',
            backgroundColor: 'rgba(106, 35, 1, 0.6)',
            borderRadius: '24px', padding: '32px 32px 28px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          }}>

            {/* Error banner */}
            {error && (
              <div style={{
                marginBottom: '18px',
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: '12px', padding: '11px 16px',
                color: '#fde8c8', fontSize: '13px', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span>⚠</span> {error}
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{
                display: 'block', color: '#fdf0dc',
                fontSize: '13px', fontWeight: 700, marginBottom: '7px',
              }}>
                User name or email
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                autoComplete="username"
                required
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#F5C400')}
                onBlur={(e)  => (e.target.style.borderColor = 'transparent')}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{
                display: 'block', color: '#fdf0dc',
                fontSize: '13px', fontWeight: 700, marginBottom: '7px',
              }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  autoComplete="current-password"
                  required
                  style={{ ...inputStyle, paddingRight: '48px' }}
                  onFocus={(e) => (e.target.style.borderColor = '#F5C400')}
                  onBlur={(e)  => (e.target.style.borderColor = 'transparent')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: 'absolute', right: '12px',
                    top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', color: '#888', padding: '4px',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between mb-5">
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-semibold"
                style={{ color: '#fdf0dc' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                  style={{ accentColor: '#F5C400' }}
                />
                Keep me signed in
              </label>
              <a href="/forgot-password"
                className="text-sm font-bold transition-colors"
                style={{ color: '#fdf0dc' }}
                onMouseOver={(e) => (e.target.style.color = '#ffffff')}
                onMouseOut={(e)  => (e.target.style.color = '#fdf0dc')}>
                Forgot password?
              </a>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: loading ? '#4a5e72' : '#5a6e82',
                color: '#F5C400', border: 'none', borderRadius: '12px',
                padding: '15px', fontSize: '17px', fontWeight: 900,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, marginBottom: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '8px', transition: 'background-color 0.15s',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              }}
              onMouseOver={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#4a5e72'; }}
              onMouseOut={(e)  => { if (!loading) e.currentTarget.style.backgroundColor = '#5a6e82'; }}
            >
              {loading ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite', width: '18px', height: '18px' }}
                    viewBox="0 0 24 24" fill="none">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="#F5C400" strokeWidth="4"/>
                    <path style={{ opacity: 0.75 }} fill="#F5C400"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>

            {/* New here */}
            <p style={{
              textAlign: 'center', color: '#fdf0dc',
              fontSize: '13px', fontWeight: 600, margin: '0 0 12px',
            }}>
              New here ?
            </p>

            {/* Create account */}
            <a href="/signup-select" style={{
              display: 'block', width: '100%', textAlign: 'center',
              backgroundColor: '#F5C400', color: '#3d2a00',
              borderRadius: '12px', padding: '15px',
              fontSize: '17px', fontWeight: 900, textDecoration: 'none',
              transition: 'background-color 0.15s',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)', boxSizing: 'border-box',
            }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#d4a800')}
              onMouseOut={(e)  => (e.currentTarget.style.backgroundColor = '#F5C400')}>
              Create your account
            </a>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        textAlign: 'center', backgroundColor: '#6A2301',
        color: '#ffffff', padding: '14px 16px',
        fontSize: '15px', fontWeight: 600,
      }}>
        ©2026 Smart Grama Sewa
      </footer>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Login;