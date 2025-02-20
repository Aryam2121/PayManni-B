const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const session = require("express-session");
const cors = require("cors");
const passport = require("passport");
const Razorpay = require("razorpay");
const crypto = require("crypto");

dotenv.config();

const app = express();

// 🔹 Passport Config Import
require("./config/passport");

// 🔹 Routes Import
const userRoutes = require("./Routes/userRoutes");
const WalletRoutes = require("./Routes/WalletRoutes");
const contactRoutes = require("./Routes/ContactRoutes");
const transactionRoutes = require("./Routes/transactionRoutes");
const loanRoutes = require("./Routes/loanRoutes");
const flightRoutes = require("./Routes/flightRoutes");
const trainroutes = require("./Routes/trainRoutes");
const BusRoutes = require("./Routes/BusRoutes");
const SplitPaymentRoutes = require("./Routes/Split-paymentRoutes");
const TransferRoutes = require("./Routes/TransferRoutes")
// 🔹 Middlewares
app.use(express.json());

// ✅ Improved CORS Configuration
app.use(cors({
  origin: ['http://localhost:5173','https://pay-manni.vercel.app'],  // Adjust this to your frontend URL
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
}));
app.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100, // Convert INR to paise
      currency: "INR",
      accept_partial: false,
      expire_by: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
      reference_id: "txn_" + Date.now(),
      description: "Payment for Order",
      customer: {
        name: req.body.name,
        contact: req.body.contact,
        email: req.body.email,
      },
      notify: {
        sms: true,
        email: true,
      },
      callback_url: process.env.CLIENT_URL + "/payment-success",
      callback_method: "get",
    };

    const paymentLink = await razorpay.paymentLink.create(options);

    res.json({ success: true, payment_link: paymentLink.short_url });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// ✅ 2️⃣ PAYMENT VERIFICATION API
app.post("/verify-payment", (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const receivedSignature = req.headers["x-razorpay-signature"];
  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (generatedSignature === receivedSignature) {
    if (req.body.event === "payment_link.paid") {
      console.log("✅ Payment verified for Payment Link:", req.body.payload.payment_link.entity.id);
      res.json({ success: true, message: "Payment Verified Successfully" });
    } else {
      res.json({ success: false, message: "Event Not Handled" });
    }
  } else {
    res.status(400).json({ success: false, message: "Invalid Signature" });
  }
});

// ✅ Secure Session Handling
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ✅ MongoDB Connection with Better Error Handling
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "PayManni",
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // Server ko crash hone se rokne ke liye exit karna zaroori hai.
  }
};
connectDB();

// 🔹 API Routes
app.use("/api", loanRoutes);
app.use("/api/auth", userRoutes);
app.use("/api", WalletRoutes);
app.use("/api", contactRoutes);
app.use("/api", transactionRoutes);
app.use("/api", flightRoutes);
app.use("/api", trainroutes);
app.use("/api", BusRoutes);
app.use("/api",SplitPaymentRoutes);
app.use("/api",TransferRoutes);
// 🔹 Server Start
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
