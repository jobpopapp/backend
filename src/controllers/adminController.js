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
