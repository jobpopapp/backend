const express = require('express');
const router = express.Router();
const { sendSmsController, sendNewCompanyNotificationController } = require('../controllers/smsController');

router.post('/send-sms', sendSmsController);
router.post('/send-notification', sendNewCompanyNotificationController);

module.exports = router;