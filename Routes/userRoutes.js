const express = require("express");
const {
  sendOtp,
  signup,
  login,
} = require("../Controllers/userController");

const router = express.Router();

router.post("/send-otp", sendOtp); // Send OTP for phone number-based login/signup
router.post("/signup", signup); // Signup user with email, phone, and password
router.post("/login", login); // Login with email/password or phone/OTP


module.exports = router;
