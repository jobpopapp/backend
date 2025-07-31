// Backend endpoint for verifying payment and updating subscription
// Place this in your subscriptionController.js or a similar controller

// GET /api/subscription/verify-payment?orderTrackingId=xxxx
exports.verifyPayment = async (req, res) => {
  const { orderTrackingId } = req.query;
  if (!orderTrackingId) {
    return res.status(400).json({ error: "Missing orderTrackingId" });
  }

  try {
    // 1. Get Pesapal Auth Token
    const token = await getAuthToken();
    // 2. Call Pesapal GetTransactionStatus
    const response = await axios.get(
      `${PESAPAL_API}/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    const status = response.data.payment_status_description;
    const statusCode = response.data.status_code;
    // 3. Update subscription if payment is complete
    let updatedSub = null;
    if (status === "COMPLETED" || statusCode === 1) {
      const { data } = await supabase
        .from("subscriptions")
        .update({
          is_active: true,
          transactionstatus: "complete",
          redirect_url: "",
        })
        .eq("pesapal_txn_id", orderTrackingId)
        .select("*")
        .single();
      updatedSub = data;
    } else {
      // Just fetch the current subscription row
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("pesapal_txn_id", orderTrackingId)
        .single();
      updatedSub = data;
    }
    res.json(updatedSub);
  } catch (error) {
    console.error(
      "[VerifyPayment] Error:",
      error.response ? error.response.data : error.message
    );
    res
      .status(500)
      .json({ error: "Failed to verify payment or update subscription." });
  }
};
