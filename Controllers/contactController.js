const Contact = require('../models/Contact');
const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

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

// Step 1: Create Razorpay Order
exports.sendMoney = async (req, res) => {
  const { userId, amount, paymentMethod, contacts } = req.body;

  if (!paymentMethod || !userId || !amount || !contacts) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount. Amount must be a positive number.' });
  }

  try {
    const existingContacts = await Contact.find({ '_id': { $in: contacts } });
    if (existingContacts.length !== contacts.length) {
      return res.status(404).json({ message: 'One or more contacts not found' });
    }

    const options = {
      amount: amount * 100, // Convert INR to paise
      currency: 'INR',
      receipt: `txn_${Date.now()}`,
      payment_capture: 1, // Auto capture payment
    };

    const order = await razorpay.orders.create(options);

    // Save order details to track payment later
    const transaction = new Transaction({
      userId,
      amount,
      paymentMethod,
      contacts,
      razorpayOrderId: order.id,
      status: "PENDING"
    });

    await transaction.save();

    res.status(201).json({ success: true, orderId: order.id, amount, currency: 'INR' });
  } catch (error) {
    console.error('Error processing transaction:', error);
    res.status(500).json({ message: 'Server error while processing the transaction.' });
  }
};

// Step 2: Verify Payment After Razorpay Callback
exports.verifyPayment = async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  try {
    const transaction = await Transaction.findOne({ razorpayOrderId: razorpay_order_id });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Verify Razorpay signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Update transaction status
    transaction.status = "SUCCESS";
    transaction.razorpayPaymentId = razorpay_payment_id;
    await transaction.save();

    res.status(200).json({ message: "Payment verified successfully", transaction });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Server error while verifying payment" });
  }
};

// Get recent transactions
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('userId')
      .populate('contacts');

    if (!transactions.length) {
      return res.status(404).json({ message: 'No transactions found' });
    }

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error while fetching transactions.' });
  }
};
