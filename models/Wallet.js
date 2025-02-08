// models/walletModel.js
let wallet = {
  balance: 5000,
  transactions: [],
};

const getWallet = () => wallet;

const updateBalance = (amount) => {
  wallet.balance += amount;
};

const addTransaction = (amount, type) => {
  const transaction = {
    id: wallet.transactions.length + 1,
    amount,
    type,
    date: new Date().toLocaleString(),
  };
  wallet.transactions.push(transaction);
};

module.exports = {
  getWallet,
  updateBalance,
  addTransaction,
};
