const express = require("express");
const router = express.Router();
const { registerUser, getUserById,
    getUserBankData,
    loginUser} = require("../Controllers/UserupiController");

    router.post("/register", registerUser);
    router.post("/login", loginUser);
    
    // 👇 More specific route FIRST
    router.get('/:userId/bank-data', getUserBankData);
    
    // 👇 Generic one LAST
    router.get('/:userId', getUserById); 
    
module.exports = router;
