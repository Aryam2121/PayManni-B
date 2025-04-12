const WalletTransaction = require('../models/WalletTransaction');
const Transfer = require('../models/Transfer');
const Recharge = require('../models/Recharge');
const Contact = require('../models/Contact');
const BusBooking = require('../models/BusBooking');
const Booking = require('../models/Train');
const Flight = require('../models/Flight');
const Movie = require('../models/Movie');
const Loan = require('../models/LoanApplication');
const Payment = require('../models/Payment');
const BillPayment = require('../models/BillPayment');
const Group = require('../models/Group');
const Bank = require('../models/Bank');
const Userupi = require('../models/Userupi');

const getAllTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    // 🔹 Fetch basic transactions
    const [
      walletTxns,
      transferTxns,
      rechargeTxns,
      contactTxns,
      busTxns,
      trainTxns,
      flightTxns,
      movieTxns,
      loanTxns,
      billTxns,
      splitTxns,
      paymentTxns,
    ] = await Promise.all([
      WalletTransaction.find({ user: userId }),
      Transfer.find({ user: userId }),
      Recharge.find({ user: userId }),
      Contact.find({ user: userId }),
      BusBooking.find({ user: userId }),
      Booking.find({ user: userId }),
      Flight.find({ user: userId }),
      Movie.find({ user: userId }),
      Loan.find({ user: userId }),
      BillPayment.find({ user: userId }), // ensure schema has 'user' field
      Group.find({ user: userId }),
      Payment.find({ user: userId }),
    ]);

    // 🔹 Fetch bank transactions (flattened)
    const user = await Userupi.findById(userId);
    const bank = await Bank.findOne({ user: userId });

    const bankTxns = (bank?.transactions || []).map(txn => ({
      type: txn.type === 'credit' ? 'Receive Money' : 'Send Money',
      amount: txn.amount,
      description: txn.description || 'Bank Transaction',
      date: txn.date,
      details: txn,
      typeTag: 'bank',
    }));

    // 🔹 Helper to standardize format
    const formatTxn = (type, txn) => ({
      type,
      amount: txn.amount,
      description: txn.description || txn.reason || `${type} transaction`,
      date: txn.date || txn.paymentDate || txn.createdAt,
      details: txn,
      razorpayOrderId: txn.razorpayOrderId, // Add Razorpay order ID
      razorpayPaymentId: txn.razorpayPaymentId, // Add Razorpay payment ID
    });
    

    const allTransactions = [
      ...walletTxns.map(txn => formatTxn('Wallet', txn)),
      ...transferTxns.map(txn => formatTxn('Transfer', txn)),
      ...rechargeTxns.map(txn => formatTxn('Recharge', txn)),
      ...contactTxns.map(txn => formatTxn('Pay Contact', txn)),
      ...busTxns.map(txn => formatTxn('Bus Booking', txn)),
      ...trainTxns.map(txn => formatTxn('Train Booking', txn)),
      ...flightTxns.map(txn => formatTxn('Flight Booking', txn)),
      ...movieTxns.map(txn => formatTxn('Movie Booking', txn)),
      ...loanTxns.map(txn => formatTxn('Loan', txn)),
      ...bankTxns, // already formatted with type
      ...billTxns.map(txn => formatTxn('Bill Payment', txn)),
      ...splitTxns.map(txn => formatTxn('Split Payment', txn)),
      ...paymentTxns.map(txn => formatTxn('Payment', txn)),
    ];

    // 🔹 Sort all by latest
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({ success: true, transactions: allTransactions });
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAllTransactions };
