
const express = require('express');
const router = express.Router();
const { sendSmsController, sendNewCompanyNotificationController, sendDocumentUploadNotificationController } = require('../controllers/smsController');

router.post('/send-sms', sendSmsController);
router.post('/send-new-company-notification', sendNewCompanyNotificationController);
router.post('/send-document-upload-notification', sendDocumentUploadNotificationController);

module.exports = router;
