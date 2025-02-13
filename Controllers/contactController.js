const Contact = require('../models/Contact');
const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');

// Get all contacts
exports.getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.status(200).json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a new contact
exports.addContact = async (req, res) => {
  const { name, phone } = req.body;

  // Validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const newContact = new Contact({ name, phone });
    await newContact.save();
    res.status(201).json(newContact);
  } catch (error) {
    console.error('Error adding contact:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update contact (favorite/unfavorite)
exports.updateContact = async (req, res) => {
  const contactId = req.params.id;
  const { isFavorite } = req.body;

  try {
    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    contact.isFavorite = isFavorite;
    await contact.save();
    res.status(200).json(contact);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send money (create a transaction)
exports.sendMoney = async (req, res) => {
  const { userId, amount, paymentMethod, contacts } = req.body;

  // Validate required fields
  if (!paymentMethod || !userId || !amount || !contacts) {
    return res.status(400).json({ error: 'Missing required fields: paymentMethod, userId, amount, or contacts.' });
  }

  // Validate that the amount is a valid number and greater than 0
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount. Amount must be a positive number.' });
  }

  try {
    // Check if all contacts exist in the database
    const existingContacts = await Contact.find({ '_id': { $in: contacts } });
    if (existingContacts.length !== contacts.length) {
      return res.status(404).json({ message: 'One or more contacts not found' });
    }

    // Create a new transaction
    const transaction = new Transaction({
      userId,
      amount,
      paymentMethod,
      contacts,
    });

    // Save the transaction to the database
    await transaction.save();

    // Return the saved transaction
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error processing transaction:', error);
    res.status(500).json({ message: 'Server error while processing the transaction.' });
  }
};
// Get recent transactions
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('userId')     // Populate the userId field with User details
      .populate('contacts');  // Populate the contacts field with Contact details

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({ message: 'No transactions found' });
    }

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error while fetching transactions.' });
  }
};

