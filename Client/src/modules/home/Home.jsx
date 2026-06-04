import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Home = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation items for bottom bar (mobile) and top bar (desktop)
  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/about', label: 'About', icon: '📖' },
    { path: '/news', label: 'News', icon: '📰' },
    { path: '/contact', label: 'Contact', icon: '📞' },
    { path: '/gn-login', label: 'Login', icon: '🔑' }
  ];

  return (
    <div 
      style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }} 
      className="min-h-screen flex flex-col pb-16 lg:pb-0"
    >
      
      {/* 1. Desktop Header/Navbar (hidden on mobile, visible on desktop) */}
      <nav 
        style={{ backgroundColor: 'var(--bg-topbar)' }} 
        className="hidden lg:flex justify-between items-center py-2 px-4 md:px-6 lg:px-8 shadow-sm"
      >
        {/* Logo */}
        <div className="font-bold text-2xl flex items-center gap-3">
          <img src="/logo2.png" alt="Logo" className="h-12 md:h-14 w-auto" />
        </div>
        
        {/* Desktop Navigation Links */}
        <div className="space-x-6 lg:space-x-8 font-semibold">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={`hover:text-yellow-500 transition ${
                location.pathname === item.path ? 'text-yellow-600 border-b-2 border-yellow-500' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Language Switcher */}
        <div className="text-sm space-x-2">
          <a href="#" className="hover:text-yellow-500">සිංහල</a>
          <span>|</span>
          <a href="#" className="hover:text-yellow-500">தமிழ்</a>
          <span>|</span>
          <a href="#" className="hover:text-yellow-500">English</a>
        </div>
      </nav>

      {/* Mobile Hamburger Header (visible only on mobile) */}
      <nav 
        style={{ backgroundColor: 'var(--bg-topbar)' }} 
        className="lg:hidden flex justify-between items-center py-3 px-4 shadow-sm"
      >
        <div className="font-bold text-xl flex items-center gap-2">
          <img src="/logo2.png" alt="Logo" className="h-10 w-auto" />
        </div>
        
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-2xl p-2"
        >
          ☰
        </button>
      </nav>

      {/* Mobile Menu Dropdown (when hamburger clicked) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-14 left-0 right-0 bg-white shadow-lg z-50 py-4 px-4 flex flex-col space-y-3" 
             style={{ backgroundColor: 'var(--bg-topbar)' }}>
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`py-2 px-3 rounded-lg ${
                location.pathname === item.path ? 'bg-yellow-100 text-yellow-700' : ''
              }`}
            >
              {item.icon} {item.label}
            </Link>
          ))}
          <div className="pt-3 mt-2 border-t border-gray-200">
            <div className="flex justify-around text-sm">
              <a href="#" className="py-1 px-2">සිංහල</a>
              <a href="#" className="py-1 px-2">தமிழ்</a>
              <a href="#" className="py-1 px-2">English</a>
            </div>
          </div>
        </div>
      )}

      {/* 2. Hero Section - Responsive padding and text sizes */}
      <main 
        className="flex-grow flex items-center px-4 sm:px-6 md:px-8 lg:px-12" 
        style={{ 
          backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('/background.jpg')", 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }}
      >
        <div className="max-w-2xl text-white py-12 sm:py-16 md:py-20">
          {/* Responsive heading: xs(2xl) → sm(3xl) → md(4xl) → lg(5xl) */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 sm:mb-6 leading-tight">
            Smart Grama Sewa: <br />
            Your Village, Digitally <br />
            Connected.
          </h1>
          {/* Responsive paragraph: base → sm:lg */}
          <p className="text-sm sm:text-base md:text-lg mb-6 sm:mb-8">
            Access essential Grama Niladhari services from the comfort of your home. 
            We're bringing the Grama Niladhari office to your fingertips for a 
            faster, more transparent Sri Lanka.
          </p>
          {/* Responsive button: smaller on mobile, larger on desktop */}
          <Link 
            to="/gn-login" 
            className="bg-[#FFCB05] text-black px-6 sm:px-8 md:px-10 py-2 sm:py-3 rounded-full font-bold hover:bg-yellow-500 transition inline-block text-sm sm:text-base"
          >
            Get Started
          </Link>
        </div>
      </main>

      {/* 3. Footer (hidden on mobile, visible on desktop) */}
      <footer style={{   
        backgroundColor: '#6A2301',
        color: '#fff',
        textAlign: 'center',
        padding: '13px 16px',
        fontSize: '13px',
        fontWeight: 600,
      }} className="hidden lg:block">
        ©2026 Smart Grama Sewa
      </footer>

      {/* 4. BOTTOM NAVIGATION BAR - Mobile Only (like Instagram/WhatsApp) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.1)] z-50">
        <div className="flex justify-around items-center py-2 px-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
                location.pathname === item.path 
                  ? 'text-yellow-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Home;