const express = require("express");
const { sendMoney, verifyPayment, getTransactions } = require("../Controllers/contactController.js");

const router = express.Router();

// 📌 Send money (Create Razorpay Order)
router.post("/transactions/send-money", sendMoney);

// 📌 Verify payment after Razorpay callback
router.post("/transactions/verify-payment", verifyPayment);

// 📌 Get recent transactions
router.get("/transactions", getTransactions);

module.exports = router;
