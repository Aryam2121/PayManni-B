const express = require("express");
const { getAllTransactions } = require('../Controllers/UnifiedTransactionController');
const Userupi = require('../models/Userupi');
const Bank = require('../models/Bank');
const router = express.Router();

// 🧑 Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await Userupi.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// 💳 Get all transactions (admin-wide)
router.get('/transactions', async (req, res) => {
  try {
    const allUserIds = await Userupi.find({}, '_id');
    const userIds = allUserIds.map(u => u._id);

    // Pretend it's a global admin request — use your controller logic repeatedly
    let allTransactions = [];

    for (const userId of userIds) {
      req.user = { id: userId }; // temporarily inject
      const result = await getAllTransactions(req, { status: () => ({ json: () => {} }) });

      // Assuming getAllTransactions returns transaction array
      if (result?.transactions?.length) {
        allTransactions.push(...result.transactions.map(tx => ({ ...tx, userId })));
      }
    }

    res.json(allTransactions);
  } catch (err) {
    console.error('Admin txn fetch error:', err);
    res.status(500).json({ error: 'Error fetching transactions' });
  }
});

// 📊 Admin dashboard analytics
router.get('/analytics', async (req, res) => {
  try {
    const users = await Userupi.find();
    const banks = await Bank.find();

    const totalUsers = users.length;
    const totalBalance = users.reduce((acc, user) => acc + (user.balance || 0), 0);

    const totalBankTxn = banks.flatMap(b => b.transactions || []);
    const totalRevenue = totalBankTxn.reduce((acc, tx) => acc + tx.amount, 0);

    res.json({ totalUsers, totalBalance, totalRevenue });
  } catch (err) {
    console.error('Error in analytics:', err);
    res.status(500).json({ error: 'Error computing analytics' });
  }
});

module.exports = router;
