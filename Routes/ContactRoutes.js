const express = require("express");
const {  addContact, updateContact,getContacts, sendMoney } = require("../Controllers/contactController.js");

const router = express.Router();

// 📌 Get all contacts
router.get("/contacts", getContacts);
router.get("/contacts/:userId", getContacts);
router.post("/contacts/send-money" ,sendMoney)
// 📌 Add a new contact
router.post("/addcontacts", addContact);

// 📌 Update a contact (favorite/unfavorite)
router.put("/contacts/:id", updateContact);

module.exports = router;
