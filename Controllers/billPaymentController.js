const BillPayment = require("../models/BillPayment");

// Create a new bill payment
 const payBill = async (req, res) => {
  try {
    const { billType, amount, paymentMethod } = req.body;

    if (!billType || !amount || !paymentMethod) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newPayment = new BillPayment({
      billType,
      amount,
      paymentMethod,
      status: "success", // Assuming all payments succeed for now
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
    const payments = await BillPayment.find().sort({ paymentDate: -1 });
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