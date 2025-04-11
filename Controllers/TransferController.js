const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const Transfer = require("../models/Transfer");
const Userupi = require("../models/Userupi");
const Payment = require("../models/Payment");
const bcrypt = require("bcryptjs");
const Logger = require("../utils/logger");
const WalletTransaction = require("../models/WalletTransaction");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Card validation function
const validateCard = (card) => {
  const cardRegex = /^\d{16}$/;
  const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  const cvvRegex = /^\d{3,4}$/;
  return cardRegex.test(card.number) && expiryRegex.test(card.expiry) && cvvRegex.test(card.cvv);
};

// Create Transfer with Razorpay
const createTransfer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { recipient, amount, paymentMethod, cardDetails, paypalId, upiId } = req.body;
    if (!recipient || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid recipient or amount" });
    }

    const user = await Userupi.findById(req.user.userId).session(session);
    const recipientUser = await Userupi.findOne({ username: recipient }).session(session);

    if (!user || !recipientUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "User or recipient not found" });
    }

    if (user.balance < amount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Insufficient balance" });
    }

    let paymentStatus = "pending";
    let paymentData = {
      userId: user._id,                            // 🔗 Reference to user
      recipient: recipientUser.username,          // 🧾 Display name or UPI of recipient
      amount,                                     // 💸 Amount transferred
      paymentMethod,                              // 💳 "card", "paypal", "upi"
      status: paymentStatus,                      // ✅ "pending", "success", etc.
      
      // 🌐 Transaction listing support
      type: "payment",                            // 🚩 For filtering in transaction history
      userUpi: user.username || user.upiId,       // 🧾 To show who paid
      razorpayOrderId: null,                      // 🧾 Set later after Razorpay order creation
    };
    

    if (paymentMethod === "card") {
      if (!cardDetails || !validateCard(cardDetails)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Invalid card details" });
      }
      cardDetails.number = await bcrypt.hash(cardDetails.number, 10);
      paymentData.cardDetails = cardDetails;
    }

    if (paymentMethod === "paypal" && !paypalId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "PayPal ID is required" });
    }

    if (paymentMethod === "upi" && !/^\d{10}@upi$/.test(upiId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Invalid UPI ID format" });
    }

    // Razorpay Order Creation
    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `transfer_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    paymentData.razorpayOrderId = order.id;

    // Save Payment
    const newPayment = new Payment(paymentData);
    await newPayment.save({ session });
    

    // Log Wallet Transaction
    await WalletTransaction.create([{
      user: user._id,
      amount,
      type: "Transfer",
      description: `Transferred to ${recipientUser.username} via ${paymentMethod}`,
    }], { session });

    await session.commitTransaction();
    session.endSession();

    Logger.info("Payment Initiated", { userId: user._id, amount, paymentMethod });

    return res.status(201).json({
      message: "Payment initiated. Proceed to Razorpay checkout.",
      order,
      paymentId: newPayment._id,
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    Logger.error("Transfer Error", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Fetch user transfers
const getTransfers = async (req, res) => {
  try {
    const transfers = await Transfer.find({ sender: req.user.userId }).sort({ createdAt: -1 });
    res.json(transfers);
  } catch (error) {
    Logger.error("Get Transfers Error", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { createTransfer, getTransfers };
