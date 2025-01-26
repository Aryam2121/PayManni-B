const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Send OTP for login or signup
// Send OTP for login or signup
exports.sendOtp = async (req, res) => {
    const { phoneNumber } = req.body;
  
    try {
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required." });
      }
  
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
  
      // Find or create a user with phoneNumber and save OTP
      let user = await User.findOne({ phoneNumber });
      if (!user) {
        // Only save phoneNumber and OTP if user doesn't exist, no email or password required here
        user = new User({ phoneNumber, otp });
      } else {
        user.otp = otp; // Update OTP if user already exists
      }
      await user.save(); // Save user with phoneNumber and otp only
  
      // Send OTP using Twilio
      await client.messages.create({
        body: `Your OTP is: ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });
  
      res.status(200).json({ message: "OTP sent successfully to your phone." });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ message: "Error sending OTP.", error });
    }
  };
  

// Register User
exports.signup = async (req, res) => {
    const { email, phoneNumber, password, confirmPassword, otp } = req.body;
  
    if (!email || !phoneNumber || !password || !confirmPassword || !otp) {
      return res.status(400).json({ message: "All fields are required." });
    }
  
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }
  
    try {
      const user = await User.findOne({ phoneNumber });
  
      if (!user || user.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP or phone number." });
      }
  
      // Hash password before saving
      const hashedPassword = await bcrypt.hash(password, 10);
      user.email = email;
      user.password = hashedPassword;
      user.otp = undefined; // Clear OTP after use
      await user.save();
  
      res.status(201).json({ message: "User registered successfully." });
    } catch (error) {
      console.error("Signup Error:", error);
      res.status(500).json({ message: "Error during signup.", error });
    }
  };
  

// Login User (Email/Password or Phone/OTP)
exports.login = async (req, res) => {
  const { email, password, phoneNumber, otp } = req.body;

  try {
    if (email && password) {
      // Login with email and password
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password." });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
      return res.status(200).json({ message: "Login successful.", token });
    } else if (phoneNumber && otp) {
      // Login with phone number and OTP
      const user = await User.findOne({ phoneNumber });
      if (!user) {
        return res.status(404).json({ message: "User with this phone number does not exist." });
      }

      if (user.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP." });
      }

      user.otp = undefined; // Clear OTP after successful login
      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
      return res.status(200).json({ message: "Login successful.", token });
    } else {
      return res.status(400).json({ message: "Invalid login credentials. Provide email & password or phone number & OTP." });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Error during login.", error });
  }
};
