import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../../firebase';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
          <button
            onClick={handleLogout}
            className="bg-primary hover:bg-secondary text-white px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Welcome, {user?.email}!
        </h1>
        <p className="text-gray-600">
          You have successfully logged in to Smart Grama Sewa.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;