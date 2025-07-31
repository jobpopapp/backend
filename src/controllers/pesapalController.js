const axios = require("axios");
const { supabase } = require("../config/supabase");

const PESAPAL_API = "https://pay.pesapal.com/v3/api";

// Get Pesapal Auth Token
const getAuthToken = async () => {
  try {
    const res = await axios.post(`${PESAPAL_API}/Auth/RequestToken`, {
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    });
    console.log(
      "[Pesapal Auth] Token received successfully. Pesapal Response Data:",
      JSON.stringify(res.data, null, 2)
    );
    return res.data.token;
  } catch (error) {
    console.error(
      "[Pesapal Auth] Error:",
      error.response ? error.response.data : error.message
    );
    throw new Error("Could not authenticate with Pesapal");
  }
};

// Register IPN URL
exports.registerIpnUrl = async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "Missing url for IPN registration." });
  }

  let token;
  try {
    token = await getAuthToken();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  const ipnPayload = {
    url: url,
    ipn_notification_type: "POST",
  };

  try {
    const response = await axios.post(
      `${PESAPAL_API}/URLSetup/RegisterIPNURL`,
      ipnPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      message:
        "IPN URL registered successfully. Please save the ipn_id from the response and set it as PESAPAL_IPN_ID in your .env file.",
      data: response.data,
    });
  } catch (error) {
    console.error(
      "Pesapal IPN Registration Error:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to register IPN URL with Pesapal." });
  }
};

// Submit Order to Pesapal
exports.submitOrder = async (req, res) => {
  console.log("[Pesapal] Incoming submitOrder request body:", req.body);
  const { planType } = req.body;
  const companyId = req.companyId;

  // 1. Get Billing Address
  console.log(
    `[Pesapal] Fetching billing address for company_id: ${companyId}`
  );
  const { data: billingAddresses, error: addressError } = await supabase
    .from("billing_addresses")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (addressError) {
    console.error(
      `[Pesapal] Error fetching billing address for company_id: ${companyId}`,
      addressError
    );
    return res
      .status(500)
      .json({ error: "Could not retrieve billing address." });
  }

  const billingAddress =
    billingAddresses && billingAddresses.length > 0
      ? billingAddresses[0]
      : null;

  if (!billingAddress) {
    console.warn(
      `[Pesapal] No billing address found for company_id: ${companyId}`
    );
    return res
      .status(400)
      .json({ error: "Billing address not found. Please create one first." });
  }

  // 2. Get Plan Details from database
  const { data: planData, error: planError } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("id", planType)
    .single();

  if (planError || !planData) {
    console.error("Error fetching plan:", planError);
    return res.status(400).json({ error: "Invalid subscription plan." });
  }

  const plan = {
    amount: planData.price,
    description: planData.description,
    // Always use 'USH' for Pesapal
    currency: "UGX",
  };

  // 3. Get Pesapal Token
  let token;
  try {
    token = await getAuthToken();
    console.log(
      "[Pesapal] Backend authenticated with Pesapal. JWT Token:",
      token
    );
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  // 4. Construct Order Payload
  const orderPayload = {
    id: `JOBPOP-${companyId}-${Date.now()}`,
    currency: plan.currency, // 'USH'
    amount: parseFloat(plan.amount).toFixed(2),
    description: plan.description,
    callback_url: process.env.PESAPAL_CALLBACK_URL,
    redirect_mode: "", // Add as per Pesapal docs
    notification_id: process.env.PESAPAL_IPN_ID, // Get this from your Pesapal dashboard
    branch: "", // Add as per Pesapal docs, or set to your store/branch name
    billing_address: {
      email_address: billingAddress.email_address,
      phone_number: billingAddress.phone_number,
      country_code: billingAddress.country_code,
      first_name: billingAddress.first_name,
      middle_name: billingAddress.middle_name,
      last_name: billingAddress.last_name,
      line_1: billingAddress.line_1,
      line_2: billingAddress.line_2,
      city: billingAddress.city,
      state: billingAddress.state,
      postal_code: billingAddress.postal_code,
      zip_code: billingAddress.zip_code,
    },
  };

  // 5. Submit Order
  try {
    console.log(
      "[Pesapal] Submitting order to Pesapal with payload:",
      orderPayload
    );
    const response = await axios.post(
      `${PESAPAL_API}/Transactions/SubmitOrderRequest`,
      orderPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    // Log the full Axios response for debugging
    console.log("[Pesapal] Axios full response:", {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
    });

    // 6. Save transaction details for reconciliation
    await supabase.from("subscriptions").insert([
      {
        company_id: companyId,
        plan_type: planType,
        pesapal_tracking_id: response.data.order_tracking_id, // Use order_tracking_id
        status: "PENDING",
      },
    ]);

    res.json(response.data);
  } catch (error) {
    console.error(
      "[Pesapal] Order Submission Error:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to submit order to Pesapal." });
  }
};
