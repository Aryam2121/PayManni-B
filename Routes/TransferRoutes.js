const express = require("express");
const router = express.Router();
const transferController = require("../Controllers/transferController.js");
const { authenticateUser } = require("../Middleware/authMiddleware.js"); // ✅ Destructure the function

// ✅ Create a Transfer (with Razorpay)
router.post("/transfer", authenticateUser, transferController.createTransfer); // ✅ Correct middleware usage

// ✅ Get User Transfers
router.get("/transfers", authenticateUser, transferController.getTransfers); // ✅ Correct middleware usage

module.exports = router;
