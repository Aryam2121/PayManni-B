const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const userController = require("../Controllers/userController.js");

// ✅ Send OTP via SMS
router.post("/send-otp", userController.sendOtp);

// ✅ User Signup (Email/Password or Phone/OTP)
router.post("/signup", userController.signup);

// ✅ Google Authentication (Signup/Login)
router.post("/google-auth", userController.googleAuth);

// ✅ User Login (Email/Password or Phone/OTP)
router.post("/login", userController.login);

// ✅ Google OAuth Login
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// ✅ Google OAuth Callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
    try {
      const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

      // Set JWT in an HTTP-only cookie for better security
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Secure in production
        sameSite: "Strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to frontend
      res.redirect(`${process.env.CLIENT_URL}/dashboard`);
    } catch (error) {
      console.error("Google Auth Error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  }
);

// ✅ Logout User
router.get("/logout", (req, res) => {
  req.logout();
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });

    // Clear JWT Cookie
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  });
});

module.exports = router;
