const mongoose = require('mongoose');

// Booking Subschema
const movieBookingSubSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Userupi', required: true },
  seatsBooked: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  paymentStatus: { type: String, default: 'Pending', enum: ['Pending', 'Completed', 'Failed'] },
  bookingDate: { type: Date, default: Date.now },

  // ✅ For getAllTransaction compatibility
  type: { type: String, default: 'movie' },
  amount: { type: Number }, // duplicate of totalPrice
  status: { type: String, default: 'success', enum: ['pending', 'success', 'failed'] },
  createdAt: { type: Date, default: Date.now },
});

// Middleware to sync amount and status
movieBookingSubSchema.pre('save', function (next) {
  this.amount = this.totalPrice;
  this.status = this.paymentStatus?.toLowerCase() || 'pending';
  this.createdAt = this.bookingDate || new Date();
  next();
});

// Main Movie Schema
const MovieBookingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes
  price: { type: Number, required: true },
  seatsAvailable: { type: Number, required: true },
  image: { type: String },
  bookings: [movieBookingSubSchema], // Array of compatible booking objects
});

const Movie = mongoose.model('Movie', MovieBookingSchema);

module.exports = Movie;
