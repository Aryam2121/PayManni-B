const express = require("express");
const {
  getAllLoans,
  getLoanById,
  applyLoan,
  createLoanPaymentOrder,
  verifyLoanPayment,
  repayLoanEMI,
} = require("../Controllers/loanController.js");

const router = express.Router();

// ✅ GET all loan applications
router.get("/getAllloans", getAllLoans);

// ✅ GET loan application by ID
router.get("/loans/:id", getLoanById);

// ✅ Apply for a Loan
router.post("/loans/apply", applyLoan);

// ✅ Create Razorpay Order for EMI Payment
router.post("/loans/payment/order", createLoanPaymentOrder);

// ✅ Verify Razorpay Payment
router.post("/loans/payment/verify", verifyLoanPayment);

// ✅ Repay Loan EMI
router.post('/:loanId/repay', repayLoanEMI);
module.exports = router;
