const express = require("express");
const router = express.Router();
const { registerUser } = require("../Controllers/UserupiController");

router.post("/register", registerUser);

module.exports = router;
