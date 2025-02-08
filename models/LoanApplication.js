const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  term: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  monthlyEMI: { type: Number, required: true },
  approvalChance: { type: String, required: true },
  status: { type: String, required: true },
});

const Loan = mongoose.model('Loan', loanSchema);

module.exports = Loan;
