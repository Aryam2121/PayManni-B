const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  date: { type: Date, required: true },
  passengers: { type: Number, required: true },
  class: { type: String, required: true },
  totalPrice: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Userupi', required: true },

  // ✅ Fields for getAllTransaction compatibility
  type: { type: String, default: "booking" }, // Can be "booking", "transfer", etc.
  amount: { type: Number },                   // Duplicate of totalPrice for consistency
  status: { type: String, enum: ["pending", "success", "failed"], default: "success" },
  createdAt: { type: Date, default: Date.now },
});

bookingSchema.pre("save", function (next) {
  if (!this.amount) {
    this.amount = this.totalPrice;
  }
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
