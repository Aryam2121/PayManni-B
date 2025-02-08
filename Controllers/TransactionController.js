const Transaction = require("../models/Transaction.js");

// Recharge function
const rechargeAccount = async (req, res) => {
  try {
    const { userId, amount, paymentMethod, promoCode } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid input values" });
    }

    // Promo code discount logic
    let finalAmount = parseFloat(amount);
    if (promoCode?.toLowerCase() === "discount10") {
      finalAmount = finalAmount * 0.9;
    }

    // Save transaction in DB
    const transaction = new Transaction({
      userId,
      amount: finalAmount,
      paymentMethod,
      promoCode,
    });

    await transaction.save();
    return res.status(201).json({ message: "Recharge successful", transaction });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Fetch transactions for a user
const getTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const transactions = await Transaction.find({ userId }).sort({ transactionDate: -1 });
    return res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Export using module.exports
module.exports = { rechargeAccount, getTransactions };
