const { supabase } = require("../config/supabase");
const { OAuth2Client } = require("google-auth-library");
const {
  hashPassword,
  comparePassword,
  generateToken,
  formatResponse,
} = require("../utils/helpers");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const twoFACodes = {}; // Existing 2FA for company deletion

// Temporary store for OTPs (In a real app, use a database with expiry and proper cleanup)
const otpStore = {};

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
      return res
        .status(400)
        .json(formatResponse(false, null, "Google ID token missing email."));
    }

    // Check if a company with this email already exists
    const { data: company, error } = await supabase
      .from("companies")
      .select("id, name, email, phone, country, is_verified, certificate_url, created_at")
      .eq("email", email)
      .maybeSingle();

    if (error || company === null) {
      // Company not found, or an error occurred during lookup
      console.error("Google login error: Company not found or DB error", error);
      return res.status(404).json(formatResponse(false, null, "No existing company account found with this Google email. Please register or use your existing login."));
    }

    // If company exists, generate JWT and return success
    const token = generateToken(company.id);
    const { password_hash, ...companyData } = company;

    // Check and update subscription status (non-blocking)
    const { checkAndUpdateSubscription } = require("../utils/pesapalSubscriptionCheck");
    checkAndUpdateSubscription(company.id);

    res.json(formatResponse(true, { company: companyData, token }, "Google login successful."));

  } catch (error) {
    console.error("Google login verification error:", error);
    res.status(500).json(formatResponse(false, null, "Failed to verify Google ID token or internal server error."));
  }
};

const sendOtpForPasswordReset = async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, message: "Phone number is required." });
  }

  // Check if user with this phone exists
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', phone)
    .maybeSingle();

  console.log(`Supabase user lookup for phone ${phone}:`, user, "Error:", userError);

  if (userError || !user) {
    console.error("User lookup failed or user not found:", userError || "User not found");
    return res.status(404).json({ success: false, message: "No account found with this phone number." });
  }

  // Generate a 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const expiryTime = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes

  otpStore[phone] = { otp, expiryTime, userId: user.id };
  console.log(`Generated OTP for ${phone}: ${otp}`);

  const message = `Your Jobpop password reset OTP is ${otp}. It is valid for 5 minutes.`;

  try {
    console.log(`Attempting to send SMS to ${phone} with message: ${message}`);
    await sendSMS(phone, message);
    console.log("SMS sent successfully.");
    res.json({ success: true, message: "OTP sent to your phone number." });
  } catch (error) {
    console.error("Error sending OTP SMS:", error.message);
    delete otpStore[phone]; // Clean up if SMS fails
    res.status(500).json({ success: false, message: "Failed to send OTP. Please try again." });
  }
};

const resetPasswordWithOtp = async (req, res) => {
  const { phone, otp, newPassword } = req.body;

  if (!phone || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: "Phone, OTP, and new password are required." });
  }

  const storedOtpData = otpStore[phone];

  if (!storedOtpData || storedOtpData.otp !== otp || Date.now() > storedOtpData.expiryTime) {
    delete otpStore[phone]; // Invalidate OTP after failed attempt or expiry
    return res.status(401).json({ success: false, message: "Invalid or expired OTP." });
  }

  // Hash the new password
  const hashedPassword = await hashPassword(newPassword);

  try {
    // Update password in Supabase for the user associated with this phone
    const { data, error } = await supabase
      .from('profiles')
      .update({ password: hashedPassword })
      .eq('phone', phone);

    if (error) throw error;

    delete otpStore[phone]; // Clean up after successful reset
    res.json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    console.error("Error resetting password:", error.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  googleLogin,
  sendOtpForPasswordReset,
  resetPasswordWithOtp,
};
