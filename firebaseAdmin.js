const admin = require("firebase-admin");

if (!process.env.FIREBASE_CREDENTIALS) {
  throw new Error("Missing FIREBASE_CREDENTIALS in environment variables");
}

let serviceAccount;

try {
  serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
} catch (error) {
  throw new Error("FIREBASE_CREDENTIALS is not a valid JSON string");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
