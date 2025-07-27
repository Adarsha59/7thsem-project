import React, { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";

const NO_FACE_TIMEOUT = 5000;

const FaceRecognition = ({ onFaceMatched }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let lastFaceTime = Date.now();
    let stopped = false;
    let intervalId = null;
    let detectionTimer = null;

    const stopWebcam = () => {
      stopped = true;
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    };

    const getLabeledFaceDescriptions = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/users/labels");
        const data = await res.json();
        if (!data.success) {
          console.error("Labels API failed:", data);
          return [];
        }
        const labeledDescriptors = await Promise.all(
          data.labels.map(async ({ name }) => {
            const descriptors = [];
            for (let i = 1; i <= 3; i++) {
              const imgUrl = `http://localhost:3001/uploads/${encodeURIComponent(
                name
              )}/${i}.png`;
              try {
                const img = await faceapi.fetchImage(imgUrl);
                const detection = await faceapi
                  .detectSingleFace(img)
                  .withFaceLandmarks()
                  .withFaceDescriptor();
                if (detection) descriptors.push(detection.descriptor);
              } catch (e) {
                console.warn(`Failed loading ${imgUrl}`, e);
              }
            }
            if (descriptors.length === 0) return null;
            return new faceapi.LabeledFaceDescriptors(name, descriptors);
          })
        );
        return labeledDescriptors.filter(Boolean);
      } catch (e) {
        console.error(e);
        return [];
      }
    };

    const startRecognition = async () => {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      ]);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (stopped) return;
        videoRef.current.srcObject = stream;
        await new Promise((res) => (videoRef.current.onloadedmetadata = res));
        videoRef.current.play();
      } catch (e) {
        console.error("Webcam error", e);
        return;
      }

      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.width;
      canvas.height = video.height;

      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvas, displaySize);

      const labeledDescriptors = await getLabeledFaceDescriptions();
      if (labeledDescriptors.length === 0) {
        console.warn("No labeled faces");
        stopWebcam();
        return;
      }

      const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors);

      intervalId = setInterval(async () => {
        if (stopped) return;

        const detections = await faceapi
          .detectAllFaces(video, new faceapi.SsdMobilenetv1Options())
          .withFaceLandmarks()
          .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let faceDetected = false;
        let matchedName = null;

        resizedDetections.forEach((det) => {
          const bestMatch = faceMatcher.findBestMatch(det.descriptor);
          new faceapi.draw.DrawBox(det.detection.box, {
            label: bestMatch.toString(),
            boxColor: bestMatch.label === "unknown" ? "#ff0000" : "#00ff00",
            lineWidth: 3,
          }).draw(canvas);

          if (bestMatch.label !== "unknown") {
            faceDetected = true;
            matchedName = bestMatch.label;
          }
        });

        if (faceDetected && matchedName) {
          lastFaceTime = Date.now();
          if (!detectionTimer) {
            detectionTimer = setTimeout(() => {
              stopWebcam();
              onFaceMatched(matchedName); // report face match here
            }, 2000); // wait 2 sec stable
          }
        } else {
          if (detectionTimer) {
            clearTimeout(detectionTimer);
            detectionTimer = null;
          }
        }
      }, 200);

      const noFaceCheck = setInterval(() => {
        if (Date.now() - lastFaceTime > NO_FACE_TIMEOUT) {
          stopWebcam();
          clearInterval(intervalId);
          clearInterval(noFaceCheck);
          if (detectionTimer) clearTimeout(detectionTimer);
        }
      }, 500);
    };

    startRecognition();

    return () => {
      stopped = true;
      if (intervalId) clearInterval(intervalId);
      if (detectionTimer) clearTimeout(detectionTimer);
      stopWebcam();
    };
  }, [onFaceMatched]);

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg,#121212 60%,#1a1a2e 100%)",
      }}
    >
      <video
        ref={videoRef}
        width={600}
        height={450}
        autoPlay
        muted
        style={{
          position: "absolute",
          borderRadius: 18,
          boxShadow: "0 0 24px 0 #00ff00b0",
          border: "4px solid #00ff00",
          backgroundColor: "#000",
        }}
      />
      <canvas
        ref={canvasRef}
        width={600}
        height={450}
        style={{
          position: "absolute",
          borderRadius: 18,
          pointerEvents: "none",
          boxShadow: "0 0 15px 0 #00ff0060",
        }}
      />
    </div>
  );
};

export default FaceRecognition;
