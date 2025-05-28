import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import FaceDetectionPage from "./pages/FaceDetectionPage";
import FaceRecognitionPage from "./pages/FaceRecognitionPage";
import Light from "./pages/Light";
import WelcomePage from "./pages/face/[face]";
import UnknownPage from "./pages/UnknownPage";
import FaceAuthFlow from "./pages/FaceAuthFlow";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<Home />} /> */}
        <Route path="/" element={<FaceAuthFlow />} />
        <Route path="/face-detection" element={<FaceDetectionPage />} />
        <Route path="/face-recognition" element={<FaceRecognitionPage />} />
        <Route path="/light" element={<Light />} />
        <Route path="/face/:face" element={<WelcomePage />} />
        <Route path="/unknown" element={<UnknownPage />} />
      </Routes>
    </Router>
  );
};

export default App;
