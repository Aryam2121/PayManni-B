const Razorpay = require("razorpay");
const Recharge = require("../models/Recharge.js");
const WalletTransaction = require("../models/WalletTransaction.js");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Recharge function with Razorpay
const rechargeAccount = async (req, res) => {
  try {
    const { userId, amount, paymentMethod, promoCode } = req.body;

    // Input validation
    if (!userId || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid input values" });
    }

    // Promo code logic
    let finalAmount = parseFloat(amount);
    if (promoCode?.toLowerCase() === "discount10") {
      finalAmount = finalAmount * 0.9;
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(finalAmount * 100),
      currency: "INR",
      receipt: `recharge_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    // Save recharge in DB (Pending)
    const recharge = new Recharge({
      userId,
      amount: finalAmount,
      paymentMethod,
      promoCode,
      status: "Pending",
      razorpayOrderId: order.id,
      rechargeDate: new Date(),
    });

    await recharge.save();

    // 🔥 Log as WalletTransaction (Recharge initiated)
    await WalletTransaction.create({
      user: userId,
      amount: finalAmount,
      type: "Recharge",
      description: `Recharge initiated${promoCode ? ` with promo ${promoCode}` : ""}`,
    });

    return res.status(201).json({
      message: "Order created successfully. Proceed to payment.",
      order,
      recharge,
    });
  } catch (error) {
    console.error("Recharge error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch recharges by user
const getRecharges = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const recharges = await Recharge.find({ userId }).sort({ rechargeDate: -1 });

    res.status(200).json(recharges);
  } catch (error) {
    console.error("Fetch recharges error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { rechargeAccount, getRecharges };
