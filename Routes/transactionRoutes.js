// routes/transactionRoutes.js
const express = require('express');
const { createTransaction, getTransactions } = require('../Controllers/TransactionController');
const router = express.Router();

router.post('/send', createTransaction);
router.get('/get', getTransactions);

module.exports = router;
