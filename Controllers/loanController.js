const Loan = require('../models/LoanApplication');

// GET all loan applications
const getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.find();
    res.status(200).json(loans);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

// GET loan application by ID
const getLoanById = async (req, res) => {
  const { id } = req.params;
  try {
    const loan = await Loan.findById(id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan application not found' });
    }
    res.status(200).json(loan);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

// POST loan application (existing)
const applyLoan = async (req, res) => {
  const { amount, term } = req.body;
  
  if (parseFloat(amount) < 100 || parseFloat(amount) > 700000000) {
    return res.status(400).json({ status: '❌ Loan amount must be between $100 and $1000.' });
  }
  if (parseInt(term) < 3 || parseInt(term) > 24) {
    return res.status(400).json({ status: '❌ Loan term must be between 3 and 24 months.' });
  }
  
  const interestRate = amount >= 100 && amount <= 500 ? 5 : 7;
  const rate = interestRate / 100 / 12;
  const emi = (parseFloat(amount) * rate) / (1 - Math.pow(1 + rate, -parseInt(term)));
  
  const approvalRate = Math.min(95, Math.max(30, 100 - parseFloat(amount) / 10));
  const approvalChance = `${approvalRate}% chance of approval`;

  const newLoan = new Loan({
    amount,
    term,
    interestRate,
    monthlyEMI: emi.toFixed(2),
    approvalChance,
    status: '✅ Loan Approved!',
  });

  try {
    const savedLoan = await newLoan.save();
    res.status(201).json(savedLoan);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

module.exports = { getAllLoans, getLoanById, applyLoan };
