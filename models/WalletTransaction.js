const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true }, // e.g., 'Payment', 'Receive'
  description: { type: String, required: true },
  razorpayOrderId: { type: String }, // New field for storing Razorpay order ID
  razorpayPaymentId: { type: String }, // New field for storing Razorpay payment ID
  status: { type: String, default: 'pending' }, // status like 'completed', 'pending'
  date: { type: Date, default: Date.now },
});

const WalletTransaction = mongoose.model("WalletTransaction", walletTransactionSchema);
module.exports = WalletTransaction;
