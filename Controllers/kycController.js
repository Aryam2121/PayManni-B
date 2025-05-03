const KYC = require('../models/KYC');
const User = require('../models/Userupi');

// Submit KYC with Cloudinary
const submitKYC = async (req, res) => {
  try {
    const { fullName, dob, panNumber, address } = req.body;
    const idImage = req.files?.idImage?.[0];
    const selfie = req.files?.selfie?.[0];

    if (!idImage || !selfie) {
      return res.status(400).json({ message: 'Both ID image and selfie are required.' });
    }

    const newKYC = new KYC({
      userId: req.user.id,
      fullName,
      dob,
      panNumber,
      address,
      idImageUrl: idImage.path,
      selfieUrl: selfie.path
    });

    await newKYC.save();
    res.status(201).json({ message: "KYC Submitted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error submitting KYC" });
  }
};

const getAllKYCs = async (req, res) => {
  const kycs = await KYC.find().populate('userId', 'email');
  res.json(kycs);
};

const updateKYCStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['Verified', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const updated = await KYC.findByIdAndUpdate(id, { status }, { new: true });
  res.json(updated);
};

module.exports = {
  submitKYC,
  getAllKYCs,
  updateKYCStatus
};
