const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const verifyToken = async (req, res, next) => {
  try {
    const token =
      req.cookies?.access_token ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ status: false, message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid Access Token" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: error.message || "Invalid Access Token" });
  }
};

module.exports = verifyToken;
