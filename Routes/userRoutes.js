const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken"); // 🔹 JWT import missing tha, add kar diya
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
  async (req, res) => {
    try {
      const user = req.user;

      // 🔹 JWT me `name` aur `email` bhi add kar rahe hain
      const jwtToken = jwt.sign(
        { id: user._id, name: user.name, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({
        message: "Google login successful",
        token: jwtToken,
        user: { id: user._id, name: user.name, email: user.email },
      });
    } catch (error) {
      res.status(500).json({ message: "Google authentication error", error: error.message });
    }
  }
);

module.exports = router;
