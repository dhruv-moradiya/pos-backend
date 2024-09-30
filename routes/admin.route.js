const Router = require("express");
const { upload } = require("../middlewares/multer.middleware");
const { logRequest } = require("../middlewares/log.middleware");
const { createAdmin } = require("../controllers/admin.controller");
const logInAdmin = require("../controllers/auth/loginAdminAndCashier.controller");
const checkTokenIsValid = require("../controllers/auth/validateToken");

const router = Router();

router.post("/validate-token", checkTokenIsValid);

// CREATE ADMIN
router.post(
  "/create-admin",
  logRequest,
  upload.fields([{ name: "profileImage", maxCount: 1 }]),
  createAdmin
);

// LOGIN ADMIN
router.post("/login-admin", logRequest, logInAdmin);

module.exports = router;
