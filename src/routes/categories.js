const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const {
  authenticateToken,
  requireVerification,
} = require("../middleware/auth");

// Public: List all categories
router.get("/", categoryController.listCategories);

// Protected: Create, update, delete categories (admin only, add admin middleware if needed)
router.post(
  "/",
  authenticateToken,
  requireVerification,
  categoryController.createCategory
);
router.put(
  "/:id",
  authenticateToken,
  requireVerification,
  categoryController.updateCategory
);
router.delete(
  "/:id",
  authenticateToken,
  requireVerification,
  categoryController.deleteCategory
);

module.exports = router;
