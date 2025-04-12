const Contact = require('../models/Contact');
const { validationResult } = require('express-validator');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const WalletTransaction = require('../models/WalletTransaction'); 
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
    // Check if the provided contacts exist in the database
    const existingContacts = await Contact.find({ '_id': { $in: contacts } });
    if (existingContacts.length !== contacts.length) {
      return res.status(404).json({ message: 'One or more contacts not found' });
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise (1 INR = 100 paise)
      currency: 'INR',
      receipt: `txn_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    // Save the transaction to WalletTransaction model
    const transaction = new WalletTransaction({
      user: userId, // The user who initiated the transaction
      amount: amount, // The amount being sent
      type: "Payment", // Transaction type is 'Payment'
      description: `Payment to contacts: ${contacts.join(', ')}`, // A simple description
      razorpayOrderId: order.id, // Save the Razorpay order ID
      razorpayPaymentId: "", // Initially, leave the Razorpay payment ID empty
    });

    await transaction.save(); // Save the transaction to the database

    // Respond with the Razorpay order details and transaction details
    res.status(201).json({
      success: true,
      orderId: order.id,
      amount,
      currency: 'INR',
      transactionId: transaction._id, // Include the transaction ID in the response
    });
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

    // Find the corresponding transaction and update status
    const transaction = await WalletTransaction.findOne({ razorpayOrderId: razorpay_order_id });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    transaction.razorpayPaymentId = razorpay_payment_id; // Update the payment ID
    transaction.status = "completed"; // Or failed based on actual status
    await transaction.save();

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

