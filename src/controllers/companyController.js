const { supabase } = require("../config/supabase");
const { formatResponse } = require("../utils/helpers");
const fs = require("fs").promises;
const path = require("path");

// Upload certificate
const uploadCertificate = async (req, res) => {
  try {
    const companyId = req.companyId;

    if (!req.file) {
      return res
        .status(400)
        .json(formatResponse(false, null, "No file uploaded"));
    }

    const file = req.file;
    const fileName = `certificates/${companyId}/${file.filename}`;

    // Read the file
    const fileBuffer = await fs.readFile(file.path);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("company-documents")
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // Clean up local file
      await fs.unlink(file.path).catch(console.error);
      return res
        .status(500)
        .json(formatResponse(false, null, "Failed to upload certificate"));
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from("company-documents")
      .getPublicUrl(fileName);

    // Update company record with certificate URL
    const { data: company, error: updateError } = await supabase
      .from("companies")
      .update({
        certificate_url: urlData.publicUrl,
      })
      .eq("id", companyId)
      .select(
        "id, name, email, phone, country, is_verified, certificate_url, created_at"
      )
      .single();

    if (updateError) {
      console.error("Update company error:", updateError);
      // Clean up local file
      await fs.unlink(file.path).catch(console.error);
      return res
        .status(500)
        .json(formatResponse(false, null, "Failed to update company record"));
    }

    // Clean up local file
    await fs.unlink(file.path).catch(console.error);

    res.json(
      formatResponse(
        true,
        {
          company,
          certificateUrl: urlData.publicUrl,
        },
        "Certificate uploaded successfully. Your company is now under review."
      )
    );
  } catch (error) {
    console.error("Upload certificate error:", error);

    // Clean up local file if it exists
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }

    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

// Get company information
const getCompanyInfo = async (req, res) => {
  try {
    const company = req.company;

    // Remove password hash from response
    const { password_hash, ...companyData } = company;

    // Get subscription status
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("company_id", company.id)
      .eq("is_active", true)
      .gte("end_date", new Date().toISOString())
      .single();

    // Get job count
    const { count: jobCount, error: jobError } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("company_id", company.id);

    if (jobError) {
      console.error("Job count error:", jobError);
    }

    res.json(
      formatResponse(
        true,
        {
          company: companyData,
          subscription: subscription || null,
          jobCount: jobCount || 0,
          status: {
            isVerified: company.is_verified,
            hasActiveSubscription: !!subscription,
            canPostJobs: company.is_verified && !!subscription,
          },
        },
        "Company information retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Get company info error:", error);
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

// Get verification status
const getVerificationStatus = async (req, res) => {
  try {
    const company = req.company;

    let statusMessage = "";
    let canUploadCertificate = false;
    let nextSteps = [];

    if (!company.certificate_url) {
      statusMessage =
        "Please upload your Certificate of Incorporation to proceed with verification.";
      canUploadCertificate = true;
      nextSteps = ["Upload Certificate of Incorporation"];
    } else if (!company.is_verified) {
      statusMessage =
        "Your certificate has been uploaded and is under review. We will notify you once verified.";
      nextSteps = ["Wait for admin approval", "Check email for updates"];
    } else {
      statusMessage =
        "Your company has been verified! You can now purchase a subscription to start posting jobs.";
      nextSteps = ["Purchase subscription", "Start posting jobs"];
    }

    res.json(
      formatResponse(
        true,
        {
          isVerified: company.is_verified,
          hasCertificate: !!company.certificate_url,
          certificateUrl: company.certificate_url,
          statusMessage,
          canUploadCertificate,
          nextSteps,
        },
        "Verification status retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Get verification status error:", error);
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

module.exports = {
  uploadCertificate,
  getCompanyInfo,
  getVerificationStatus,
};
