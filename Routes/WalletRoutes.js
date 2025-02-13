// routes/walletRoutes.js
const express = require("express");
const router = express.Router();
const walletController = require("../Controllers/WalletController.js");

// Route for fetching wallet details
router.get("/wallet", walletController.getWalletDetails);

// Route for depositing money
router.post("/deposit", walletController.depositMoney);

// Route for withdrawing money
router.post("/withdraw", walletController.withdrawMoney);

module.exports = router;
