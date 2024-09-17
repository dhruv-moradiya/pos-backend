const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },
    items: [
      {
        dish: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Dish",
          required: true,
        },
        qty: {
          type: Number,
          required: true,
        },
        discount: {
          type: Number,
          default: 0,
        },
        _id: false,
      },
    ],
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "CANCELED", "HOLD"],
      required: true,
      default: "PENDING",
    },
    orderType: { type: String, enum: ["DINE-IN", "TAKEAWAY"], required: true },
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ["PAID", "UNPAID"], required: true },
  },
  { timestamps: true }
);

orderSchema.virtual("customer_info", {
  ref: "User",
  localField: "customer_id",
  foreignField: "_id",
  justOne: true,
  select: "_id name isOnline",
});

orderSchema.virtual("table_info", {
  ref: "Table",
  localField: "tableId",
  foreignField: "_id",
  justOne: true,
  select: "_id capacity",
});

orderSchema.set("toJSON", { virtuals: true });

orderSchema.set("toObject", { virtuals: true });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
