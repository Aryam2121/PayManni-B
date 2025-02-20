const express = require("express");
const { createTransfer, getTransfers } = require("../Controllers/TransferController");
const { authenticateUser } = require("../Middleware/authMiddleware"); // Changed authenticateUser → protect

const router = express.Router();

router.post("/transfer", authenticateUser, createTransfer);
router.get("/history", authenticateUser, getTransfers);

module.exports = router;
