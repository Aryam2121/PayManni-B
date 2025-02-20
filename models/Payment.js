const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["card", "paypal", "upi"], required: true },
    cardDetails: {
      number: { type: String, select: false }, // Encrypt this in backend
      expiry: { type: String },
      cvv: { type: String, select: false },
    },
    paypalId: { type: String },
    upiId: { type: String },
    status: { type: String, enum: ["success", "failed", "pending"], default: "pending" },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", PaymentSchema);
module.exports = Payment;
