const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contactInfo: {
      type: String,
      required: true,
    },
    password: {
      type: String,
    },
    profileImage: {
      type: String,
    },
    profileImagePublicId: {
      type: String,
    },
    totalPerson: { type: Number, default: 1 },
    refreshToken: {
      type: String,
    },
    isOnline: Boolean,
    currentTableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
    orderHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  },
  {
    timestamps: true,
  }
);

userSchema.methods.generateAccessToken = () => {
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

userSchema.methods.generateRefreshToken = () => {
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

const User = mongoose.model("User", userSchema);

module.exports = User;
