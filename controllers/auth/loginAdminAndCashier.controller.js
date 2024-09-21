const Admin = require("../../models/admin.model");
const Cashier = require("../../models/cashier.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const generateAccessTokenAndRefreshToken = async (userId, type) => {
  const user =
    type === "Admin"
      ? await Admin.findById(userId)
      : await Cashier.findById(userId);

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

module.exports = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ status: false, message: "All fields are required" });
    }

    const user =
      (await Admin.findOne({ email })) || (await Cashier.findOne({ email }));
    if (!user) {
      return res.status(400).json({ status: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid credentials" });
    }

    const userType = user instanceof Admin ? "Admin" : "Cashier";

    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user._id, userType);

    user.password = undefined;

    return res
      .status(200)
      .cookie("access_token", accessToken, { httpOnly: true, secure: true })
      .cookie("refresh_token", refreshToken, { httpOnly: true, secure: true })
      .json({
        status: true,
        message: `${userType} logged in successfully`,
        user,
        accessToken,
      });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};
