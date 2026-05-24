import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }} className="min-h-screen flex flex-col">
      
      {/* 1. Header/Navbar - Using team variables */}
      <nav style={{ backgroundColor: 'var(--bg-topbar)' }} className="flex justify-between items-center py-6 px-12 shadow-sm">
        <div className="font-bold text-2xl">Smart Grama Sewa</div>
        <div className="space-x-8 font-semibold">
          <Link to="/">Home</Link>
          <a href="#">About</a>
          <a href="#">News & Notices</a>
          <a href="#">Contact</a>
        </div>
        <div className="text-sm">සිංහල || தமிழ் || English</div>
      </nav>

      {/* 2. Hero Section - Using the overlay image style */}
      <main 
        className="flex-grow flex items-center px-12" 
        style={{ 
          backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('/background.jpg')", 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }}
      >
        <div className="max-w-2xl text-white py-20">
          <h1 className="text-5xl font-extrabold mb-6 leading-tight">
            Smart Grama Sewa: Your Village, Digitally Connected.
          </h1>
          <p className="text-lg mb-8">
            Access essential Grama Niladhari services from the comfort of your home. 
            We're bringing the Grama Niladhari office to your fingertips for a 
            faster, more transparent Sri Lanka.
          </p>
          <Link to="/login" className="bg-[#FFCB05] text-black px-10 py-3 rounded-full font-bold hover:bg-yellow-500 transition">
            Get Started
          </Link>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="p-6 bg-[#332421] text-white text-center">
        © 2026 Smart Grama Sewa. All rights reserved.
      </footer>
    </div>
  );
};

export default Home;