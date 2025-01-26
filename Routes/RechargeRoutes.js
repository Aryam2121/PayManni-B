// routes/recharge.js
const express = require("express");
const router = express.Router();
const Recharge = require("../models/Recharge");

// Handle Recharge Request
router.post("/recharge", async (req, res) => {
  const { userId, amount, paymentMethod, promoCode } = req.body;

  // Validate amount
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  // Simulate promo code logic
  let finalAmount = parseFloat(amount);
  if (promoCode.toLowerCase() === "discount10") {
    finalAmount = finalAmount * 0.9; // Apply 10% discount
  }

  try {
    const newRecharge = new Recharge({
      userId,
      amount: finalAmount,
      paymentMethod,
      promoCode,
    });

    await newRecharge.save();
    res.status(200).json({
      message: "Recharge successful!",
      transaction: newRecharge,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get Transaction History
router.get("/:userId/transactions", async (req, res) => {
  const { userId } = req.params;

  try {
    const transactions = await Recharge.find({ userId })
      .sort({ transactionDate: -1 })
      .limit(10); // Fetch the last 10 transactions

    if (transactions.length === 0) {
      return res.status(404).json({ message: "No transactions found" });
    }

    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
