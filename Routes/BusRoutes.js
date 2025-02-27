const express = require("express");
const { getBuses, createOrder, bookBus } = require("../Controllers/BusController.js");

const router = express.Router();

// 📌 Get available buses
router.get("/buses", getBuses);

// 📌 Create a Razorpay order
router.post("/payment/order", createOrder);

// 📌 Book a bus after payment verification
router.post("/booking", bookBus);

module.exports = router;
