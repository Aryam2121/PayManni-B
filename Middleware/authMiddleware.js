const admin = require("firebase-admin");
const Userupi = require("../models/Userupi");

// Initialize Firebase Admin SDK (make sure it's initialized only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // or use cert() if using a service account JSON
  });
}

const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const idToken = authHeader.split(" ")[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log("✅ Firebase Decoded Token:", decodedToken);

      const userId = decodedToken.uid;
      const user = await Userupi.findById(userId).select("-password");

      if (!user) {
        console.log("❌ User not found in DB for UID:", userId);
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("❌ Firebase Token Verification Failed:", error.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } else {
    return res.status(401).json({ message: "No token provided" });
  }
};

module.exports = { authenticateUser };
