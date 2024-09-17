const Dish = require("../models/dishes.model");
const { uploadFile } = require("../utils/cloudinary");

// ADD NEW DISH
const addNewDish = async (req, res) => {
  try {
    const {
      name,
      type,
      price,
      category,
      spice_level,
      preparation_time,
      ingredients,
      calories,
      chefs_note,
    } = req.body;

    if (!name || !price || !type || !category) {
      return res
        .status(400)
        .json({ status: false, message: "All fields are required" });
    }

    const existingDish = await Dish.findOne({ name: name.toLowerCase() });

    if (existingDish) {
      return res
        .status(400)
        .json({ status: false, message: "Dish already exists" });
    }

    const dishImageLocalPath = req.files?.dishImage?.[0]?.path || null;
    const dishImageData = dishImageLocalPath
      ? await uploadFile(dishImageLocalPath)
      : {};

    const dish = await Dish.create({
      name: name.toLowerCase(),
      type: type.toUpperCase(),
      price,
      category: category.toUpperCase(),
      dishImage: dishImageData.url || "",
      spice_level: spice_level.toUpperCase(),
      preparation_time,
      ingredients: ingredients.split(","),
      calories,
      chefs_note,
    });

    if (!dish) {
      return res
        .status(500)
        .json({ status: false, message: "Dish not created" });
    }

    return res
      .status(201)
      .json({ status: true, message: "Dish created successfully", dish });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error while creating dish: " + error.message,
    });
  }
};

// GET ALL DISHES
const getAllDishes = async (req, res) => {
  try {
    const dishes = await Dish.find();

    if (!dishes) {
      return res
        .status(500)
        .json({ status: false, message: "Dishes not found" });
    }

    return res
      .status(200)
      .json({ status: true, message: "Dishes found", dishes });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error while getting dishes: " + error.message,
    });
  }
};

// GET DISH BY ID
const getDishById = async (req, res) => {
  try {
    const { id } = req.params;
    const dish = await Dish.findById(id);
    if (!dish) {
      return res.status(500).json({ status: false, message: "Dish not found" });
    }
    return res.status(200).json({ status: true, message: "Dish found", dish });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error while getting dish: " + error.message,
    });
  }
};

// UPDATE DISH
const updateDish = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = {};

    const fieldTransformations = {
      name: (value) => value.toLowerCase(),
      type: (value) => value.toUpperCase(),
      category: (value) => value.toUpperCase(),
      spice_level: (value) => value.toUpperCase(),
      ingredients: (value) => value.split(","),
    };

    for (const key in req.body) {
      if (req.body.hasOwnProperty(key)) {
        updateFields[key] = fieldTransformations[key]
          ? fieldTransformations[key](req.body[key])
          : req.body[key];
      }
    }

    const dish = await Dish.findOneAndUpdate(
      { _id: id },
      { $set: updateFields },
      { new: true }
    );

    if (!dish) {
      return res.status(404).json({ status: false, message: "Dish not found" });
    }

    return res.status(200).json({
      status: true,
      message: "Dish updated successfully",
      dish,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error while updating dish: " + error.message,
    });
  }
};

module.exports = { addNewDish, getAllDishes, getDishById, updateDish };
