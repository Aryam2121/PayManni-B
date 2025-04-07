const Userupi = require("../models/Userupi");

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

module.exports = { registerUser };
