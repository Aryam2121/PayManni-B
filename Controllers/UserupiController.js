const Userupi = require("../models/Userupi");
const jwt = require("jsonwebtoken");
const Wallet = require("../models/Wallet"); 
const WalletTransaction = require("../models/WalletTransaction");

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
  const { name, email, password } = req.body;

  try {
    const existingUser = await Userupi.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "Email already in use" });
    }

    const newUser = new Userupi({
      name,
      email,
      password,
      balance: 10000, // Optional legacy
    });

    await newUser.save();

    // ✅ Create a wallet for the new user
    const wallet = new Wallet({
      userId: newUser._id,
      balance: 10000,
    });
    await wallet.save();

    // ✅ Deduct registration fee (e.g., ₹50)
    const registrationFee = 50;

    if (wallet.balance >= registrationFee) {
      // Deduct fee
      wallet.balance -= registrationFee;
      await wallet.save();

      // ✅ Log transaction
      await WalletTransaction.create({
        user: newUser._id,
        amount: registrationFee,
        type: "Withdraw",
        description: "Registration Fee Deducted",
      });
    } else {
      return res.status(400).json({ msg: "Insufficient balance for registration fee" });
    }

    res.status(201).json({ msg: "User registered successfully", user: newUser });
  } catch (err) {
    res.status(500).json({ msg: "Server error", err });
  }
};
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Userupi.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // ✅ Token generation
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ 
      msg: "Login successful", 
      token,        
      userId: user._id,
      user
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", err });
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
