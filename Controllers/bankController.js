const Bank = require("../models/Bank.js"); // Assuming you have a Bank model defined in models/Bank.js
// 🔹 GET Bank Info by User ID
const Userupi = require("../models/Userupi.js"); // Assuming you have a Userupi model defined in models/Userupi.js
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const getBankInfo = async (req, res) => {
  try {
    const bankInfo = await Bank.findOne({ user: req.params.userId });
    if (!bankInfo) return res.status(404).json({ message: 'Bank data not found' });

    res.status(200).json(bankInfo);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bank data', error });
  }
};

// 🔹 ADD a Linked Bank Account
const addLinkedAccount = async (req, res) => {
  try {
    const { bankName, accountNumberMasked } = req.body;

    const bank = await Bank.findOne({ user: req.params.userId });
    if (!bank) {
      const newBank = new Bank({
        user: req.params.userId,
        linkedAccounts: [{ bankName, accountNumberMasked }],
        transactions: [],
      });
      await newBank.save();
      return res.status(201).json(newBank);
    }

    bank.linkedAccounts.push({ bankName, accountNumberMasked });
    await bank.save();
    res.status(200).json(bank);
  } catch (error) {
    res.status(500).json({ message: 'Error adding linked account', error });
  }
};

// 🔹 ADD a Transaction
const addTransaction = async (req, res) => {
  try {
    const { date, description, amount, type } = req.body;
    const { userId } = req.params;

    const bank = await Bank.findOne({ user: userId });
    if (!bank) return res.status(404).json({ message: 'Bank account not found' });

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    // ✅ Add transaction to bank
    bank.transactions.unshift({ date, description, amount, type });
    await bank.save();

    // ✅ Update wallet balance
    const balanceChange = type === "Withdraw" ? -amount : amount;
    if (type === "Withdraw" && wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    wallet.balance += balanceChange;
    await wallet.save();

    // ✅ Log to WalletTransaction model
    await WalletTransaction.create({
      user: userId,
      amount,
      type,
      description: `Bank ${type} - ${description}`,
    });

    res.status(200).json({
      msg: "Transaction recorded & wallet updated",
      newWalletBalance: wallet.balance,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding transaction', error });
  }
};
const getMyAccountDetails = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await Userupi.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    const wallet = await Wallet.findOne({ userId });

    const bank = await Bank.findOne({ user: userId });

    // Send only relevant account details
    res.status(200).json({
      name: user.name,
      email: user.email,
      upiId: user.virtualUpiId || `${user.name.toLowerCase()}@paymanni`,
      balance: wallet?.balance ,
      linkedAccounts: bank?.linkedAccounts || [],
      transactions: bank?.transactions?.slice(-5).reverse() || [],
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
const getBankTransactionsForUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const bankRecord = await Bank.findOne({ user: userId }).populate("user");

    if (!bankRecord) {
      return res.status(404).json({ message: "No bank record found for this user" });
    }

    const userUpi = bankRecord.user.upiId || "unknown-upi"; // fallback if not available

    const transactions = bankRecord.transactions.map(txn => ({
      userId: bankRecord.user._id,
      userUpi,
      date: txn.date,
      description: txn.description,
      amount: txn.amount,
      type: txn.type,
      typeTag: "bank",
    }));

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bank transactions", error: error.message });
  }
};
module.exports = {
  getBankInfo,
  addLinkedAccount,
  addTransaction,
  getMyAccountDetails,
  getBankTransactionsForUser,
};