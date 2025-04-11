const mongoose = require('mongoose');

const RechargeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Userupi", required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String },
  promoCode: { type: String },
  status: { type: String, default: "Pending" },
  razorpayOrderId: { type: String },
  rechargeDate: { type: Date, default: Date.now },
});

const Recharge = mongoose.model("Recharge", RechargeSchema);
module.exports = Recharge;
