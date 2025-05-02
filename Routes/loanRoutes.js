const express = require("express");
const {
  getAllLoans,
  getLoanById,
  applyLoan,
  createLoanPaymentOrder,
  verifyLoanPayment,
  repayLoanEMI,
} = require("../Controllers/loanController.js");

const { authenticateUser} = require("../Middleware/authMiddleware.js"); 

const router = express.Router();

// ✅ GET all loan applications
router.get("/getAllloans", authenticateUser, getAllLoans);

// ✅ GET loan application by ID
router.get("/loans/:id", authenticateUser, getLoanById);

// ✅ Apply for a Loan
router.post("/loans/apply", authenticateUser, applyLoan);

// ✅ Create Razorpay Order for EMI Payment
router.post("/loans/payment/order", authenticateUser, createLoanPaymentOrder);

// ✅ Verify Razorpay Payment (optional, depending on client-side verification)
router.post("/loans/payment/verify", verifyLoanPayment);

// ✅ Repay Loan EMI
router.post("/:loanId/repay", authenticateUser, repayLoanEMI);

module.exports = router;
