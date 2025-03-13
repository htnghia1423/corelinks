const { Schema, model } = require("mongoose");

const userSchema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  userType: {
    type: String,
    enum: ["free", "premium"],
    default: "free",
  },
});

module.exports = model("User", userSchema);
