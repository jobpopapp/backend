const express = require("express");
const router = express.Router();
const billingController = require("../controllers/billingController");
const { authenticateToken } = require("../middleware/auth");

router.get("/", billingController.getBillingAddress);
router.post("/", billingController.upsertBillingAddress);
router.put("/:id", billingController.upsertBillingAddress);
router.delete("/", billingController.deleteBillingAddress);

module.exports = router;
