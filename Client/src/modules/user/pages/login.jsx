import React, { useState } from 'react';

const Login = () => {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [rememberMe, setRememberMe]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

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
      console.log('Login attempt:', { email, password, rememberMe });
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      setError('Incorrect credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Full-screen background image ── */}
      <div
        className="flex-1 flex flex-col relative"
        style={{
          backgroundImage: 'url(/background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Subtle warm tint over background */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(180, 120, 60, 0.12)' }}
        />

        {/* Logo */}
        <div className="relative z-10 p-5">
          <img
            src="/logo.png"
            alt="Smart Grama Sewa"
            className="mx-auto h-10 w-auto"
          />
        </div>

        {/* Main centered section */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-12">

          {/* "Sign in" title */}
          <h1
            className="text-5xl font-black mb-8 tracking-tight"
            style={{ color: '#1e1200' }}
          >
            Sign in
          </h1>

          {/* Semi-transparent brown card — matches screenshot */}
          <div
            className="w-full max-w-md rounded-3xl px-8 py-8 shadow-2xl"
            style={{ backgroundColor: 'rgba(140, 80, 30, 0.82)' }}
          >

            {/* Error banner */}
            {error && (
              <div
                className="mb-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fde8c8' }}
              >
                <span>⚠</span> {error}
              </div>
            )}

            {/* User name or email */}
            <div className="mb-5">
              <label
                className="block text-sm font-bold mb-2"
                style={{ color: '#fdf0dc' }}
              >
                User name or email
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                autoComplete="username"
                required
                className="w-full rounded-xl px-4 py-3.5 text-base font-semibold outline-none transition-all"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#1e1200',
                  border: '2.5px solid transparent',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#F5C400')}
                onBlur={(e)  => (e.target.style.borderColor = 'transparent')}
              />
            </div>

            {/* Password */}
            <div className="mb-5">
              <label
                className="block text-sm font-bold mb-2"
                style={{ color: '#fdf0dc' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl px-4 py-3.5 pr-12 text-base font-semibold outline-none transition-all"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#1e1200',
                    border: '2.5px solid transparent',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#F5C400')}
                  onBlur={(e)  => (e.target.style.borderColor = 'transparent')}
                />
                {/* Eye toggle button */}
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: '4px' }}
                >
                  {showPassword ? (
                    /* Eye-slash (hide) */
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    /* Eye (show) */
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Keep me signed in + Forgot password */}
            <div className="flex items-center justify-between mb-5">
              <label
                className="flex items-center gap-2 cursor-pointer select-none text-sm font-semibold"
                style={{ color: '#fdf0dc' }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                  style={{ accentColor: '#F5C400' }}
                />
                Keep me signed in
              </label>
              <a
                href="/forgot-password"
                className="text-sm font-bold transition-colors"
                style={{ color: '#fdf0dc' }}
                onMouseOver={(e) => (e.target.style.color = '#ffffff')}
                onMouseOut={(e)  => (e.target.style.color = '#fdf0dc')}
              >
                Forgot password?
              </a>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full rounded-xl py-3.5 text-lg font-black transition-all
                duration-150 shadow-md mb-5 flex items-center justify-center gap-2
                disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#5a6e82', color: '#F5C400' }}
              onMouseOver={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#4a5e72'; }}
              onMouseOut={(e)  => { if (!loading) e.currentTarget.style.backgroundColor = '#5a6e82'; }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="#F5C400" strokeWidth="4" />
                    <path className="opacity-75" fill="#F5C400"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>

            {/* New here */}
            <p
              className="text-center text-sm font-semibold mb-3"
              style={{ color: '#fdf0dc' }}
            >
              New here ?
            </p>

            {/* Create your account ) */}
            <a
              href="/signup"
              className="block w-full text-center rounded-xl py-3.5 text-lg font-black
                transition-all duration-150 shadow-md"
              style={{ backgroundColor: '#F5C400', color: '#3d2a00' }}
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
        className="text-center py-4 text-sm font-semibold text-white"
        style={{ backgroundColor: '#6A2301' }}
      >
        ©2026 Smart Grama Sewa
      </footer>

    </div>
  );
};

export default Login;