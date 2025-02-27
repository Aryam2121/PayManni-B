const express = require("express");
const router = express.Router();
const splitPaymentController = require("../Controllers/Split-PaymentController.js");

// ✅ Group Management
router.post("/create-group", splitPaymentController.createGroup);
router.get("/groups", splitPaymentController.getGroups);
router.post("/add-user", splitPaymentController.addUserToGroup);
router.post("/remove-user", splitPaymentController.removeUserFromGroup);
router.post("/update-payment", splitPaymentController.updateUserPayment);
router.post("/split-payment", splitPaymentController.splitPayment);

// ✅ Payment Processing
router.post("/create-order", splitPaymentController.createPaymentOrder);
router.post("/verify-payment", splitPaymentController.verifyPayment);

module.exports = router;
