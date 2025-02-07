const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const passport = require("passport");

dotenv.config();

const app = express();

require("./config/passport");

const userRoutes = require("./Routes/userRoutes");
const RechargeRoutes = require("./Routes/RechargeRoutes");
const WalletRoutes = require("./Routes/WalletRoutes");
const contactRoutes = require("./Routes/ContactRoutes");
const transactionRoutes = require("./Routes/transactionRoutes");

app.use(express.json());
app.use(cors());

app.use(
  session({
    secret: process.env.SESSION_SECRET ,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "PayManni", // Optional: Replace with your database name if needed
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.use("/api/auth", userRoutes);
app.use("/api/recharge", RechargeRoutes);
app.use("/api", WalletRoutes);
app.use("/api", contactRoutes);
app.use("/api/transactions", transactionRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
