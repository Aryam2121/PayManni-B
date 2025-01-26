const Wallet = require("../models/Wallet");

/**
 * Get wallet balance for the authenticated user.
 * @route   GET /api/wallet/balance
 * @access  Protected
 */
exports.getBalance = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });
    res.status(200).json({ balance: wallet ? wallet.balance : 0 });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch wallet balance", error: error.message });
  }
};

/**
 * Add funds to the wallet of the authenticated user.
 * @route   POST /api/wallet/add
 * @access  Protected
 */
exports.addBalance = async (req, res) => {
  const { amount } = req.body;

  // Validate the amount
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Amount must be greater than zero" });
  }

  try {
    const wallet = await Wallet.findOneAndUpdate(
      { user: req.user.id },
      { $inc: { balance: amount } },
      { new: true, upsert: true } // Creates a wallet if it doesn't exist
    );

    res.status(200).json({ message: "Balance updated successfully", wallet });
  } catch (error) {
    res.status(500).json({ message: "Failed to update wallet balance", error: error.message });
  }
};
