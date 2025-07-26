const express = require('express');
const router = express.Router();
const pesapalController = require('../controllers/pesapalController');
const { authenticateToken } = require('../middleware/auth');

// Route to submit an order for payment
router.post('/submit-order', authenticateToken, pesapalController.submitOrder);

// Route for IPN registration
router.post('/register-ipn', pesapalController.registerIpnUrl);

module.exports = router;
