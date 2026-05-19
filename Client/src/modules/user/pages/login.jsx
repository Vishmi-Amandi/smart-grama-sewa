import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth } from '../../../firebase';

// Icons Component
const Icon = ({ d, size = 20, color = 'currentColor', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

// Icon paths
const Icons = {
  mail: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M3 10h18',
  warning: 'M12 9v4 M12 17h.01 M12 2a10 10 0 100 20 10 10 0 000-20z',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 8a4 4 0 100 8 4 4 0 000-8z',
  eyeOff: 'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94 M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19 M1 1l22 22',
  spinner: 'M21 12a9 9 0 11-6.219-8.56',
  arrowLeft: 'M19 12H5 M12 19l-7-7 7-7',
  check: 'M20 6L9 17l-5-5',
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Forgot Password states
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  // Email verification states
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const navigate = useNavigate();

  // Detect mobile screen
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load saved "Remember Me" preference
  useEffect(() => {
    const savedPreference = localStorage.getItem('rememberMe');
    if (savedPreference === 'true') {
      setRememberMe(true);
    }
  }, []);

  // Save "Remember Me" preference when changed
  const handleRememberMeChange = (e) => {
    const checked = e.target.checked;
    setRememberMe(checked);
    localStorage.setItem('rememberMe', checked);
  };

  // Resend verification email
  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, unverifiedEmail, password);
      await sendEmailVerification(userCredential.user);
      await auth.signOut();
      setError('Verification email resent! Please check your inbox.');
      setShowVerificationMessage(false);
    } catch (err) {
      setError('Could not resend verification. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowVerificationMessage(false);

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
      // Set persistence based on "Remember Me" checkbox
      if (rememberMe) {
        await setPersistence(auth, browserLocalPersistence);
      } else {
        await setPersistence(auth, browserSessionPersistence);
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setUnverifiedEmail(email);
        setShowVerificationMessage(true);
        setError('');
        setLoading(false);
        return;
      }

      console.log('Login successful:', user.email);
      navigate('/dashboard');
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

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      setResetError('Please enter your email address');
      return;
    }

    setResetLoading(true);
    setResetError('');

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetEmailSent(true);
    } catch (err) {
      console.error('Password reset error:', err);
      switch (err.code) {
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

  const handleBackToLogin = () => {
    setForgotPasswordMode(false);
    setResetEmailSent(false);
    setResetError('');
    setResetEmail('');
  };

  // FORGOT PASSWORD UI
  if (forgotPasswordMode) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/background.jpg)' }}>
          <div className="absolute inset-0 bg-white/60 pointer-events-none" />

          <div className="relative z-10 p-4 sm:p-6">
            <img src="/logo.png" alt="Smart Grama Sewa" className="h-24 sm:h-28 w-auto" />
          </div>

          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-10 sm:pb-12">
            <h1 className="text-3xl sm:text-4xl font-black text-[#332421] mb-5 sm:mb-7 text-center">
              Reset Password
            </h1>

            <div className="w-[90%] max-w-md bg-[#6a2301]/60 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl">
              {resetEmailSent ? (
                <>
                  <div className="text-center mb-6">
                    <div className="mb-4 flex justify-center">
                      <Icon d={Icons.mail} size={48} color="#F5C400" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-lg font-extrabold text-[#fdf0dc] mb-3">Check Your Email</h2>
                    <p className="text-sm text-[#fdf0dc] leading-relaxed">
                      We've sent a password reset link to <strong>{resetEmail}</strong>.<br />
                      Please check your inbox and follow the instructions.
                    </p>
                  </div>
                  <button
                    onClick={handleBackToLogin}
                    className="w-full bg-[#F5C400] text-[#3d2a00] rounded-xl py-3.5 sm:py-3 text-base sm:text-sm font-bold cursor-pointer transition-colors hover:bg-[#d4a800]"
                  >
                    Back to Sign In
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[#fdf0dc] text-sm mb-5 text-center">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>

                  {resetError && (
                    <div className="mb-4 bg-white/15 rounded-xl px-4 py-3 text-[#fde8c8] text-xs font-semibold flex items-center gap-2">
                      <Icon d={Icons.warning} size={14} color="#fde8c8" /> {resetError}
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="block text-[#fdf0dc] text-sm font-bold mb-2">Email Address</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full bg-white text-[#1e1200] border-2 border-transparent rounded-xl px-4 py-3.5 sm:py-3 text-base sm:text-sm font-semibold outline-none focus:border-[#F5C400] transition-colors"
                    />
                  </div>

                  <button
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="w-full bg-[#5a6e82] text-[#F5C400] rounded-xl py-4 sm:py-3.5 text-base sm:text-lg font-black cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mb-3 flex items-center justify-center gap-2 transition-colors hover:bg-[#4a5e72]"
                  >
                    {resetLoading ? (
                      <>
                        <Icon d={Icons.spinner} size={18} color="#F5C400" strokeWidth={2.5} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>

                  <button
                    onClick={handleBackToLogin}
                    className="w-full bg-transparent text-[#fdf0dc] border border-[#fdf0dc] rounded-xl py-3.5 sm:py-3 text-sm sm:text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors hover:bg-white/10"
                  >
                    <Icon d={Icons.arrowLeft} size={14} color="#fdf0dc" />
                    Back to Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <footer className="text-center bg-[#6A2301] text-white py-3 px-4 text-sm font-semibold">
          ©2026 Smart Grama Sewa
        </footer>
      </div>
    );
  }

  // MAIN LOGIN UI
  return (
    <div className="min-h-screen flex flex-col">
      {/* Background */}
      <div className="flex-1 relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/background.jpg)' }}>
        <div className="absolute inset-0 bg-white/60 pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 p-4 sm:p-6">
          <img src="/logo.png" alt="Smart Grama Sewa" className="h-24 sm:h-28 w-auto" />
        </div>

        {/* Main centered section */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-10 sm:pb-12">
          {/* Sign in title */}
          <h1 className="text-4xl sm:text-5xl font-black text-[#332421] -tracking-wide mb-5 sm:mb-7 text-center">
            Sign in
          </h1>

          {/* Semi-transparent brown card */}
          <div className="w-[90%] max-w-md bg-[#6a2301]/60 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl">
            {/* Error banner */}
            {error && (
              <div className="mb-4 bg-red-500/20 rounded-xl px-4 py-3 text-[#fde8c8] text-xs font-semibold flex items-center gap-2">
                <Icon d={Icons.warning} size={14} color="#fde8c8" /> {error}
              </div>
            )}

            {/* Email Verification Message */}
            {showVerificationMessage && (
              <div className="mb-4 bg-[#F5C400]/15 rounded-xl p-4 border border-[#F5C400]/50">
                <div className="flex items-center gap-3 mb-3">
                  <Icon d={Icons.mail} size={28} color="#F5C400" />
                  <div>
                    <div className="font-bold text-[#F5C400] mb-1">Email Not Verified</div>
                    <div className="text-xs text-[#fdf0dc]">Please verify your email address to continue.</div>
                  </div>
                </div>
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="w-full bg-[#F5C400] text-[#3d2a00] rounded-xl py-2.5 text-sm font-bold cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors hover:bg-[#d4a800]"
                >
                  {resendLoading ? (
                    <>
                      <Icon d={Icons.spinner} size={14} color="#3d2a00" strokeWidth={2.5} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Resend Verification Email'
                  )}
                </button>
              </div>
            )}

            {/* User name or email */}
            <div className="mb-4">
              <label className="block text-[#fdf0dc] text-sm font-bold mb-2">User name or email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                  setShowVerificationMessage(false);
                }}
                autoComplete="username"
                required
                className="w-full bg-white text-[#1e1200] border-2 border-transparent rounded-xl px-4 py-3.5 sm:py-3 text-base sm:text-sm font-semibold outline-none focus:border-[#F5C400] transition-colors"
              />
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block text-[#fdf0dc] text-sm font-bold mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                    setShowVerificationMessage(false);
                  }}
                  autoComplete="current-password"
                  required
                  className="w-full bg-white text-[#1e1200] border-2 border-transparent rounded-xl px-4 py-3.5 sm:py-3 text-base sm:text-sm font-semibold outline-none focus:border-[#F5C400] transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer text-gray-400 p-1 hover:text-gray-600 transition-colors"
                >
                  <Icon d={showPassword ? Icons.eyeOff : Icons.eye} size={18} color="#888" />
                </button>
              </div>
            </div>

            {/* Keep me signed in & Forgot password */}
            <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-[#fdf0dc] hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={handleRememberMeChange}
                  className="w-4 h-4 rounded accent-[#F5C400] cursor-pointer"
                />
                Keep me signed in
              </label>
              <button
                onClick={() => {
                  setForgotPasswordMode(true);
                  setResetEmail(email);
                }}
                className="text-sm font-bold text-[#fdf0dc] hover:text-white bg-none border-none cursor-pointer transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#5a6e82] text-[#F5C400] rounded-xl py-4 sm:py-3.5 text-base sm:text-lg font-black cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mb-5 flex items-center justify-center gap-2 transition-all hover:bg-[#4a5e72] hover:scale-[1.02] shadow-md"
            >
              {loading ? (
                <>
                  <Icon d={Icons.spinner} size={18} color="#F5C400" strokeWidth={2.5} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#fdf0dc]/30 to-transparent"></div>
              <div className="flex items-center gap-2 px-4">
                <div className="w-5 h-px bg-[#fdf0dc]/30"></div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#fdf0dc]/50">
                  or
                </span>
                <div className="w-5 h-px bg-[#fdf0dc]/30"></div>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#fdf0dc]/30 to-transparent"></div>
            </div>

            {/* Create your account button */}
            <a
              href="/signup-select"
              className="block w-full text-center bg-[#F5C400] text-[#3d2a00] rounded-xl py-4 sm:py-3.5 text-base sm:text-lg font-black no-underline transition-all hover:bg-[#d4a800] hover:scale-[1.02] shadow-md"
            >
              Create new account
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center bg-[#6A2301] text-white py-3 px-4 text-sm font-semibold">
        © 2026 Smart Grama Sewa. All rights reserved.
      </footer>

      {/* Add animation styles */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;