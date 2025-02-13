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
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
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
// 🔹 Middlewares
app.use(express.json());

// ✅ Improved CORS Configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);
app.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100, // Convert INR to paise
      currency: "INR",
      receipt: "order_rcptid_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ 2️⃣ PAYMENT VERIFICATION API
app.post("/verify-payment", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (generated_signature === razorpay_signature) {
    res.json({ success: true, message: "Payment Verified Successfully" });
  } else {
    res.status(400).json({ success: false, message: "Payment Verification Failed" });
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
// 🔹 Server Start
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
