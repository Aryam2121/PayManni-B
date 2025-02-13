const Bus = require("../models/BusBooking");

const getBuses = async (req, res) => {
  try {
    const { from, to, date, seatType } = req.query;
    
    let query = {};
    if (from) query.from = from;
    if (to) query.to = to;
    if (seatType) query.type = seatType;

    // Assuming buses are pre-filled and location/date filters are applied based on bus info
    const buses = await Bus.find(query);
    res.status(200).json(buses);
  } catch (err) {
    res.status(500).json({ message: "Error fetching buses", error: err.message });
  }
};

const bookBus = async (req, res) => {
  const { busId, user, date, from, to, seatType } = req.body;

  try {
    // Assuming bookings will be saved in a booking collection
    const booking = {
      user,
      busId,
      date,
      from,
      to,
      seatType
    };
    // Save the booking (to be implemented in a separate Booking model)
    // const newBooking = await Booking.create(booking);

    res.status(201).json({ message: "Bus booked successfully", booking });
  } catch (err) {
    res.status(500).json({ message: "Error booking bus", error: err.message });
  }
};

module.exports = { getBuses, bookBus };
