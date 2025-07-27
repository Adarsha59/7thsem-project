import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useParams } from "react-router-dom";

const WelcomePage = () => {
  const location = useLocation();
  const params = useParams();
  const matchedFace = location.state?.matchedFace || params.matchedFace;

  const [isLightOn, setIsLightOn] = useState(false);
  const [realname, setRealname] = useState(null);

  useEffect(() => {
    const openDoor = async () => {
      if (!matchedFace) {
        console.warn("No matchedFace");
        return;
      }

      const name = matchedFace.trim();
      setRealname(name);

      if (name.toLowerCase() !== "unknown" && name !== "") {
        try {
          const resOn = await axios.post("http://localhost:3001/send", {
            signal: "1",
          });
          if (resOn.data.success) {
            setIsLightOn(true);
            setTimeout(async () => {
              const resOff = await axios.post("http://localhost:3001/send", {
                signal: "0",
              });
              if (resOff.data.success) setIsLightOn(false);
            }, 4800);
          }
        } catch (err) {
          console.error("Error controlling light", err);
        }
      }
    };

    openDoor();
  }, [matchedFace]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
      {realname && realname.toLowerCase() !== "unknown" ? (
        <div className="bg-black bg-opacity-40 rounded-xl shadow-2xl p-10 text-center">
          <h1 className="text-5xl font-extrabold mb-4">Welcome, {realname}!</h1>
          <p className="text-2xl">
            The door is{" "}
            <span className="font-bold">
              {isLightOn ? "Open ✅" : "Closed 🔒"}
            </span>
          </p>
        </div>
      ) : (
        <div className="bg-black bg-opacity-40 rounded-xl shadow-2xl p-10 text-center">
          <h1 className="text-4xl font-bold mb-2">Access Denied 🚫</h1>
          <p className="text-xl">You are not authorized.</p>
        </div>
      )}
    </div>
  );
};

export default WelcomePage;
