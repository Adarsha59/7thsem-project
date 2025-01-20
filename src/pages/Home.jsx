import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 text-white">
      <h1 className="text-4xl font-extrabold mb-6">Face Detection App</h1>
      <div className="space-x-4">
        <Link to="/face-detection">
          <button className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:bg-gray-200 transition">
            🚀 Go Detect
          </button>
        </Link>
        <Link to="/face-recognition">
          <button className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg shadow-lg hover:bg-gray-200 transition">
            🔑 Go Recognition
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Home;
