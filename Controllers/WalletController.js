const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 🟡 Get wallet details (balance only)
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

// 🟡 Deposit Money (initiate Razorpay)
const depositMoney = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid deposit amount" });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `wallet_deposit_${Date.now()}`,
      payment_capture: 1,
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

// 🟡 Confirm Deposit (via webhook)
const confirmDeposit = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount } = req.body;
    const userId = req.user.id;

    // Validate Razorpay Signature
    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Update balance
    const wallet = await Wallet.findOneAndUpdate(
      { userId },
      { $inc: { balance: amount } },
      { new: true, upsert: true }
    );

    // Create transaction
    await WalletTransaction.create({
      user: userId,
      amount,
      type: "Deposit",
      description: "Wallet Deposit via Razorpay",
    });

    return res.json({ message: "Deposit successful", balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// 🟡 Withdraw Money
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

    // Deduct balance
    wallet.balance -= amount;
    await wallet.save();

    // Create transaction
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

// 🟡 Razorpay Signature Verifier
const verifyRazorpaySignature = (orderId, paymentId, signature) => {
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


// const Wallet = require("../models/Wallet.js");
// const Razorpay = require("razorpay");
// const crypto = require("crypto");

// // Initialize Razorpay
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// // Get wallet details (balance and transactions)
// const getWalletDetails = async (req, res) => {
//   try {
//     const userId = req.user.id; // Ensure authentication
//     const wallet = await Wallet.findOne({ userId });

//     if (!wallet) {
//       return res.status(404).json({ message: "Wallet not found" });
//     }

//     res.json({ balance: wallet.balance, transactions: wallet.transactions });
//   } catch (error) {
//     console.error("Error fetching wallet:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// // Handle deposit via Razorpay
// const depositMoney = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { amount } = req.body;
//     if (!amount || amount <= 0) {
//       return res.status(400).json({ message: "Invalid deposit amount" });
//     }

//     // Create Razorpay order
//     const options = {
//       amount: Math.round(amount * 100), // Convert to paise
//       currency: "INR",
//       receipt: `wallet_deposit_${Date.now()}`,
//       payment_capture: 1, // Auto-capture payment
//     };

//     const order = await razorpay.orders.create(options);
    
//     return res.status(201).json({
//       message: "Payment initiated. Proceed to Razorpay checkout.",
//       order,
//     });
//   } catch (error) {
//     console.error("Error creating Razorpay order:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// // Handle deposit confirmation via Razorpay Webhook
// const confirmDeposit = async (req, res) => {
//   try {
//     const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount } = req.body;
//     const userId = req.user.id;

//     // Verify Razorpay signature
//     const secret = process.env.RAZORPAY_KEY_SECRET;
//     const hmac = crypto.createHmac("sha256", secret);
//     hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
//     const expectedSignature = hmac.digest("hex");

//     if (!crypto.timingSafeEqual(Buffer.from(expectedSignature, "utf-8"), Buffer.from(razorpay_signature, "utf-8"))) {
//       return res.status(400).json({ message: "Payment verification failed" });
//     }

//     // Update wallet balance
//     const wallet = await Wallet.findOneAndUpdate(
//       { userId },
//       { $inc: { balance: amount }, $push: { transactions: { amount, type: "Deposit", date: new Date() } } },
//       { new: true }
//     );

//     return res.json({ message: "Deposit successful", balance: wallet.balance });
//   } catch (error) {
//     console.error("Error confirming deposit:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// // Handle withdrawal
// const withdrawMoney = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { amount } = req.body;

//     if (!amount || amount <= 0) {
//       return res.status(400).json({ message: "Invalid withdrawal amount" });
//     }

//     const wallet = await Wallet.findOne({ userId });
//     if (!wallet) {
//       return res.status(404).json({ message: "Wallet not found" });
//     }

//     if (wallet.balance < amount) {
//       return res.status(400).json({ message: "Insufficient balance" });
//     }

//     // Deduct amount and update transactions
//     wallet.balance -= amount;
//     wallet.transactions.push({ amount, type: "Withdraw", date: new Date() });
//     await wallet.save();

//     res.json({ balance: wallet.balance });
//   } catch (error) {
//     console.error("Error withdrawing money:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// module.exports = {
//   getWalletDetails,
//   depositMoney,
//   confirmDeposit,
//   withdrawMoney,
// };
