const mongoose = require("mongoose");

const busSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Userupi",
    required: true
  },
  userUpi: {
    type: String,
    required: true,
    match: /^[\w.-]+@[\w.-]+$/ // Basic UPI format validation
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["AC Seater", "Non-AC Seater", "AC Sleeper", "Non-AC Sleeper"],
    required: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  departureTime: {
    type: Date, // Better than string for sorting and filtering
    required: true
  },
  boardingTime: {
    type: String,
    required: true
  },
  boardingStation: {
    type: String,
    required: true
  },
  droppingPoint: {
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

  // Optional Future Upgrade: Detailed seat structure
  // seats: [{
  //   seatNumber: String,
  //   isAvailable: { type: Boolean, default: true },
  //   isWindow: { type: Boolean, default: false },
  //   genderRestriction: { type: String, enum: ['male', 'female', 'none'], default: 'none' }
  // }],

  mealsIncluded: {
    type: Boolean,
    default: false
  },
  amenities: {
    type: [String],
    default: []
  },
  features: {
    airConditioning: { type: Boolean, default: false },
    wifi: { type: Boolean, default: false },
    recliningSeats: { type: Boolean, default: false },
    powerOutlets: { type: Boolean, default: false },
    waterBottles: { type: Boolean, default: false },
    onBoardToilets: { type: Boolean, default: false },
    firstAidKit: { type: Boolean, default: false }
  },
  journeyType: {
    type: String,
    enum: ['one-way', 'round-trip'],
    required: true
  },
  pickupTime: {
    type: String,
    default: ''
  },
  dropOffTime: {
    type: Date
  },
  busNumber: {
    type: String,
    required: true
  },
  driverContact: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['booked', 'cancelled'],
    default: 'booked'
  },
  typeTag: {
    type: String,
    default: 'bus'
  }
}, { timestamps: true });

// 🚀 Create an index to optimize search
busSchema.index({ from: 1, to: 1, date: 1 });

const Bus = mongoose.model("Bus", busSchema);

module.exports = Bus;
