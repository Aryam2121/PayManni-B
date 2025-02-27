const Wallet = require("../models/Wallet.js");
const Razorpay = require("razorpay");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Get wallet details (balance and transactions)
const getWalletDetails = (req, res) => {
  const walletData = Wallet.getWallet();
  res.json(walletData);
};

// Handle deposit via Razorpay
const depositMoney = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid deposit amount" });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt: `wallet_deposit_${Date.now()}`,
      payment_capture: 1, // Auto-capture payment
    };

    const order = await razorpay.orders.create(options);
    
    return res.status(201).json({
      message: "Payment initiated. Proceed to Razorpay checkout.",
      order,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Handle deposit confirmation via Razorpay Webhook
const confirmDeposit = (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount } = req.body;

    // Verify Razorpay signature (implementation required)
    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    Wallet.updateBalance(amount);
    Wallet.addTransaction(amount, "Deposit");
    
    return res.json({ message: "Deposit successful", balance: Wallet.getWallet().balance });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Handle withdrawal
const withdrawMoney = (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
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

// Razorpay Signature Verification (Implement this properly)
const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  const crypto = require("crypto");
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(`${orderId}|${paymentId}`);
  return hmac.digest("hex") === signature;
};

module.exports = {
  getWalletDetails,
  depositMoney,
  confirmDeposit,
  withdrawMoney,
};
