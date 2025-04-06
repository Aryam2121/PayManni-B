const express = require("express");
const {createPaymentLink} = require('../Controllers/createPaymentLink.js');

const router = express.Router();
// Controller for creating a payment

// Route to handle payment creation
router.post('/payment/create-link', createPaymentLink);
module.exports = router;