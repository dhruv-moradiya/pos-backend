const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema({
  capacity: { type: Number, required: true },
  isOccupied: { type: Boolean, default: false },
  currentCustomerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  tableName: { type: String, required: true, unique: true },
});

const Table = mongoose.model("Table", tableSchema);

module.exports = Table;
