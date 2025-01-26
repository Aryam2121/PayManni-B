// routes/contactRoutes.js
const express = require('express');
const { addContact, getContacts, toggleFavorite } = require('../Controllers/contactController');
const router = express.Router();

router.post('/add', addContact);
router.get('/get', getContacts);
router.patch('/favorite/:id', toggleFavorite);

module.exports = router;
