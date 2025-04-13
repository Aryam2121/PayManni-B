const express = require("express");
const router = express.Router();
const {generateBuses} = require("../Controllers/generateBusData.js");

router.post("/generateBuses", async (req, res) => {
    try {
      await generateBuses();
      res.status(200).json({ message: "Buses created successfully" });
    } catch (error) {
      console.error("Error in generateBuses route:", error); // Add this
      res.status(500).json({ message: "Error creating buses", error: error.message || error });
    }
  });

module.exports = router;