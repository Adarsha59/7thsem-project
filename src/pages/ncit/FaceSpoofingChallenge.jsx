// FaceSpoofingChallenge.js
import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

// const CHALLENGE_EXPRESSIONS = ["happy", "sad", "angry", "surprised", "neutral"];
const CHALLENGE_EXPRESSIONS = ["happy", "neutral"];

const HOLD_DURATION = 1000; // ms
const CHALLENGE_TIME = 10000; // ms
const TOTAL_ROUNDS = 2; // Number of rounds for extra security

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

  // Load models
  useEffect(() => {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    ]);
  }, []);

  // Timer effect
  useEffect(() => {
    if (!isRunning) return;
    if (timer <= 0) {
      setResult(`Failed! You didn't complete round ${round} in time.`);
      setTimeout(stopCamera, 2000);
      setIsRunning(false);
      return;
    }
    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, timer, round]);

  // Start camera
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

  // Stop camera
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

  // Pick a random expression not in usedExpressions
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

  // Main challenge logic
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

        // Find the most probable expression
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

        // Check for current challenge
        if (maxLabel === targetExpr && maxVal > 0.6) {
          if (!holdStart) holdStart = Date.now();
          if (Date.now() - holdStart >= HOLD_DURATION && !challengeResolved) {
            challengeResolved = true;
            if (used.length === 1) {
              // First challenge in round passed, issue second
              setChallengeStep(2);
              issueChallenge(used, roundNum);
            } else {
              // Second challenge in round passed
              if (roundNum < TOTAL_ROUNDS) {
                // Start next round
                setResult(`✅ Round ${roundNum} complete! Next round...`);
                setIsRunning(false);
                setTimeout(() => {
                  setChallengeStep(1);
                  setUsedExpressions([]);
                  setRound(roundNum + 1);
                  issueChallenge([], roundNum + 1);
                }, 1500);
              } else {
                // All rounds complete
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

      // If time runs out, fail
      if (Date.now() - startTime > CHALLENGE_TIME && !challengeResolved) {
        challengeResolved = true;
        setResult(`Failed! You didn't complete round ${roundNum} in time.`);
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
        height: "100vh",
        background: "#f7f7f7",
      }}
    >
      <div style={{ position: "relative" }}>
        <video
          ref={videoRef}
          width="480"
          height="360"
          autoPlay
          muted
          playsInline
          style={{ borderRadius: "10px", background: "#222" }}
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
          }}
        />
      </div>
      <div
        style={{
          position: "relative",
          zIndex: 2,
          background: "rgba(255,255,255,0.98)",
          padding: "1.2rem",
          borderRadius: "1rem",
          marginTop: "1.5rem",
          minWidth: 320,
          textAlign: "center",
          boxShadow: "0 2px 12px #0001",
        }}
      >
        {isRunning && (
          <h3 style={{ margin: 0, color: "#e00" }}>
            Timer: {timer} second{timer !== 1 ? "s" : ""}
          </h3>
        )}
        {isRunning && (
          <h4 style={{ margin: 0, color: "#0070f3" }}>
            Round: {round} / {TOTAL_ROUNDS}
          </h4>
        )}
        {!isCameraActive && !result && (
          <button onClick={startCamera}>Start Camera</button>
        )}
        {isCameraActive && challenge && !result && (
          <>
            <h2>
              {challengeStep === 1 ? `Please show: ` : `Now show: `}
              <span style={{ color: "#0070f3" }}>{challenge}</span> expression
              <br />
              (Hold it for 1 second!)
              <br />
              <small>
                You must complete both expressions in each round within 10
                seconds.
              </small>
            </h2>
            <div style={{ marginTop: "0.5rem" }}>
              <b>Your expression:</b>{" "}
              <span style={{ color: "#333" }}>
                {currentExpression.label}{" "}
                {currentExpression.confidence > 0
                  ? `(${(currentExpression.confidence * 100).toFixed(0)}%)`
                  : ""}
              </span>
            </div>
          </>
        )}
        {result && <h1>{result}</h1>}
      </div>
    </div>
  );
};

export default FaceSpoofingChallenge;
