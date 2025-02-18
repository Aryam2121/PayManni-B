const express = require("express");
const router = express.Router();
const{createGroup,getGroups,addUserToGroup,removeUserFromGroup,updateUserPayment,splitPayment} = require("../Controllers/Split-paymentController.js");

router.post("/create",  createGroup);
router.get("/all",  getGroups);
router.post("/add-user",  addUserToGroup);
router.post("/remove-user",  removeUserFromGroup);
router.post("/update-payment",  updateUserPayment);
router.post("/split",  splitPayment);

module.exports = router;
