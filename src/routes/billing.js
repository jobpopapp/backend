const express = require("express");
const router = express.Router();
const billingController = require("../controllers/billingController");
const { authenticateToken } = require("../middleware/auth");

router.get("/", authenticateToken, billingController.getBillingAddress);
router.post("/", authenticateToken, billingController.upsertBillingAddress);

module.exports = router;
