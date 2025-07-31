const { supabase } = require("../config/supabase");
const axios = require("axios");

const PESAPAL_API = "https://pay.pesapal.com/v3/api";

const getAuthToken = async () => {
  try {
    const res = await axios.post(`${PESAPAL_API}/Auth/RequestToken`, {
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    });
    return res.data.token;
  } catch (error) {
    console.error(
      "Pesapal Auth Error:",
      error.response ? error.response.data : error.message
    );
    throw new Error("Could not authenticate with Pesapal");
  }
};

const getTransactionStatus = async (orderTrackingId) => {
  const token = await getAuthToken();
  const response = await axios.get(
    `${PESAPAL_API}/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

exports.handleIpn = async (req, res) => {
  const { OrderTrackingId } = req.body;

  try {
    const transaction = await getTransactionStatus(OrderTrackingId);
    const { payment_status_description } = transaction;

    await supabase
      .from("subscriptions")
      .update({ status: payment_status_description })
      .eq("pesapal_tracking_id", OrderTrackingId);

    res.status(200).send("IPN received");
  } catch (error) {
    console.error("Error handling IPN:", error);
    res.status(500).send("Error handling IPN");
  }
};

exports.handleCallback = async (req, res) => {
  const { OrderTrackingId } = req.query;

  try {
    const transaction = await getTransactionStatus(OrderTrackingId);
    const { payment_status_description } = transaction;

    await supabase
      .from("subscriptions")
      .update({ status: payment_status_description })
      .eq("pesapal_tracking_id", OrderTrackingId);

    // Redirect to a new frontend route with payment status
    res.redirect(`${process.env.FRONTEND_URL}/subscription/payment-result?orderTrackingId=${OrderTrackingId}&status=${payment_status_description}`);
  } catch (error) {
    console.error("Error handling callback:", error);
    res.redirect(`${process.env.FRONTEND_URL}/subscription/payment-result?status=error`);
  }
};

// Get all subscription plans
exports.getSubscriptionPlans = async (req, res) => {
  const { data, error } = await supabase.from("subscription_plans").select("*");
  console.log("[SubscriptionPlans][DEBUG] Query result:", { data, error });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Get a single subscription plan
exports.getSubscriptionPlan = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return res.status(404).json({ error: "Plan not found" });
  res.json(data);
};

// Create a new subscription plan
exports.createSubscriptionPlan = async (req, res) => {
  const { data, error } = await supabase
    .from("subscription_plans")
    .insert([req.body]);
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
};

// Update a subscription plan
exports.updateSubscriptionPlan = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("subscription_plans")
    .update(req.body)
    .eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// Delete a subscription plan
exports.deleteSubscriptionPlan = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from("subscription_plans")
    .delete()
    .eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
};

// Get subscription status for a company
exports.getSubscriptionStatus = async (req, res) => {
  console.log("Received request to get subscription status");
  const companyId = req.companyId;
  const { data, error } = await supabase
    .from("subscriptions")
    .select("is_active, plan_type, pesapal_txn_id, start_date, end_date")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Always log the raw data and error for debugging
  console.log(
    `[Subscription][DEBUG] Query result for company_id ${companyId}:`,
    { data, error }
  );
  if (data) {
    console.log(
      `[Subscription][DEBUG] Raw is_active value:`,
      data.is_active,
      "Type:",
      typeof data.is_active
    );
  }

  if (error || !data) {
    // No subscription found, return is_active: false
    console.log(
      `[Subscription] Status for company_id ${companyId}: is_active = false`
    );
    return res.json({ is_active: false });
  }

  // Print the subscription status for the logged-in company
  console.log(`[Subscription] Status for company_id ${companyId}:`, {
    ...data,
    is_active: !!data.is_active,
  });

  // Return the subscription status, always include is_active
  res.json({
    ...data,
    is_active: !!data.is_active,
  });
};
