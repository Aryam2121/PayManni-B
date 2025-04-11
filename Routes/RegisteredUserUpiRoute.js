const express = require("express");
const router = express.Router();
const { registerUser, getUserById,
    getUserBankData,
    loginUser} = require("../Controllers/UserupiController");

router.post("/register", registerUser);
router.get('/:userId', getUserById); 
router.get('/:userId/bank-data', getUserBankData); 
router.post('/login', loginUser); // Login route
module.exports = router;
