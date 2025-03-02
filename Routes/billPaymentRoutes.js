const express = require("express");
const { payBill, getAllPayments, getPaymentHistoryByBill } = require("../Controllers/billPaymentController.js");
const router = express.Router();


// Route to pay a bill
router.post("/pay", payBill);

// Route to get all payments
router.get("/history", getAllPayments);

// Route to get payment history for a specific bill type
router.get("/history/:billType", getPaymentHistoryByBill);

module.exports = router;
