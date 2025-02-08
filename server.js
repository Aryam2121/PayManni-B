const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const session = require("express-session");
const cors = require("cors");
const passport = require("passport");

dotenv.config();

const app = express();

// 🔹 Passport Config Import
require("./config/passport");

// 🔹 Routes Import
const userRoutes = require("./Routes/userRoutes");
const RechargeRoutes = require("./Routes/RechargeRoutes");
const WalletRoutes = require("./Routes/WalletRoutes");
const contactRoutes = require("./Routes/ContactRoutes");
const transactionRoutes = require("./Routes/transactionRoutes");

// 🔹 Middlewares
app.use(express.json());

// ✅ Improved CORS Configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);

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
app.use("/api/auth", userRoutes);
app.use("/api/recharge", RechargeRoutes);
app.use("/api/wallet", WalletRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/transactions", transactionRoutes);

// 🔹 Server Start
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
