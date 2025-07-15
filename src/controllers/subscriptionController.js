const { supabase } = require("../config/supabase");
const webSocket = require("../utils/websocket");
const {
  formatResponse,
  generatePaymentReference,
  calculateSubscriptionEndDate,
  getSubscriptionPlanDetails,
} = require("../utils/helpers");

// Get subscription plans
const handlePaymentCallback = (req, res) => {
  // Your callback logic here
  res.sendStatus(200);
};

const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = [
      {
        id: "monthly",
        name: "Monthly Plan",
        description: "Post unlimited jobs for 30 days",
        price: 50,
        currency: "USD",
        duration: 30,
        features: [
          "Unlimited job postings",
          "Job management dashboard",
          "Email support",
          "30 days validity",
        ],
      },
      {
        id: "annual",
        name: "Annual Plan",
        description:
          "Post unlimited jobs for 365 days with significant savings",
        price: 500,
        currency: "USD",
        duration: 365,
        savings: 100,
        features: [
          "Unlimited job postings",
          "Job management dashboard",
          "Priority email support",
          "365 days validity",
          "Save $100 compared to monthly",
        ],
      },
      {
        id: "per_job",
        name: "Per Job Plan",
        description: "Pay only for the jobs you post",
        price: 30,
        currency: "USD",
        duration: null,
        features: [
          "Single job posting",
          "Job management dashboard",
          "Email support",
          "No expiry date",
        ],
      },
    ];

    res.json(
      formatResponse(
        true,
        { plans },
        "Subscription plans retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Get subscription plans error:", error);
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

// Get current subscription
const getCurrentSubscription = async (req, res) => {
  try {
    const companyId = req.companyId;

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Get subscription error:", error);
      return res
        .status(500)
        .json(formatResponse(false, null, "Failed to retrieve subscription"));
    }

    let status = "none";
    let daysRemaining = 0;
    let isActive = false;

    if (subscription) {
      const now = new Date();
      const endDate = new Date(subscription.end_date);
      isActive = subscription.is_active && endDate > now;

      if (isActive) {
        status = "active";
        daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      } else if (endDate <= now) {
        status = "expired";
      } else {
        status = "inactive";
      }
    }

    res.json(
      formatResponse(
        true,
        {
          subscription,
          status,
          isActive,
          daysRemaining,
        },
        "Subscription status retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Get current subscription error:", error);
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

// Pesapal IPN Callback
const handleCallback = async (req, res) => {
  const { OrderTrackingId, OrderNotificationType, OrderMerchantReference } =
    req.query;

  if (OrderNotificationType === "IPN") {
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .update({ status: "ACTIVE", pesapal_tracking_id: OrderTrackingId })
      .eq("pesapal_tracking_id", OrderMerchantReference)
      .select();

    if (error) {
      console.error("Error updating subscription:", error);
      return res.status(500).send("Error updating subscription");
    }

    webSocket.send({
      type: "SUBSCRIPTION_UPDATE",
      companyId: subscription[0].company_id,
      status: "ACTIVE",
    });

    res.status(200).send("Callback received");
  } else {
    res.redirect(
      `${process.env.FRONTEND_URL}/payment-complete?tracking_id=${OrderTrackingId}`
    );
  }
};

// Simulate successful payment (for testing)
const simulatePaymentSuccess = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { planType } = req.body;

    const planDetails = getSubscriptionPlanDetails(planType);
    if (!planDetails) {
      return res
        .status(400)
        .json(formatResponse(false, null, "Invalid subscription plan"));
    }

    const startDate = new Date();
    const endDate = calculateSubscriptionEndDate(planType, startDate);

    const subscriptionData = {
      company_id: companyId,
      plan_type: planType,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      is_active: true,
      auto_renew: false,
      pesapal_txn_id: `TEST-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    await supabase
      .from("subscriptions")
      .update({ is_active: false })
      .eq("company_id", companyId)
      .eq("is_active", true);

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .insert([subscriptionData])
      .select("*")
      .single();

    if (error) {
      console.error("Create subscription error:", error);
      return res
        .status(500)
        .json(formatResponse(false, null, "Failed to activate subscription"));
    }

    res.json(
      formatResponse(
        true,
        { subscription },
        "Test subscription activated successfully"
      )
    );
  } catch (error) {
    console.error("Simulate payment error:", error);
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

exports.handlePaymentCallback = (req, res) => {
  // Your callback logic here
  res.sendStatus(200);
};

module.exports = {
  getSubscriptionPlans,
  getCurrentSubscription,
  handleCallback,
  simulatePaymentSuccess,
  handlePaymentCallback,
};
