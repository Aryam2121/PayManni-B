const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Userupi", required: true },
    recipient: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["card", "paypal", "upi"], required: true },

    cardDetails: {
      number: { type: String, select: false }, // Should be encrypted
      expiry: { type: String },
      cvv: { type: String, select: false },
    },
    razorpayOrderId: { type: String },

    paypalId: { type: String },
    upiId: { type: String },

    // ✅ Status like other models
    status: { type: String, enum: ["success", "failed", "pending"], default: "pending" },

    // ✅ For global transaction listing
    type: { type: String, default: "payment" }, // e.g., "payment", "loan", "recharge", etc.
    userUpi: { type: String }, // Who paid — like EMI
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", PaymentSchema);
module.exports = Payment;
