// routes/trainRoutes.js
const express = require('express');
const { getTrains } = require('../Controllers/trainController');

const router = express.Router();

router.get('/get-trains', getTrains);  // Route for getting available trains based on query

module.exports = router;
