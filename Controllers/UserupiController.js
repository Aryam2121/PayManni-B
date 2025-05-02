const Userupi = require("../models/Userupi");
const jwt = require("jsonwebtoken");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const admin = require("../firebaseAdmin"); // Import the Firebase admin SDK

const JWT_SECRET = process.env.JWT_SECRET;

const getUserById = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await Userupi.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.status(200).json(user); // send full user object
  } catch (err) {
    res.status(500).json({ msg: "Server error", err });
  }
};

const getUserBankData = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await Userupi.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({
      linkedAccounts: user.linkedAccounts || [],
      transactions: user.transactions || [],
      virtualUpiId: user.virtualUpiId || `${user.name}@paymanni`,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", err });
  }
};

// 🚀 Updated registerUser to support both idToken and firebaseUid-based registration
const registerUser = async (req, res) => {
  const { idToken, firebaseUid, email, name,googleIdToken } = req.body;

  try {
    let phoneNumber;
    let upiId;

    // Case 1: Phone auth with ID token
    if (idToken) {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      phoneNumber = decodedToken.phone_number;

      if (!phoneNumber) {
        return res.status(400).json({ msg: "Phone number not found in Firebase token" });
      }

      upiId = `${phoneNumber}@paymanni`;
    }
    // Case 2: Email registration using Firebase UID (manual registration)
    else if (firebaseUid && email) {
      const userRecord = await admin.auth().getUser(firebaseUid);
      upiId = `${email.split("@")[0]}@paymanni`;
      phoneNumber = userRecord.phoneNumber || null;
    }
      // Case 3: Google Sign-In
      else if (googleIdToken) {
        const decodedGoogleToken = await admin.auth().verifyIdToken(googleIdToken);
        finalEmail = decodedGoogleToken.email;
        finalName = decodedGoogleToken.name || "Google User";
        if (!finalEmail) return res.status(400).json({ msg: "Email not found in Google token" });
        upiId = `${finalEmail.split("@")[0]}@paymanni`;
      }
    else {
      return res.status(400).json({ msg: "Missing idToken or firebaseUid + email or googleIdToken" });
    }

    let existingUser = await Userupi.findOne({ upiId });

    if (existingUser) {
      return res.status(400).json({ msg: "User already registered" });
    }

    const newUser = new Userupi({
      name: name || "New User",
      email: email || `${phoneNumber}@paymanni.in`,
      upiId,
      balance: 10000,
    });

    await newUser.save();

    const wallet = new Wallet({
      userId: newUser._id,
      balance: 10000,
    });

    await wallet.save();

    const registrationFee = 50;
    if (wallet.balance >= registrationFee) {
      await wallet.updateBalance(-registrationFee);
      await WalletTransaction.create({
        user: newUser._id,
        amount: registrationFee,
        type: "Withdraw",
        description: "Registration Fee Deducted",
      });
    }

    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: "1h" });

    res.status(201).json({
      msg: "Registration successful",
      token,
      userId: newUser._id,
      user: newUser,
    });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ msg: "Registration failed", err });
  }
};

const loginUser = async (req, res) => {
  const { email, password, idToken, googleIdToken } = req.body;

  try {
    let user;

    // Check if login is via Email/Password
    if (email && password) {
      // Sign in with email and password using Firebase Authentication
      const userCredential = await admin.auth().signInWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) {
        return res.status(400).json({ msg: "User not found" });
      }

      // Firebase ID Token
      const token = await firebaseUser.getIdToken();
      const decodedToken = await admin.auth().verifyIdToken(token);
      const phoneNumber = decodedToken.phone_number || null;

      const upiId = phoneNumber ? `${phoneNumber}@paymanni` : `${email.split("@")[0]}@paymanni`;

      user = await Userupi.findOne({ upiId });

      if (!user) {
        // Create a new user if not found
        user = new Userupi({
          name: firebaseUser.displayName || "New User",
          email: firebaseUser.email,
          upiId,
          balance: 10000,
        });
        await user.save();

        const wallet = new Wallet({
          userId: user._id,
          balance: 10000,
        });
        await wallet.save();
      }

    } else if (idToken) {
      // If login is via phone OTP (idToken)
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const phoneNumber = decodedToken.phone_number;

      if (!phoneNumber) {
        return res.status(400).json({ msg: "Phone number not found in token" });
      }

      const upiId = `${phoneNumber}@paymanni`;

      user = await Userupi.findOne({ upiId });

      if (!user) {
        user = new Userupi({
          name: "New User",
          email: `${phoneNumber}@paymanni.in`,
          upiId,
          balance: 10000,
        });
        await user.save();

        const wallet = new Wallet({
          userId: user._id,
          balance: 10000,
        });
        await wallet.save();
      }
 // Google Login
 else if (googleIdToken) {
  const decodedGoogleToken = await admin.auth().verifyIdToken(googleIdToken);
  const googleEmail = decodedGoogleToken.email;
  const name = decodedGoogleToken.name || "Google User";
  if (!googleEmail) return res.status(400).json({ msg: "Email not found in Google token" });

  const upiId = `${googleEmail.split("@")[0]}@paymanni`;
  user = await Userupi.findOne({ upiId });

  if (!user) {
    user = new Userupi({
      name,
      email: googleEmail,
      upiId,
      balance: 10000,
    });
    await user.save();
    const wallet = new Wallet({ userId: user._id, balance: 10000 });
    await wallet.save();
  }
}
    } else {
      return res.status(400).json({ msg: "Email/password, idToken or googleIdToken required" });
    }

    // Create a JWT token to authenticate further requests
    const jwtToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({
      msg: email ? "Email login successful" : "Phone login successful",
      token: jwtToken,
      userId: user._id,
      user,
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Authentication failed", err });
  }
};


const editUserProfile = async (req, res) => {
  const { userId } = req.params;
  const updates = req.body;

  try {
    const updatedUser = await Userupi.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.status(200).json({
      msg: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", err });
  }
};

module.exports = {
  registerUser,
  getUserBankData,
  getUserById,
  loginUser,
  editUserProfile,
};
