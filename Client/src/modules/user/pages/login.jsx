// src/modules/user/pages/Login.jsx
import React, { useState } from 'react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt:', { email, password, rememberMe });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Image Logo in Top-Left Corner */}
      <div className="p-6">
        <img 
          src="/logo.jpg" 
          alt="Smart Grama Sewa" 
          className="px-8 pt-7 pb-2"  // Adjust height as needed
        />
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Login Form Section */}
        <div className="w-full max-w-md bg-white p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Sign in</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50"
                placeholder="User name or email"
                required
              />
            </div>
            
            <div className="mb-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50"
                placeholder="Password"
                required
              />
            </div>

            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="ml-2 text-sm text-gray-600">Keep me signed in</span>
              </label>
              <a href="/forgot-password" className="text-sm text-primary hover:text-secondary">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-secondary text-white font-semibold py-3 px-4 rounded-lg transition duration-300 mb-4"
            >
              Sign in
            </button>
          </form>

          <div className="text-center text-gray-600 text-sm">
            New here?{' '}
            <a href="/signup" className="text-primary hover:text-secondary font-medium">
              Create your account
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-400 text-sm pb-4">
        ©2026 Smart Grama Sewa
      </div>
    </div>
  );
};

export default Login;