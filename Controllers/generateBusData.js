const mongoose = require("mongoose");
const Bus = require("../models/BusBooking");

// Helper function to generate random data
const generateRandomData = () => {
  const busTypes = ["AC Seater", "Non-AC Seater", "AC Sleeper", "Non-AC Sleeper"];
  const journeyTypes = ["One-way", "Round-trip"];
  const seatTypes = ["Standard", "Business", "Luxury"];
  const fromLocations = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata"];
  const toLocations = ["Goa", "Pune", "Hyderabad", "Agra", "Jaipur"];
  const priceRange = { min: 300, max: 2000 };
  const amenities = ["AC", "WiFi", "Reclining Seats", "Water Bottles", "Power Outlets", "Toilets"];
  const randomAmenities = [];
  const numOfAmenities = Math.floor(Math.random() * amenities.length) + 1; // Random number of amenities
  for (let i = 0; i < numOfAmenities; i++) {
    const randomAmenity = amenities[Math.floor(Math.random() * amenities.length)];
    if (!randomAmenities.includes(randomAmenity)) {
      randomAmenities.push(randomAmenity);
    }
  }

  return {
    userId: mongoose.Types.ObjectId(),
    userUpi: `upi_${Math.floor(Math.random() * 1000000)}`,
    name: `Bus-${Math.floor(Math.random() * 1000)}`,
    type: busTypes[Math.floor(Math.random() * busTypes.length)],
    seatType: seatTypes[Math.floor(Math.random() * seatTypes.length)], // Random seat type
    amenities: randomAmenities, // Random amenities
    time: `${Math.floor(Math.random() * 12) + 1}:${Math.floor(Math.random() * 60)} ${Math.random() < 0.5 ? "AM" : "PM"}`,
    price: Math.floor(Math.random() * (priceRange.max - priceRange.min)) + priceRange.min,
    availableSeats: Math.floor(Math.random() * 20) + 10, // Between 10-30 seats available
    status: "booked",
    journeyType: journeyTypes[Math.floor(Math.random() * journeyTypes.length)],
    from: fromLocations[Math.floor(Math.random() * fromLocations.length)],
    to: toLocations[Math.floor(Math.random() * toLocations.length)],
    pickupTime: `${Math.floor(Math.random() * 12) + 1}:${Math.floor(Math.random() * 60)} ${Math.random() < 0.5 ? "AM" : "PM"}`,
    dropOffTime: `${Math.floor(Math.random() * 12) + 1}:${Math.floor(Math.random() * 60)} ${Math.random() < 0.5 ? "AM" : "PM"}`,
    airConditioning: Math.random() > 0.5, // Random true/false
    wifi: Math.random() > 0.5, // Random true/false
    recliningSeats: Math.random() > 0.5, // Random true/false
    powerOutlets: Math.random() > 0.5, // Random true/false
    waterBottles: Math.random() > 0.5, // Random true/false
    onBoardToilets: Math.random() > 0.5, // Random true/false
    firstAidKit: Math.random() > 0.5, // Random true/false
    busNumber: `BUS-${Math.floor(Math.random() * 10000)}`,
    driverContact: `+91${Math.floor(Math.random() * 10000000000)}`
  };
};

// Generate 50 buses
const generateBuses = async () => {
  try {
    const buses = [];
    for (let i = 0; i < 100; i++) {
      buses.push(generateRandomData());
    }

    // Insert buses into the database
    const createdBuses = await Bus.insertMany(buses);
    console.log("100 buses created successfully", createdBuses);
  } catch (error) {
    console.error("Error creating buses:", error);
  }
};

// Call the function to generate buses
module.exports = {generateBuses};