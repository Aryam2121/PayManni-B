const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const Bank = require("../models/Bank");

// 🧾 Get Wallet Details
const getWalletDetails = async (req, res) => {
  try {
    const userId = req.body.userId || req.user?.id;
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    const transactions = await WalletTransaction.find({ user: userId }).sort({ createdAt: -1 });

    res.json({
      balance: wallet.balance,
      transactions,
    });
  } catch (error) {
    console.error("Error in getWalletDetails:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// 💰 Deposit from Bank to Wallet
const depositMoney = async (req, res) => {
  try {
    const { amount, userId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid deposit amount" });
    }

    const bank = await Bank.findOne({ user: userId });
    if (!bank || bank.linkedAccounts.length === 0) {
      return res.status(404).json({ message: "No linked bank account found" });
    }

    const primaryAccount = bank.linkedAccounts[0];

    if (primaryAccount.balance < amount) {
      return res.status(400).json({ message: "Insufficient bank balance" });
    }

    // Deduct from bank
    primaryAccount.balance -= amount;

    // Add to wallet
    const wallet = await Wallet.findOneAndUpdate(
      { userId },
      { $inc: { balance: amount } },
      { new: true, upsert: true }
    );

    await bank.save();

    await WalletTransaction.create({
      user: userId,
      amount,
      type: "Deposit",
      description: "Wallet Deposit from Bank",
    });

    res.json({ message: "Deposit successful", walletBalance: wallet.balance });
  } catch (error) {
    console.error("Error in depositMoney:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// 💸 Withdraw from Wallet to Bank
const withdrawMoney = async (req, res) => {
  try {
    const { amount, userId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid withdrawal amount" });
    }

    const wallet = await Wallet.findOne({ userId });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    const bank = await Bank.findOne({ user: userId });
    if (!bank || bank.linkedAccounts.length === 0) {
      return res.status(404).json({ message: "No linked bank account found" });
    }

    const primaryAccount = bank.linkedAccounts[0];

    // Deduct from wallet
    wallet.balance -= amount;
    await wallet.save();

    // Add to bank
    primaryAccount.balance += amount;
    await bank.save();

    await WalletTransaction.create({
      user: userId,
      amount,
      type: "Withdraw",
      description: "Wallet Withdrawal to Bank",
    });

    res.json({ message: "Withdrawal successful", walletBalance: wallet.balance });
  } catch (error) {
    console.error("Error in withdrawMoney:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
  getWalletDetails,
  depositMoney,
  withdrawMoney,
};
