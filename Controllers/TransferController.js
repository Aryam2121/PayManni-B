const Transfer = require("../models/Transfer");
const User = require("../models/User");

const createTransfer = async (req, res) => {
  try {
    const { recipient, amount, paymentMethod } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user || user.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const newTransfer = new Transfer({ sender: user._id, recipient, amount, paymentMethod, status: "success" });

    await newTransfer.save();

    user.balance -= amount;
    await user.save();

    res.status(201).json({ message: "Transfer successful", transfer: newTransfer });
  } catch (error) {
    console.error("Transfer Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getTransfers = async (req, res) => {
  try {
    const transfers = await Transfer.find({ sender: req.user.userId }).sort({ createdAt: -1 });
    res.json(transfers);
  } catch (error) {
    console.error("Get Transfers Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { createTransfer, getTransfers };
