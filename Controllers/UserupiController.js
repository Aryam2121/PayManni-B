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
  // Extract userId from request parameters
  const { userId } = req.params;

  // Check if userId is provided
  if (!userId) {
    return res.status(400).json({ msg: "UserId is required" });
  }

  try {
    // Find user by userId in the Userupi collection
    const user = await Userupi.findById(userId);

    // If user is not found, return a 404 response
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Return user bank data
    res.json({
      linkedAccounts: user.linkedAccounts || [], // Default to empty array if not present
      transactions: user.transactions || [], // Default to empty array if not present
      virtualUpiId: user.virtualUpiId || `${user.name}@paymanni`, // Default virtual UPI ID if not present
    });
  } catch (err) {
    console.error(err); // Log the error for better debugging
    res.status(500).json({ msg: "Server error", error: err.message }); // Return more detailed error message
  }
};


// 🚀 Updated registerUser to support both idToken and firebaseUid-based registration
const registerUser = async (req, res) => {
  const { idToken, firebaseUid, email, name, googleIdToken } = req.body;

  try {
    let phoneNumber;
    let upiId;
    let finalEmail;
    let finalName;

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

    // Check if user already exists based on the generated upiId
    let existingUser = await Userupi.findOne({ upiId });

    if (existingUser) {
      return res.status(400).json({ msg: "User already registered" });
    }

    // Create a new user
    const newUser = new Userupi({
      name: finalName || name || "New User",
      email: finalEmail || email || `${phoneNumber}@paymanni.in`,
      upiId,
      firebaseUid, // Save the firebaseUid to associate the user
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

    const createNewUser = async (name, email, upiId) => {
      const newUser = new Userupi({
        name: name || "New User",
        email: email,
        upiId,
        balance: 10000,
      });
      await newUser.save();

      const wallet = new Wallet({
        userId: newUser._id,
        balance: 10000,
      });
      await wallet.save();

      return newUser;
    };

    if (idToken) {
      // Verify the ID token from frontend (email/password, phone, or Google sign-in)
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const phoneNumber = decodedToken.phone_number || null;
      const emailFromToken = decodedToken.email; // Get the email from the token

      // Ensure email is available
      const upiId = phoneNumber 
        ? `${phoneNumber}@paymanni` 
        : emailFromToken 
          ? `${emailFromToken.split("@")[0]}@paymanni` 
          : null;

      if (!upiId) {
        return res.status(400).json({ msg: "Email or phone number required in token" });
      }

      const firebaseUid = decodedToken.uid;
      user = await Userupi.findOne({ firebaseUid });

      if (!user) {
        // If the user doesn't exist, create a new one
        user = await createNewUser(decodedToken.name || "New User", emailFromToken || `${phoneNumber}@paymanni.in`, upiId);
      }

    } else if (googleIdToken) {
      // Handle Google authentication
      const decodedGoogleToken = await admin.auth().verifyIdToken(googleIdToken);
      const googleEmail = decodedGoogleToken.email;
      const name = decodedGoogleToken.name || "Google User";

      if (!googleEmail) {
        return res.status(400).json({ msg: "Email not found in Google token" });
      }

      const upiId = `${googleEmail.split("@")[0]}@paymanni`;

      user = await Userupi.findOne({ upiId });

      if (!user) {
        user = await createNewUser(name, googleEmail, upiId);
      }

    } else {
      return res.status(400).json({ msg: "idToken or googleIdToken required" });
    }

    // Generate JWT for the user to authenticate subsequent requests
    const jwtToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({
      msg: email ? "Email login successful" : idToken ? "Phone login successful" : "Google login successful",
      token: jwtToken,
      userId: user._id,
      user,
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Authentication failed", error: err.message });
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
