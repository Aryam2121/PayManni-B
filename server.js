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
const TransferRoutes = require("./Routes/TransferRoutes");

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
  allowedHeaders: 'Content-Type,Authorization'
}));

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
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const receivedSignature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (expectedSignature === receivedSignature) {
      console.log("✅ Payment verified for:", req.body.payload.payment.entity.id);
      return res.json({ success: true, message: "Payment Verified Successfully" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid Signature" });
    }

  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
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
app.use("/api", transactionRoutes);
app.use("/api", flightRoutes);
app.use("/api", trainroutes);
app.use("/api", BusRoutes);
app.use("/api", SplitPaymentRoutes);
app.use("/api", TransferRoutes);

// 🔹 Server Start
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
