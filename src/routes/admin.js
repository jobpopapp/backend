const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticateToken } = require("../middleware/auth");

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
  // Assuming companyId is the user's ID from the authenticated token
  // In a real app, you'd fetch the user's role from the DB
  // For this task, we're using the hardcoded admin emails
  const adminEmails = ['jobpopapp@gmail.com', 'admin@jobpop.app'];
  const userEmail = req.company.email; // Assuming email is part of the authenticated token payload

  if (adminEmails.includes(userEmail)) {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Admin privileges required." });
  }
};

// Company Management Routes
router.get("/companies", authenticateToken, isAdmin, adminController.getCompanies);
router.get("/companies/:id", authenticateToken, isAdmin, adminController.getCompanyById);
router.put("/companies/:id", authenticateToken, isAdmin, adminController.updateCompanyProfile);
router.put("/companies/:id/verify", authenticateToken, isAdmin, adminController.updateCompanyVerification);

module.exports = router;
