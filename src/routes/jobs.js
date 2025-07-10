const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const {
  authenticateToken,
  requireVerification,
  requireActiveSubscription,
} = require("../middleware/auth");
const {
  validateJobCreation,
  validateJobUpdate,
} = require("../middleware/validation");

// Public routes (no auth required)
router.get("/categories", jobController.getJobCategories);

// Protected routes
router.get(
  "/my",
  authenticateToken,
  requireVerification,
  jobController.getMyJobs
);
router.get(
  "/:id",
  authenticateToken,
  requireVerification,
  jobController.getJobById
);

router.post(
  "/",
  authenticateToken,
  requireVerification,
  requireActiveSubscription,
  validateJobCreation,
  jobController.createJob
);

router.put(
  "/:id",
  authenticateToken,
  requireVerification,
  requireActiveSubscription,
  validateJobUpdate,
  jobController.updateJob
);

router.delete(
  "/:id",
  authenticateToken,
  requireVerification,
  requireActiveSubscription,
  jobController.deleteJob
);

module.exports = router;
