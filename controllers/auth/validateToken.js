const jet = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  try {
    const token =
      req.body.token || req.header("Authorization").replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }

    const decodedToken = await jet.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    if (!decodedToken) {
      return res.status(401).json({
        status: false,
        message: "Invalid Access Token",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Valid Access Token",
    });
  } catch (error) {
    return res.status(401).json({
      status: false,
      message: error.message || "Invalid Access Token",
    });
  }
};
