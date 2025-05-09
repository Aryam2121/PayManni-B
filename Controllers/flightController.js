const axios = require("axios");
const Flight = require("../models/Flight");
require("dotenv").config();  // Make sure to require dotenv
const Razorpay = require('razorpay');
const UserUpi = require("../models/Userupi");
const deductFromWallet = require("../utils/deductFromWallet");
const crypto = require("crypto");

// ✅ Fetch all flights from the database
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Fetch all flights
const getAllFlights = async (req, res) => {
  try {
    const flights = await Flight.find();
    res.status(200).json({ success: true, flights });
  } catch (error) {
    console.error("Error fetching flights:", error);
    res.status(500).json({ success: false, message: "Error fetching flights", error: error.message });
  }
};

// ✅ Create Razorpay Order
const createOrder = async (req, res) => {
  try {
    const { amount, currency } = req.body;

    if (!amount || !currency) {
      return res.status(400).json({ success: false, message: "Amount and currency are required" });
    }

    const options = {
      amount: amount * 100, // Razorpay accepts amount in paisa
      currency,
      receipt: `order_${Math.random().toString(36).substring(7)}`,
      payment_capture: 1, // Auto-capture payment
    };

    const order = await razorpay.orders.create(options);
    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ success: false, message: "Error creating order", error: error.message });
  }
};

// ✅ Verify Razorpay Payment
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment data" });
    }

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    res.status(200).json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ success: false, message: "Error verifying payment", error: error.message });
  }
};

const bookFlight = async (req, res) => {
  try {
    const {
      flightId,
      userId,
      paymentMethod,  // "wallet" or "razorpay"
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature
    } = req.body;

    if (!flightId || !userId || !paymentMethod) {
      return res.status(400).json({ success: false, message: "Required fields are missing" });
    }

    const flight = await Flight.findById(flightId);
    if (!flight) {
      return res.status(404).json({ success: false, message: "Flight not found" });
    }

    const user = await UserUpi.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ Payment Handling
    if (paymentMethod === "wallet") {
      await deductFromWallet(userId, flight.price, "Flight booking");
    } else if (paymentMethod === "razorpay") {
      if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
        return res.status(400).json({ success: false, message: "Razorpay payment details required" });
      }

      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      if (generatedSignature !== razorpaySignature) {
        return res.status(400).json({ success: false, message: "Invalid payment signature" });
      }

      flight.paymentId = razorpayPaymentId;
    } else {
      return res.status(400).json({ success: false, message: "Invalid payment method" });
    }

    // ✅ Save booking
    flight.userId = userId;
    flight.userUpi = user.username || user.upiId;
    flight.status = "success";
    flight.type = "flight-booking";
    flight.createdAt = new Date();

    const bookedFlight = await flight.save();

    res.status(200).json({
      success: true,
      message: "Flight booked successfully",
      flight: bookedFlight,
      paidBy: paymentMethod
    });
  } catch (error) {
    console.error("Flight booking error:", error);
    res.status(500).json({ success: false, message: "Error booking flight", error: error.message });
  }
};

// ✅ Add a single flight
const addFlight = async (req, res) => {
  try {
    const newFlight = new Flight(req.body);
    const savedFlight = await newFlight.save();
    res.status(201).json({ message: "Flight added successfully", flight: savedFlight });
  } catch (error) {
    res.status(500).json({ message: "Error adding flight", error: error.message });
  }
};

// ✅ Add multiple flights
const addMultipleFlights = async (req, res) => {
  try {
    const savedFlights = await Flight.insertMany(req.body.flights);
    res.status(201).json({ message: "Flights added successfully", flights: savedFlights });
  } catch (error) {
    res.status(500).json({ message: "Error adding flights", error: error.message });
  }
};

// ✅ Search flights with filters
const searchFlights = async (req, res) => {
  const { from, to, departureDate, returnDate, passengers, travelClass } = req.body;

  // Flexible filter creation
  const filters = {};
  if (from) filters.departure = from;
  if (to) filters.arrival = to;
  if (departureDate) filters.departureDate = departureDate;
  if (returnDate) filters.returnDate = returnDate;
  if (passengers) filters.passengers = passengers;
  if (travelClass) filters.travelClass = travelClass;

  try {
    const flights = await Flight.find(filters);
    if (flights.length === 0) {
      return res.status(404).json({ message: "No flights found for the given criteria" });
    }
    res.status(200).json(flights);
  } catch (error) {
    res.status(500).json({ message: "Error fetching flights", error: error.message });
  }
};

// ✅ Get flight details by ID
const getFlightDetails = async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ message: "Flight not found" });
    }
    res.status(200).json(flight);
  } catch (error) {
    res.status(500).json({ message: "Error fetching flight details", error: error.message });
  }
};

module.exports = { getAllFlights, addFlight, addMultipleFlights, searchFlights, getFlightDetails,createOrder, verifyPayment, bookFlight };
