// const User = require("../models/User.js");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const twilio = require("twilio");
// const { OAuth2Client } = require("google-auth-library");

// const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
// const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// // Send OTP
// exports.sendOtp = async (req, res) => {
//   const { phoneNumber } = req.body;
//   if (!phoneNumber) return res.status(400).json({ message: "Phone number is required." });
//   if (!/^\+\d{10,15}$/.test(phoneNumber)) return res.status(400).json({ message: "Invalid phone number format." });

//   try {
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

//     let user = await User.findOne({ phoneNumber });
//     if (!user) user = new User({ phoneNumber, otp, otpExpiry });
//     else Object.assign(user, { otp, otpExpiry });

//     await user.save();
//     await client.messages.create({ body: `Your OTP is: ${otp}`, from: process.env.TWILIO_PHONE_NUMBER, to: phoneNumber });
//     res.status(200).json({ message: "OTP sent successfully." });
//   } catch (error) {
//     res.status(500).json({ message: "Error sending OTP.", error: error.message });
//   }
// };

// // Signup
// // Signup
// exports.signup = async (req, res) => {
//   const { name, email, phoneNumber, password, confirmPassword, otp } = req.body;

//   try {
//     let user;
    
//     if (phoneNumber && otp) {
//       user = await User.findOne({ phoneNumber });
//       if (!user || user.otp !== otp || user.otpExpiry < new Date())
//         return res.status(400).json({ message: "Invalid or expired OTP." });

//       user.otp = undefined;
//       user.otpExpiry = undefined;
//       if (name) user.name = name;
//       if (email) user.email = email;
//       if (password) user.password = await bcrypt.hash(password, 10);
//       await user.save();
//     } 
//     else if (email && password && confirmPassword) {
//       if (password !== confirmPassword) return res.status(400).json({ message: "Passwords do not match." });

//       const existingUser = await User.findOne({ email });
//       if (existingUser) return res.status(400).json({ message: "Email already registered." });

//       user = await new User({ name, email, password: await bcrypt.hash(password, 10) }).save();
//     } 
//     else {
//       return res.status(400).json({ message: "Invalid signup data." });
//     }

//     const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: "1h" });

//     return res.status(201).json({
//       message: "User registered successfully.",
//       token,
//       user: { id: user._id, name: user.name, email: user.email, phoneNumber: user.phoneNumber }
//     });

//   } catch (error) {
//     res.status(500).json({ message: "Signup error.", error: error.message });
//   }
// };


// // Google Signup/Login
// exports.googleAuth = async (req, res) => {
//   const { token } = req.body;

//   try {
//     const ticket = await googleClient.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
//     const { email, name, picture } = ticket.getPayload(); // 🔹 Google se name aur profile picture le rahe hain

//     let user = await User.findOne({ email });

//     if (!user) {
//       user = await new User({ name, email, googleId: ticket.getUserId(), profilePicture: picture, authMethod: "google" }).save(); // 🔹 Name & profile picture save kar rahe hain
//     }

//     const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

//     res.status(200).json({ message: "Google auth successful.", token: jwtToken, user: { name: user.name, email: user.email, profilePicture: user.profilePicture } });
//   } catch (error) {
//     res.status(500).json({ message: "Google authentication failed.", error: error.message });
//   }
// };



// // Login
// // Login
// exports.login = async (req, res) => {
//   const { email, password, phoneNumber, otp } = req.body;
//   try {
//     let user;

//     if (email && password) {
//       user = await User.findOne({ email });
//       if (!user || !user.password) return res.status(404).json({ message: "User not found or password not set." });

//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) return res.status(401).json({ message: "Invalid email or password." });
//     } 
//     else if (phoneNumber && otp) {
//       user = await User.findOne({ phoneNumber });
//       if (!user || user.otp !== otp || user.otpExpiry < new Date()) 
//         return res.status(400).json({ message: "Invalid or expired OTP." });

//       user.otp = undefined;
//       user.otpExpiry = undefined;
//       await user.save();
//     } 
//     else {
//       return res.status(400).json({ message: "Invalid login credentials." });
//     }

//     const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: "1h" });

//     return res.status(200).json({ 
//       message: "Login successful.", 
//       token,
//       user: { id: user._id, name: user.name, email: user.email, phoneNumber: user.phoneNumber }
//     });

//   } catch (error) {
//     res.status(500).json({ message: "Login error.", error: error.message });
//   }
// };
const User = require("../models/User.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");
const { OAuth2Client } = require("google-auth-library");
const sendGridMail = require("@sendgrid/mail");

sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 📌 Utility Function: Generate OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * 📌 Send OTP via SMS
 */
exports.sendOtp = async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ message: "Phone number is required." });
  if (!/^\+\d{10,15}$/.test(phoneNumber)) return res.status(400).json({ message: "Invalid phone number format." });

  try {
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min validity

    let user = await User.findOne({ phoneNumber });

    if (user && new Date(user.otpExpiry) > new Date()) {
      return res.status(400).json({ message: "Previous OTP is still valid. Please wait." });
    }

    if (!user) {
      user = new User({ phoneNumber, otp, otpExpiry });
    } else {
      user.otp = otp;
      user.otpExpiry = otpExpiry;
    }

    await user.save();

    await client.messages.create({
      body: `Your OTP is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    res.status(200).json({ message: "OTP sent successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error sending OTP.", error: error.message });
  }
};

/**
 * 📌 User Signup (Email/Password or Phone/OTP)
 */
exports.signup = async (req, res) => {
  const { name, email, phoneNumber, password, confirmPassword, otp } = req.body;

  try {
    let user;

    if (phoneNumber && otp) {
      user = await User.findOne({ phoneNumber });
      if (!user || user.otp !== otp) return res.status(400).json({ message: "Invalid or expired OTP." });

      if (new Date(user.otpExpiry) < new Date()) return res.status(400).json({ message: "OTP expired." });

      user.otp = null;
      user.otpExpiry = null;

      if (name) user.name = name;
      if (email) user.email = email;
      if (password) user.password = await bcrypt.hash(password, 10);

      await user.save();
    } else if (email && password && confirmPassword) {
      if (password !== confirmPassword) return res.status(400).json({ message: "Passwords do not match." });

      if (await User.findOne({ email })) return res.status(400).json({ message: "Email already registered." });

      user = new User({
        name,
        email,
        password: await bcrypt.hash(password, 10),
        phoneNumber: null,
      });

      await user.save();
    } else {
      return res.status(400).json({ message: "Invalid signup data." });
    }

    const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(201).json({
      message: "User registered successfully.",
      token,
      user: { id: user._id, name: user.name, email: user.email, phoneNumber: user.phoneNumber },
    });
  } catch (error) {
    res.status(500).json({ message: "Signup error.", error: error.message });
  }
};

/**
 * 📌 Google Authentication (Signup/Login)
 */
exports.googleAuth = async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
    const { email, name, picture, sub: googleId } = ticket.getPayload(); // Using `sub` for Google User ID

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ name, email, googleId, profilePicture: picture, authMethod: "google" });
      await user.save();
    }

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({
      message: "Google auth successful.",
      token: jwtToken,
      user: { name: user.name, email: user.email, profilePicture: user.profilePicture },
    });
  } catch (error) {
    res.status(500).json({ message: "Google authentication failed.", error: error.message });
  }
};

/**
 * 📌 User Login (Email/Password or Phone/OTP)
 */
exports.login = async (req, res) => {
  const { email, password, phoneNumber, otp } = req.body;

  try {
    let user;

    // 📌 Email & Password Login
    if (email && password) {
      user = await User.findOne({ email });

      if (!user) return res.status(404).json({ message: "User not found." });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        // 📌 Generate OTP & Send it to Email (if password is wrong)
        const generatedOtp = generateOtp();
        user.otp = generatedOtp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await sendGridMail.send({
          to: email,
          from: "aryamangupta2121@gmail.com",
          subject: "Your OTP for Login",
          text: `Your OTP is: ${generatedOtp}`,
        });

        return res.status(401).json({ message: "Incorrect password. OTP sent to email.", otpRequired: true });
      }

    } else if (phoneNumber && otp) {
      // 📌 Phone & OTP Login
      user = await User.findOne({ phoneNumber });

      if (!user || user.otp !== otp) return res.status(400).json({ message: "Invalid OTP." });

      if (new Date(user.otpExpiry).getTime() < Date.now()) {
        return res.status(400).json({ message: "OTP expired." });
      }

      // 🔹 Clear OTP after successful login
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
    } else if (email && otp) {
      // 📌 Email & OTP Login (Agar password bhul gaya ho)
      user = await User.findOne({ email });

      if (!user || user.otp !== otp) return res.status(400).json({ message: "Invalid OTP." });

      if (new Date(user.otpExpiry).getTime() < Date.now()) {
        return res.status(400).json({ message: "OTP expired." });
      }

      // 🔹 Clear OTP after successful login
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
    } else {
      return res.status(400).json({ message: "Invalid login credentials." });
    }

    // 📌 Generate JWT Token
    const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({
      message: "Login successful.",
      token,
      user: { id: user._id, name: user.name, email: user.email, phoneNumber: user.phoneNumber },
    });
  } catch (error) {
    res.status(500).json({ message: "Login error.", error: error.message });
  }
};
