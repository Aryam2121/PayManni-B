const express = require("express");
const router = express.Router();
const walletController = require("../Controllers/walletController.js");
const { authenticateUser } = require("../Middleware/authMiddleware.js");

// ✅ Get wallet details (balance & transactions)
router.get("/", authenticateUser, walletController.getWalletDetails);

// ✅ Deposit money via Razorpay
router.post("/deposit", authenticateUser, walletController.depositMoney);

// ✅ Confirm deposit via Razorpay Webhook (Webhook doesn't require authentication)
router.post("/confirm-deposit", walletController.confirmDeposit);

// ✅ Withdraw money
router.post("/withdraw", authenticateUser, walletController.withdrawMoney);

module.exports = router;
