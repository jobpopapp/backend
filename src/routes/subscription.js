const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken } = require('../middleware/auth');

// Pesapal IPN listener
router.post('/ipn', subscriptionController.handleIpn);

// Pesapal callback URL
router.get('/callback', subscriptionController.handleCallback);

// Get subscription status
router.get('/status', authenticateToken, subscriptionController.getSubscriptionStatus);

// CRUD for subscription plans
router.get('/plans', subscriptionController.getSubscriptionPlans);
router.get('/plans/:id', subscriptionController.getSubscriptionPlan);
router.post('/plans', authenticateToken, subscriptionController.createSubscriptionPlan);
router.put('/plans/:id', authenticateToken, subscriptionController.updateSubscriptionPlan);
router.delete('/plans/:id', authenticateToken, subscriptionController.deleteSubscriptionPlan);

module.exports = router;
