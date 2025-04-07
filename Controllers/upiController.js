const Userupi = require('../models/Userupi');

// Generate UPI ID
const generateUpiId = async (req, res) => {
    const { username, upiUsername } = req.body;
    const upiId = `${upiUsername}@paymanni`;
  
    try {
      const user = await Userupi.findOne({ username });
      if (!user) return res.status(404).json({ msg: "User not found" });
  
      // Check if UPI ID already exists
      const existing = await Userupi.findOne({ upiId });
      if (existing) return res.status(400).json({ msg: "UPI ID already in use" });
  
      user.upiId = upiId;
      await user.save();
  
      res.json({ msg: "UPI ID created successfully", upiId });
    } catch (err) {
      res.status(500).json({ msg: "Server error", err });
    }
  };
  

// Simulate Sending Money
const sendMoney = async (req, res) => {
  const { fromUpi, toUpi, amount } = req.body;

  try {
    const sender = await Userupi.findOne({ upiId: fromUpi });
    const receiver = await Userupi.findOne({ upiId: toUpi });

    if (!sender || !receiver) return res.status(404).json({ msg: "UPI ID(s) not found" });

    if (sender.balance < amount) return res.status(400).json({ msg: "Insufficient balance" });

    sender.balance -= amount;
    receiver.balance += amount;

    await sender.save();
    await receiver.save();

    res.json({ msg: `₹${amount} sent from ${fromUpi} to ${toUpi}` });
  } catch (err) {
    res.status(500).json({ msg: "Server error", err });
  }
};

// Simulate Receiving Money (Top-up)
const receiveMoney = async (req, res) => {
  const { toUpi, amount } = req.body;

  try {
    const user = await Userupi.findOne({ upiId: toUpi });
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.balance += amount;
    await user.save();

    res.json({ msg: `₹${amount} added to ${toUpi}` });
  } catch (err) {
    res.status(500).json({ msg: "Server error", err });
  }
};
module.exports = {generateUpiId,sendMoney,receiveMoney};