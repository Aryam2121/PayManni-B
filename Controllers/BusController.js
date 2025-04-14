const Bus = require("../models/BusBooking");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Multiple Buses
const createMultipleBuses = async (req, res) => {
  try {
    const buses = req.body;

    if (!Array.isArray(buses) || buses.length === 0) {
      return res.status(400).json({ message: "Please provide an array of bus objects." });
    }

    const createdBuses = await Bus.insertMany(buses);
    res.status(201).json({ message: "Buses added successfully", buses: createdBuses });
  } catch (error) {
    console.error("Error creating multiple buses:", error);
    res.status(500).json({ message: "Failed to add buses", error: error.message });
  }
};

// Get Buses based on Filters
const getBuses = async (req, res) => {
  try {
    const { from, to, date, seatType } = req.query;

    // Initialize an empty query object
    let query = {};

    // Check and add conditions to the query object
    if (from) query.from = from;
    if (to) query.to = to;

    // Convert date to a Date object and filter by the exact date
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1); // Include the full day range

      query.date = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    // Filter based on seatType (if provided), ensuring the seat is available
    if (seatType) {
      query["seats.type"] = seatType; // Assuming seats are stored in an array with `type` and `available`
      query["seats.available"] = true;
    }

    // Fetch buses from the database
    const buses = await Bus.find(query).lean();

    // If no buses are found, return a 404 error
    if (!buses.length) {
      return res.status(404).json({ message: "No buses found for the given criteria" });
    }

    // Return the buses in the response
    res.status(200).json(buses);
  } catch (err) {
    console.error("Error fetching buses:", err);
    res.status(500).json({ message: "Error fetching buses", error: err.message });
  }
};


// Create Razorpay Order
const createOrder = async (req, res) => {
  const { amount, currency } = req.body;

  try {
    const options = {
      amount: amount * 100, // Amount in paise (₹1 = 100 paise)
      currency: currency || "INR",
      receipt: `order_rcpt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    res.status(201).json(order);
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    res.status(500).json({ message: "Error creating payment order", error: err.message });
  }
};

// Verify Payment and Book Bus
const bookBus = async (req, res) => {
  const { busId, user, date, from, to, seatType, payment } = req.body;

  try {
    if (!busId || !user || !date || !from || !to || !seatType || !payment || !user._id || !user.upi) {
      return res.status(400).json({ message: "All fields are required, including user ID, UPI, and payment details" });
    }

    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    // Check seat availability
    const seat = bus.seats.find(seat => seat.type === seatType && seat.available);
    if (!seat) {
      return res.status(400).json({ message: `No available seats of type ${seatType}` });
    }

    // Verify payment
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(payment.razorpay_order_id + "|" + payment.razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== payment.razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Mark seat as booked
    seat.available = false;
    await bus.save();

    // Save booking as transaction-like entry
    const bookedBus = new Bus({
      userId: user._id,
      userUpi: user.upi,
      name: bus.name,
      type: bus.type,
      time: bus.time,
      price: bus.price,
      availableSeats: bus.availableSeats - 1,
      status: 'booked',
      typeTag: 'bus',
      // Additional Fields from Updated Schema
      airConditioning: bus.airConditioning,
      wifi: bus.wifi,
      recliningSeats: bus.recliningSeats,
      powerOutlets: bus.powerOutlets,
      waterBottles: bus.waterBottles,
      onBoardToilets: bus.onBoardToilets,
      firstAidKit: bus.firstAidKit,
      journeyType: bus.journeyType,
      pickupTime: bus.pickupTime,
      dropOffTime: bus.dropOffTime,
      busNumber: bus.busNumber,
      driverContact: bus.driverContact
    });

    await bookedBus.save();

    res.status(201).json({
      message: "Bus booked successfully",
      booking: {
        userId: user._id,
        userUpi: user.upi,
        busId,
        date,
        from,
        to,
        seatType,
        paymentId: payment.razorpay_payment_id,
        status: 'booked',
        typeTag: 'bus'
      }
    });
  } catch (err) {
    console.error("Error booking bus:", err);
    res.status(500).json({ message: "Error booking bus", error: err.message });
  }
};

module.exports = { getBuses, createOrder, bookBus, createMultipleBuses };
