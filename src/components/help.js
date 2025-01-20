import React, { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import { useNavigate } from "react-router-dom"; // Hook to navigate between pages

const FaceRecognitionPage = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate(); // Hook to navigate between pages

  useEffect(() => {
    const loadModels = async () => {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      ]);
      startWebcam(); // Start webcam after models are loaded
    };

    const startWebcam = () => {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((error) => console.error("Error accessing webcam:", error));
    };

    loadModels();
  }, []);

  const getLabeledFaceDescriptions = async () => {
    const labels = ["Adarsha", "Messi"]; // Example labels

    return Promise.all(
      labels.map(async (label) => {
        const descriptions = [];
        const img = await faceapi.fetchImage(`/labels/${label}/1.png`);
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (detections) {
          descriptions.push(detections.descriptor);
        }
        return new faceapi.LabeledFaceDescriptors(label, descriptions);
      })
    );
  };

  useEffect(() => {
    if (!videoRef.current) return;

    const handleVideoPlay = async () => {
      const labeledFaceDescriptors = await getLabeledFaceDescriptions();
      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

      if (!canvasRef.current || !videoRef.current) return;
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.width;
      canvas.height = video.height;
      video.parentElement.append(canvas);

      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvas, displaySize);

      const intervalId = setInterval(async () => {
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

        const results = resizedDetections.map((d) =>
          faceMatcher.findBestMatch(d.descriptor)
        );

        let faceDetected = false;
        let matchedFace = null;

        results.forEach((result, i) => {
          const box = resizedDetections[i].detection.box;
          const drawBox = new faceapi.draw.DrawBox(box, {
            label: result.toString(),
          });
          drawBox.draw(canvas);

          if (result.toString() !== "unknown") {
            faceDetected = true;
            matchedFace = result.toString();
          }
        });

        if (faceDetected && matchedFace) {
          // Route to the Known Face page
          navigate(`/know/${matchedFace}`);
        } else {
          // Route to the Unknown Face page
          navigate("/unknown");
        }
      }, 100);

      return () => clearInterval(intervalId);
    };

    videoRef.current.addEventListener("play", handleVideoPlay);
    return () => videoRef.current?.removeEventListener("play", handleVideoPlay);
  }, [navigate]);

  return (
    <div>
      <video
        ref={videoRef}
        width="600"
        height="450"
        autoPlay
        muted
        style={{ position: "absolute", borderRadius: "10px" }}
      />
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", borderRadius: "10px" }}
      />
    </div>
  );
};

export default FaceRecognitionPage;
