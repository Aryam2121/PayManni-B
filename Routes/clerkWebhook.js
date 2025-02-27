const express = require("express");
const crypto = require("crypto");
const User = require("../models/User"); // Apna MongoDB User model
const router = express.Router();

const CLERK_SIGNING_SECRET = "whsec_QfqF4E4tCd+EnixuezmgdVb8Pne8vvQr"; // Environment me store kar!

// Clerk Webhook Handler
router.post("/clerk-webhook", express.json({ type: "application/json" }), async (req, res) => {
  const payload = JSON.stringify(req.body);
  const signature = req.headers["clerk-signature"];

  if (!verifySignature(payload, signature)) {
    return res.status(400).json({ message: "Invalid Signature" });
  }

  const eventType = req.body.type;
  const data = req.body.data;

  try {
    if (eventType === "user.created" || eventType === "user.updated") {
      const { id, email_addresses, phone_numbers, first_name, last_name, username } = data;
      
      const email = email_addresses.length ? email_addresses[0].email_address : null;
      const phoneNumber = phone_numbers.length ? phone_numbers[0].phone_number : null;

      let user = await User.findOne({ clerkId: id });

      if (!user) {
        user = new User({
          clerkId: id,
          name: `${first_name} ${last_name}`,
          email,
          phoneNumber,
          username,
        });
      } else {
        user.name = `${first_name} ${last_name}`;
        user.email = email;
        user.phoneNumber = phoneNumber;
        user.username = username;
      }

      await user.save();
      return res.status(200).json({ message: "User synced successfully" });
    }

    res.status(200).json({ message: "Event received but no action taken" });
  } catch (error) {
    console.error("Clerk Webhook Error:", error);
    res.status(500).json({ message: "Error processing webhook", error: error.message });
  }
});

// 🔹 **Verify Clerk Webhook Signature**
function verifySignature(payload, signature) {
  const hmac = crypto.createHmac("sha256", CLERK_SIGNING_SECRET);
  hmac.update(payload, "utf8");
  const digest = hmac.digest("base64");
  return signature === digest;
}

module.exports = router;
