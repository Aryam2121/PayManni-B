const Wallet = require("../models/Wallet")
const WalletTransaction = require("../models/WalletTransaction");
const mongoose = require("mongoose");

const deductFromWallet = async (userId, amount, description) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const wallet = await Wallet.findOne({ userId }).session(session);

    if (!wallet || wallet.balance < amount) {
      throw new Error("Insufficient balance");
    }

    wallet.balance -= amount;
    await wallet.save({ session });

    await WalletTransaction.create(
      [{
        user: userId,
        amount,
        type: "Withdraw",
        description,
      }],
      { session }
    );

    // Commit the transaction if everything is successful
    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    // Rollback transaction in case of error
    await session.abortTransaction();
    session.endSession();
    throw error;  // Re-throw the error to be handled by calling function
  }
};


module.exports = deductFromWallet;
