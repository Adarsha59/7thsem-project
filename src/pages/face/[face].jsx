import React, { useEffect, useState } from "react";
import axios from "axios"; // Make sure to import axios
import { useLocation } from "react-router-dom";

const WelcomePage = () => {
  const location = useLocation();

  const { matchedFace } = location.state || {};
  const [isLightOn, setIsLightOn] = useState(false);
  const [realname, setrealname] = useState(null);
  useEffect(() => {
    const doZero = async () => {
      try {
        if (matchedFace == null) {
          return; // If no matched face, return
        }
        const name = matchedFace.split(" ")[0];
        setrealname(name);
        if (name && name !== "unknown") {
          // Send signal 1
          const response1 = await axios.post("http://localhost:3001/send", {
            signal: "1",
          });
          if (response1.data.success) {
            console.log("Light On");
            setIsLightOn(true);

            // After 5 seconds, send signal 0
            setTimeout(async () => {
              const response2 = await axios.post("http://localhost:3001/send", {
                signal: "0",
              });
              if (response2.data.success) {
                console.log("Light Off");
                setIsLightOn(false);
              }
            }, 5000); // Send signal 0 after 5 seconds
          }
        }
      } catch (error) {
        console.error(
          "Error occurred while trying to control the light",
          error
        );
        alert("Error occurred while trying to control the light.");
      }
    };

    // Run the function when the component loads
    doZero();
  }, [matchedFace]); // Dependency on name, it will re-run when name changes

  return (
    <h1>
      Welcome, {realname} door is {isLightOn}!
    </h1>
  );
};

export default WelcomePage;
