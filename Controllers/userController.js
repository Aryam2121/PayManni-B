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
// 📌 Send OTP
exports.sendOtp = async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ message: "Phone number is required." });
  if (!/^\+\d{10,15}$/.test(phoneNumber)) return res.status(400).json({ message: "Invalid phone number format." });

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Generated OTP: ${otp}`); // Add this log
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min validity
    console.log(`OTP Expiry: ${user.otpExpiry}, Current Time: ${new Date()}`);

 
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

    // Save the user object with OTP and expiry
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
// 📌 Signup
// 📌 Signup
// 📌 Signup
exports.signup = async (req, res) => {
  const { name, email, phoneNumber, password, confirmPassword, otp } = req.body;

  try {
    let user;

    // Phone number and OTP logic
    if (phoneNumber && otp) {
      user = await User.findOne({ phoneNumber });
      if (!user || !user.otp) {
        return res.status(400).json({ message: "OTP not found. Please request a new OTP." });
      }

      // Check if the OTP matches and if it's still valid
      if (user.otp.toString().trim() !== otp.toString().trim()) {
        return res.status(400).json({ message: "Invalid OTP." });
      }

      // Check if OTP has expired
      if (new Date(user.otpExpiry) < new Date()) {
        return res.status(400).json({ message: "OTP expired." });
      }

      user.otp = null;  // Clear OTP after successful validation
      user.otpExpiry = null;  // Clear OTP expiry

      // Update user details
      if (name) user.name = name;
      if (email) user.email = email;
      if (password) user.password = await bcrypt.hash(password, 10); // Hash password if provided

      await user.save();
    }
    // Email and Password signup
    else if (email && password && confirmPassword) {
      if (password !== confirmPassword) return res.status(400).json({ message: "Passwords do not match." });

      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: "Email already registered." });

      // If phoneNumber is empty, set it to null
      let newUserData = { 
        name, 
        email, 
        password: await bcrypt.hash(password, 10) // Hash password
      };

      if (phoneNumber && phoneNumber !== "") {
        newUserData.phoneNumber = phoneNumber;
      } else {
        newUserData.phoneNumber = null;  // Set to null if empty
      }

      user = await new User(newUserData).save();
    } else {
      return res.status(400).json({ message: "Invalid signup data." });
    }

    // Create JWT token
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

    // Case 1: Email and Password Login
    if (email && password) {
      console.log("Trying to login with email:", email);
      console.log("Received password:", password);  // Debugging log

      console.log("Querying for user with email:", email);
      user = await User.findOne({ email: email });
      console.log("User found:", user);

      if (!user || !user.password) {
        console.log("User not found or password not set.");
        return res.status(404).json({ message: "User not found or password not set." });
      }

      console.log("Stored hashed password:", user.password);  // Debugging log

      // Compare password with stored hash
      const isMatch = await bcrypt.compare(password, user.password);
      console.log("Password comparison result:", isMatch);

      if (!isMatch) {
        // Password mismatch, send OTP to email
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

        user.otp = generatedOtp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // Send OTP via SendGrid
        const msg = {
          to: email,
          from: 'aryamangupta2121@gmail.com',
          subject: 'Your OTP for Login',
          text: `Your OTP is: ${generatedOtp}`,
        };

        await sendGridMail.send(msg);

        return res.status(401).json({
          message: "Invalid email or password. OTP sent to your email.",
          otpRequired: true,
        });
      }
    }

    // Case 2: Phone Number and OTP Login
    else if (phoneNumber && otp) {
      user = await User.findOne({ phoneNumber });
      if (!user) return res.status(400).json({ message: "User not found." });

      // Check if OTP exists for phone login
      if (!user.otp) {
        // Generate OTP if not already generated
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

        user.otp = generatedOtp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // Send OTP to phone number (you can use SMS service like Twilio here)
        return res.status(401).json({
          message: "OTP sent to your phone.",
          otpRequired: true,
        });
      }

      // Check OTP validity
      if (user.otp.toString().trim() !== otp.toString().trim()) {
        return res.status(400).json({ message: "Invalid OTP." });
      }

      // Check if OTP expired
      if (new Date(user.otpExpiry) < new Date()) {
        return res.status(400).json({ message: "OTP expired." });
      }

      // Clear OTP after successful validation
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
    } else {
      return res.status(400).json({ message: "Invalid login credentials." });
    }

    // Create JWT token
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
