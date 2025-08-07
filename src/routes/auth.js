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
router.post("/google-login", authController.googleLogin);
router.post("/send-otp-password-reset", authController.sendOtpForPasswordReset);
router.post("/reset-password-with-otp", authController.resetPasswordWithOtp);

// Protected routes
router.get("/profile", authenticateToken, authController.getProfile);
router.put("/profile", authenticateToken, authController.updateProfile);

module.exports = router;
