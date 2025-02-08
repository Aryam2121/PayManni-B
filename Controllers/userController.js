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
const sendGridMail = require('@sendgrid/mail');
sendGridMail.setApiKey(process.env.SENDGRID_API_KEY); 
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 📌 Send OTP
exports.sendOtp = async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ message: "Phone number is required." });
  if (!/^\+\d{10,15}$/.test(phoneNumber)) return res.status(400).json({ message: "Invalid phone number format." });

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
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
    console.log(`OTP Sent: ${otp} to ${phoneNumber}`); // Debugging log

    await client.messages.create({
      body: `Your OTP is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    res.status(200).json({ message: "OTP sent successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error sending OTP.", error: error.message });
  }
};

// 📌 Signup
exports.signup = async (req, res) => {
  const { name, email, phoneNumber, password, confirmPassword, otp } = req.body;

  try {
    let user;

    // Handle OTP login (Only if phoneNumber and OTP are provided)
    if (phoneNumber && otp) {
      // user = await User.findOne({ phoneNumber });

      console.log("Stored OTP in DB:", user.otp);
      console.log("Stored OTP Expiry in DB:", new Date(user.otpExpiry));
      console.log("Current Time:", new Date());
      console.log("Entered OTP:", otp);

      if (user.otp.toString().trim() !== otp.toString().trim()) {
        return res.status(400).json({ message: "Invalid OTP." });
      }

      if (new Date(user.otpExpiry) < new Date()) {
        return res.status(400).json({ message: "OTP expired." });
      }

      user.otp = null;
      user.otpExpiry = null;
      if (name) user.name = name;
      if (email) user.email = email;
      if (password) user.password = await bcrypt.hash(password, 10);

      await user.save();
    } 
    // Handle email-password signup (If phoneNumber is not provided)
    else if (email && password && confirmPassword) {
      if (password !== confirmPassword) return res.status(400).json({ message: "Passwords do not match." });

      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: "Email already registered." });

      // Create new user with email and password only
      let newUserData = { name, email, password: await bcrypt.hash(password, 10) };

      // Add phoneNumber only if it's not null or undefined
      if (phoneNumber && phoneNumber !== null && phoneNumber !== '') {
        newUserData.phoneNumber = phoneNumber;
      }

      user = await new User(newUserData).save();
    } else {
      return res.status(400).json({ message: "Invalid signup data." });
    }

    const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: "1h" });

    return res.status(201).json({
      message: "User registered successfully.",
      token,
      user: { id: user._id, name: user.name, email: user.email, phoneNumber: user.phoneNumber }
    });
  } catch (error) {
    console.log("Signup Error:", error);
    res.status(500).json({ message: "Signup error.", error: error.message });
  }
};

// Google Signup/Login
exports.googleAuth = async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
    const { email, name, picture } = ticket.getPayload(); // 🔹 Google se name aur profile picture le rahe hain

    let user = await User.findOne({ email });

    if (!user) {
      user = await new User({ name, email, googleId: ticket.getUserId(), profilePicture: picture, authMethod: "google" }).save(); // 🔹 Name & profile picture save kar rahe hain
    }

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ message: "Google auth successful.", token: jwtToken, user: { name: user.name, email: user.email, profilePicture: user.profilePicture } });
  } catch (error) {
    res.status(500).json({ message: "Google authentication failed.", error: error.message });
  }
};



// 📌 Login
exports.login = async (req, res) => {
  const { email, password, phoneNumber, otp } = req.body;

  try {
    let user;

    if (email && password) {
      user = await User.findOne({ email });
      if (!user || !user.password) return res.status(404).json({ message: "User not found or password not set." });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        // Agar password galat ho, toh SendGrid se OTP bhejo email pe
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // Send OTP via SendGrid
        const msg = {
          to: email,  // User's email
          from: 'aryamangupta2121@gmail.com',  // Aapka verified SendGrid email
          subject: 'Your OTP for Login',
          text: `Your OTP is: ${otp}`,
        };

        await sendGridMail.send(msg);

        return res.status(401).json({
          message: "Invalid email or password. OTP sent to your email.",
          otpRequired: true,
        });
      }
    } 
    // Case 2: Phone Number and OTP Login (Ye pehle wale jaise hi hai)
    else if (phoneNumber && otp) {
      user = await User.findOne({ phoneNumber });

      if (!user) return res.status(400).json({ message: "User not found." });

      if (user.otp.toString().trim() !== otp.toString().trim()) {
        return res.status(400).json({ message: "Invalid OTP." });
      }

      if (new Date(user.otpExpiry) < new Date()) {
        return res.status(400).json({ message: "OTP expired." });
      }

      user.otp = null;
      user.otpExpiry = null;
      await user.save();
    } else {
      return res.status(400).json({ message: "Invalid login credentials." });
    }

    const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: "1h" });

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: { id: user._id, name: user.name, email: user.email, phoneNumber: user.phoneNumber }
    });
  } catch (error) {
    console.log("Login Error:", error);
    res.status(500).json({ message: "Login error.", error: error.message });
  }
};