const express = require('express');
const { rechargeAccount, getTransactions } = require("../Controllers/TransactionController.js");

const router = express.Router();

// Recharge Route
router.post("/recharge", rechargeAccount);

// Get Transaction History
router.get("/recharge/:userId/transactions", getTransactions);

module.exports = router;  
