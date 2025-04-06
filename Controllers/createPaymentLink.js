const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createPaymentLink = async (req, res) => {
  const { amount, movieId, userId, selectedSeats } = req.body;

  console.log("Received Payment Request:", req.body);
  console.log("Using Razorpay Key:", process.env.RAZORPAY_KEY_ID);

  try {
    const result = await razorpay.paymentLink.create({
      amount: amount * 100,
      currency: "INR",
      accept_partial: false,
      description: `Movie Booking for ${selectedSeats.join(", ")}`,
      customer: {
        name: "Aryaman Gupta",
        contact: "9123456789",
        email: "customer@example.com",
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
    console.error("Razorpay Error:", error);
    res.status(500).json({
      message: "Failed to create payment link",
      error: error?.message || "Unknown error",
    });
  }
};

module.exports = {
  createPaymentLink,
};
