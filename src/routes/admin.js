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

// Analytics Routes
router.get("/analytics", authenticateToken, isAdmin, adminController.getAnalytics);

// Subscription Plan Management Routes
router.post("/subscription-plans", authenticateToken, isAdmin, adminController.createSubscriptionPlan);
router.put("/subscription-plans/:id", authenticateToken, isAdmin, adminController.updateSubscriptionPlan);
router.delete("/subscription-plans/:id", authenticateToken, isAdmin, adminController.deleteSubscriptionPlan);

// Subscription Management Routes
router.get("/subscriptions", authenticateToken, isAdmin, adminController.getSubscriptions);
router.put("/subscriptions/:id", authenticateToken, isAdmin, adminController.updateSubscription);

module.exports = router;
