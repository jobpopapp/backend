const { supabase } = require("../config/supabase");
const { OAuth2Client } = require('google-auth-library');
const {
  hashPassword,
  comparePassword,
  generateToken,
  formatResponse,
} = require("../utils/helpers");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Register a new company
const register = async (req, res) => {
  try {
    const { name, email, phone, country, password } = req.body;

    // Check if company already exists
    const { data: existingCompany } = await supabase
      .from("companies")
      .select("id")
      .eq("email", email)
      .single();

    if (existingCompany) {
      return res
        .status(409)
        .json(
          formatResponse(false, null, "Company with this email already exists")
        );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert new company
    const { data: company, error } = await supabase
      .from("companies")
      .insert([
        {
          name,
          email,
          phone,
          country,
          password_hash: hashedPassword,
          is_verified: false,
          created_at: new Date().toISOString(),
        },
      ])
      .select("id, name, email, phone, country, is_verified, created_at")
      .single();

    if (error) {
      console.error("Registration error:", error);
      return res
        .status(500)
        .json(formatResponse(false, null, "Failed to register company"));
    }

    // Generate JWT token
    const token = generateToken(company.id);

    res.status(201).json(
      formatResponse(
        true,
        {
          company,
          token,
        },
        "Company registered successfully. Please upload your certificate for verification."
      )
    );
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

// Login company
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find company by email
    const { data: company, error } = await supabase
      .from("companies")
      .select(
        "id, name, email, phone, country, password_hash, is_verified, certificate_url, created_at"
      )
      .eq("email", email)
      .single();

    if (error || !company) {
      return res
        .status(401)
        .json(formatResponse(false, null, "Invalid email or password"));
    }

    // Verify password
    const isValidPassword = await comparePassword(
      password,
      company.password_hash
    );
    if (!isValidPassword) {
      return res
        .status(401)
        .json(formatResponse(false, null, "Invalid email or password"));
    }

    // Generate JWT token
    const token = generateToken(company.id);

    // Remove password hash from response
    const { password_hash, ...companyData } = company;

    // Check and update subscription status (non-blocking)
    const {
      checkAndUpdateSubscription,
    } = require("../utils/pesapalSubscriptionCheck");
    checkAndUpdateSubscription(company.id);

    res.json(
      formatResponse(
        true,
        {
          company: companyData,
          token,
        },
        "Login successful"
      )
    );
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

// Get current company profile
const getProfile = async (req, res) => {
  try {
    const company = req.company;

    // Remove password hash from response
    const { password_hash, ...companyData } = company;

    res.json(
      formatResponse(
        true,
        { company: companyData },
        "Profile retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

// Update company profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, country } = req.body;
    const companyId = req.companyId;

    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (country) updates.country = country;

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json(formatResponse(false, null, "No valid fields to update"));
    }

    const { data: company, error } = await supabase
      .from("companies")
      .update(updates)
      .eq("id", companyId)
      .select(
        "id, name, email, phone, country, is_verified, certificate_url, created_at"
      )
      .single();

    if (error) {
      console.error("Update profile error:", error);
      return res
        .status(500)
        .json(formatResponse(false, null, "Failed to update profile"));
    }

    res.json(formatResponse(true, { company }, "Profile updated successfully"));
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload?.email;

    if (!email) {
      return res.status(400).json(formatResponse(false, null, "Google ID token missing email."));
    }

    // Check if a company with this email already exists
    const { data: company, error } = await supabase
      .from("companies")
      .select("id, name, email, phone, country, is_verified, certificate_url, created_at")
      .eq("email", email)
      .single();

    if (error || !company) {
      // Company not found, or an error occurred during lookup
      console.error("Google login error: Company not found or DB error", error);
      return res.status(404).json(formatResponse(false, null, "No existing company account found with this Google email. Please register or use your existing login."));
    }

    // If company exists, generate JWT and return success
    const token = generateToken(company.id);
    const { password_hash, ...companyData } = company; // Remove password hash

    // Check and update subscription status (non-blocking)
    const { checkAndUpdateSubscription } = require("../utils/pesapalSubscriptionCheck");
    checkAndUpdateSubscription(company.id);

    res.json(formatResponse(true, { company: companyData, token }, "Google login successful."));

  } catch (error) {
    console.error("Google login verification error:", error);
    res.status(500).json(formatResponse(false, null, "Failed to verify Google ID token or internal server error."));
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  googleLogin,
};
