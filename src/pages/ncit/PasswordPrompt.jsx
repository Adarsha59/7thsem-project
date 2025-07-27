import React, { useState, useEffect, useRef } from "react";

export default function PasswordPrompt({ matchedName, onVerify, loading }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef(null);
  const lastEnterState = useRef(false);
  const isSubmitting = useRef(false); // Prevent double submission

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Prevent double submission
    if (isSubmitting.current || loading) {
      console.log("Submission blocked - already processing");
      return;
    }

    if (!password.trim()) {
      alert("Please enter your password.");
      return;
    }

    if (!/^\d{5}$/.test(password)) {
      alert("Password must be exactly 5 digits (numbers only).");
      return;
    }

    isSubmitting.current = true;

    try {
      // Clear the enter flag on backend before submitting
      await fetch("http://localhost:3001/keypad/clear-enter", {
        method: "POST",
      });

      // Call the parent's onVerify function
      await onVerify(password);

      // Clear the form after successful verification
      setPassword("");

      // Clear the backend buffer
      await fetch("http://localhost:3001/keypad/clear-buffer", {
        method: "POST",
      });
    } catch (error) {
      console.error("Verification error:", error);
      alert("Verification failed. Please try again.");
    } finally {
      isSubmitting.current = false;
    }
  };

  useEffect(() => {
    const poll = setInterval(async () => {
      // Skip polling while submitting
      if (isSubmitting.current || loading) {
        return;
      }

      try {
        const res = await fetch("http://localhost:3001/keypad");
        const data = await res.json();

        if (data.success) {
          console.log("=== KEYPAD DEBUG (PasswordPrompt) ===");
          console.log("Input Buffer:", data.inputBuffer);
          console.log("Enter Pressed:", data.enterPressed);
          console.log("Last Enter State:", lastEnterState.current);
          console.log("Is Submitting:", isSubmitting.current);
          console.log("Loading:", loading);
          console.log("===================");

          // Update password only if it's different
          if (data.inputBuffer !== password) {
            setPassword(data.inputBuffer || "");
          }

          // Handle enter press detection
          if (data.enterPressed && !lastEnterState.current) {
            console.log("✓ D key detected — preparing to verify password");
            lastEnterState.current = true;

            // Check if password is valid before submitting
            if (data.inputBuffer && /^\d{5}$/.test(data.inputBuffer)) {
              console.log("✓ Valid 5-digit password, verifying");

              if (formRef.current) {
                // Use setTimeout to ensure state updates are processed
                setTimeout(() => {
                  if (formRef.current && !isSubmitting.current) {
                    formRef.current.requestSubmit();
                  }
                }, 100);
              }
            } else {
              console.log("✗ Invalid password length or format");
              alert("Please enter exactly 5 digits before submitting.");

              // Clear the enter flag since we're not submitting
              try {
                await fetch("http://localhost:3001/keypad/clear-enter", {
                  method: "POST",
                });
                lastEnterState.current = false;
              } catch (err) {
                console.warn("Could not clear enter flag:", err);
              }
            }
          } else if (!data.enterPressed && lastEnterState.current) {
            // Reset enter state when backend clears it
            lastEnterState.current = false;
            console.log("✓ Enter state reset");
          }
        }
      } catch (err) {
        console.error("Keypad poll failed:", err);
      }
    }, 300); // Reduced interval for better responsiveness

    return () => clearInterval(poll);
  }, [password, loading]); // Include dependencies

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
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
      <h2
        style={{
          textAlign: "center",
          marginBottom: "20px",
          fontSize: "26px",
          fontWeight: "700",
          color: "#00d084",
        }}
      >
        Welcome Back, {matchedName}
      </h2>

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
        <strong>#</strong> to clear, and <strong>D</strong> to unlock.
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
        Password (5 digits)
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          readOnly
          placeholder="Enter using keypad"
          autoComplete="off"
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
            cursor: "default",
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

      {/* Progress indicator */}
      <div
        style={{
          fontSize: "12px",
          color: password.length === 5 ? "#00d084" : "#888",
          marginTop: "8px",
          textAlign: "center",
          fontWeight: "500",
        }}
      >
        {password.length}/5 digits entered
        {password.length === 5 && " ✓"}
      </div>

      <button
        type="submit"
        disabled={loading || isSubmitting.current || password.length !== 5}
        style={{
          marginTop: "30px",
          width: "100%",
          padding: "14px",
          borderRadius: "8px",
          border: "none",
          background:
            loading || isSubmitting.current || password.length !== 5
              ? "#666"
              : "#4caf50",
          color:
            loading || isSubmitting.current || password.length !== 5
              ? "#999"
              : "#fff",
          fontWeight: "700",
          fontSize: "17px",
          cursor:
            loading || isSubmitting.current || password.length !== 5
              ? "not-allowed"
              : "pointer",
          transition: "all 0.3s ease",
          opacity: loading || isSubmitting.current ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!loading && !isSubmitting.current && password.length === 5) {
            e.currentTarget.style.background = "#45a049";
          }
        }}
        onMouseLeave={(e) => {
          if (!loading && !isSubmitting.current && password.length === 5) {
            e.currentTarget.style.background = "#4caf50";
          }
        }}
      >
        {loading || isSubmitting.current ? "Verifying..." : "Unlock"}
      </button>
    </form>
  );
}
