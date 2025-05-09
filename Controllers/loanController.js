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
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized: user not found" });
    }

    const loans = await Loan.find({ userId: req.user.id });

    if (!loans || loans.length === 0) {
      return res.status(200).json({ success: true, loans: [], message: "No loans found" });
    }

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
    const userId = req.user.id;

    const { amount, term, interestRate, monthlyEMI, approvalChance } = req.body;

    if (!amount || !term || !interestRate || !monthlyEMI || !approvalChance) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const newLoan = new Loan({
      userId,
      amount,
      term,
      interestRate,
      monthlyEMI,
      approvalChance,
      status: "pending",
      type: "loan"
    });

    await newLoan.save();

    res.status(201).json({
      success: true,
      message: "Loan applied successfully",
      loan: newLoan
    });
  } catch (error) {
    console.error("❌ applyLoan error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Create Razorpay order for EMI
const createLoanPaymentOrder = async (req, res) => {
  try {
    const { loanId, amount } = req.body;

    console.log("📥 createLoanPaymentOrder input:", req.body);

    // ✅ Check Razorpay keys
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success: false, message: "Razorpay keys not configured properly" });
    }

    // ✅ Validate input
    if (!loanId || !amount) {
      return res.status(400).json({ success: false, message: "Loan ID and amount are required" });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    // ✅ Find the loan
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ success: false, message: "Loan not found" });
    }

    // ✅ Shorten the receipt ID to fit the Razorpay limit
    const receiptId = `loan_${loanId.slice(-6)}_${Date.now().toString().slice(-6)}`;

    // ✅ Prepare Razorpay order options
    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency: "INR",
      receipt: receiptId, // short receipt ID
      payment_capture: 1,
    };

    console.log("📤 Razorpay order options:", options);

    // ✅ Create the order
    const order = await razorpay.orders.create(options);

    res.status(201).json({ success: true, order });

  } catch (error) {
    console.error("❌ Razorpay order creation error:", error?.error?.description || error.message);

    res.status(500).json({
      success: false,
      message: "Error creating order",
      error: error?.error?.description || error.message
    });
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

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    }
    );
  } catch (error) {
    console.error("❌ verifyLoanPayment error:", error);
    res.status(500).json({ success: false, message: "Error verifying payment", error: error.message });
  }
};

// ✅ Repay EMI and save to loan record
const repayLoanEMI = async (req, res) => {
  try {
    const userId = req.user.id;
    const { loanId } = req.params;
    const { amount, userUpi, paymentId } = req.body;
    if (!amount || !userUpi) {
      return res.status(400).json({ success: false, message: "Amount and userUpi are required" });
    }

    const loan = await Loan.findOne({ _id: loanId, userId });

    if (!loan) {
      return res.status(404).json({ success: false, message: "Loan not found" });
    }

    const payment = {
      paymentId: paymentId || `EMI_${Date.now()}`, // fallback
      amount,
      userUpi,
      status: "success",
      type: "emi-payment",
      date: new Date()
    };

    loan.payments.push(payment);
    await loan.save();

    res.status(200).json({
      success: true,
      message: "EMI payment successful",
      loan
    });
  } catch (error) {
    console.error("❌ repayLoanEMI error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
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
