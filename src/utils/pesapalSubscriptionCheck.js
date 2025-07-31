const axios = require("axios");
const { supabase } = require("../config/supabase");
const PESAPAL_API = "https://pay.pesapal.com/v3/api";

// Helper to get Pesapal Auth Token
const getPesapalToken = async () => {
  const res = await axios.post(`${PESAPAL_API}/Auth/RequestToken`, {
    consumer_key: process.env.PESAPAL_CONSUMER_KEY,
    consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
  });
  return res.data.token;
};

// Check and update subscription status after login
const checkAndUpdateSubscription = async (companyId) => {
  // Get the subscription for this company (only one row per company_id)
  const { data: sub, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("company_id", companyId)
    .single();
  if (
    error ||
    !sub ||
    !sub.pesapal_txn_id ||
    sub.transactionstatus !== "pending"
  )
    return;

  // Get Pesapal token
  let token;
  try {
    token = await getPesapalToken();
  } catch (e) {
    console.error("[Pesapal] Auth error during subscription check", e);
    return;
  }

  // Call Pesapal GetTransactionStatus
  try {
    const resp = await axios.get(
      `${PESAPAL_API}/Transactions/GetTransactionStatus?orderTrackingId=${sub.pesapal_txn_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    const status = resp.data.payment_status_description;
    const statusCode = resp.data.status_code;
    if (resp.status === 200 && (status === "COMPLETED" || statusCode === 1)) {
      // Update subscription
      await supabase
        .from("subscriptions")
        .update({
          is_active: true,
          transactionstatus: "complete",
          redirect_url: "",
        })
        .eq("id", sub.id);
    }
  } catch (e) {
    console.error("[Pesapal] Error checking/updating subscription status", e);
  }
};

module.exports = { checkAndUpdateSubscription };
