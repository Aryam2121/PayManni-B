// models/Flight.js
const mongoose = require("mongoose");

const flightSchema = new mongoose.Schema({
  airline: { type: String, required: true },
  departure: { type: String, required: true },
  arrival: { type: String, required: true },
  duration: { type: String, required: true },
  price: { type: Number, required: true },
  departureDate: { type: Date, required: true },  // New field for departure date
  returnDate: { type: Date },  // Optional return date
  passengers: { type: Number },  // Number of passengers
  travelClass: { type: String, enum: ["Economy", "Business", "First Class",'Premium Economy'] },  // Travel class
});

const Flight = mongoose.model("Flight", flightSchema);

module.exports = Flight;

