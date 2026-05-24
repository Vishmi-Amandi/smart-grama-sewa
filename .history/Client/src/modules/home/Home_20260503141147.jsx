import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }} className="min-h-screen flex flex-col">
      
      {/* 1. Header/Navbar - Using team variables */}
      <nav style={{ backgroundColor: 'var(--bg-topbar)' }} className="flex justify-between items-center py-2 px-3 shadow-sm">
        {/* Logo and Name aligned side-by-side */}
        <div className="font-bold text-2xl flex items-center gap-3">
          <img src="/logo2.png" alt="Logo" className="h-15 w-auto" />
          
        </div>
        
        <div className="space-x-8 font-semibold">
          <Link to="/">Home</Link>
          <a href="#">About</a>
          <a href="#">News & Notices</a>
          <a href="#">Contact</a>
        </div>
        <div className="text-sm">
          <a href="#">සිංහල ||</a>
          <a href="#"> தமிழ் ||</a>
          <a href="#"> English</a></div>
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
          <Link to="/login" className="bg-[#FFCB05] text-black px-10 py-3 rounded-full font-bold hover:bg-yellow-500 transition inline-block">
            Get Started
          </Link>
        </div>
      </main>

      {/* 3. Footer */}
      <footer style={{   
        backgroundColor: '#6A2301',
        color: '#fff',
        textAlign: 'center',
        padding: '13px 16px',
        fontSize: '13px',
        fontWeight: 600,
      }}>
        ©2026 Smart Grama Sewa
      </footer>


    </div>
  );
};

export default Home;


   