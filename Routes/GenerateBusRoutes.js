const express = require("express");
const router = express.Router();
const generateBuses = require("../Controllers/generateBusData.js");

router.post("/generateBuses", async (req, res) => {
    try {
      await generateBuses();
      res.status(200).json({ message: "Buses created successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error creating buses", error });
    }
  });

module.exports = router;