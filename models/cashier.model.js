const mongoose = require("mongoose");

const cashierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shiftStartTime: { type: Date, required: true },
  shiftEndTime: { type: Date, required: true },
  customersHandled: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // List of customers handled by this cashier
  totalOrdersProcessed: { type: Number, default: 0 }, // Total number of orders processed
  totalAmountProcessed: { type: Number, default: 0 }, // Total monetary amount processed during shift
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

cashierSchema.methods.generateAccessToken = () => {
  return jwt.sign(
    {
      id: this._id,
      name: this.name,
      email: this.email,
      contactInfo: this.contactInfo,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

cashierSchema.methods.generateRefreshToken = () => {
  return jwt.sign(
    {
      id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

const Cashier = mongoose.model("Cashier", cashierSchema);

module.exports = Cashier;
