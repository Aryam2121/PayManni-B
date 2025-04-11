const Contact = require('../models/Contact');
const { validationResult } = require('express-validator');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Get all contacts
exports.getAllContacts = async (req, res) => {
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
  const { name, phone, userId, userUpi } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const newContact = new Contact({
      name,
      phone,
      userId,
      userUpi,
      type: "contact",
      status: "added",
    });

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

// Step 1: Create Razorpay Order (Send Money)
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
      amount: amount * 100,
      currency: 'INR',
      receipt: `txn_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    // No transaction saving here

    res.status(201).json({ success: true, orderId: order.id, amount, currency: 'INR' });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: 'Server error while creating order.' });
  }
};

// Step 2: Verify Payment
exports.verifyPayment = async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  try {
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    res.status(200).json({
      message: "Payment verified successfully",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Server error while verifying payment" });
  }
};

