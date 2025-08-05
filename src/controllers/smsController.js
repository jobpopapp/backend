
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

module.exports = { sendSmsController };
