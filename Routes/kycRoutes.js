const express = require('express');
const router = express.Router();

const {
  submitKYC,
  getAllKYCs,
  updateKYCStatus
} = require('../Controllers/kycController');

const { authenticateUser } = require('../Middleware/authMiddleware');
const upload = require('../Middleware/upload'); // cloudinary multer config

// Uploading two fields: idImage and selfie
router.post(
  '/submit',
  authenticateUser,
  upload.fields([
    { name: 'idImage', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]),
  submitKYC
);

router.get('/admin/all', authenticateUser, getAllKYCs);
router.patch('/admin/status/:id', authenticateUser, updateKYCStatus);

module.exports = router;
