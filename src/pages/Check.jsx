import React, { useState, useEffect, useRef } from "react";

const PasswordForm = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const submitRef = useRef(false);
  const processingEnterRef = useRef(false); // Prevent multiple enter processing

  const handleSubmit = async (e, isAutoSubmit = false) => {
    if (e) e.preventDefault();

    if (submitRef.current) {
      console.log("Submit blocked by submitRef");
      return;
    }

    if (password.length !== 5) {
      alert("Please enter a 5-digit password");
      return;
    }

    setLoading(true);
    submitRef.current = true;

    try {
      console.log("Submitting password:", password);

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Show success alert
      alert("Success! Registration completed successfully.");

      // Clear the form after success
      setPassword("");

      // Clear the backend buffer
      try {
        await fetch("http://localhost:3001/keypad/clear-buffer", {
          method: "POST",
        });
      } catch (err) {
        console.warn("Could not clear backend buffer:", err);
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Registration failed. Please try again.");
    } finally {
      setLoading(false);
      submitRef.current = false;
      processingEnterRef.current = false;
    }
  };

  useEffect(() => {
    const poll = setInterval(async () => {
      if (loading || submitRef.current) {
        return; // Skip polling while processing
      }

      try {
        const res = await fetch("http://localhost:3001/keypad");
        const data = await res.json();

        if (data.success) {
          console.log("=== KEYPAD DEBUG ===");
          console.log("Last Key:", data.lastKey);
          console.log("Input Buffer:", data.inputBuffer);
          console.log("Enter Pressed:", data.enterPressed);
          console.log("Password Length:", data.inputBuffer.length);
          console.log("Loading:", loading);
          console.log("SubmitRef:", submitRef.current);
          console.log("ProcessingEnter:", processingEnterRef.current);
          console.log("===================");

          // Update password only if it's different
          if (data.inputBuffer !== password) {
            setPassword(data.inputBuffer);
          }

          // Handle enter press
          if (data.enterPressed && !processingEnterRef.current) {
            console.log("✓ Enter was pressed");
            processingEnterRef.current = true;

            // Clear the enter flag on backend immediately
            try {
              await fetch("http://localhost:3001/keypad/clear-enter", {
                method: "POST",
              });
              console.log("✓ Enter flag cleared on backend");
            } catch (err) {
              console.warn("Could not clear enter flag:", err);
            }

            if (data.inputBuffer.length === 5) {
              console.log(
                "✓ Password length is 5, proceeding with auto-submit"
              );
              handleSubmit(null, true);
            } else {
              console.log(
                "✗ Password length is not 5:",
                data.inputBuffer.length
              );
              alert("Please enter exactly 5 digits");
              processingEnterRef.current = false;
            }
          }
        }
      } catch (err) {
        console.error("Keypad poll failed", err);
      }
    }, 200); // Reduced polling interval for better responsiveness

    return () => clearInterval(poll);
  }, [password, loading]); // Remove password from dependencies to prevent unnecessary re-renders

  return (
    <form
      onSubmit={(e) => handleSubmit(e, false)}
      style={{
        background: "#121212",
        padding: "40px",
        borderRadius: "12px",
        boxShadow: "0 12px 48px rgba(0,0,0,0.4)",
        maxWidth: "420px",
        margin: "80px auto",
        color: "#f0f0f0",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          marginBottom: "20px",
          fontSize: "26px",
          fontWeight: "700",
          color: "#00d084",
        }}
      >
        Complete Registration
      </h1>

      <p
        style={{
          fontSize: "14px",
          lineHeight: "1.6",
          marginBottom: "30px",
          textAlign: "center",
          color: "#ccc",
        }}
      >
        Enter your 5-digit password using the keypad. Use <strong>*</strong> or{" "}
        <strong>#</strong> to clear, and <strong>D</strong> to submit.
      </p>

      <label
        style={{
          display: "block",
          fontWeight: "600",
          marginBottom: "6px",
          fontSize: "13px",
          color: "#aaa",
        }}
      >
        Name
      </label>
      <input
        type="text"
        readOnly
        placeholder="Auto-filled from previous step"
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: "8px",
          border: "1px solid #444",
          background: "#1c1c1c",
          color: "#777",
          marginBottom: "24px",
          fontSize: "15px",
          cursor: "not-allowed",
        }}
      />

      <label
        style={{
          display: "block",
          fontWeight: "600",
          marginBottom: "6px",
          fontSize: "13px",
          color: "#aaa",
        }}
      >
        Password (5 digits)
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => {
            // Allow manual input but limit to 5 digits
            const value = e.target.value.slice(0, 5);
            setPassword(value);
          }}
          placeholder="5-digit password"
          autoComplete="off"
          maxLength={5}
          style={{
            width: "100%",
            padding: "12px 44px 12px 16px",
            borderRadius: "8px",
            border:
              password.length === 5 ? "2px solid #00d084" : "1px solid #444",
            background: "#1c1c1c",
            color: "#f0f0f0",
            fontSize: "18px",
            letterSpacing: "2px",
            transition: "border-color 0.3s ease",
          }}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          style={{
            position: "absolute",
            top: "50%",
            right: "12px",
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            color: "#888",
            fontSize: "20px",
            cursor: "pointer",
            transition: "color 0.3s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
        >
          {showPassword ? "🙈" : "👁️"}
        </button>
      </div>

      <div
        style={{
          fontSize: "12px",
          color: "#888",
          marginTop: "8px",
          textAlign: "center",
        }}
      >
        {password.length}/5 digits entered
      </div>

      <button
        type="submit"
        disabled={loading || password.length !== 5}
        style={{
          marginTop: "30px",
          width: "100%",
          padding: "14px",
          borderRadius: "8px",
          border: "none",
          background: loading || password.length !== 5 ? "#666" : "#00d084",
          color: loading || password.length !== 5 ? "#999" : "#121212",
          fontWeight: "700",
          fontSize: "17px",
          transition: "all 0.3s ease",
          cursor: loading || password.length !== 5 ? "not-allowed" : "pointer",
        }}
        onMouseEnter={(e) => {
          if (!loading && password.length === 5) {
            e.currentTarget.style.background = "#00b871";
          }
        }}
        onMouseLeave={(e) => {
          if (!loading && password.length === 5) {
            e.currentTarget.style.background = "#00d084";
          }
        }}
      >
        {loading ? "Submitting..." : "Complete Registration"}
      </button>
    </form>
  );
};

export default PasswordForm;
