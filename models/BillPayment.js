import mongoose from "mongoose";

const BillPaymentSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true }
);

const BillPayment = mongoose.model("BillPayment", BillPaymentSchema);
export default BillPayment;
