"use client";
import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

// const CHALLENGE_EXPRESSIONS = ["happy", "sad", "angry", "surprised", "neutral"];
const CHALLENGE_EXPRESSIONS = ["happy", "neutral"];

const HOLD_DURATION = 1000;
const CHALLENGE_TIME = 10000;
const TOTAL_ROUNDS = 2;

const FaceSpoofingChallenge = ({ onSuccess }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [usedExpressions, setUsedExpressions] = useState([]);
  const [result, setResult] = useState(null);
  const [timer, setTimer] = useState(CHALLENGE_TIME / 1000);
  const [isRunning, setIsRunning] = useState(false);
  const [currentExpression, setCurrentExpression] = useState({
    label: "-",
    confidence: 0,
  });
  const [challengeStep, setChallengeStep] = useState(1);
  const [round, setRound] = useState(1);

  useEffect(() => {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    ]);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    if (timer <= 0) {
      setResult(`⏰ Time's up! You didn't complete round ${round}.`);
      setTimeout(stopCamera, 2000);
      setIsRunning(false);
      return;
    }
    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, timer, round]);

  const startCamera = async () => {
    setResult(null);
    setCurrentExpression({ label: "-", confidence: 0 });
    setUsedExpressions([]);
    setChallengeStep(1);
    setRound(1);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    streamRef.current = stream;
    if (videoRef.current) videoRef.current.srcObject = stream;
    setIsCameraActive(true);
    setTimeout(() => {
      issueChallenge([], 1);
    }, 600);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setChallenge(null);
    setUsedExpressions([]);
    setIsRunning(false);
    setTimer(CHALLENGE_TIME / 1000);
    setCurrentExpression({ label: "-", confidence: 0 });
    setChallengeStep(1);
    setRound(1);
  };

  const issueChallenge = (used, roundNum) => {
    const available = CHALLENGE_EXPRESSIONS.filter((e) => !used.includes(e));
    const expr = available[Math.floor(Math.random() * available.length)];
    setChallenge(expr);
    setUsedExpressions([...used, expr]);
    setResult(null);
    setTimer(CHALLENGE_TIME / 1000);
    setIsRunning(true);
    detectChallenge(expr, used, roundNum);
  };

  const detectChallenge = (targetExpr, used, roundNum) => {
    let animationId;
    let startTime = Date.now();
    let holdStart = null;
    let challengeResolved = false;

    const detect = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvas, displaySize);

      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detection) {
        faceapi.draw.drawDetections(
          canvas,
          faceapi.resizeResults(detection, displaySize)
        );
        faceapi.draw.drawFaceLandmarks(
          canvas,
          faceapi.resizeResults(detection, displaySize)
        );

        const expressions = detection.expressions;
        let maxLabel = null,
          maxVal = 0;
        for (let label of CHALLENGE_EXPRESSIONS) {
          if (expressions[label] > maxVal) {
            maxVal = expressions[label];
            maxLabel = label;
          }
        }
        setCurrentExpression({ label: maxLabel, confidence: maxVal });

        if (maxLabel === targetExpr && maxVal > 0.6) {
          if (!holdStart) holdStart = Date.now();
          if (Date.now() - holdStart >= HOLD_DURATION && !challengeResolved) {
            challengeResolved = true;
            if (used.length === 1) {
              setChallengeStep(2);
              issueChallenge(used, roundNum);
            } else {
              if (roundNum < TOTAL_ROUNDS) {
                setResult(`✅ Round ${roundNum} complete! Next round...`);
                setIsRunning(false);
                setTimeout(() => {
                  setChallengeStep(1);
                  setUsedExpressions([]);
                  setRound(roundNum + 1);
                  issueChallenge([], roundNum + 1);
                }, 1500);
              } else {
                setResult(`🎉 Success! Spoofing challenge passed.`);
                setIsRunning(false);
                setTimeout(() => {
                  if (onSuccess) onSuccess();
                }, 1500);
              }
            }
            return;
          }
        } else {
          holdStart = null;
        }
      } else {
        setCurrentExpression({ label: "-", confidence: 0 });
        holdStart = null;
      }

      if (Date.now() - startTime > CHALLENGE_TIME && !challengeResolved) {
        challengeResolved = true;
        setResult(
          `⏰  Mr Robot Time's up! You didn't complete round ${roundNum}.`
        );
        setIsRunning(false);
        setTimeout(stopCamera, 2000);
        return;
      }

      animationId = requestAnimationFrame(detect);
    };

    detect();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  };

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg,#f7f7f7 60%,#e0eaff 100%)",
        fontFamily: "Inter, Arial, sans-serif",
        padding: "1rem",
      }}
    >
      {isRunning && (
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 0,
            right: 0,
            textAlign: "center",
            zIndex: 10,
            fontSize: "2.2rem",
            fontWeight: "bold",
            color: "#e00",
            letterSpacing: "2px",
            textShadow: "0 2px 12px #fff,0 0 2px #e00",
            animation: "pulse 1s infinite",
            userSelect: "none",
          }}
        >
          {timer} <span style={{ fontSize: "1.1rem" }}>seconds left</span>
        </div>
      )}
      <div style={{ position: "relative" }}>
        <video
          ref={videoRef}
          width="480"
          height="360"
          autoPlay
          muted
          playsInline
          style={{
            borderRadius: "18px",
            background: "#222",
            boxShadow: "0 6px 24px #0002",
          }}
        />
        <canvas
          ref={canvasRef}
          width="480"
          height="360"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            pointerEvents: "none",
            borderRadius: "18px",
          }}
        />
      </div>
      <div
        style={{
          position: "relative",
          zIndex: 2,
          background: "rgba(255,255,255,0.98)",
          padding: "2rem 2.5rem",
          borderRadius: "1.5rem",
          marginTop: "2rem",
          minWidth: 380,
          textAlign: "center",
          boxShadow: "0 8px 32px #0001",
          userSelect: "none",
        }}
      >
        {isRunning && (
          <div
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              color: "#0070f3",
              marginBottom: "0.5rem",
              letterSpacing: "1px",
            }}
          >
            Round <span style={{ fontSize: "1.5rem" }}>{round}</span> /{" "}
            {TOTAL_ROUNDS}
          </div>
        )}
        {!isCameraActive && !result && (
          <button
            onClick={startCamera}
            style={{
              padding: "1rem 2.5rem",
              fontSize: "1.3rem",
              borderRadius: "0.7rem",
              border: "none",
              backgroundColor: "#0070f3",
              color: "white",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,112,243,0.16)",
              fontWeight: 700,
              letterSpacing: "1px",
              transition: "background-color 0.3s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#005bb5")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#0070f3")
            }
          >
            Start Camera
          </button>
        )}
        {isCameraActive && challenge && !result && (
          <>
            <div
              style={{
                fontSize: "1.3rem",
                fontWeight: 700,
                color: "#222",
                marginBottom: "0.7rem",
              }}
            >
              {challengeStep === 1 ? `Please show:` : `Now show:`}
            </div>
            <div
              style={{
                fontSize: "3.5rem",
                fontWeight: "900",
                color: "#ff4500",
                textTransform: "capitalize",
                display: "inline-block",
                margin: "0.2rem 0",
                animation: "bounce 1.4s infinite",
                textShadow: "0 0 18px #ffd7c8, 0 0 8px #ff4500",
                letterSpacing: "2px",
              }}
            >
              {challenge}
            </div>
            <div
              style={{
                fontSize: "1.2rem",
                color: "#555",
                marginTop: "0.5rem",
              }}
            >
              (Hold for <b>1 second</b>)
            </div>
            <div
              style={{
                marginTop: "1.2rem",
                fontSize: "1.15rem",
                fontWeight: 600,
              }}
            >
              <span style={{ color: "#222" }}>Detected:</span>{" "}
              <span style={{ color: "#0070f3" }}>
                {currentExpression.label}{" "}
                {currentExpression.confidence > 0
                  ? `(${(currentExpression.confidence * 100).toFixed(0)}%)`
                  : ""}
              </span>
            </div>
          </>
        )}
        {result && (
          <h1
            style={{
              marginTop: "1.2rem",
              color: result.startsWith("🎉") ? "green" : "#e00",
              fontWeight: "bold",
              fontSize: "1.5rem",
              letterSpacing: "1px",
            }}
          >
            {result}
          </h1>
        )}
      </div>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0);}
          50% { transform: translateY(-16px);}
        }
      `}</style>
    </div>
  );
};

export default FaceSpoofingChallenge;
