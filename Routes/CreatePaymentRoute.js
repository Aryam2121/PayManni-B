const express = require('express');
const createPaymentController = require('../Controllers/createPaymentLink.js');

const router = express.Router();

// Controller for creating a payment

// Route to handle payment creation
router.post('/payment/create-link', createPaymentController);

module.exports = router;