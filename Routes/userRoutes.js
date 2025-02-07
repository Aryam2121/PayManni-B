const express = require("express");
const passport = require("passport");
const { sendOtp, signup, login } = require("../Controllers/userController");

const router = express.Router();

router.post("/send-otp", sendOtp); // Send OTP for phone-based login/signup
router.post("/signup", signup); // Signup user with email, phone, and password
router.post("/login", login); // Login with email/password or phone/OTP

// 🔹 Google Login Route
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// 🔹 Google Callback Route
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/dashboard"); // ✅ Successful login redirect
  }
);

module.exports = router;
