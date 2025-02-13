const mongoose = require("mongoose");

const busSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['AC Sleeper', 'Non-AC Seater', 'AC Semi-Sleeper'],
    required: true
  },
  time: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  availableSeats: {
    type: Number,
    required: true
  }
}, { timestamps: true });

const Bus = mongoose.model("Bus", busSchema);

module.exports = Bus;
