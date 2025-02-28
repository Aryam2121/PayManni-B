const express = require("express");
const router = express.Router();
const trainController = require("../Controllers/trainController.js");

// ✅ Train Search Route
router.get("/trains", trainController.getTrains);

// ✅ Razorpay Payment Route
router.post("/create-payment", trainController.createPayment);
router.post("/verify-payment", trainController.verifyPayment);

module.exports = router;
