// routes/contactRoutes.js
const express = require('express');
const { addContact, getContacts, toggleFavorite } = require('../Controllers/contactController');
const router = express.Router();

router.post('/addCont', addContact);
router.get('/getCont', getContacts);
router.patch('/favorite/:id', toggleFavorite);

module.exports = router;
