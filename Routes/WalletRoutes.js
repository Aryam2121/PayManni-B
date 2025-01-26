const express = require("express");
const router = express.Router();
const Wallet = require("../models/Wallet");

// Deposit amount
router.post("/deposit", async (req, res) => {
  const { userId, amount } = req.body;
  
  // Validate amount
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  try {
    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      wallet = new Wallet({ userId, balance: 0, transactions: [] });
    }

    wallet.balance += amount;
    wallet.transactions.push({ amount, type: "Deposit" });

    await wallet.save();
    res.status(200).json({
      message: "Deposit successful",
      balance: wallet.balance,
      transaction: wallet.transactions[wallet.transactions.length - 1],
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Withdraw amount
router.post("/withdraw", async (req, res) => {
  const { userId, amount } = req.body;
  
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  try {
    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    wallet.balance -= amount;
    wallet.transactions.push({ amount, type: "Withdraw" });

    await wallet.save();
    res.status(200).json({
      message: "Withdrawal successful",
      balance: wallet.balance,
      transaction: wallet.transactions[wallet.transactions.length - 1],
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get transaction history
router.get("/:userId/transactions", async (req, res) => {
  const { userId } = req.params;

  try {
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    res.status(200).json(wallet.transactions);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get wallet balance
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    res.status(200).json({ balance: wallet.balance });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
