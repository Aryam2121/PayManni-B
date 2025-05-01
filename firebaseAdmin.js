const admin = require("firebase-admin");

const serviceAccount = require("./firebase-service-account.json"); // Download this from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
