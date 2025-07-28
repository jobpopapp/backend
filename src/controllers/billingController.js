const deleteBillingAddress = async (req, res) => {
  const companyId = req.body.company_id || req.query.company_id;
  if (!companyId) {
    return res
      .status(400)
      .json({ error: "company_id is required in body or query" });
  }
  console.log(`[Billing] DELETE billing address for company_id: ${companyId}`);
  const { data, error } = await supabase
    .from("billing_addresses")
    .delete()
    .eq("company_id", companyId);
  if (error) {
    console.error(
      `[Billing] Error deleting billing address for company_id: ${companyId}`,
      error
    );
    return res.status(500).json({ error: error.message });
  }
  res.json({ success: true, data });
};
const { supabase } = require("../config/supabase");

const getBillingAddress = async (req, res) => {
  const companyId = req.query.company_id || (req.user && req.user.id);
  if (!companyId) {
    return res
      .status(400)
      .json({ error: "company_id is required as query param" });
  }
  console.log(`[Billing] GET billing address for company_id: ${companyId}`);
  const { data, error } = await supabase
    .from("billing_addresses")
    .select("*")
    .eq("company_id", companyId)
    .single();

  if (error && error.code !== "PGRST116") {
    // Ignore 'not found' error
    console.error(
      `[Billing] Error fetching billing address for company_id: ${companyId}`,
      error
    );
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
};

const upsertBillingAddress = async (req, res) => {
  const companyId = req.body.company_id;
  console.log(
    `[Billing] UPSERT billing address for company_id: ${companyId} with data:`,
    req.body
  );
  const { ...addressData } = req.body;

  const { data, error } = await supabase
    .from("billing_addresses")
    .upsert(
      { ...addressData, company_id: companyId },
      { onConflict: "company_id" }
    );

  if (error) {
    console.error(
      `[Billing] Error upserting billing address for company_id: ${companyId}`,
      error
    );
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
};

module.exports = {
  getBillingAddress,
  upsertBillingAddress,
  deleteBillingAddress,
};
