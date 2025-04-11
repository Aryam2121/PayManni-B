const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Userupi', required: true },

  amount: { type: Number, required: true },
  term: { type: Number, required: true }, // in months
  interestRate: { type: Number, required: true },
  monthlyEMI: { type: Number, required: true },
  approvalChance: { type: String, required: true },

  // ✅ Loan Status
  status: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "pending"
  },

  // ✅ Transaction-compatible fields
  type: { type: String, default: "loan" },
  createdAt: { type: Date, default: Date.now },

  // ✅ EMI Payments
  payments: [
    {
      paymentId: { type: String },
      amount: { type: Number },
      date: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: ["success", "failed", "pending"],
        default: "success"
      },
      type: { type: String, default: "emi-payment" },
      userUpi: { type: String } // ✅ Who paid the EMI
    }
  ]
});

const Loan = mongoose.model('Loan', loanSchema);

module.exports = Loan;
