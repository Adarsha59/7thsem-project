import React, { useState } from "react";
import FaceSpoofingChallenge from "./ncit/FaceSpoofingChallenge";
import FaceRecognition from "./ncit/FaceAuthFlow";

const FaceEntryFlow = () => {
  const [passedSpoofing, setPassedSpoofing] = useState(false);

  return (
    <div>
      {!passedSpoofing ? (
        <FaceSpoofingChallenge onSuccess={() => setPassedSpoofing(true)} />
      ) : (
        <FaceRecognition />
      )}
    </div>
  );
};

export default FaceEntryFlow;
