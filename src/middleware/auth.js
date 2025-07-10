const jwt = require("jsonwebtoken");
const config = require("../config");
const { supabase } = require("../config/supabase");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Get company details from database
    const { data: company, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", decoded.companyId)
      .single();

    if (error || !company) {
      return res.status(401).json({
        success: false,
        message: "Invalid token or company not found",
      });
    }

    // Add company info to request object
    req.company = company;
    req.companyId = company.id;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

const requireVerification = (req, res, next) => {
  if (!req.company.is_verified) {
    return res.status(403).json({
      success: false,
      message: "Company verification required. Please wait for admin approval.",
      code: "COMPANY_NOT_VERIFIED",
    });
  }
  next();
};

const requireActiveSubscription = async (req, res, next) => {
  try {
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("company_id", req.companyId)
      .eq("is_active", true)
      .gte("end_date", new Date().toISOString())
      .single();

    if (error || !subscription) {
      return res.status(403).json({
        success: false,
        message: "Active subscription required to perform this action.",
        code: "SUBSCRIPTION_REQUIRED",
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify subscription status",
    });
  }
};

module.exports = {
  authenticateToken,
  requireVerification,
  requireActiveSubscription,
};
