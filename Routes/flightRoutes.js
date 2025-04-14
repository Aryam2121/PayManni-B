const express = require("express");
const router = express.Router();
const {
  getAllFlights,
  addFlight,
  addMultipleFlights,
  searchFlights,
  getFlightDetails,
  createOrder,
  verifyPayment,
  bookFlight
} = require("../Controllers/flightController.js");

// Flight-related routes
router.get("/flights", getAllFlights);
router.post("/flights", addFlight);
router.post("/flights/multiple", addMultipleFlights);
router.post("/flights/search", searchFlights);
router.get("/flights/:id", getFlightDetails);

// Payment-related routes
router.post("/order", createOrder);
router.post("/verify-payment", verifyPayment);

// Booking route
router.post("/book-flight", bookFlight);

module.exports = router;
