const express = require("express");
const router = express.Router();
const trainController = require("../Controllers/trainController.js");

// ✅ Train Search Route
router.get("/trains", trainController.getTrains);

// ✅ Razorpay Payment Route
router.post("/create-payment", trainController.createPayment);

module.exports = router;
