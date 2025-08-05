const { supabase } = require("../config/supabase");

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

exports.deleteCompany = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true, message: "Company deleted successfully" });
  } catch (error) {
    console.error("Error deleting company:", error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
