const User = require("../models/user.model");
const Table = require("../models/table.model");
const ObjectId = require("mongodb").ObjectId;

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { uploadFile } = require("../utils/cloudinary");

// GENERATE ACCESS AND REFRESH TOKEN
const generateAccessTokenAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

// VALIDATE AND ASSIGN TABLE
const validateAndAssignTable = async (userId, tableId) => {
  if (!ObjectId.isValid(tableId)) {
    return { success: false, message: "Invalid table id" };
  }

  const table = await Table.findById(tableId);
  if (!table) {
    return { success: false, message: "Table not found" };
  }

  if (table.isOccupied) {
    return { success: false, message: "Table is already occupied" };
  }

  // Assign the table to the user
  table.isOccupied = true;
  table.currentCustomerId = new ObjectId(String(userId));
  await table.save({ validateBeforeSave: false });

  return { success: true, table };
};

// CREATE ONLINE USER
const createOnlineUser = async (req) => {
  const { name, email, password, role, contactInfo } = req.body;

  // Validate required fields for online user creation
  if (!name || !email || !password || !role || !contactInfo) {
    return { success: false, message: "All fields are required" };
  }

  // Check if user already exists for online creation
  let existingUser = await User.findOne({ email });
  if (existingUser) {
    return { success: false, message: "User already exists" };
  }

  // Handle online user creation
  const hashedPassword = await bcrypt.hash(password, 10);

  let profileImagePath = req.files?.profileImage?.[0]?.path || "";
  let profileImage = profileImagePath ? await uploadFile(profileImagePath) : {};

  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    profileImage: profileImage.url || "",
    profileImagePublicId: profileImage.public_id || "",
    role: role.toUpperCase(),
    contactInfo,
    isOnline: true,
  });

  if (!newUser) {
    return { success: false, message: "User could not be created" };
  }

  return { success: true, user: newUser };
};

// CREATE OFFLINE USER
const createOfflineUser = async (req) => {
  const { name, email, contactInfo, currentTableId, totalPerson } = req.body;

  if (!currentTableId) {
    return { success: false, message: "Current table id is required" };
  }

  // Check if user already exists for offline creation
  let existingUser = await User.findOne({ email });
  if (existingUser) {
    const tableResult = await validateAndAssignTable(
      existingUser._id,
      currentTableId
    );
    if (!tableResult.success) {
      return { success: false, message: tableResult.message };
    }

    existingUser.currentTableId = new ObjectId(String(currentTableId));
    await existingUser.save({ validateBeforeSave: false });

    return { success: true, user: existingUser, table: tableResult.table };
  }

  // Create a new offline user
  const newUser = await User.create({
    name,
    email,
    contactInfo,
    currentTableId,
    totalPerson,
    isOnline: false,
  });

  const tableResult = await validateAndAssignTable(newUser._id, currentTableId);
  if (!tableResult.success) {
    return { success: false, message: tableResult.message };
  }

  if (!newUser) {
    return { success: false, message: "User could not be created" };
  }

  return { success: true, user: newUser, table: tableResult.table._id };
};

// CREATE USER
const createUser = async (req, res) => {
  try {
    const isOnline = req.body.isOnline === "true";

    let result;
    if (isOnline) {
      result = await createOnlineUser(req);
    } else {
      result = await createOfflineUser(req);
    }

    if (!result.success) {
      return res.status(400).json({ status: false, message: result.message });
    }

    return res.status(200).json({
      status: true,
      message: "User created successfully",
      data: { user: result.user, table: result.table || null },
    });
  } catch (error) {
    console.error("Error while creating user:", error.message);
    return res.status(500).json({
      status: false,
      message: "Error while creating user: " + error.message,
    });
  }
};

// LOGIN USER
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ status: false, message: "All fields are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ status: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .cookie("access_token", accessToken, {
        httpOnly: true,
        secure: true,
      })
      .cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: true,
      })
      .json({ status: true, message: "Login successful" });
  } catch (error) {
    console.log("🚀 ~ loginUser ~ error:", error);
    return res.status(500).json({
      status: false,
      message: "Error while login user :- " + error.message,
    });
  }
};

// DELETE USER
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ status: false, message: "User id is required" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(400).json({ status: false, message: "User not found" });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res
        .status(400)
        .json({ status: false, message: "User not deleted" });
    }

    return res
      .status(200)
      .json({ status: true, message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error while deleting user :- " + error.message,
    });
  }
};

// GET ALL USER
const getAllUser = async (req, res) => {
  try {
    const users = await User.aggregate([{ $project: { password: 0 } }]);

    if (!users) {
      return res.status(400).json({ status: false, message: "User not found" });
    }

    return res.status(200).json({ status: true, message: "User found", users });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error while getting user :- " + error.message,
    });
  }
};

// GET SINGLE USER
const getSingleUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({ status: false, message: "User not found" });
    }
    return res.status(200).json({ status: true, message: "User found", user });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error while getting user :- " + error.message,
    });
  }
};

// INSERT DATA
const insertData = async (req, res) => {
  try {
    const data = [
      {
        name: "Aarav Sharma",
        email: "aarav.sharma@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 98765 43210",
        isOnline: true,
      },
      {
        name: "Isha Verma",
        email: "isha.verma@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 87654 32109",
        isOnline: true,
      },
      {
        name: "Rohan Mehta",
        email: "rohan.mehta@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 76543 21098",
        isOnline: true,
      },
      {
        name: "Priya Singh",
        email: "priya.singh@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 65432 10987",
        isOnline: true,
      },
      {
        name: "Kabir Nair",
        email: "kabir.nair@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 54321 09876",
        isOnline: true,
      },
      {
        name: "Ananya Iyer",
        email: "ananya.iyer@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 99887 66554",
        isOnline: true,
      },
      {
        name: "Vivaan Kumar",
        email: "vivaan.kumar@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 98765 54321",
        isOnline: true,
      },
      {
        name: "Diya Bhatt",
        email: "diya.bhatt@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 87654 43210",
        isOnline: true,
      },
      {
        name: "Aryan Gupta",
        email: "aryan.gupta@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 76543 32109",
        isOnline: true,
      },
      {
        name: "Sana Patel",
        email: "sana.patel@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 65432 21098",
        isOnline: true,
      },
      {
        name: "Arjun Kapoor",
        email: "arjun.kapoor@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 54321 10987",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Nidhi Desai",
        email: "nidhi.desai@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 43210 98765",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Aditya Rao",
        email: "aditya.rao@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 32109 87654",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Meera Das",
        email: "meera.das@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 21098 76543",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Rhea Joshi",
        email: "rhea.joshi@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 10987 65432",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Ankit Singh",
        email: "ankit.singh@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 99876 54321",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Sneha Reddy",
        email: "sneha.reddy@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 88765 43210",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Krishna Menon",
        email: "krishna.menon@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 77654 32109",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Tanya Choudhary",
        email: "tanya.choudhary@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 66543 21098",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Manish Goel",
        email: "manish.goel@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 55432 10987",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Pooja Jain",
        email: "pooja.jain@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 44321 09876",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Ravi Mishra",
        email: "ravi.mishra@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 33210 98765",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Sakshi Kapoor",
        email: "sakshi.kapoor@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 22109 87654",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Nishant Yadav",
        email: "nishant.yadav@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 11098 76543",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Aditi Gupta",
        email: "aditi.gupta@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 90987 65432",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Vikram Sharma",
        email: "vikram.sharma@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 89876 54321",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Simran Gill",
        email: "simran.gill@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 78765 43210",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Kunal Thakur",
        email: "kunal.thakur@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 67654 32109",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Reena Nair",
        email: "reena.nair@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 56543 21098",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Gaurav Singh",
        email: "gaurav.singh@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 45432 10987",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Neha Desai",
        email: "neha.desai@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 34321 09876",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Akash Mehta",
        email: "akash.mehta@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 23210 98765",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Lavanya Raj",
        email: "lavanya.raj@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 12109 87654",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Rajesh Kumar",
        email: "rajesh.kumar@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 01198 76543",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Ritu Arora",
        email: "ritu.arora@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 90909 09090",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Kiran Patil",
        email: "kiran.patil@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 89898 98989",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Vani Sharma",
        email: "vani.sharma@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 78787 87878",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Madhav Agarwal",
        email: "madhav.agarwal@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 67676 76767",
        currentTableId: 1,
        isOnline: false,
      },
      {
        name: "Snehal Bhatia",
        email: "snehal.bhatia@example.com",
        password: "123456",
        role: "CUSTOMER",
        contactInfo: "+91 56565 65656",
        currentTableId: 1,
        isOnline: false,
      },
    ];

    const users = await User.insertMany(data);

    return res
      .status(200)
      .json({ status: true, message: "Data inserted successfully" });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error while inserting data :- " + error.message,
    });
  }
};

module.exports = {
  createUser,
  deleteUser,
  loginUser,
  getAllUser,
  getSingleUser,
  insertData,
};
