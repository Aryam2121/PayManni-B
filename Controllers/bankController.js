const Bank = require("../models/Bank.js"); // Assuming you have a Bank model defined in models/Bank.js
// 🔹 GET Bank Info by User ID
const Userupi = require("../models/Userupi.js"); // Assuming you have a Userupi model defined in models/Userupi.js
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

    const bank = await Bank.findOne({ user: req.params.userId });
    if (!bank) return res.status(404).json({ message: 'Bank account not found' });

    bank.transactions.unshift({ date, description, amount, type });
    await bank.save();
    res.status(200).json(bank);
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
module.exports = {
  getBankInfo,
  addLinkedAccount,
  addTransaction,
  getMyAccountDetails,
};