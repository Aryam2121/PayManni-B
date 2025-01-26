// models/Recharge.js
const mongoose = require("mongoose");

const rechargeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["UPI", "Debit/Credit", "Wallet"],
      required: true,
    },
    promoCode: {
      type: String,
      default: "",
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Recharge", rechargeSchema);
