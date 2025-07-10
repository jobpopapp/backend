const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const { authenticateToken } = require("../middleware/auth");
const { upload, handleUploadError } = require("../middleware/upload");

// Protected routes
router.post(
  "/certificate",
  authenticateToken,
  upload.single("certificate"),
  handleUploadError,
  companyController.uploadCertificate
);

router.get("/me", authenticateToken, companyController.getCompanyInfo);
router.get(
  "/verification-status",
  authenticateToken,
  companyController.getVerificationStatus
);

module.exports = router;
