const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Userupi", required: true },
  balance: { type: Number, default: 0 },
});

walletSchema.methods.updateBalance = async function (amount) {
  this.balance += amount;
  return this.save();
};

const Wallet = mongoose.model("Wallet", walletSchema);
module.exports = Wallet;
