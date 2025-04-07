const Userupi = require('../models/Userupi');

// Generate UPI ID
const generateUpiId = async (req, res) => {
    const { username, upiUsername } = req.body;
  
    if (!username || !upiUsername) {
      return res.status(400).json({ msg: "Username and UPI username are required" });
    }
  
    const upiId = `${upiUsername}@paymanni`;
  
    try {
      const user = await Userupi.findOne({ name: username }); // Assuming username is actually `name`
      if (!user) return res.status(404).json({ msg: "User not found" });
  
      if (user.upiId) {
        return res.status(400).json({ msg: "This user already has a UPI ID", upiId: user.upiId });
      }
  
      const existing = await Userupi.findOne({ upiId });
      if (existing) {
        return res.status(400).json({ msg: "UPI ID is already taken by another user" });
      }
  
      user.upiId = upiId;
      await user.save();
  
      res.status(200).json({ msg: "UPI ID created successfully", upiId });
    } catch (err) {
      res.status(500).json({ msg: "Server error", error: err.message });
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