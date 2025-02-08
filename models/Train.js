// models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  from: String,
  to: String,
  date: Date,
  passengers: Number,
  class: String,
  totalPrice: Number,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to a User model
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
