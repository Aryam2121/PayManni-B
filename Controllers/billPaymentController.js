const BillPayment = require("../models/BillPayment");

// Create a new bill payment
const payBill = async (req, res) => {
  try {
    const { billType, amount, paymentMethod, userId, userUpi } = req.body;

    if (!billType || !amount || !paymentMethod || !userId || !userUpi) {
      return res.status(400).json({ message: "All fields are required including userId and userUpi" });
    }

    const newPayment = new BillPayment({
      userId,
      userUpi,
      billType,
      amount,
      paymentMethod,
      status: "success", // Simulated for now
      typeTag: "bill",   // So getAllTransaction can filter it
    });

    await newPayment.save();
    res.status(201).json({ message: "Payment successful", payment: newPayment });
  } catch (error) {
    res.status(500).json({ message: "Payment failed", error: error.message });
  }
};
// Get all bill payments
const getAllPayments = async (req, res) => {
  try {
    const { userId } = req.query;

    const query = userId ? { userId } : {};
    const payments = await BillPayment.find(query).sort({ paymentDate: -1 });

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve payments", error: error.message });
  }
};


// Get payment history by bill type
 const getPaymentHistoryByBill = async (req, res) => {
  try {
    const { billType } = req.params;
    const payments = await BillPayment.find({ billType }).sort({ paymentDate: -1 });

    if (!payments.length) {
      return res.status(404).json({ message: "No payment history found for this bill type" });
    }

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve history", error: error.message });
  }
};
module.exports = { payBill, getAllPayments, getPaymentHistoryByBill };