const https = require('https');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Train.js');

// Razorpay Initialization
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 🚆 Get Trains & Log Search
const getTrains = (req, res) => {
  const { from, to, date, class: trainClass, user } = req.query;

  const options = {
    method: 'POST',
    hostname: 'trains.p.rapidapi.com',
    port: null,
    path: '/v1/railways/trains/india',
    headers: {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      'x-rapidapi-host': 'trains.p.rapidapi.com',
      'Content-Type': 'application/json',
    },
  };

  const request = https.request(options, (response) => {
    let data = '';
    
    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', async () => {
      try {
        const trains = JSON.parse(data);
        const filteredTrains = trains.filter(train => train.from === from && train.to === to);

        // Log the train search as a booking with status: fetched
        await new Booking({
          from,
          to,
          date,
          passengers: 0,
          class: trainClass || 'General',
          totalPrice: 0,
          user,
          type: 'search',
          amount: 0,
          status: 'fetched',
        }).save();

        res.json(filteredTrains);
      } catch (error) {
        res.status(500).json({ message: 'Error parsing API response' });
      }
    });
  });

  request.on('error', (error) => {
    res.status(500).json({ message: 'API request failed', error: error.message });
  });

  request.write(JSON.stringify({ search: 'Rajdhani', date, class: trainClass }));
  request.end();
};

// 💳 Create Razorpay Order & Save Pending Booking
const createPayment = async (req, res) => {
  try {
    const { amount, currency, bookingData } = req.body;

    const options = {
      amount: amount * 100, // in paise
      currency: currency || 'INR',
      receipt: `order_rcpt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    // Save temporary booking with "pending" status
    const tempBooking = new Booking({
      ...bookingData,
      amount: bookingData.totalPrice,
      status: 'pending',
      type: 'booking',
      createdAt: new Date(),
    });

    await tempBooking.save();

    res.status(200).json({ success: true, order, tempBooking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Verify Razorpay Payment & Update Booking
const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    bookingData,
  } = req.body;

  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generatedSignature === razorpay_signature) {
    try {
      // Update the latest pending booking for that user
      const updatedBooking = await Booking.findOneAndUpdate(
        { user: bookingData.user, status: 'pending' },
        {
          status: 'success',
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: 'Payment verified and booking confirmed!',
        booking: updatedBooking,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Verified but failed to update booking',
        error: err.message,
      });
    }
  } else {
    res.status(400).json({ success: false, message: 'Payment verification failed' });
  }
};

module.exports = { getTrains, createPayment, verifyPayment };
