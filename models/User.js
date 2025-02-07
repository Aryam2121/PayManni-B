const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Will be filled only for Google users
  },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true, // Optional for Google users
  },
  password: {
    type: String,
  },
  otp: String,
  otpExpiry: Date,
  authMethod: {
    type: String,
    enum: ["google", "email-password", "phone-otp"],
    required: true,
  },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next(); 
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("User", userSchema);
