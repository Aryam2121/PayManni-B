const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  promoCode: { type: String },
  transactionDate: { type: Date, default: Date.now },
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }]  // Reference to Contact model
});


const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;
