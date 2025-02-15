const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  balance: { type: Number, default: 0 },
  transactions: [
    {
      amount: Number,
      type: { type: String, enum: ["Deposit", "Withdraw", "Payment"], required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

walletSchema.methods.updateBalance = async function (amount) {
  this.balance += amount;
  return this.save();
};

walletSchema.methods.addTransaction = async function (amount, type) {
  this.transactions.push({ amount, type });
  return this.save();
};

const Wallet = mongoose.model("Wallet", walletSchema);

module.exports = Wallet;
