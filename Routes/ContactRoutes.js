const express = require('express');
const { check } = require('express-validator');
const router = express.Router();

const paymentController = require('../Controllers/contactController');

// Get all contacts
router.get('/contacts/get', paymentController.getContacts);

// Add new contact
router.post(
  '/contacts/add',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('phone', 'Phone number is required').not().isEmpty(),
  ],
  paymentController.addContact
);

// Update contact (favorite/unfavorite)
router.put('/contacts/:id', paymentController.updateContact);

// Send money (create a transaction)
router.post('/transactions/send', paymentController.sendMoney);

// Get recent transactions
router.get('/transactions/get', paymentController.getTransactions);

module.exports = router;
