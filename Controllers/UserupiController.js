const Userupi = require("../models/Userupi");
const jwt = require("jsonwebtoken");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const admin = require("../firebaseAdmin");

const JWT_SECRET = process.env.JWT_SECRET;

// 🚀 Updated registerUser to support both idToken and firebaseUid-based registration
const registerUser = async (req, res) => {
  const { idToken, firebaseUid, email, name } = req.body;

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
    else {
      return res.status(400).json({ msg: "Missing idToken or firebaseUid + email" });
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

// Other methods unchanged
const getUserById = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await Userupi.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error", err });
  }
};

const getUserBankData = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await Userupi.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({
      linkedAccounts: user.linkedAccounts || [],
      transactions: user.transactions || [],
      virtualUpiId: user.virtualUpiId || `${user.name}@paymanni`,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", err });
  }
};

const loginUser = async (req, res) => {
  const { email, password, idToken } = req.body;
  try {
    let user;

    if (idToken) {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const phoneNumber = decodedToken.phone_number;
      if (!phoneNumber) return res.status(400).json({ msg: "Phone number not found in token" });
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

        const wallet = new Wallet({ userId: user._id, balance: 10000 });
        await wallet.save();
      }
    } else if (email && password) {
      return res.status(400).json({ msg: "Email/password login is not supported on server" });
    } else {
      return res.status(400).json({ msg: "Missing idToken or email/password" });
    }

    const jwtToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({
      msg: "Login successful",
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
