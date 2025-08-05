const { sendSMS } = require('../utils/sms');

async function sendSmsController(req, res) {
  const { phoneNumber, message } = req.body;

  if (!phoneNumber || !message) {
    return res.status(400).json({ error: 'Phone number and message are required' });
  }

  try {
    const result = await sendSMS(phoneNumber, message);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to send SMS' });
  }
}

async function sendNewCompanyNotificationController(req, res) {
  const { name, phone, email } = req.body;
  const phoneNumber = process.env.JOBPOPNUMBER;

  if (!name || !phone || !email) {
    return res.status(400).json({ error: 'Name, phone, and email are required' });
  }

  if (!phoneNumber) {
    console.error('JOBPOPNUMBER not set in .env file');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const message = `Dear admin Jobpop app, a new hiring company ${name} ${phone} ${email} has created a new account.`;

  try {
    const result = await sendSMS(phoneNumber, message);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error sending notification SMS:', error.message);
    res.status(500).json({ success: false, error: 'Failed to send notification SMS' });
  }
}

module.exports = { sendSmsController, sendNewCompanyNotificationController };