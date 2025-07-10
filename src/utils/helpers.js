const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config");

// Hash password
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password with hash
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Generate JWT token
const generateToken = (companyId) => {
  return jwt.sign({ companyId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

// Generate unique reference number for payments
const generatePaymentReference = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `JOBPOP-${timestamp}-${random}`;
};

// Format response
const formatResponse = (
  success,
  data = null,
  message = null,
  errors = null
) => {
  const response = { success };

  if (data !== null) response.data = data;
  if (message) response.message = message;
  if (errors) response.errors = errors;

  return response;
};

// Calculate subscription end date
const calculateSubscriptionEndDate = (planType, startDate = new Date()) => {
  const endDate = new Date(startDate);

  switch (planType) {
    case "monthly":
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case "annual":
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    case "per_job":
      // Per job doesn't have an end date, but we'll set it to 1 year for database consistency
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    default:
      throw new Error("Invalid plan type");
  }

  return endDate;
};

// Get subscription plan details
const getSubscriptionPlanDetails = (planType) => {
  const plans = {
    monthly: { cost: 50, duration: 30, name: "Monthly Plan" },
    annual: { cost: 500, duration: 365, name: "Annual Plan" },
    per_job: { cost: 30, duration: null, name: "Per Job Plan" },
  };

  return plans[planType] || null;
};

// Validate file type
const isValidFileType = (mimetype) => {
  return config.upload.allowedTypes.includes(mimetype);
};

// Sanitize filename
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, "_");
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  generatePaymentReference,
  formatResponse,
  calculateSubscriptionEndDate,
  getSubscriptionPlanDetails,
  isValidFileType,
  sanitizeFilename,
};
