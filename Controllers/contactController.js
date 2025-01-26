// controllers/contactController.js
const Contact = require('../models/Contact');

exports.addContact = async (req, res) => {
  const { name, phone } = req.body;

  try {
    const contact = new Contact({ name, phone });
    await contact.save();
    res.status(201).json({ success: true, message: 'Contact added successfully', contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding contact', error });
  }
};

exports.getContacts = async (req, res) => {
  const { searchQuery } = req.query;

  try {
    const query = searchQuery
      ? { $or: [{ name: { $regex: searchQuery, $options: 'i' } }, { phone: { $regex: searchQuery } }] }
      : {};
    const contacts = await Contact.find(query);
    res.status(200).json({ success: true, contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching contacts', error });
  }
};

exports.toggleFavorite = async (req, res) => {
  const { id } = req.params;

  try {
    const contact = await Contact.findById(id);
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });

    contact.isFavorite = !contact.isFavorite;
    await contact.save();
    res.status(200).json({ success: true, message: 'Favorite status toggled', contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating contact', error });
  }
};
