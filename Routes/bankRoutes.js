const express = require("express");
const { getBankInfo, addLinkedAccount, addTransaction } = require('../Controllers/bankController.js');
const router = express.Router();

// GET banking data for a user
router.get('/:userId', getBankInfo);

// POST add linked account
router.post('/:userId/account', addLinkedAccount);

// POST add transaction
router.post('/:userId/transaction', addTransaction);

module.exports = router;
