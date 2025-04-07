const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: { type: String }, 
  balance: { type: Number, default: 0 },
  upiId: { type: String, unique: true, sparse: true } // e.g., john@paymanni
});

const Userupi = mongoose.model('Userupi', userSchema);
module.exports = Userupi;
