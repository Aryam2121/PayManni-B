const mongoose = require("mongoose");

const flightSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Userupi", required: true },

  // Flight details
  airline: { type: String, required: true },
  flightNumber: { type: String }, // like AI-202, EK-505
  departure: { type: String, required: true },
  arrival: { type: String, required: true },
  departureAirportCode: { type: String }, // e.g. DEL, BOM
  arrivalAirportCode: { type: String },
  departureDateTime: { type: Date, required: true },
  arrivalDateTime: { type: Date },
  duration: { type: String }, // Optional if you calculate from dep/arr
  stops: { type: Number, default: 0 }, // Non-stop = 0

  // Passenger & booking info
  passengers: { type: Number, default: 1 },
  travelClass: {
    type: String,
    enum: ["Economy", "Premium Economy", "Business", "First Class"],
    default: "Economy"
  },
  seatNumbers: [{ type: String }], // ["12A", "12B"]

  // Price breakdown
  baseFare: { type: Number, required: true },
  taxes: { type: Number, default: 0 },
  convenienceFee: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },

  // Optional return trip
  returnDateTime: { type: Date },
  returnFlightNumber: { type: String },
  returnDeparture: { type: String },
  returnArrival: { type: String },

  // Payment & status
  userUpi: { type: String }, // e.g. user@upi
  paymentMethod: { type: String, enum: ["wallet", "upi", "card", "netbanking"] },
  status: { type: String, enum: ["success", "failed", "pending"], default: "success" },
  type: { type: String, default: "flight-booking" },
  paymentId: { type: String }, // ✅ Add this in schema


  // Extras
  baggageAllowance: { type: String }, // like "20kg checked-in, 7kg cabin"
  mealIncluded: { type: Boolean, default: false },
  refundable: { type: Boolean, default: false },
  pnr: { type: String }, // generated PNR number
  bookingId: { type: String, unique: true }, // custom booking id
  createdAt: { type: Date, default: Date.now }
});

const Flight = mongoose.model("Flight", flightSchema);
module.exports = Flight;
