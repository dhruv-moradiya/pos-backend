const Router = require("express");
const {
  addNewTable,
  getAllTables,
} = require("../controllers/table.controller");
const verifyToken = require("../middlewares/auth.middleware");
const { logRequest } = require("../middlewares/log.middleware");

const router = Router();

// ADD NEW TABLE
router.post("/", logRequest, verifyToken, addNewTable);

// GET ALL TABLES
router.get("/", logRequest, verifyToken, getAllTables);

module.exports = router;
