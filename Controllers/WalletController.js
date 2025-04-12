const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// 🔐 Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 🔍 Get wallet balance & transaction history
const getWalletDetails = async (req, res) => {
  try {
    const userId = req.user.id;

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    const transactions = await WalletTransaction.find({ user: userId }).sort({ createdAt: -1 });

    res.json({
      balance: wallet.balance,
      transactions,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// 💰 Deposit: Initiate Razorpay order
const depositMoney = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid deposit amount" });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `wallet_deposit_${Date.now()}`,
      payment_capture: 1,
    });

    res.status(201).json({
      message: "Payment initiated. Proceed to Razorpay checkout.",
      order,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ Verify Razorpay Signature
const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(`${orderId}|${paymentId}`);
  const digest = hmac.digest("hex");
  return digest === signature;
};

// 🧾 Deposit: Confirm after payment success
const confirmDeposit = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount } = req.body;
    const userId = req.user.id;

    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const wallet = await Wallet.findOneAndUpdate(
      { userId },
      { $inc: { balance: amount } },
      { new: true, upsert: true }
    );

    await WalletTransaction.create({
      user: userId,
      amount,
      type: "Deposit",
      description: "Wallet Deposit via Razorpay",
    });

    res.json({ message: "Deposit successful", balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// 💸 Withdraw from wallet
const withdrawMoney = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid withdrawal amount" });
    }

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    if (amount > wallet.balance) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    wallet.balance -= amount;
    await wallet.save();

    await WalletTransaction.create({
      user: userId,
      amount,
      type: "Withdraw",
      description: "Wallet Withdrawal",
    });

    res.json({ message: "Withdrawal successful", balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
  getWalletDetails,
  depositMoney,
  confirmDeposit,
  withdrawMoney,
};
