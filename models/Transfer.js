const mongoose = require("mongoose");

const TransferSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "Userupi", required: true },
  recipient: String,
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["card", "upi", "paypal", "bank"], required: true },
  status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

const Transfer = mongoose.model("Transfer", TransferSchema);
module.exports = Transfer;
