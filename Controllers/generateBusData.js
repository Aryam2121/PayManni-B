const mongoose = require("mongoose");
const Bus = require("../models/BusBooking");

const generateRandomData = () => {
  const busTypes = ["AC Seater", "Non-AC Seater", "AC Sleeper", "Non-AC Sleeper"];
  const journeyTypes = ["one-way", "round-trip"];
  const fromLocations = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata"];
  const toLocations = ["Goa", "Pune", "Hyderabad", "Agra", "Jaipur"];
  const amenitiesList = ["AC", "WiFi", "Reclining Seats", "Water Bottles", "Power Outlets", "Toilets"];
  const priceRange = { min: 300, max: 2000 };

  // Generate random amenities
  const randomAmenities = [];
  const numOfAmenities = Math.floor(Math.random() * amenitiesList.length) + 1;
  for (let i = 0; i < numOfAmenities; i++) {
    const amenity = amenitiesList[Math.floor(Math.random() * amenitiesList.length)];
    if (!randomAmenities.includes(amenity)) {
      randomAmenities.push(amenity);
    }
  }

  // Generate random times
  const today = new Date();
  const departureTime = new Date(today.getTime() + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)); // Within 7 days
  const dropOffTime = new Date(departureTime.getTime() + Math.floor(Math.random() * 8 * 60 * 60 * 1000)); // + up to 8 hours

  return {
    userId: new mongoose.Types.ObjectId(),
    userUpi: `user${Math.floor(Math.random() * 10000)}@upi`,
    name: `Bus-${Math.floor(Math.random() * 1000)}`,
    type: busTypes[Math.floor(Math.random() * busTypes.length)],
    from: fromLocations[Math.floor(Math.random() * fromLocations.length)],
    to: toLocations[Math.floor(Math.random() * toLocations.length)],
    date: departureTime,
    departureTime: departureTime,
    boardingTime: `${departureTime.getHours()}:${departureTime.getMinutes()}`,
    boardingStation: "Main Station",
    droppingPoint: "City Center",
    price: Math.floor(Math.random() * (priceRange.max - priceRange.min)) + priceRange.min,
    availableSeats: Math.floor(Math.random() * 20) + 10,
    mealsIncluded: Math.random() > 0.5,
    amenities: randomAmenities,
    features: {
      airConditioning: Math.random() > 0.5,
      wifi: Math.random() > 0.5,
      recliningSeats: Math.random() > 0.5,
      powerOutlets: Math.random() > 0.5,
      waterBottles: Math.random() > 0.5,
      onBoardToilets: Math.random() > 0.5,
      firstAidKit: Math.random() > 0.5
    },
    journeyType: journeyTypes[Math.floor(Math.random() * journeyTypes.length)],
    pickupTime: `${departureTime.getHours() + 1}:${departureTime.getMinutes()}`,
    dropOffTime: dropOffTime,
    busNumber: `BUS-${Math.floor(Math.random() * 10000)}`,
    driverContact: `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    status: "booked",
    typeTag: "bus"
  };
};

// Generate 100 buses
const generateBuses = async () => {
  try {
    const buses = [];
    for (let i = 0; i < 100; i++) {
      buses.push(generateRandomData());
    }

    const createdBuses = await Bus.insertMany(buses);
    console.log("✅ Buses created:", createdBuses.length);
  } catch (error) {
    console.error("❌ Error creating buses:", error.message);
  }
};

module.exports = { generateBuses };
