
const axios = require('axios');

async function sendSMS(phoneNumber, message) {
  try {
    const response = await axios.get(process.env.SMS_API_URL, {
      params: {
        username: process.env.SMS_USERNAME,
        password: process.env.SMS_PASSWORD,
        message,
        number: phoneNumber,
        sender: process.env.SMS_USERNAME
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

module.exports = { sendSMS };
