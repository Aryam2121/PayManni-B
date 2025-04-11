const express = require("express");
const router = express.Router();
const { getAllTransactions } = require('../Controllers/UnifiedTransactionController.js'); // assuming you have a controller for unified transactions
const { authenticateUser } = require('../Middleware/authMiddleware.js'); // assuming JWT auth middleware


router.get('/transactions', authenticateUser, getAllTransactions);

module.exports = router;
