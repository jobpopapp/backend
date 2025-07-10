const { supabase } = require("../config/supabase");
const {
  formatResponse,
  generatePaymentReference,
  calculateSubscriptionEndDate,
  getSubscriptionPlanDetails,
} = require("../utils/helpers");

// Get subscription plans
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

// Initiate subscription payment
const initiatePayment = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { planType } = req.body;

    // Validate plan type
    const planDetails = getSubscriptionPlanDetails(planType);
    if (!planDetails) {
      return res
        .status(400)
        .json(formatResponse(false, null, "Invalid subscription plan"));
    }

    // Generate payment reference
    const paymentReference = generatePaymentReference();

    // For now, we'll simulate payment initiation
    // In production, you would integrate with Pesapal API here
    const paymentData = {
      reference: paymentReference,
      amount: planDetails.cost,
      currency: "USD",
      plan_type: planType,
      plan_name: planDetails.name,
      company_id: companyId,
      payment_url: `https://sandbox.pesapal.com/payment/${paymentReference}`, // This would be from Pesapal
      status: "pending",
    };

    // Store payment intent in database (you might want to create a payments table)
    // For now, we'll just return the payment data

    res.json(
      formatResponse(
        true,
        {
          payment: paymentData,
          instructions: [
            "Click the payment URL to complete payment",
            "You will be redirected back to the dashboard after payment",
            "Your subscription will be activated automatically",
          ],
        },
        "Payment initiated successfully"
      )
    );
  } catch (error) {
    console.error("Initiate payment error:", error);
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

// Handle payment callback (webhook)
const handlePaymentCallback = async (req, res) => {
  try {
    // This would be called by Pesapal webhook
    const { reference, status, plan_type, company_id } = req.body;

    if (status === "completed" || status === "success") {
      // Payment successful, create or update subscription
      const planDetails = getSubscriptionPlanDetails(plan_type);
      const startDate = new Date();
      const endDate = calculateSubscriptionEndDate(plan_type, startDate);

      const subscriptionData = {
        company_id,
        plan_type,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: true,
        auto_renew: false,
        pesapal_txn_id: reference,
        created_at: new Date().toISOString(),
      };

      // Deactivate any existing active subscriptions
      await supabase
        .from("subscriptions")
        .update({ is_active: false })
        .eq("company_id", company_id)
        .eq("is_active", true);

      // Create new subscription
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
          "Subscription activated successfully"
        )
      );
    } else {
      res.json(formatResponse(false, null, "Payment failed or cancelled"));
    }
  } catch (error) {
    console.error("Payment callback error:", error);
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

// Simulate successful payment (for testing)
const simulatePaymentSuccess = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { planType } = req.body;

    // Validate plan type
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

    // Deactivate any existing active subscriptions
    await supabase
      .from("subscriptions")
      .update({ is_active: false })
      .eq("company_id", companyId)
      .eq("is_active", true);

    // Create new subscription
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

module.exports = {
  getSubscriptionPlans,
  getCurrentSubscription,
  initiatePayment,
  handlePaymentCallback,
  simulatePaymentSuccess,
};
