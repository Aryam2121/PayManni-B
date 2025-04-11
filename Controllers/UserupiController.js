const Userupi = require("../models/Userupi");
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
    // Check if email already exists
    const existingUser = await Userupi.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "Email already in use" });
    }

    const newUser = new Userupi({
      name,
      email,
      password, // In production, hash the password!
      balance: 1000, // Starting balance for simulation
    });

    await newUser.save();
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

    res.status(200).json({ 
      msg: "Login successful", 
      userId: user._id, // <-- this is what you use in frontend
      user
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", err });
  }
};
const getMyAccountDetails = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await Userupi.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Send only relevant account details
    res.status(200).json({
      name: user.name,
      email: user.email,
      upiId: user.virtualUpiId || `${user.name.toLowerCase()}@paymanni`,
      balance: user.balance,
      linkedAccounts: user.linkedAccounts || [],
      transactions: user.transactions?.slice(-5).reverse() || [], // Last 5 transactions
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
module.exports = { registerUser, getUserBankData,getUserById, loginUser,getMyAccountDetails };
