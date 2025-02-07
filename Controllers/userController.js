const User = require("../models/User.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");
const { OAuth2Client } = require("google-auth-library");

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Send OTP
exports.sendOtp = async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ message: "Phone number is required." });
  if (!/^\+\d{10,15}$/.test(phoneNumber)) return res.status(400).json({ message: "Invalid phone number format." });

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    let user = await User.findOne({ phoneNumber });
    if (!user) user = new User({ phoneNumber, otp, otpExpiry });
    else Object.assign(user, { otp, otpExpiry });

    await user.save();
    await client.messages.create({ body: `Your OTP is: ${otp}`, from: process.env.TWILIO_PHONE_NUMBER, to: phoneNumber });
    res.status(200).json({ message: "OTP sent successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error sending OTP.", error: error.message });
  }
};

// Signup
exports.signup = async (req, res) => {
  const { email, phoneNumber, password, confirmPassword, otp } = req.body;
  if (phoneNumber && otp) {
    const user = await User.findOne({ phoneNumber });
    if (!user || user.otp !== otp || user.otpExpiry < new Date())
      return res.status(400).json({ message: "Invalid or expired OTP." });
    
    user.otp = undefined;
    user.otpExpiry = undefined;
    if (email) user.email = email;
    if (password) user.password = await bcrypt.hash(password, 10);
    await user.save();
    return res.status(201).json({ message: "User registered successfully." });
  }
  if (email && password && confirmPassword) {
    if (password !== confirmPassword) return res.status(400).json({ message: "Passwords do not match." });
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already registered." });
    const hashedPassword = await bcrypt.hash(password, 10);
    await new User({ email, password: hashedPassword }).save();
    return res.status(201).json({ message: "User registered successfully." });
  }
  res.status(400).json({ message: "Invalid signup data." });
};

// Google Signup/Login
exports.googleAuth = async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
    const { email, name } = ticket.getPayload();
    let user = await User.findOne({ email });
    if (!user) user = await new User({ email }).save();
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ message: "Google auth successful.", token: jwtToken });
  } catch (error) {
    res.status(500).json({ message: "Google authentication failed.", error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password, phoneNumber, otp } = req.body;
  try {
    if (email && password) {
      const user = await User.findOne({ email });
      if (!user || !user.password) return res.status(404).json({ message: "User not found or password not set." });
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: "Invalid email or password." });
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
      return res.status(200).json({ message: "Login successful.", token });
    }
    if (phoneNumber && otp) {
      const user = await User.findOne({ phoneNumber });
      if (!user || user.otp !== otp || user.otpExpiry < new Date())
        return res.status(400).json({ message: "Invalid or expired OTP." });
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
      return res.status(200).json({ message: "Login successful.", token });
    }
    res.status(400).json({ message: "Invalid login credentials." });
  } catch (error) {
    res.status(500).json({ message: "Login error.", error: error.message });
  }
};
