const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "Userupi", required: true },
  amount: { type: Number, required: true },
  type: { type: String,     enum: ["Deposit", "Withdraw", "Payment", "Recharge", "Transfer", "Refund"], required: true },
  description: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const WalletTransaction = mongoose.model("WalletTransaction", walletTransactionSchema);
module.exports = WalletTransaction;
