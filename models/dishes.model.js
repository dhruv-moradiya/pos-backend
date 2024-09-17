const mongoose = require("mongoose");

const dishSchema = new mongoose.Schema(
  {
    name: { type: String, lowerCase: true, required: true },
    isAvailable: { type: Boolean, default: true },
    type: {
      type: String,
      enum: ["STARTER", "BREAKFAST", "LUNCH", "DINNER", "DESSERT"],
      required: true,
    },
    category: {
      type: String,
      enum: ["VEGETARIAN", "NON-VEGETARIAN", "VEGAN"],
      required: true,
    },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ["AVAILABLE", "UNAVAILABLE"],
      default: "AVAILABLE",
    },
    dishImage: {
      type: String,
      required: true,
    },
    spice_level: { type: String, enum: ["HIGH", "MEDIUM", "LOW"] },
    preparation_time: String,
    ingredients: [{ type: String }],
    calories: Number,
    chefs_note: String,
  },
  {
    timestamps: true,
  }
);

const Dish = mongoose.model("Dish", dishSchema);

module.exports = Dish;
