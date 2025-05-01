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

    // Simulated banking data response
    res.json({
      linkedAccounts: user.linkedAccounts || [],
      transactions: user.transactions || [],
      virtualUpiId: user.virtualUpiId || `${user.name}@paymanni`,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", err });
  }
};
const registerUser = async (req, res) => {
  const { idToken, name } = req.body;

  try {
    // 1. Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const phoneNumber = decodedToken.phone_number;

    if (!phoneNumber) {
      return res.status(400).json({ msg: "Phone number not found in Firebase token" });
    }

    const upiId = `${phoneNumber}@paymanni`;

    // 2. Check if already exists
    let existingUser = await Userupi.findOne({ upiId });

    if (existingUser) {
      return res.status(400).json({ msg: "Phone number already registered" });
    }

    // 3. Create user
    const newUser = new Userupi({
      name: name || "New User",
      email: `${phoneNumber}@paymanni.in`,
      upiId,
      balance: 10000,
    });
    await newUser.save();

    // 4. Create wallet
    const wallet = new Wallet({
      userId: newUser._id,
      balance: 10000,
    });
    await wallet.save();

    // 5. Deduct ₹50 registration fee
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

    // 6. Generate JWT for our app
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: "1h" });

    res.status(201).json({
      msg: "Phone registration successful",
      token,
      userId: newUser._id,
      user: newUser,
    });
  } catch (err) {
    console.error("Phone register error:", err);
    res.status(500).json({ msg: "Phone registration failed", err });
  }
};
const loginUser = async (req, res) => {
  const { idToken } = req.body;  // Firebase ID token sent from frontend

  try {
    // ✅ 1. Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const phoneNumber = decodedToken.phone_number;  // Extract phone number from the token

    if (!phoneNumber) {
      return res.status(400).json({ msg: "Phone number not found in token" });
    }

    // ✅ 2. Use phoneNumber as UPI ID
    const upiId = `${phoneNumber}@paymanni`;  // Construct UPI ID using phone number
    let user = await Userupi.findOne({ upiId });  // Check if user already exists

    // ✅ 3. Create user if doesn't exist
    if (!user) {
      user = new Userupi({
        name: "New User",  // Placeholder name, can be updated later
        email: `${phoneNumber}@paymanni.in`,  // Use phone number to generate email
        upiId,  // Assign the generated UPI ID
        balance: 10000,  // Default balance
      });
      await user.save();  // Save new user to database

      // Create a wallet for the user
      const wallet = new Wallet({
        userId: user._id,  // Link wallet to user by userId
        balance: 10000,  // Default wallet balance
      });
      await wallet.save();  // Save wallet to database
    }

    // ✅ 4. Generate JWT for app authentication
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });

    // Send response back to frontend with the JWT token and user details
    res.status(200).json({
      msg: "Phone login successful",
      token,  // JWT token to be used for further authentication
      userId: user._id,  // User's unique ID
      user,  // User details
    });

  } catch (err) {
    console.error("Phone login error:", err);
    res.status(500).json({ msg: "Phone authentication failed", err });  // Handle errors
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
module.exports = { registerUser, getUserBankData,getUserById, loginUser,editUserProfile};
