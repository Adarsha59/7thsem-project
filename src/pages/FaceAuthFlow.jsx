// FaceAuthFlow.js
import React, { useState } from "react";
import FaceSpoofingChallenge from "./ncit/FaceSpoofingChallenge.jsx";
import FaceRecognition from "./ncit/FaceRecognition.jsx";

// In your page/component

export default function FaceAuthPage() {
  const [step, setStep] = useState("spoofing");
  return (
    <>
      {step === "spoofing" && (
        <FaceSpoofingChallenge onSuccess={() => setStep("recognition")} />
      )}
      {step === "recognition" && <FaceRecognition />}
    </>
  );
}
