const { body, validationResult } = require("express-validator");

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// Company registration validation
const validateCompanyRegistration = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Company name must be between 2 and 100 characters"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("phone")
    .trim()
    .isLength({ min: 8, max: 20 })
    .withMessage("Phone number must be between 8 and 20 characters"),

  body("country")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Country must be between 2 and 50 characters"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),

  handleValidationErrors,
];

// Company login validation
const validateCompanyLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

// Job creation validation
const validateJobCreation = [
  body("title")
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage("Job title must be between 5 and 100 characters"),

  body("description")
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage("Job description must be between 50 and 5000 characters"),

  body("category_id")
    .isInt({ min: 1 })
    .withMessage("Please select a valid job category"),

  body("country")
    .trim()
    .isIn(["Uganda", "Abroad"])
    .withMessage("Country must be either Uganda or Abroad"),

  body("deadline")
    .isISO8601()
    .toDate()
    .custom((value) => {
      if (value <= new Date()) {
        throw new Error("Deadline must be in the future");
      }
      return true;
    }),

  body("salary")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Salary information must not exceed 100 characters"),

  body("is_foreign")
    .optional()
    .isBoolean()
    .withMessage("Foreign employer field must be boolean"),

  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("phone")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("Phone number must not exceed 20 characters"),

  body("whatsapp")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("WhatsApp number must not exceed 20 characters"),

  body("application_link")
    .optional()
    .isURL()
    .withMessage("Application link must be a valid URL"),

  handleValidationErrors,
];

// Job update validation (similar to creation but all fields optional)
const validateJobUpdate = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage("Job title must be between 5 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage("Job description must be between 50 and 5000 characters"),

  body("category_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Please select a valid job category"),

  body("country")
    .optional()
    .trim()
    .isIn(["Uganda", "Abroad"])
    .withMessage("Country must be either Uganda or Abroad"),

  body("deadline")
    .optional()
    .isISO8601()
    .toDate()
    .custom((value) => {
      if (value <= new Date()) {
        throw new Error("Deadline must be in the future");
      }
      return true;
    }),

  body("salary")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Salary information must not exceed 100 characters"),

  body("is_foreign")
    .optional()
    .isBoolean()
    .withMessage("Foreign employer field must be boolean"),

  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("phone")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("Phone number must not exceed 20 characters"),

  body("whatsapp")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("WhatsApp number must not exceed 20 characters"),

  body("application_link")
    .optional()
    .isURL()
    .withMessage("Application link must be a valid URL"),

  handleValidationErrors,
];

module.exports = {
  validateCompanyRegistration,
  validateCompanyLogin,
  validateJobCreation,
  validateJobUpdate,
  handleValidationErrors,
};
