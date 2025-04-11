const mongoose = require("mongoose");

const flightSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Userupi", required: true }, // ✅ Reference to the user

  airline: { type: String, required: true },
  departure: { type: String, required: true },
  arrival: { type: String, required: true },
  duration: { type: String, required: true },
  price: { type: Number, required: true },
  departureDate: { type: Date, required: true },
  returnDate: { type: Date },
  passengers: { type: Number },
  travelClass: {
    type: String,
    enum: ["Economy", "Business", "First Class", "Premium Economy"]
  },

  // ✅ Standard transaction fields
  type: { type: String, default: "flight-booking" },
  status: { type: String, enum: ["success", "failed", "pending"], default: "success" },
  userUpi: { type: String }, // For identifying who booked it
  createdAt: { type: Date, default: Date.now }
});

const Flight = mongoose.model("Flight", flightSchema);

module.exports = Flight;
