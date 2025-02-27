const https = require('https');
const Razorpay = require('razorpay');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Fetch trains
const getTrains = (req, res) => {
  const { from, to, date, class: trainClass } = req.query;

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

    response.on('end', () => {
      try {
        const trains = JSON.parse(data);
        const filteredTrains = trains.filter(train => 
          train.from === from && train.to === to
        );
        res.json(filteredTrains);
      } catch (error) {
        res.status(500).json({ message: 'Error parsing the response from API' });
      }
    });
  });

  request.on('error', (error) => {
    res.status(500).json({ message: 'Error fetching data from the API', error: error.message });
  });

  const requestData = {
    search: 'Rajdhani',
    date: date,
    class: trainClass,
  };

  request.write(JSON.stringify(requestData));
  request.end();
};

// Razorpay Payment Route
const createPayment = async (req, res) => {
  try {
    const { amount, currency } = req.body;

    const options = {
      amount: amount * 100, // Razorpay works in paise (₹1 = 100 paise)
      currency: currency || 'INR',
      receipt: `order_rcpt_${Date.now()}`,
      payment_capture: 1, // Auto capture
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getTrains, createPayment };
