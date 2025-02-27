const Razorpay = require("razorpay");
const Transaction = require("../models/Transaction.js");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Recharge function with Razorpay
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

    // Create Razorpay order
    const options = {
      amount: Math.round(finalAmount * 100), // Convert to paise
      currency: "INR",
      receipt: `recharge_${Date.now()}`,
      payment_capture: 1, // Auto capture
    };

    const order = await razorpay.orders.create(options);

    // Save transaction in DB (Pending status)
    const transaction = new Transaction({
      userId,
      amount: finalAmount,
      paymentMethod,
      promoCode,
      status: "Pending",
      razorpayOrderId: order.id,
    });

    await transaction.save();

    return res.status(201).json({
      message: "Order created successfully. Proceed to payment.",
      order,
      transaction,
    });
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
