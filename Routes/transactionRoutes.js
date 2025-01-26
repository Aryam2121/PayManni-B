// routes/transactionRoutes.js
const express = require('express');
const { createTransaction, getTransactions } = require('../Controllers/TransactionController');
const router = express.Router();

router.post('/sendTrans', createTransaction);
router.get('/getTrans', getTransactions);

module.exports = router;
