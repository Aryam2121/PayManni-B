const Transfer = require("../models/Transfer");
const User = require("../models/User");
const Payment = require("../models/Payment");
const bcrypt = require("bcryptjs");
const Logger = require("../utils/logger");

const validateCard = (card) => {
  const cardRegex = /^\d{16}$/;
  const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  const cvvRegex = /^\d{3,4}$/;

  return cardRegex.test(card.number) && expiryRegex.test(card.expiry) && cvvRegex.test(card.cvv);
};

const createTransfer = async (req, res) => {
  try {
    const { recipient, amount, paymentMethod, cardDetails, paypalId, upiId } = req.body;
    if (!recipient || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid recipient or amount" });
    }

    const user = await User.findById(req.user.userId);
    const recipientUser = await User.findOne({ username: recipient });

    if (!user || !recipientUser) {
      return res.status(400).json({ message: "User or recipient not found" });
    }

    if (user.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    let paymentStatus = "pending";
    let paymentData = {
      userId: user._id,
      recipient: recipientUser._id,
      amount,
      paymentMethod,
      status: paymentStatus,
    };

    if (paymentMethod === "card") {
      if (!cardDetails || !validateCard(cardDetails)) {
        return res.status(400).json({ message: "Invalid card details" });
      }
      cardDetails.number = await bcrypt.hash(cardDetails.number, 10);
      paymentData.cardDetails = cardDetails;
    }

    if (paymentMethod === "paypal" && !paypalId) {
      return res.status(400).json({ message: "PayPal ID is required" });
    }

    if (paymentMethod === "upi" && !/^\d{10}@upi$/.test(upiId)) {
      return res.status(400).json({ message: "Invalid UPI ID format" });
    }

    // Simulated Payment Processing
    paymentStatus = "success"; 
    paymentData.status = paymentStatus;
    paymentData.paypalId = paypalId;
    paymentData.upiId = upiId;

    const newPayment = new Payment(paymentData);
    await newPayment.save();

    if (paymentStatus === "success") {
      user.balance -= amount;
      recipientUser.balance += amount;
      await user.save();
      await recipientUser.save();

      const newTransfer = new Transfer({
        sender: user._id,
        recipient: recipientUser._id,
        amount,
        paymentMethod,
        status: "success",
      });

      await newTransfer.save();
      Logger.info("Payment Successful", { userId: user._id, amount, paymentMethod });
      return res.status(201).json({ message: "Transfer successful", transfer: newTransfer });
    } else {
      Logger.error("Payment Failed", { userId: user._id, amount, paymentMethod });
      return res.status(400).json({ message: "Payment failed" });
    }
  } catch (error) {
    Logger.error("Transfer Error", error);
    res.status(500).json({ message: "Server Error" });
  }
};

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
