const mongoose = require("mongoose");

const busSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Userupi", // optional, but useful if you use user model
    required: true
  },
  userUpi: {
    type: String,
    required: true
  },
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
  },
  status: {
    type: String,
    enum: ['booked', 'cancelled'],
    default: 'booked'
  },
  typeTag: {
    type: String,
    default: 'bus' // for getAllTransactions filtering
  }
}, { timestamps: true });

const Bus = mongoose.model("Bus", busSchema);

module.exports = Bus;
