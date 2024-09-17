const express = require("express");
const {
  createUser,
  loginUser,
  deleteUser,
  getAllUser,
  getSingleUser,
} = require("../controllers/user.controllers");
const router = express.Router();
const { upload } = require("../middlewares/multer.middleware");
const verifyToken = require("../middlewares/auth.middleware");
const { logRequest } = require("../middlewares/log.middleware");

// CREATE USER
router.post(
  "/create-user",
  upload.fields([{ name: "profileImage", maxCount: 1 }]),
  logRequest,
  createUser
);

// LOGIN USER
router.post("/login-user", logRequest, loginUser);

// DELETE USER
router.delete("/:id", logRequest, verifyToken, deleteUser);

// GET ALL USER
router.get("/", logRequest, verifyToken, getAllUser);

// GET SINGLE USER
router.get("/:id", logRequest, verifyToken, getSingleUser);

module.exports = router;
