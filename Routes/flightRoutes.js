const express = require("express");
const { 
  searchFlights, 
  getFlightDetails, 
  addFlight, 
  addMultipleFlights, 
  getAllFlights, 
  fetchAndStoreFlights  // ✅ API se flights fetch karne ka function add kiya
} = require("../Controllers/flightController");

const router = express.Router();

router.post("/search", searchFlights);
router.get("/details/:id", getFlightDetails);
router.post("/add", addFlight);
router.post("/add-multiple", addMultipleFlights);
router.get("/flights", getAllFlights);
router.get("/fetch", fetchAndStoreFlights);  // ✅ New route added to fetch flights from API

module.exports = router;
