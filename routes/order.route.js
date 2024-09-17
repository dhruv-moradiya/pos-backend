const Router = require("express");
const {
  placeOrder,
  getAllOrders,
  getOrderById,
  updateQuantityAndDiscount,
  removeOrder,
} = require("../controllers/order.controller");
const verifyToken = require("../middlewares/auth.middleware");
const { logRequest } = require("../middlewares/log.middleware");

const router = Router();

// GET ALL ORDERS
router.get("/", logRequest, getAllOrders);

// PLACE ORDER
router.post("/", verifyToken, logRequest, placeOrder);

// GET ORDER BY ID
router.get("/:id", verifyToken, logRequest, getOrderById);

// UPDATE ORDER
router.patch(
  "/update_item/:id",
  verifyToken,
  logRequest,
  updateQuantityAndDiscount
);

// DELETE ORDER
router.delete("/:id", verifyToken, logRequest, removeOrder);

logRequest, (module.exports = router);
