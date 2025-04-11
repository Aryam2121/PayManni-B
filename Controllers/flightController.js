const axios = require("axios");
const Flight = require("../models/Flight");
require("dotenv").config();  // Make sure to require dotenv
const Razorpay = require('razorpay');
const API_KEY = process.env.AVIATION_API_KEY;
const BASE_URL = "http://api.aviationstack.com/v1/flights";
const UserUpi = require("../models/Userupi");

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
    const { flightId, userId, paymentId } = req.body;

    if (!flightId || !userId || !paymentId) {
      return res.status(400).json({ success: false, message: "Flight ID, User ID, and Payment ID are required" });
    }

    const flight = await Flight.findById(flightId);
    if (!flight) {
      return res.status(404).json({ success: false, message: "Flight not found" });
    }

    const user = await UserUpi.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ Add standard transaction-compatible fields
    flight.userId = userId;
    flight.userUpi = user.username || user.upiId;
    flight.status = "success"; // You can make this dynamic if needed
    flight.type = "flight-booking";
    flight.createdAt = new Date(); // Optional, Mongoose does this automatically
    flight.paymentId = paymentId;

    await flight.save();

    res.status(200).json({ success: true, message: "Flight booked successfully", flight });
  } catch (error) {
    console.error("Error booking flight:", error);
    res.status(500).json({ success: false, message: "Error booking flight", error: error.message });
  }
};

// ✅ Fetch flights from AviationStack API and store in DB
const fetchAndStoreFlights = async (req, res) => {
  try {
    const response = await axios.get(BASE_URL, { params: { access_key: API_KEY } });

    if (!response.data || !response.data.data) {
      return res.status(404).json({ message: "No flight data found from API" });
    }

    const flightsData = response.data.data.map(flight => ({
      airline: flight.airline.name || "Unknown",
      departure: flight.departure.iata || "Unknown",
      arrival: flight.arrival.iata || "Unknown",
      duration: flight.flight_time || "Unknown",
      price: Math.floor(Math.random() * 5000) + 2000,
      departureDate: flight.departure.estimated || flight.departure.scheduled,
      returnDate: null,
      passengers: Math.floor(Math.random() * 200) + 50,
      travelClass: "Economy"
    }));

    const savedFlights = await Flight.insertMany(flightsData);
    res.status(201).json({ message: "Flights fetched and stored successfully", flights: savedFlights });
  } catch (error) {
    res.status(500).json({ message: "Error fetching flights", error: error.message });
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

module.exports = { getAllFlights, fetchAndStoreFlights, addFlight, addMultipleFlights, searchFlights, getFlightDetails,createOrder, verifyPayment, bookFlight };
