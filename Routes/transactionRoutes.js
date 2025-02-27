const express = require("express");
const router = express.Router();
const transactionController = require("../Controllers/TransactionController.js");

// ✅ Recharge Account (Create Razorpay Order)
router.post("/recharge", transactionController.rechargeAccount);

// ✅ Get User Transactions
router.get("/transactions/:userId", transactionController.getTransactions);

module.exports = router;
