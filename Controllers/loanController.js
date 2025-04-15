const Loan = require("../models/LoanApplication");
const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();

// ✅ Validate Razorpay credentials
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("❌ Razorpay keys missing in .env file");
}

// 🔥 Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Get all loans for a specific user
const getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ userId: req.user.id });
    res.status(200).json({ success: true, loans });
  } catch (error) {
    console.error("❌ getAllLoans error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Get loan by ID
const getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate("userId");
    if (!loan) {
      return res.status(404).json({ success: false, message: "Loan application not found" });
    }
    res.status(200).json({ success: true, loan });
  } catch (error) {
    console.error("❌ getLoanById error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Apply for a loan
const applyLoan = async (req, res) => {
  try {
    const { amount, term } = req.body;
    console.log("📥 applyLoan input:", { amount, term });

    if (!amount || !term) {
      return res.status(400).json({ success: false, message: "Amount and term are required" });
    }

    if (parseFloat(amount) < 100 || parseFloat(amount) > 700000000) {
      return res.status(400).json({ success: false, message: "Loan amount must be between ₹100 and ₹700,000,000." });
    }

    if (parseInt(term) < 3 || parseInt(term) > 24) {
      return res.status(400).json({ success: false, message: "Loan term must be between 3 and 24 months." });
    }

    const interestRate = amount <= 500 ? 5 : 7;
    const rate = interestRate / 100 / 12;
    const emi = (parseFloat(amount) * rate) / (1 - Math.pow(1 + rate, -parseInt(term)));
    const approvalRate = Math.min(95, Math.max(30, 100 - parseFloat(amount) / 10));
    const approvalChance = `${approvalRate}% chance of approval`;

    const newLoan = new Loan({
      userId: req.user.id,
      amount,
      term,
      interestRate,
      monthlyEMI: emi.toFixed(2),
      approvalChance,
      status: "success",
      type: "loan",
    });

    const savedLoan = await newLoan.save();
    res.status(201).json({ success: true, loan: savedLoan });
  } catch (error) {
    console.error("❌ applyLoan error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Create Razorpay order for EMI
const createLoanPaymentOrder = async (req, res) => {
  try {
    const { loanId, amount } = req.body;
    console.log("📥 createLoanPaymentOrder input:", { loanId, amount });

    if (!loanId || !amount) {
      return res.status(400).json({ success: false, message: "Loan ID and amount are required" });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ success: false, message: "Loan not found" });
    }

    const options = {
      amount: Math.round(amount * 100), // in paise
      currency: "INR",
      receipt: `loan_${loanId}_${Date.now()}`,
      payment_capture: 1,
    };

    console.log("📤 Razorpay order options:", options);
    const order = await razorpay.orders.create(options);

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error("❌ createLoanPaymentOrder error:", error);
    res.status(500).json({ success: false, message: "Error creating order", error: error.message });
  }
};

// ✅ Verify Razorpay payment
const verifyLoanPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    res.status(200).json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    console.error("❌ verifyLoanPayment error:", error);
    res.status(500).json({ success: false, message: "Error verifying payment", error: error.message });
  }
};

// ✅ Repay EMI and save to loan record
const repayLoanEMI = async (req, res) => {
  try {
    const { loanId, paymentId, amount, userUpi } = req.body;
    console.log("📥 repayLoanEMI input:", { loanId, paymentId, amount, userUpi });

    if (!loanId || !paymentId || !amount || !userUpi) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ success: false, message: "Loan not found" });
    }

    loan.payments.push({
      paymentId,
      amount,
      userUpi,
      date: new Date(),
      status: "success",
      type: "emi-payment",
    });

    await loan.save();
    res.status(200).json({ success: true, message: "EMI payment recorded", loan });
  } catch (error) {
    console.error("❌ repayLoanEMI error:", error);
    res.status(500).json({ success: false, message: "Error processing repayment", error: error.message });
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
