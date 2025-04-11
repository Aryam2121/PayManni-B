const mongoose = require("mongoose");

const BillPaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Userupi",
      required: true,
    },
    userUpi: {
      type: String,
      required: true,
    },
    billType: {
      type: String,
      required: true,
      enum: [
        "Electricity",
        "Water",
        "Internet",
        "Gas",
        "Phone",
        "TV",
        "Insurance",
        "Rent",
        "Subscription",
      ],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["card", "upi", "paypal"],
    },
    status: {
      type: String,
      required: true,
      enum: ["success", "failed"],
      default: "success",
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    typeTag: {
      type: String,
      default: "bill",
    },
  },
  { timestamps: true }
);

const BillPayment = mongoose.model("BillPayment", BillPaymentSchema);
module.exports = BillPayment;
