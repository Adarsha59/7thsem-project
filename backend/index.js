const express = require("express");
const sendRoute = require("./routes/sendRoute");
const getRoute = require("./routes/getRoute");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
const port = 3001;

// Use routes
app.use("/send", sendRoute);
// app.use("/get", getRoute);

// Start server
app.listen(port, () => {
  console.log(`🚀 Express server running on http://localhost:${port}`);
});
