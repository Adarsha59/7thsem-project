// FaceAuthFlow.js
import React, { useState } from "react";
import FaceSpoofingChallenge from "./ncit/FaceSpoofingChallenge.jsx";
import FaceRecognition from "./ncit/FaceRecognition.jsx";

const FaceAuthFlow = () => {
  const [step, setStep] = useState("spoofing"); // "spoofing" or "recognition"

  return (
    <>
      {step === "spoofing" && (
        <FaceSpoofingChallenge onSuccess={() => setStep("recognition")} />
      )}
      {step === "recognition" && <FaceRecognition />}
    </>
  );
};

export default FaceAuthFlow;
