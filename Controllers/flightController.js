const axios = require("axios");
const Flight = require("../models/Flight");
require("dotenv").config();  // Make sure to require dotenv

const API_KEY = process.env.AVIATION_API_KEY;
const BASE_URL = "http://api.aviationstack.com/v1/flights";

// ✅ Fetch all flights from the database
const getAllFlights = async (req, res) => {
  try {
    const flights = await Flight.find();
    res.status(200).json(flights);
  } catch (error) {
    res.status(500).json({ message: "Error fetching flights", error: error.message });
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

module.exports = { getAllFlights, fetchAndStoreFlights, addFlight, addMultipleFlights, searchFlights, getFlightDetails };
