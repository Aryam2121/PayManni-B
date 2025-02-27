// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//   },
//   email: {
//     type: String,
//     unique: true,
//     sparse: true, // Allows multiple null values
//   },
//   googleId: {
//     type: String,
//     unique: true,
//     sparse: true, // Will be filled only for Google users
//   },
//   phoneNumber: {
//     type: String,
//     unique: true,
//     sparse: true, // Allows multiple null values
//   },
  
//   password: {
//     type: String,
//     select: false, // Don't return password in queries by default
//   },
//   profilePicture: {
//     type: String, // Store Google profile image URL
//   },
//   otp: {
//     type: String,
//     select: false, // Hide OTP from responses
//   },
//   otpExpiry: {
//     type: Date,
//     select: false, // Hide OTP expiry from responses
//   },
//   authMethod: {
//     type: String,
//     enum: ["google", "email-password", "phone-otp"],
//     default: "email-password",
//   },
// });

// // Hash password before saving
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password") || !this.password) return next();
//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Remove OTP after successful verification
// userSchema.methods.clearOTP = async function () {
//   this.otp = undefined;
//   this.otpExpiry = undefined;
//   await this.save();
// };

// const User = mongoose.model("User", userSchema);
// module.exports = User;
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  name: { type: String },
  email: { type: String, unique: true, sparse: true },
  phoneNumber: { type: String, unique: true, sparse: true },
  username: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
