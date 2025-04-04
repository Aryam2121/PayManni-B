// models/Movie.js
const mongoose = require('mongoose');

// Define the Movie Schema with booking details
const MovieBookingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },  // Movie duration in minutes
  price: { type: Number, required: true },
  seatsAvailable: { type: Number, required: true }, // Number of available seats
  image: { type: String },
  bookings: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Reference to User model
      seatsBooked: { type: Number, required: true }, // Number of seats booked by the user
      totalPrice: { type: Number, required: true }, // Total price for the booking
      paymentStatus: { type: String, default: 'Pending', enum: ['Pending', 'Completed', 'Failed'] }, // Payment status
      bookingDate: { type: Date, default: Date.now },  // Date of booking
    },
  ],
});

// Create a model using the schema
const Movie = mongoose.model('Movie', MovieBookingSchema);

module.exports = Movie;
