import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FaceRecognition from "./FaceRecognition";
import PasswordPrompt from "./PasswordPrompt";

export default function FaceAuthFlow() {
  const [matchedName, setMatchedName] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFaceMatched = (name) => {
    setMatchedName(name);
  };

  const handleVerify = async (password) => {
    setLoading(true);
    try {
      const res = await fetch(
        "http://localhost:3001/api/users/verify-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: matchedName, password }),
        }
      );
      const data = await res.json();
      if (data.success) {
        alert("✅ Door unlocked!");
        navigate(`/face/${matchedName}`, {
          state: { matchedFace: matchedName },
        });
      } else {
        alert("❌ Wrong password");
      }
    } catch (err) {
      alert("Server error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (matchedName) {
    return (
      <PasswordPrompt
        matchedName={matchedName}
        onVerify={handleVerify}
        loading={loading}
      />
    );
  }

  return <FaceRecognition onFaceMatched={onFaceMatched} />;
}
