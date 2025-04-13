const express = require("express");
const { getBuses, createOrder, bookBus,createMultipleBuses } = require("../Controllers/BusController.js");

const router = express.Router();

// 📌 Get available buses
router.get("/buses", getBuses);

// 📌 Create a Razorpay order
router.post("/payment/order", createOrder);

// 📌 Book a bus after payment verification
router.post("/booking", bookBus);
router.post("/buses/multiple", createMultipleBuses);

module.exports = router;
