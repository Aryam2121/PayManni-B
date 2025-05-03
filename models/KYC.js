const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Userupi', required: true },
  fullName: String,
  dob: String,
  panNumber: String,
  address: String,
  idImageUrl: String,
  selfieUrl: String,
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Rejected'],
    default: 'Pending'
  }
}, { timestamps: true });

const KYC = mongoose.model('KYC', kycSchema);
module.exports = KYC;
