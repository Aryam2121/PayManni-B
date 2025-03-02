import express from "express";
import { payBill, getAllPayments, getPaymentHistoryByBill } from "../Controllers/billPaymentController.js";

const router = express.Router();

// Route to pay a bill
router.post("/pay", payBill);

// Route to get all payments
router.get("/history", getAllPayments);

// Route to get payment history for a specific bill type
router.get("/history/:billType", getPaymentHistoryByBill);

export default router;
