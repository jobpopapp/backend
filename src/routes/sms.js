
const express = require('express');
const router = express.Router();
const { sendSmsController } = require('../controllers/smsController');

router.post('/send-sms', sendSmsController);

module.exports = router;
