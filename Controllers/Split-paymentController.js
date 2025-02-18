const Group = require("../models/Split-payment.js");

// Create a new group
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

// Get all groups
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find();
    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a user to a group
exports.addUserToGroup = async (req, res) => {
  try {
    const { groupId, userName } = req.body;
    if (!groupId || !userName) {
      return res.status(400).json({ message: "Group ID and user name are required." });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    group.members.push({ name: userName, payment: 0 });
    await group.save();
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove a user from a group
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

// Update payment amount for a user
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

// Split payment among members
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
