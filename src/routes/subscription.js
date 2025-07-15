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

const pesapalController = require("../controllers/pesapalController");
router.post(
  "/initiate",
  authenticateToken,
  requireVerification,
  pesapalController.submitOrder
);

// Add support for /payment/initiate endpoint
router.post(
  "/payment/initiate",
  authenticateToken,
  requireVerification,
  pesapalController.submitOrder
);

// Test route for development
router.post(
  "/simulate-payment",
  authenticateToken,
  requireVerification,
  subscriptionController.simulatePaymentSuccess
);

module.exports = router;
