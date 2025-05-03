const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const session = require("express-session");
const cors = require("cors");
const passport = require("passport");
const Razorpay = require("razorpay");
const crypto = require("crypto");

require('dotenv').config();

const app = express();

// 🔹 Passport Config Import
require("./config/passport");

// 🔹 Routes Import
const kycRoutes = require("./Routes/kycRoutes");
const userRoutes = require("./Routes/userRoutes");
const WalletRoutes = require("./Routes/WalletRoutes");
const contactRoutes = require("./Routes/ContactRoutes");
const RechargeRoutes = require("./Routes/RechargeRoutes");
const loanRoutes = require("./Routes/loanRoutes");
const flightRoutes = require("./Routes/flightRoutes");
const trainroutes = require("./Routes/trainRoutes");
const BusRoutes = require("./Routes/BusRoutes");
const SplitPaymentRoutes = require("./Routes/Split-paymentRoutes");
const TransferRoutes = require("./Routes/TransferRoutes");
const clerkWebhook = require("./Routes/clerkWebhook");
const  billPaymentRoutes = require("./Routes/billPaymentRoutes.js");
const movieRoutes = require("./Routes/movieRoutes.js");
const createPaymentRoute = require("./Routes/CreatePaymentRoute.js");
const upiRoutes = require("./Routes/upiRoutes.js");
const RegisteredUserUpiRoute = require("./Routes/RegisteredUserUpiRoute.js");
const BankRoutes = require("./Routes/bankRoutes.js");
const unifiedTransactionRoutes = require("./Routes/unifiedTransactionRoute.js");
const GenerateBusRoutes = require("./Routes/GenerateBusRoutes.js");
// ✅ Initialize Razorpay Instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 🔹 Middlewares
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'https://pay-manni.vercel.app'],
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: true, // Allow credentials (cookies, session data)
}));
app.options('*', cors()); // Handle preflight requests


// ✅ 1️⃣ CREATE ORDER API
app.post("/create-order", async (req, res) => {
  try {
    const { amount, name, contact, email } = req.body;

    if (!amount || !name || !contact || !email) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const options = {
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `txn_${Date.now()}`,
      payment_capture: 1, // Auto-capture the payment
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });

  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ 2️⃣ PAYMENT VERIFICATION API
app.post("/verify-payment", (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // 🔹 Get the received signature from Razorpay header
  const receivedSignature = req.headers["x-razorpay-signature"];

  // 🔹 Generate signature from request body
  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(req.body)) // Make sure req.body is exactly as received
    .digest("hex");

  console.log("🔹 Received Signature:", receivedSignature);
  console.log("🔹 Generated Signature:", generatedSignature);

  if (generatedSignature === receivedSignature) {
    console.log("✅ Payment verified!");

    if (req.body.event === "payment_link.paid") {
      console.log("💰 Payment ID:", req.body.payload.payment.entity.id);
      return res.json({ success: true, message: "Payment Verified Successfully" });
    } else {
      return res.json({ success: false, message: "Event Not Handled" });
    }
  } else {
    console.log("❌ Invalid Signature! Possible issue with secret or body format.");
    return res.status(400).json({ success: false, message: "Invalid Signature" });
  }
});


// ✅ Secure Session Handling
app.use(session({
  secret: process.env.SESSION_SECRET || "default_secret",
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// ✅ MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: "PayManni" });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};
connectDB();

// 🔹 API Routes
app.use("/api", loanRoutes);
app.use("/api/auth", userRoutes);
app.use("/api", WalletRoutes);
app.use("/api", contactRoutes);
app.use("/api", RechargeRoutes);
app.use("/api", flightRoutes);
app.use("/api", trainroutes);
app.use("/api", BusRoutes);
app.use("/api", SplitPaymentRoutes);
app.use("/api", TransferRoutes);
app.use("/api", clerkWebhook);
app.use("/api", billPaymentRoutes);
app.use("/api", movieRoutes); // Movie routes
app.use("/api", createPaymentRoute); // Payment routes
app.use("/api", upiRoutes);
app.use("/api", RegisteredUserUpiRoute); // UPI routes
app.use("/api", BankRoutes); // Bank routes
app.use("/api",GenerateBusRoutes);
app.use("/api/transactions", unifiedTransactionRoutes);// 🔹 Server Start
app.use("/api", kycRoutes); // KYC routes
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
