const Group = require("../models/Split-payment.js");
const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();

// 🔥 Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name, totalAmount } = req.body;
    if (!name || !totalAmount) {
      return res.status(400).json({ message: "Name and amount are required." });
    }

    const newGroup = new Group({ name, members: [], totalAmount });
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, groupId, userName } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment data" });
    }

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Update payment status
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    const user = group.members.find((member) => member.name === userName);
    if (!user) return res.status(404).json({ message: "User not found in group." });

    user.paymentStatus = "Paid";
    await group.save();

    res.status(200).json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Error verifying payment", error: error.message });
  }
};
