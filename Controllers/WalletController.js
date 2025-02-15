// controllers/walletController.js
const Wallet = require("../models/Wallet.js");

// Get wallet details (balance and transactions)
const getWalletDetails = (req, res) => {
  const walletData = Wallet.getWallet();
  res.json(walletData);
};

// Handle deposit
const depositMoney = (req, res) => {
  const { amount } = req.body;
  if (amount <= 0) {
    return res.status(400).json({ message: "Invalid deposit amount" });
  }
  Wallet.updateBalance(amount);
  Wallet.addTransaction(amount, "Deposit");
  res.json({ balance: Wallet.getWallet().balance });
};

// Handle withdrawal
const withdrawMoney = (req, res) => {
  const { amount } = req.body;
  if (amount <= 0) {
    return res.status(400).json({ message: "Invalid withdrawal amount" });
  }
  if (amount <= Wallet.getWallet().balance) {
    Wallet.updateBalance(-amount);
    Wallet.addTransaction(amount, "Withdraw");
    res.json({ balance: Wallet.getWallet().balance });
  } else {
    res.status(400).json({ message: "Insufficient balance" });
  }
};

module.exports = {
  getWalletDetails,
  depositMoney,
  withdrawMoney,
};
