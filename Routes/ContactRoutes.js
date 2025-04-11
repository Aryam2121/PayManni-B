const express = require("express");
const { getAllContacts, addContact, updateContact,getContacts } = require("../Controllers/contactController.js");

const router = express.Router();

// 📌 Get all contacts
router.get("/contacts", getContacts);
router.get("/contacts/:userId", getContacts);

// 📌 Add a new contact
router.post("/contacts", addContact);

// 📌 Update a contact (favorite/unfavorite)
router.put("/contacts/:id", updateContact);

module.exports = router;
