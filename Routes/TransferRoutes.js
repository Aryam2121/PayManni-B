const express = require("express");
const router = express.Router();
const transferController = require("../Controllers/TransferController.js");

// ✅ Create a Transfer (with Razorpay)
router.post("/transfer",transferController.createTransfer); // ✅ Correct middleware usage

// ✅ Get User Transfers
router.get("/transfers",transferController.getTransfers); // ✅ Correct middleware usage

module.exports = router;
