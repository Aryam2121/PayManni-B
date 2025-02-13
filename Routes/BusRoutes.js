const express = require("express");
const router = express.Router();
const { getBuses, bookBus } = require("../Controllers/BusController");

// Route to get the available buses
router.get("/buses", getBuses);

// Route to book a bus
router.post("/book", bookBus);

module.exports = router;
