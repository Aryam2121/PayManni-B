const mongoose = require("mongoose");
const transactionSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
  },
  description: String,
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true,
  },
});

const bankSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Userupi', // Assuming you already have a User model
    required: true,
  },
  linkedAccounts: [
    {
      bankName: String,
      accountNumberMasked: String, // e.g., **** 1234
    },
  ],
  transactions: [transactionSchema],
});

const Bank =  mongoose.model('Bank', bankSchema);
module.exports = Bank;
