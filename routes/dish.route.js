const Router = require("express");
const { addNewDish, getAllDishes } = require("../controllers/dish.controller");
const verifyToken = require("../middlewares/auth.middleware");
const { logRequest } = require("../middlewares/log.middleware");
const { upload } = require("../middlewares/multer.middleware");

const router = Router();

// ADD NEW DISH
router.post(
  "/",
  logRequest,
  verifyToken,
  upload.fields([{ name: "dishImage", maxCount: 1 }]),
  addNewDish
);

// GET ALL DISH
router.get("/", logRequest, verifyToken, getAllDishes);

module.exports = router;
