const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/connectDB");

const userRoute = require("./routes/user-route");
const userDeleteRoute = require("./routes/user-delete");
const sendRoute = require("./routes/sendRoute");
const getRoute = require("./routes/getRoute");
const keypadRoute = require("./routes/keypad");
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

connectDB();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Mount both user routes under /api/users
app.use("/api/users", userRoute);
app.use("/api/users", userDeleteRoute);

app.use("/send", sendRoute);
app.use("/get", getRoute);
app.use("/keypad", keypadRoute);
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
