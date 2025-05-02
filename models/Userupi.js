const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
  },
  name: String,
  email: { type: String, unique: true, sparse: true }, // make sparse in case phone-only users don’t have email
  password: { type: String }, // optional for Firebase users
  balance: { type: Number, default: 0 },
  upiId: { type: String, unique: true, sparse: true }, // john@paymanni
});

const Userupi = mongoose.model("Userupi", userSchema);
module.exports = Userupi;
