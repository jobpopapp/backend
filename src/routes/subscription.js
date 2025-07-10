const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const {
  authenticateToken,
  requireVerification,
} = require("../middleware/auth");

// Public routes
router.get("/plans", subscriptionController.getSubscriptionPlans);
router.post("/callback", subscriptionController.handlePaymentCallback);

// Protected routes
router.get(
  "/current",
  authenticateToken,
  subscriptionController.getCurrentSubscription
);

router.get(
  "/status",
  authenticateToken,
  subscriptionController.getCurrentSubscription
);

router.post(
  "/initiate",
  authenticateToken,
  requireVerification,
  subscriptionController.initiatePayment
);

// Test route for development
router.post(
  "/simulate-payment",
  authenticateToken,
  requireVerification,
  subscriptionController.simulatePaymentSuccess
);

module.exports = router;
