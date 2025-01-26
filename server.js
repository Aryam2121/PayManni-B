const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

// Importing Routes
const userRoutes = require("./Routes/userRoutes");
const RechargeRoutes = require("./Routes/RechargeRoutes");
const WalletRoutes = require("./Routes/WalletRoutes");
const contactRoutes = require("./Routes/ContactRoutes");
const transactionRoutes = require("./Routes/transactionRoutes");

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection
mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "PayManni", // Optional: Replace with your database name if needed
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/recharge", RechargeRoutes);
app.use("/api", WalletRoutes);
app.use("/api", contactRoutes);
app.use("/api/transactions", transactionRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
