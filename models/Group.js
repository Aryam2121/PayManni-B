const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  members: [
    {
      name: { type: String, required: true },
      payment: { type: Number, default: 0 },
    },
  ],
  totalAmount: { type: Number, required: true },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Userupi", required: false }, // Who created the group/split
  description: { type: String }, // Optional for notes like "Dinner Split", etc.

}, { timestamps: true }); // Adds createdAt and updatedAt automatically

const Group = mongoose.model("Group", GroupSchema);
module.exports = Group;
