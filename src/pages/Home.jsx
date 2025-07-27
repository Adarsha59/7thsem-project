import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 text-white px-4">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-8 drop-shadow">
        Face Authentication Portal
      </h1>

      <div className="flex flex-col md:flex-row gap-6">
        <Link to="/face-detection">
          <button className="px-8 py-4 bg-white text-blue-700 font-bold rounded-xl shadow-lg hover:bg-gray-100 transition">
            🚪 Open Door
          </button>
        </Link>

        <Link to="/register">
          <button className="px-8 py-4 bg-white text-green-700 font-bold rounded-xl shadow-lg hover:bg-gray-100 transition">
            📝 Register User
          </button>
        </Link>

        <Link to="/delete-user">
          <button className="px-8 py-4 bg-white text-red-700 font-bold rounded-xl shadow-lg hover:bg-gray-100 transition">
            ❌ Delete User
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Home;
