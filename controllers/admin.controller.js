const Admin = require("../models/admin.model");
const bcrypt = require("bcrypt");
const { uploadFile } = require("../utils/cloudinary");

// CREATE ADMIN
const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ status: false, message: "All fields are required" });
    }

    const existingAdmin = await Admin.find();

    if (existingAdmin.length > 0) {
      return res.status(400).json({
        status: false,
        message: "Admin already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let profileImagePath = req.files?.profileImage?.[0]?.path || "";

    if (!profileImagePath) {
      return res
        .status(400)
        .json({ status: false, message: "Profile image is required" });
    }

    let profileImage = profileImagePath
      ? await uploadFile(profileImagePath)
      : {};

    const newAdmin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      profileImage: profileImage.url || "",
      profileImagePublicId: profileImage.public_id || "",
    });

    if (!newAdmin) {
      return res
        .status(400)
        .json({ status: false, message: "Failed to create admin" });
    }

    return res.status(200).json({
      status: true,
      message: "Admin created successfully",
      admin: newAdmin,
    });
  } catch (err) {
    console.log("Error while creating admin :- ", err.message);
    res.status(500).json({ status: false, message: err.message });
  }
};

module.exports = { createAdmin };
