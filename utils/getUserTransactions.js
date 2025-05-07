// utils/getUserTransactions.js
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

const getUserTransactions = async (userId) => {
  try {
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
      BillPayment.find({ user: userId }),
      Group.find({ user: userId }),
      Payment.find({ user: userId }),
    ]);

    const bank = await Bank.findOne({ user: userId });

    const bankTxns = (bank?.transactions || []).map(txn => ({
      type: txn.type === 'credit' ? 'Receive Money' : 'Send Money',
      amount: txn.amount,
      description: txn.description || 'Bank Transaction',
      date: txn.date,
      details: txn,
      typeTag: 'bank',
    }));

    const formatTxn = (type, txn) => ({
      type,
      amount: txn.amount,
      description: txn.description || txn.reason || `${type} transaction`,
      date: txn.date || txn.paymentDate || txn.createdAt,
      details: txn,
      razorpayOrderId: txn.razorpayOrderId,
      razorpayPaymentId: txn.razorpayPaymentId,
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
      ...bankTxns,
      ...billTxns.map(txn => formatTxn('Bill Payment', txn)),
      ...splitTxns.map(txn => formatTxn('Split Payment', txn)),
      ...paymentTxns.map(txn => formatTxn('Payment', txn)),
    ];

    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    return allTransactions;
  } catch (error) {
    console.error(`Error fetching transactions for user ${userId}:`, error);
    return [];
  }
};

module.exports = getUserTransactions;
