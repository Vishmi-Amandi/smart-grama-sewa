import React from "react";

const Home = () => {
  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-blue-800 mb-4">
        Smart Grama Sewa
      </h1>
      <p className="text-lg text-gray-600 text-center max-w-xl mb-6">
        A digital platform to access Grama Niladhari services easily.
      </p>
      <div className="space-x-4">
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          Login
        </button>
        <button className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600">
          Register
        </button>
      </div>
    </div>
  );
};

export default Home;