import React, { useRef, useState } from "react";
import PasswordForm from "./PasswordForm";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const videoRef = useRef(null);
  const [name, setName] = useState("");
  const [capturedImages, setCapturedImages] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [poseInstruction, setPoseInstruction] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const poses = [
    "Look straight ahead",
    "Turn your head LEFT <---",
    "Turn your head RIGHT --->",
  ];

  const startCamera = async () => {
    setCapturedImages([]);
    setShowPasswordForm(false);
    setPoseInstruction("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      alert("Please enter your name first");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:3001/api/users/check-name?name=${encodeURIComponent(
          trimmedName
        )}`
      );
      const data = await res.json();
      if (data.exists) {
        alert("User with this name already exists. Choose a different name.");
        return;
      }
    } catch {
      alert("Failed to verify username availability.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch {
      alert("Cannot access webcam. Allow camera permission.");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  };

  const startCaptureSequence = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    const images = [];

    for (let i = 0; i < poses.length; i++) {
      setPoseInstruction(poses[i]);
      for (let j = 3; j > 0; j--) {
        setCountdown(j);
        await new Promise((r) => setTimeout(r, 1000));
      }
      setCountdown(null);
      const photoBlob = await capturePhoto();
      images.push(photoBlob);
      setCapturedImages([...images]);
      if (i < poses.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    setIsCapturing(false);
    setPoseInstruction("");
    setShowPasswordForm(true);

    if (videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }
  };

  const handleSubmit = async ({ password }) => {
    if (!password.trim()) {
      alert("Please enter your password");
      return;
    }
    if (capturedImages.length !== poses.length) {
      alert(`You need to capture ${poses.length} photos`);
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("password", password);
    capturedImages.forEach((blob, idx) => {
      formData.append("images", blob, `${idx + 1}.png`);
    });

    try {
      const res = await fetch("http://localhost:3001/api/users/register", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        alert("Registration successful!");
        setName("");
        setCapturedImages([]);
        setShowPasswordForm(false);
        navigate("/"); // 👈 redirect to home
      } else {
        alert("Registration failed: " + (data.message || ""));
      }
    } catch {
      alert("Upload error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (showPasswordForm) {
    return (
      <PasswordForm name={name} onSubmit={handleSubmit} loading={loading} />
    );
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "30px auto",
        padding: 24,
        background: "#222",
        borderRadius: 12,
        color: "#eee",
      }}
    >
      <button
        onClick={() => navigate("/")}
        style={{
          background: "transparent",
          border: "none",
          color: "#4caf50",
          fontSize: 18,
          cursor: "pointer",
          marginBottom: 20,
          textDecoration: "underline",
        }}
      >
        ← Back to Home
      </button>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>
        Face Registration
      </h2>

      <label
        htmlFor="nameInput"
        style={{ display: "block", marginBottom: 6, fontWeight: "600" }}
      >
        Name:
      </label>
      <input
        id="nameInput"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter full name"
        style={{
          width: "100%",
          padding: 12,
          fontSize: 16,
          borderRadius: 6,
          border: "1.5px solid #555",
          backgroundColor: "#333",
          color: "#eee",
          marginBottom: 16,
        }}
        autoComplete="off"
        disabled={isCapturing}
      />

      <button
        onClick={startCamera}
        style={{
          width: "100%",
          padding: 14,
          fontWeight: "700",
          fontSize: 16,
          borderRadius: 8,
          backgroundColor: "#4caf50",
          border: "none",
          color: "white",
          cursor: "pointer",
          marginBottom: 20,
        }}
        disabled={isCapturing || !name.trim()}
      >
        Start Camera
      </button>

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 640,
          margin: "auto",
          borderRadius: 14,
          overflow: "hidden",
          border: "3px solid #444",
          marginBottom: 20,
          backgroundColor: "#000",
        }}
      >
        <video
          ref={videoRef}
          width="640"
          height="480"
          autoPlay
          muted
          playsInline
          style={{ display: "block" }}
        />
        {(countdown !== null || poseInstruction) && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 20, fontWeight: "600" }}>
              {poseInstruction}
            </div>
            {countdown !== null && (
              <div style={{ fontSize: 80, fontWeight: "bold" }}>
                {countdown}
              </div>
            )}
          </div>
        )}
      </div>

      {capturedImages.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3>Captured Photos:</h3>
          <div style={{ display: "flex", gap: 10 }}>
            {capturedImages.map((blob, i) => {
              const url = URL.createObjectURL(blob);
              return (
                <img
                  key={i}
                  src={url}
                  alt={`Capture ${i + 1}`}
                  width={160}
                  height={120}
                  style={{
                    borderRadius: 10,
                    objectFit: "cover",
                    border: "2px solid #4caf50",
                  }}
                  onLoad={() => URL.revokeObjectURL(url)}
                />
              );
            })}
          </div>
        </div>
      )}

      {!isCapturing && (
        <button
          onClick={startCaptureSequence}
          disabled={!videoRef.current || !name.trim()}
          style={{
            marginTop: 16,
            width: "100%",
            padding: 14,
            fontWeight: "700",
            fontSize: 16,
            borderRadius: 8,
            backgroundColor: "#ff9800",
            border: "none",
            color: "white",
            cursor: "pointer",
          }}
        >
          Start 3-Photo Capture
        </button>
      )}
    </div>
  );
};

export default Register;
