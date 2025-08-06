const { supabase } = require("../config/supabase");
const { sendSMS } = require("../utils/sms");
require('dotenv').config();

// Temporary store for 2FA codes (In a real app, use a database with expiry)
const twoFACodes = {};

exports.getCompanies = async (req, res) => {
  try {
    const { data, error } = await supabase.from("companies").select("*");
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching companies:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.getCompanyById = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from("companies").select("*").eq("id", id).single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Company not found" });
    res.json(data);
  } catch (error) {
    console.error("Error fetching company by ID:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateCompanyProfile = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, country } = req.body;
  try {
    const { data, error } = await supabase.from("companies").update({ name, email, phone, country }).eq("id", id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error updating company profile:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.updateCompanyVerification = async (req, res) => {
  const { id } = req.params;
  const { is_verified } = req.body;
  try {
    const { data, error } = await supabase.from("companies").update({ is_verified }).eq("id", id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error updating company verification status:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const adminEmails = ['jobpopapp@gmail.com', 'admin@jobpop.app'];

    // 1. Total number of user profiles (companies, excluding admins)
    const { data: allCompanies, error: allCompaniesError } = await supabase
      .from("companies")
      .select("id, email");
    if (allCompaniesError) throw allCompaniesError;

    const nonAdminCompanies = allCompanies.filter(company => !adminEmails.includes(company.email));
    const totalCompanies = nonAdminCompanies.length;

    // 2. Number of active subscribers (companies with active subscriptions)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: activeSubscriptions, error: activeSubscriptionsError } = await supabase
      .from("subscriptions")
      .select("company_id")
      .eq("is_active", true)
      .gte("end_date", todayStart.toISOString());
    if (activeSubscriptionsError) throw activeSubscriptionsError;

    const activeSubscriberCompanyIds = new Set(activeSubscriptions.map(sub => sub.company_id));
    const activeSubscribers = activeSubscriberCompanyIds.size;

    // 3. Number of inactive subscribers (total non-admin companies - active subscribers)
    const inactiveSubscribers = totalCompanies - activeSubscribers;

    res.json({
      success: true,
      data: {
        totalCompanies,
        activeSubscribers,
        inactiveSubscribers,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.createSubscriptionPlan = async (req, res) => {
  try {
    const { data, error } = await supabase.from("subscription_plans").insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error("Error creating subscription plan:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.updateSubscriptionPlan = async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };
  // Map 'popular' from frontend to 'is_popular' for database
  if (typeof updateData.popular !== 'undefined') {
    updateData.is_popular = updateData.popular;
    delete updateData.popular;
  }
  try {
    const { data, error } = await supabase.from("subscription_plans").update(updateData).eq("id", id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error updating subscription plan:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.deleteSubscriptionPlan = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from("subscription_plans").delete().eq("id", id);
    if (error) throw error;
    res.status(204).json({ success: true, message: "Plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting subscription plan:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.getSubscriptions = async (req, res) => {
  try {
    const { data, error } = await supabase.from("subscriptions").select("*, companies(name)");
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching subscriptions:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.getSubscriptionById = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from("subscriptions").select("*").eq("id", id).single();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: "Subscription not found" });
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching subscription by ID:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.updateSubscription = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase.from("subscriptions").update(req.body).eq("id", id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error updating subscription:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.initiateCompanyDelete2FA = async (req, res) => {
  const { companyId } = req.body;
  const directorNumber = process.env.DIRECTORNUMBER;

  if (!directorNumber) {
    console.error("DIRECTORNUMBER not set in .env file");
    return res.status(500).json({ success: false, message: "Server configuration error: Director number not set." });
  }

  // Fetch company name
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("name")
    .eq("id", companyId)
    .single();

  if (companyError || !company) {
    console.error("Error fetching company for 2FA:", companyError ? companyError.message : "Company not found");
    return res.status(404).json({ success: false, message: "Company not found or error fetching company details." });
  }

  const companyName = company.name;

  // Generate a random 4-digit code
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const expiryTime = Date.now() + 5 * 60 * 1000; // Code valid for 5 minutes

  // Store the code temporarily
  twoFACodes[companyId] = { code, expiryTime };
  console.log(`Generated 2FA code for company ${companyId}: ${code}`);

  const message = `Jobpop Admin: Your 2FA code for deleting company '${companyName}' is ${code}. This code is valid for 5 minutes.`;

  try {
    await sendSMS(directorNumber, message);
    res.json({ success: true, message: "2FA code sent to director's number." });
  } catch (error) {
    console.error("Error sending 2FA SMS:", error.message);
    delete twoFACodes[companyId]; // Clean up if SMS fails
    res.status(500).json({ success: false, message: "Failed to send 2FA code. Please try again." });
  }
};

exports.deleteCompany = async (req, res) => {
  const { id } = req.params;
  const { code } = req.body; // Expecting the 2FA code in the request body

  // Retrieve stored code
  const storedCodeData = twoFACodes[id];

  if (!storedCodeData || storedCodeData.code !== code || Date.now() > storedCodeData.expiryTime) {
    delete twoFACodes[id]; // Invalidate code after failed attempt or expiry
    return res.status(401).json({ success: false, message: "Invalid or expired 2FA code." });
  }

  // If code is valid, proceed with deletion
  try {
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) throw error;
    delete twoFACodes[id]; // Clean up after successful deletion
    res.json({ success: true, message: "Company deleted successfully" });
  } catch (error) {
    console.error("Error deleting company:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
