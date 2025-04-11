const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  isFavorite: { type: Boolean, default: false },

  // ✅ Compatibility with getAllTransactions
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserUpi' }, // who added the contact
  userUpi: { type: String }, // readable UPI or username
  type: { type: String, default: "contact" }, // fixed type
  status: { type: String, default: "added" }, // contact addition status (you can change as needed)
}, { timestamps: true }); // for createdAt field

const Contact = mongoose.model('Contact', contactSchema);
module.exports = Contact;
