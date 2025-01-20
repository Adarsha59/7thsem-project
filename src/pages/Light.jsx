import axios from "axios";
import React, { useState } from "react";

function Light() {
  // State to toggle light on and off
  const [isLightOn, setIsLightOn] = useState(false);

  // Function to turn on the light
  const Doone = async () => {
    try {
      const response = await axios.post("http://localhost:3001/send", {
        signal: "1",
      }); // Use correct port
      if (response.data.success) {
        console.log("Light On");
        setIsLightOn(true);
      }
    } catch (error) {
      console.error("Error occurred while trying to light", error);
      alert("Error occurred while trying to turn on the light.");
    }
  };

  // Function to turn off the light
  const Dozero = async () => {
    try {
      const response = await axios.post("http://localhost:3001/send", {
        signal: "0",
      }); // Use correct port
      if (response.data.success) {
        console.log("Light Off");
        setIsLightOn(false);
      }
    } catch (error) {
      console.error("Error occurred while trying to light", error);
      alert("Error occurred while trying to turn off the light.");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
      <div className="flex space-x-6">
        {/* Light On Box */}
        <div
          onClick={() => Doone()}
          className={`cursor-pointer p-10 rounded-lg transition-transform transform ${
            isLightOn
              ? "bg-yellow-400 scale-105 shadow-lg"
              : "bg-gray-600 hover:scale-110"
          } text-white text-center font-semibold text-2xl shadow-2xl hover:shadow-2xl`}
        >
          Light On
        </div>

        {/* Light Off Box */}
        <div
          onClick={() => Dozero()}
          className={`cursor-pointer p-10 rounded-lg transition-transform transform ${
            !isLightOn
              ? "bg-gray-600 scale-105 shadow-lg"
              : "bg-gray-400 hover:scale-110"
          } text-white text-center font-semibold text-2xl shadow-2xl hover:shadow-2xl`}
        >
          Light Off
        </div>
      </div>

      {/* Display Light Status */}
      <div className="absolute bottom-10 text-white text-4xl font-bold">
        {isLightOn ? "The light is ON" : "The light is OFF"}
      </div>
    </div>
  );
}

export default Light;
