// backend/models/User.js

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{5}$/.test(v);
      },
      message: (props) =>
        `${props.value} is not a valid password! Password must be exactly 5 digits.`,
    },
  },
  imagePath: { type: String },
});

module.exports = mongoose.model("User", userSchema);
