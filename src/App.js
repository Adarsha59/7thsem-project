import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";

import FaceAuthFlow from "./pages/FaceAuthFlow";
import DeleteUser from "./pages/DeleteUser";
import Register from "./pages/Register";
import WelcomePage from "./pages/face/[face]";
import Check from "./pages/Check";
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/hi" element={<Check />} />
        {/* <Route path="/" element={<FacepassFlow />} /> */}

        <Route path="/face-detection" element={<FaceAuthFlow />} />
        <Route path="/register" element={<Register />} />
        <Route path="/delete-user" element={<DeleteUser />} />
        <Route path="/face/:face" element={<WelcomePage />} />
        {/* Add more routes as needed */}
      </Routes>
    </Router>
  );
};

export default App;
