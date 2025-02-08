const express = require('express');
const router = express.Router();
const { getAllLoans, getLoanById, applyLoan } = require('../Controllers/loanController');

// GET all loan applications
router.get('/loans', getAllLoans);

// GET loan application by ID
router.get('/loans/:id', getLoanById);

// POST loan application (existing)
router.post('/loans/apply', applyLoan);

module.exports = router;
