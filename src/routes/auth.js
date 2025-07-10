const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const {
  validateCompanyRegistration,
  validateCompanyLogin,
} = require("../middleware/validation");
const { authenticateToken } = require("../middleware/auth");

// Public routes
router.post("/register", validateCompanyRegistration, authController.register);
router.post("/login", validateCompanyLogin, authController.login);

// Protected routes
router.get("/profile", authenticateToken, authController.getProfile);
router.put("/profile", authenticateToken, authController.updateProfile);

module.exports = router;
