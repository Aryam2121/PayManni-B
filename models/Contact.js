// models/Contact.js
const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  isFavorite: { type: Boolean, default: false },
});

module.exports = mongoose.model('Contact', ContactSchema);
