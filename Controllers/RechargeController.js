const Razorpay = require("razorpay");
const Recharge = require("../models/Recharge");
const WalletTransaction = require("../models/WalletTransaction");
const Wallet = require("../models/Wallet"); // Make sure you import this
const crypto = require("crypto");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Recharge function (Wallet or Razorpay)
const rechargeAccount = async (req, res) => {
  try {
    const { userId, amount, paymentMethod, promoCode } = req.body;

    // Input validation
    if (!userId || !amount || isNaN(amount) || amount <= 0 || !paymentMethod) {
      return res.status(400).json({ message: "Invalid input values" });
    }

    // Promo code logic
    let finalAmount = parseFloat(amount);
    if (promoCode?.toLowerCase() === "discount10") {
      finalAmount = finalAmount * 0.9; // Apply 10% discount
    }

    if (paymentMethod === "Wallet") {
      // 🔥 Direct Wallet recharge
      const wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      if (wallet.balance < finalAmount) {
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }

      // Deduct wallet balance
      wallet.balance -= finalAmount;
      await wallet.save();

      // Create recharge record
      const recharge = new Recharge({
        userId,
        amount: finalAmount,
        paymentMethod: "Wallet",
        promoCode,
        status: "Completed",
        rechargeDate: new Date(),
      });
      await recharge.save();

      // Log wallet transaction
      await WalletTransaction.create({
        user: userId,
        amount: finalAmount,
        type: "Debit",
        description: `Recharge using Wallet${promoCode ? ` with promo ${promoCode}` : ""}`,
      });

      return res.status(201).json({
        message: "Recharge successful via wallet",
        recharge,
      });
    } else if (paymentMethod === "Razorpay") {
      // 🔥 Razorpay flow
      const options = {
        amount: Math.round(finalAmount * 100), // Razorpay expects paise
        currency: "INR",
        receipt: `recharge_${Date.now()}`,
        payment_capture: 1,
      };

      const order = await razorpay.orders.create(options);

      // Save recharge in DB (Pending)
      const recharge = new Recharge({
        userId,
        amount: finalAmount,
        paymentMethod: "Razorpay",
        promoCode,
        status: "Pending",
        razorpayOrderId: order.id,
        rechargeDate: new Date(),
      });
      await recharge.save();

      // Log WalletTransaction (Recharge Initiated)
      await WalletTransaction.create({
        user: userId,
        amount: finalAmount,
        type: "Recharge",
        description: `Recharge initiated via Razorpay${promoCode ? ` with promo ${promoCode}` : ""}`,
      });

      return res.status(201).json({
        message: "Order created successfully. Proceed to payment.",
        order,
        recharge,
      });
    } else {
      return res.status(400).json({ message: "Invalid payment method" });
    }
  } catch (error) {
    console.error("Recharge error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Verify Payment (After Razorpay Callback)
const verifyRechargePayment = async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  try {
    // Verify the payment signature using Razorpay's API
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Find the corresponding recharge transaction
    const recharge = await Recharge.findOne({ razorpayOrderId: razorpay_order_id });
    if (!recharge) {
      return res.status(404).json({ message: "Recharge not found" });
    }

    // Update recharge status to completed
    recharge.status = "Completed";
    await recharge.save();

    // Credit the user's wallet
    const wallet = await Wallet.findOne({ userId: recharge.userId });
    if (wallet) {
      wallet.balance += recharge.amount;
      await wallet.save();

      // Log wallet credit transaction
      await WalletTransaction.create({
        user: recharge.userId,
        amount: recharge.amount,
        type: "Credit",
        description: "Wallet credited after Razorpay recharge",
      });
    }

    res.status(200).json({
      message: "Payment verified and wallet credited successfully",
      razorpay_payment_id,
      razorpay_order_id,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Server error while verifying payment" });
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

module.exports = { rechargeAccount, getRecharges, verifyRechargePayment };
