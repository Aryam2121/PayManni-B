// POST /api/payment/create-link
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

 const createPaymentLink = async (req, res) => {
  const { amount, movieId, userId, selectedSeats } = req.body;

  try {
    const result = await razorpay.paymentLink.create({
      amount: amount * 100,
      currency: "INR",
      accept_partial: false,
      description: `Movie Booking for ${selectedSeats.join(", ")}`,
      customer: {
        name: "Aryaman Gupta",
        contact: "+91 7579 677 966",
        email: "aryamangupta2121@gmail.com",
      },
      notify: {
        email: true,
        sms: true,
      },
      callback_url: `http://localhost:5173/payment-success?movieId=${movieId}&userId=${userId}&seats=${selectedSeats.join(",")}&amount=${amount}`,
      callback_method: "get",
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create payment link" });
  }
};
module.exports = {
  createPaymentLink,
};