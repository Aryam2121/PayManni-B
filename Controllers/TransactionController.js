// controllers/transactionController.js
const Transaction = require('../models/Transaction');
const Contact = require('../models/Contact');

exports.createTransaction = async (req, res) => {
  const { contactIds, amount } = req.body;

  try {
    const transactions = await Promise.all(
      contactIds.map(async (contactId) => {
        const contact = await Contact.findById(contactId);
        if (!contact) throw new Error(`Contact with ID ${contactId} not found`);

        return new Transaction({ contactId, amount }).save();
      })
    );

    res.status(201).json({ success: true, message: 'Transactions created successfully', transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating transactions', error });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().populate('contactId', 'name phone');
    res.status(200).json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching transactions', error });
  }
};
