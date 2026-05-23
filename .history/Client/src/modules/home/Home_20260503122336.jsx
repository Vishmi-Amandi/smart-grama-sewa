import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Header/Navbar */}
      <nav className="flex justify-between items-center p-6 bg-white">
        <div className="font-bold text-xl">Smart Grama Sewa</div>
        <div className="space-x-6">
          <Link to="/">Home</Link>
          <a href="#">About</a>
          <a href="#">News & Notices</a>
          <a href="#">Contact</a>
        </div>
        <div className="text-sm">සිංහල || தமிழ் || English</div>
      </nav>

      {/* 2. Hero Section */}
      <main className="flex-grow bg-cover bg-center flex items-center p-12" style={{ backgroundImage: "url('/path-to-your-image.jpg')" }}>
        <div className="max-w-xl text-white">
          <h1 className="text-5xl font-bold mb-4">Smart Grama Sewa: Your Village, Digitally Connected.</h1>
          <p className="mb-6">Access essential Grama Niladhari services from the comfort of your home. We're bringing the Grama Niladhari office to your fingertips for a faster, more transparent Sri Lanka.</p>
          
          <Link to="/login">
            <button className="bg-yellow-400 text-black px-8 py-3 rounded-full font-bold">
              Get Started
            </button>
          </Link>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="p-4 bg-orange-900 text-white text-center text-sm">
        © 2026 Smart Grama Sewa. All rights reserved.
      </footer>
    </div>
  );
};

export default Home;