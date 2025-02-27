const Loan = require("../models/LoanApplication");
const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();

// 🔥 Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ GET all loan applications
const getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.find();
    res.status(200).json({ success: true, loans });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err });
  }
};

// ✅ GET loan application by ID
const getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, message: "Loan application not found" });
    }
    res.status(200).json({ success: true, loan });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err });
  }
};

// ✅ Apply for a Loan
const applyLoan = async (req, res) => {
  const { amount, term } = req.body;

  if (parseFloat(amount) < 100 || parseFloat(amount) > 700000000) {
    return res.status(400).json({ success: false, message: "Loan amount must be between $100 and $1000." });
  }
  if (parseInt(term) < 3 || parseInt(term) > 24) {
    return res.status(400).json({ success: false, message: "Loan term must be between 3 and 24 months." });
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
    status: "✅ Loan Approved!",
  });

  try {
    const savedLoan = await newLoan.save();
    res.status(201).json({ success: true, loan: savedLoan });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err });
  }
};

// ✅ Create Razorpay Order for EMI Payment
const createLoanPaymentOrder = async (req, res) => {
  try {
    const { loanId, amount } = req.body;

    if (!loanId || !amount) {
      return res.status(400).json({ success: false, message: "Loan ID and amount are required" });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ success: false, message: "Loan not found" });
    }

    const options = {
      amount: amount * 100, // Razorpay requires amount in paise
      currency: "INR",
      receipt: `loan_${loanId}_${Date.now()}`,
      payment_capture: 1, // Auto-capture payment
    };

    const order = await razorpay.orders.create(options);
    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ success: false, message: "Error creating order", error: error.message });
  }
};

// ✅ Verify Razorpay Payment
const verifyLoanPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment data" });
    }

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    res.status(200).json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ success: false, message: "Error verifying payment", error: error.message });
  }
};

// ✅ Repay Loan EMI
const repayLoanEMI = async (req, res) => {
  try {
    const { loanId, paymentId } = req.body;

    if (!loanId || !paymentId) {
      return res.status(400).json({ success: false, message: "Loan ID and Payment ID are required" });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ success: false, message: "Loan not found" });
    }

    // Update the loan status with payment details
    loan.payments.push({ paymentId, date: new Date() });
    await loan.save();

    res.status(200).json({ success: true, message: "Loan EMI payment recorded successfully", loan });
  } catch (error) {
    console.error("Error processing loan repayment:", error);
    res.status(500).json({ success: false, message: "Error processing loan repayment", error: error.message });
  }
};

module.exports = {
  getAllLoans,
  getLoanById,
  applyLoan,
  createLoanPaymentOrder,
  verifyLoanPayment,
  repayLoanEMI,
};
