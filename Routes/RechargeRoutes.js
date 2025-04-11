const express = require("express");
const router = express.Router();
const {rechargeAccount,getRecharges} = require("../Controllers/RechargeController.js");

// ✅ Recharge Account (Create Razorpay Order)
router.post("/recharge", rechargeAccount);

// ✅ Get User Transactions
router.get("/recharges", getRecharges); 

module.exports = router;
