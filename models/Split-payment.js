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
});

const Group = mongoose.model("Group", GroupSchema);
module.exports = Group;
