const express = require("express");
const router = express.Router();
const { rechargeAccount, getRecharges, verifyRechargePayment } = require("../Controllers/RechargeController.js");

// ✅ Recharge Account (Create Razorpay Order)
router.post("/recharge", rechargeAccount);

// ✅ Get User Transactions (Fetch by userId)
router.get("/recharges/:userId", getRecharges);

// ✅ Verify Payment (Razorpay callback verification)
router.post("/verify-payment", verifyRechargePayment);

module.exports = router;
