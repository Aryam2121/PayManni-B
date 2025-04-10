const express = require("express");
const router = express.Router();
const {
  generateUpiId,
  sendMoney,
  receiveMoney,
 
} = require('../Controllers/upiController');

router.post('/generate-upi', generateUpiId);
router.post('/send', sendMoney);
router.post('/receive', receiveMoney);


module.exports = router;
