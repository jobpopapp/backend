const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const { authenticateToken } = require("../middleware/auth");
const { upload, handleUploadError } = require("../middleware/upload");

// Certificate management routes
router.post(
  "/certificate",
  authenticateToken,
  upload.single("certificate"),
  handleUploadError,
  companyController.uploadCertificate
);

router.get(
  "/certificate",
  authenticateToken,
  companyController.getCertificateInfo
);

router.delete(
  "/certificate",
  authenticateToken,
  companyController.removeCertificate
);

// Company information routes
router.get("/me", authenticateToken, companyController.getCompanyInfo);
router.get(
  "/verification-status",
  authenticateToken,
  companyController.getVerificationStatus
);

module.exports = router;
