// config/connectDB.js

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const dbURI = `${process.env.MONGODB_URI}/${process.env.MONGODB_DIR}`;
    const conn = await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(
      `✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`
    );
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
