const Order = require("../models/order.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");

// ADD NEW ORDER
const placeOrder = async (req, res) => {
  try {
    const {
      customer_id,
      tableId,
      items,
      status,
      orderType,
      totalAmount,
      paymentStatus,
    } = req.body;

    const missingFields = [];
    if (!customer_id) missingFields.push("customer_id");
    if (!tableId) missingFields.push("tableId");
    if (!items || items.length === 0) missingFields.push("items");
    if (!status) missingFields.push("status");
    if (!orderType) missingFields.push("orderType");
    if (!totalAmount) missingFields.push("totalAmount");
    if (!paymentStatus) missingFields.push("paymentStatus");

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: false,
        message: `Missing or empty fields: ${missingFields.join(", ")}`,
      });
    }

    const dishesIds = items.map((item) => item.dish);
    const invalidIds = [customer_id, tableId, ...dishesIds].filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );

    if (invalidIds.length > 0) {
      return res.status(400).json({
        status: false,
        message: `Invalid id(s): ${invalidIds.join(", ")}`,
      });
    }

    const order = await Order.create({
      customer_id,
      tableId,
      items,
      status,
      orderType,
      totalAmount,
      paymentStatus,
    });

    if (!order) {
      return res
        .status(500)
        .json({ status: false, message: "Error while placing order" });
    }

    await User.findByIdAndUpdate(
      customer_id,
      {
        $push: { orderHistory: order._id },
      },
      { new: true }
    );

    return res
      .status(201)
      .json({ status: true, message: "Order placed successfully", order });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error while placing order :- " + error.message,
    });
  }
};

// GET ALL ORDERS
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({
        path: "customer_info",
        select: "_id name isOnline",
      })
      .populate({
        path: "table_info",
        select: "_id capacity",
      })
      .populate({
        path: "items.dish",
        select: "_id name price",
      });

    if (!orders) {
      return res
        .status(400)
        .json({ status: false, message: "No orders found" });
    }

    const modifiedOrders = orders.map((order) => {
      const orderObj = order.toObject();
      delete orderObj.tableId;
      delete orderObj.customer_id;
      return orderObj;
    });

    return res.status(200).json({
      status: true,
      message: "Orders fetched successfully",
      orders: modifiedOrders,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error while getting orders :- " + error.message,
    });
  }
};

// GET ORDER BY ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ status: false, message: "Order id is required" });
    }

    const order = await Order.findById(id)
      .populate({
        path: "customer_info",
        select: "_id name isOnline",
      })
      .populate({
        path: "table_info",
        select: "_id capacity",
      });

    if (!order) {
      return res
        .status(400)
        .json({ status: false, message: "No order found with this id" });
    }

    const modifiedOrder = order.toObject();
    delete modifiedOrder.tableId;
    delete modifiedOrder.customer_id;

    return res.status(200).json({
      status: true,
      message: "Order fetched successfully",
      order: modifiedOrder,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error while getting order :- " + error.message,
    });
  }
};

// UPDATE QUANTITY AND DISCOUNT
const updateQuantityAndDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, dishId, discount } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ status: false, message: "Order ID is required" });
    }

    if (!dishId || (!quantity && !discount)) {
      return res.status(400).json({
        status: false,
        message: "Either quantity or discount and DishId must be provided",
      });
    }

    const order = await Order.findOne({
      _id: id,
      items: { $elemMatch: { dish: dishId } },
    });

    if (!order) {
      return res.status(400).json({
        status: false,
        message: "No order found with this id or dish",
      });
    }

    const updatedFields = {};

    if (quantity) {
      updatedFields["items.$.qty"] = Number(quantity);
    }

    if (discount) {
      updatedFields["items.$.discount"] = Number(discount);
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: id, "items.dish": dishId },
      { $set: updatedFields },
      { new: true }
    );

    return res.status(200).json({
      status: true,
      message: "Order quantity or discount updated successfully",
      updatedOrder,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error while updating order: " + error.message,
    });
  }
};

// REMOVE ORDER
const removeOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ status: false, message: "Order ID is required" });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res
        .status(400)
        .json({ status: false, message: "No order found with this id" });
    }

    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res
        .status(400)
        .json({ status: false, message: "No order found with this id" });
    }

    await User.findByIdAndUpdate(
      order.customer_id,
      {
        $pull: { orderHistory: order._id },
      },
      { new: true }
    );

    return res.status(200).json({
      status: true,
      message: "Order deleted successfully",
      deletedOrder,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error while removing order: " + error.message,
    });
  }
};

module.exports = {
  placeOrder,
  getAllOrders,
  getOrderById,
  updateQuantityAndDiscount,
  removeOrder,
};
