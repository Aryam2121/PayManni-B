const express = require("express");
const router = express.Router();
const { registerUser, getUserById,
    getUserBankData,
    loginUser,editUserProfile} = require("../Controllers/UserupiController");

    router.post("/register", registerUser);
    router.post("/login", loginUser);
    router.put("/edituser",editUserProfile);
    
    // 👇 More specific route FIRST
    router.get('/:userId/bank-data', getUserBankData);
    
    // 👇 Generic one LAST
    router.get('/:userId', getUserById); 
    
module.exports = router;
