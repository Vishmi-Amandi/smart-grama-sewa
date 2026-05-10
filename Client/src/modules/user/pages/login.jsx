import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../../firebase';

const Login = () => {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [rememberMe, setRememberMe]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [isMobile, setIsMobile]         = useState(window.innerWidth <= 768);
  
  // Forgot Password states
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const navigate = useNavigate();

  // Detect mobile screen
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // CHECK IF EMAIL IS VERIFIED
      if (!user.emailVerified) {
        setError('Please verify your email before logging in. Check your inbox for verification link.');
        setLoading(false);
        return;
      }
      
      console.log('Login successful:', user.email);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      switch(err.code) {
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

  // Forgot Password handler
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setResetError('Please enter your email address');
      return;
    }
    
    setResetLoading(true);
    setResetError('');
    
    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
    } catch (err) {
      console.error('Password reset error:', err);
      switch(err.code) {
        case 'auth/user-not-found':
          setResetError('No account found with this email');
          break;
        case 'auth/invalid-email':
          setResetError('Invalid email format');
          break;
        default:
          setResetError('Failed to send reset email. Please try again.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    backgroundColor: '#ffffff',
    color: '#1e1200',
    border: '2.5px solid transparent',
    borderRadius: '12px',
    padding: isMobile ? '14px 16px' : '13px 16px',
    fontSize: isMobile ? '16px' : '15px',
    fontWeight: '600',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  // FORGOT PASSWORD UI
  if (forgotPasswordMode) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255, 255, 255, 0.6)', pointerEvents: 'none' }} />
          
          <div style={{ position: 'relative', zIndex: 10, padding: isMobile ? '16px 20px' : '20px 24px' }}>
            <img src="/logo.png" alt="Smart Grama Sewa" style={{ height: isMobile ? '100px' : '120px', width: 'auto' }} />
          </div>
          
          <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '0 16px 40px' : '0 16px 48px' }}>
            <h1 style={{ fontSize: isMobile ? '32px' : '40px', fontWeight: 900, color: '#332421', marginBottom: isMobile ? '20px' : '28px', textAlign: 'center' }}>
              Reset Password
            </h1>
            
            <div style={{ width: '90%', maxWidth: '440px', backgroundColor: 'rgba(106, 35, 1, 0.6)', borderRadius: isMobile ? '20px' : '24px', padding: isMobile ? '24px 20px' : '32px 32px 28px', boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>
              
              {resetEmailSent ? (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fdf0dc', marginBottom: '12px' }}>Check Your Email</h2>
                    <p style={{ fontSize: '14px', color: '#fdf0dc', lineHeight: 1.6 }}>
                      We've sent a password reset link to <strong>{email}</strong>.<br />
                      Please check your inbox and follow the instructions.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setForgotPasswordMode(false);
                      setResetEmailSent(false);
                      setResetError('');
                    }}
                    style={{
                      width: '100%',
                      backgroundColor: '#F5C400',
                      color: '#3d2a00',
                      border: 'none',
                      borderRadius: '12px',
                      padding: isMobile ? '14px' : '13px',
                      fontSize: isMobile ? '16px' : '15px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginBottom: '12px',
                    }}
                  >
                    Back to Sign In
                  </button>
                </>
              ) : (
                <>
                  <p style={{ color: '#fdf0dc', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  
                  {resetError && (
                    <div style={{ marginBottom: '18px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '11px 16px', color: '#fde8c8', fontSize: '13px', fontWeight: 600 }}>
                      ⚠ {resetError}
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', color: '#fdf0dc', fontSize: '14px', fontWeight: 700, marginBottom: '7px' }}>Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = '#F5C400')}
                      onBlur={(e) => (e.target.style.borderColor = 'transparent')}
                    />
                  </div>
                  
                  <button
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    style={{
                      width: '100%',
                      backgroundColor: resetLoading ? '#4a5e72' : '#5a6e82',
                      color: '#F5C400',
                      border: 'none',
                      borderRadius: '12px',
                      padding: isMobile ? '16px' : '15px',
                      fontSize: isMobile ? '16px' : '17px',
                      fontWeight: 900,
                      cursor: resetLoading ? 'not-allowed' : 'pointer',
                      opacity: resetLoading ? 0.7 : 1,
                      marginBottom: '12px',
                    }}
                  >
                    {resetLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setForgotPasswordMode(false);
                      setResetError('');
                    }}
                    style={{
                      width: '100%',
                      backgroundColor: 'transparent',
                      color: '#fdf0dc',
                      border: '1.5px solid #fdf0dc',
                      borderRadius: '12px',
                      padding: isMobile ? '14px' : '13px',
                      fontSize: isMobile ? '14px' : '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ← Back to Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        <footer style={{ textAlign: 'center', backgroundColor: '#6A2301', color: '#ffffff', padding: isMobile ? '12px 16px' : '14px 16px', fontSize: isMobile ? '13px' : '15px', fontWeight: 600 }}>
          ©2026 Smart Grama Sewa
        </footer>
      </div>
    );
  }

  // MAIN LOGIN UI
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Background */}
      <div
        style={{
          flex: 1,
          backgroundImage: 'url(/background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <div
          style={{ 
            position: 'absolute', inset: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            pointerEvents: 'none'
          }}
        />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 10, padding: isMobile ? '16px 20px' : '20px 24px' }}>
          <img
            src="/logo.png"
            alt="Smart Grama Sewa"
            style={{ height: isMobile ? '100px' : '120px', width: 'auto' }}
          />
        </div>

        {/* Main centered section */}
        <div 
          style={{
            position: 'relative',
            zIndex: 10,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '0 16px 40px' : '0 16px 48px',
          }}
        >

          {/* "Sign in" title */}
          <h1 style={{
            fontSize: isMobile ? '36px' : '48px',
            fontWeight: 900,
            color: '#332421',
            letterSpacing: '-1px',
            marginBottom: isMobile ? '20px' : '28px',
            textAlign: 'center',
          }}>
            Sign in
          </h1>

          {/* Semi-transparent brown card */}
          <div style={{
            width: '90%',
            maxWidth: '440px',          
            backgroundColor: 'rgba(106, 35, 1, 0.6)',
            borderRadius: isMobile ? '20px' : '24px',
            padding: isMobile ? '24px 20px' : '32px 32px 28px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          }}>

            {/* Error banner */}
            {error && (
              <div style={{
                marginBottom: '18px',
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: '12px',
                padding: '11px 16px',
                color: '#fde8c8',
                fontSize: isMobile ? '13px' : '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span>⚠</span> {error}
              </div>
            )}

            {/* User name or email */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ 
                display: 'block', 
                color: '#fdf0dc', 
                fontSize: isMobile ? '14px' : '13px', 
                fontWeight: 700, 
                marginBottom: '7px' 
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
                display: 'block', 
                color: '#fdf0dc', 
                fontSize: isMobile ? '14px' : '13px', 
                fontWeight: 700, 
                marginBottom: '7px' 
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  autoComplete="current-password"
                  required
                  style={{...inputStyle, paddingRight: '48px'}}
                  onFocus={(e) => (e.target.style.borderColor = '#F5C400')}
                  onBlur={(e)  => (e.target.style.borderColor = 'transparent')}
                />
                {/* Eye toggle button */}
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

            {/* Keep me signed in & Forgot password */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: '20px',
              flexDirection: 'row',
              gap: '12px',
            }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '14px' : '13px',
                  fontWeight: 600,
                  color: '#fdf0dc',
                  flexShrink: 0,
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    accentColor: '#F5C400'
                  }}
                />
                Keep me signed in
              </label>
              <button
                onClick={() => setForgotPasswordMode(true)}
                style={{
                  fontSize: isMobile ? '14px' : '13px',
                  fontWeight: 700,
                  color: '#fdf0dc',
                  textDecoration: 'none',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => (e.target.style.color = '#ffffff')}
                onMouseOut={(e)  => (e.target.style.color = '#fdf0dc')}
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: loading ? '#4a5e72' : '#5a6e82',
                color: '#F5C400',
                border: 'none',
                borderRadius: '12px',
                padding: isMobile ? '16px' : '15px',
                fontSize: isMobile ? '16px' : '17px',
                fontWeight: 900,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.15s',
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
              ) : (
                'Sign in'
              )}
            </button>

            {/* New here */}
            <p style={{ 
              textAlign: 'center', 
              color: '#fdf0dc', 
              fontSize: isMobile ? '14px' : '13px', 
              fontWeight: 600, 
              margin: '0 0 12px' 
            }}>
              New here ?
            </p>

            {/* Create your account */}
            <a
              href="/signup-select"
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'center',
                backgroundColor: '#F5C400',
                color: '#3d2a00',
                borderRadius: '12px',
                padding: isMobile ? '16px' : '15px',
                fontSize: isMobile ? '16px' : '17px',
                fontWeight: 900,
                textDecoration: 'none',
                transition: 'background-color 0.15s',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                boxSizing: 'border-box',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#d4a800')}
              onMouseOut={(e)  => (e.currentTarget.style.backgroundColor = '#F5C400')}
            >
              Create your account
            </a>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          backgroundColor: '#6A2301',
          color: '#ffffff',
          padding: isMobile ? '12px 16px' : '14px 16px',
          fontSize: isMobile ? '13px' : '15px',
          fontWeight: 600,
        }}>
        ©2026 Smart Grama Sewa
      </footer>

      {/* Spin keyframe */}
      <style>{`
        @keyframes spin { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }
      `}</style>

    </div>
  );
};

export default Login;