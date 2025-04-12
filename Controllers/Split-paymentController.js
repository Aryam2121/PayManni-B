const Group = require("../models/Group");
const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");

// 🔥 Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name, totalAmount, userId } = req.body;  // Now we're expecting userId to be part of the request body

    if (!name || !totalAmount || !userId) {
      return res.status(400).json({ message: "Name, amount, and userId are required." });
    }

    const newGroup = new Group({
      name,
      totalAmount,
      createdBy: userId,
      members: [],
    });

    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ✅ Get all groups
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find();
    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Add a user to a group
exports.addUserToGroup = async (req, res) => {
  try {
    const { groupId, userName } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    // Check if user already exists
    const userExists = group.members.some((user) => user.name === userName);
    if (userExists) return res.status(400).json({ message: "User already in the group." });

    // Add new user to group
    group.members.push({ name: userName, payment: 0 });
    await group.save();

    res.status(200).json(group);
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Remove a user from a group
exports.removeUserFromGroup = async (req, res) => {
  try {
    const { groupId, userName } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    group.members = group.members.filter((member) => member.name !== userName);
    await group.save();
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update payment amount for a user
exports.updateUserPayment = async (req, res) => {
  try {
    const { groupId, userName, payment } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    const user = group.members.find((member) => member.name === userName);
    if (!user) return res.status(404).json({ message: "User not found in group." });

    user.payment = payment;
    await group.save();
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Split payment among members
exports.splitPayment = async (req, res) => {
  try {
    const { groupId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    const totalMembers = group.members.length;
    if (totalMembers === 0) return res.status(400).json({ message: "No members in the group." });

    const sharePerPerson = (group.totalAmount / totalMembers).toFixed(2);
    group.members.forEach((member) => (member.payment = sharePerPerson));

    await group.save();
    res.status(200).json({ message: "Payment split successfully.", group });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Create Razorpay Order for Group Member
exports.createPaymentOrder = async (req, res) => {
  try {
    const { groupId, userName } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    const user = group.members.find((member) => member.name === userName);
    if (!user) return res.status(404).json({ message: "User not found in group." });

    const amount = user.payment * 100; // Convert to paise for Razorpay

    const options = {
      amount,
      currency: "INR",
      receipt: `group_${groupId}_user_${userName}_${Date.now()}`,
      payment_capture: 1, // Auto-capture payment
    };

    const order = await razorpay.orders.create(options);
    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ message: "Error creating order", error: error.message });
  }
};

// ✅ Verify Razorpay Payment
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, groupId, userName, method } = req.body;
    const userId = req.user?._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    const user = group.members.find((member) => member.name === userName);
    if (!user) return res.status(404).json({ message: "User not found in group." });

    // 💰 Handle Wallet Payment
    if (method === "wallet") {
      const wallet = await Wallet.findOne({ userId });
      if (!wallet || wallet.balance < user.payment) {
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }

      // Deduct amount
      wallet.balance -= user.payment;
      await wallet.save();

      // Log transaction
      await WalletTransaction.create({
        user: userId,
        amount: user.payment,
        type: "Withdraw",
        description: `Group Payment - ${group.name}`,
      });

      user.paymentStatus = "Paid (Wallet)";
      await group.save();

      return res.status(200).json({ success: true, message: "Payment successful via wallet" });
    }

    // 💳 Razorpay Payment Verification
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Update status
    user.paymentStatus = "Paid (Razorpay)";
    await group.save();

    // Log Razorpay transaction
    await WalletTransaction.create({
      user: userId,
      amount: user.payment,
      type: "debit",
      method: method === "wallet" ? "Wallet" : "Razorpay",
      status: "success",
      description: `Group Payment - ${group.name}${method === "razorpay" ? " (Razorpay)" : ""}`,
      groupId: groupId,
      razorpayOrderId: razorpay_order_id || null,
      razorpayPaymentId: razorpay_payment_id || null,
    });

    res.status(200).json({ success: true, message: "Razorpay payment verified and logged" });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ message: "Payment verification failed", error: error.message });
  }
};
exports.getAllGroupTransactions = async (req, res) => {
  try {
    const userId = req.user?._id; // From JWT token

    const groupTransactions = await Group.find({ createdBy: userId }).sort({ createdAt: -1 });
    res.status(200).json(groupTransactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.checkWalletBalance = async (req, res) => {
  try {
    const { groupId, userName } = req.body;
    const userId = req.user?._id;

    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Check if user exists in group
    const user = group.members.find((m) => m.name === userName);
    if (!user) return res.status(404).json({ message: "User not found in group" });

    // Check wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) return res.json({ canPayWithWallet: false, message: "Wallet not found" });

    if (wallet.balance >= user.payment) {
      return res.json({ canPayWithWallet: true });
    } else {
      return res.json({ canPayWithWallet: false, message: "Insufficient wallet balance" });
    }
  } catch (error) {
    console.error("Error checking wallet balance:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getGroupTransactions = async (req, res) => {
  try {
    const { groupId } = req.params;

    const transactions = await WalletTransaction.find({ groupId }).populate("user", "name email");

    res.status(200).json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch group transactions", error: err.message });
  }
};
