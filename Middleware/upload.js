// middleware/upload.js
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Setup multer storage with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'paymanni_movies', // Cloudinary folder name
    allowedFormats: ['jpg', 'jpeg', 'png', 'gif'], // Allowed image formats
    transformation: [{ width: 500, height: 500, crop: 'limit' }], // Resize image to 500x500
  },
});

// Multer upload configuration
const upload = multer({ storage: storage });

module.exports = upload;
