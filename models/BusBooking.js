const mongoose = require("mongoose");

const busSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Userupi", // Optional, but useful if you use the user model
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
    enum: ["AC Seater", "Non-AC Seater", "AC Sleeper", "Non-AC Sleeper"],
    required: true
  },
  from: {
    type: String,  // Starting city of the bus
    required: true
  },
  to: {
    type: String,  // Destination city of the bus
    required: true
  },
  date: {
    type: Date,  // Date when the bus is scheduled to travel
    required: true
  },
  departureTime: {
    type: String,  // Exact departure time of the bus (e.g., "07:05")
    required: true
  },
  boardingTime: {
    type: String,  // Time when passengers should board (e.g., "06:30")
    required: true
  },
  boardingStation: {
    type: String,  // Boarding station or pickup point
    required: true
  },
  droppingPoint: {
    type: String,  // Dropping point or final destination for the bus
    required: true
  },
  price: {
    type: Number,  // Price of the bus seat
    required: true
  },
  availableSeats: {
    type: Number,  // Number of available seats on the bus
    required: true
  },
  mealsIncluded: {
    type: Boolean,  // Whether meals are complimentary or not (true/false)
    default: false
  },
  amenities: {
    type: [String],  // List of amenities provided on the bus (e.g., Wi-Fi, AC, USB charging ports)
    default: []
  },
  airConditioning: {
    type: Boolean,  // Indicates whether the bus has air conditioning
    default: false
  },
  wifi: {
    type: Boolean,  // Indicates whether the bus has Wi-Fi
    default: false
  },
  recliningSeats: {
    type: Boolean,  // Indicates whether the bus has reclining seats
    default: false
  },
  powerOutlets: {
    type: Boolean,  // Indicates whether there are power outlets available for charging devices
    default: false
  },
  waterBottles: {
    type: Boolean,  // Indicates whether bottled water is provided
    default: false
  },
  onBoardToilets: {
    type: Boolean,  // Indicates whether there are toilets on board
    default: false
  },
  firstAidKit: {
    type: Boolean,  // Indicates whether a first aid kit is available
    default: false
  },
  journeyType: {
    type: String,
    enum: ['one-way', 'round-trip'],
    required: true
  },
  pickupTime: {
    type: String,  // Specific pickup time for certain points
    default: ''
  },
  dropOffTime: {
    type: String,  // Estimated drop-off time at the destination
    default: ''
  },
  busNumber: {
    type: String,  // Unique bus number for identification
    required: true
  },
  driverContact: {
    type: String,  // Driver's contact number for emergency
    required: true
  },
  status: {
    type: String,
    enum: ['booked', 'cancelled'],
    default: 'booked'
  },
  typeTag: {
    type: String,
    default: 'bus' // for filtering transactions
  }
}, { timestamps: true });

const Bus = mongoose.model("Bus", busSchema);

module.exports = Bus;
