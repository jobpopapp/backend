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
        .json(
          formatResponse(
            false,
            null,
            "No file uploaded. Please select a certificate file."
          )
        );
    }

    const file = req.file;

    // Additional validation
    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      // Clean up local file
      await fs.unlink(file.path).catch(console.error);
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            null,
            "Invalid file type. Please upload PDF, JPG, JPEG, or PNG files only."
          )
        );
    }

    // Generate unique filename with original name
    const timestamp = Date.now();
    const sanitizedOriginalName = file.originalname.replace(
      /[^a-zA-Z0-9.-]/g,
      "_"
    );
    const fileName = `certificates/${companyId}/${timestamp}_${sanitizedOriginalName}`;

    // Read the file
    const fileBuffer = await fs.readFile(file.path);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("company-documents")
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype,
        upsert: true,
        cacheControl: "3600", // Cache for 1 hour
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // Clean up local file
      await fs.unlink(file.path).catch(console.error);
      return res
        .status(500)
        .json(
          formatResponse(
            false,
            null,
            "Failed to upload certificate to storage. Please try again."
          )
        );
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from("company-documents")
      .getPublicUrl(fileName);

    // Update company record with certificate URL and additional metadata
    const { data: company, error: updateError } = await supabase
      .from("companies")
      .update({
        certificate_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", companyId)
      .select(
        "id, name, email, phone, country, is_verified, certificate_url, created_at, updated_at"
      )
      .single();

    if (updateError) {
      console.error("Update company error:", updateError);
      // Clean up local file
      await fs.unlink(file.path).catch(console.error);
      return res
        .status(500)
        .json(
          formatResponse(
            false,
            null,
            "Failed to update company record. Please try again."
          )
        );
    }

    // Clean up local file
    await fs.unlink(file.path).catch(console.error);

    res.json(
      formatResponse(
        true,
        {
          company,
          certificate: {
            url: urlData.publicUrl,
            originalName: file.originalname,
            size: file.size,
            uploadedAt: new Date().toISOString(),
          },
        },
        "Certificate uploaded successfully! Your company is now under review for verification."
      )
    );
  } catch (error) {
    console.error("Upload certificate error:", error);

    // Clean up local file if it exists
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }

    res
      .status(500)
      .json(
        formatResponse(
          false,
          null,
          "Internal server error during certificate upload."
        )
      );
  }
};

const uploadLicense = async (req, res) => {
  try {
    const companyId = req.companyId;

    if (!req.file) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            null,
            "No file uploaded. Please select a license file."
          )
        );
    }

    const file = req.file;

    // Additional validation
    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      // Clean up local file
      await fs.unlink(file.path).catch(console.error);
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            null,
            "Invalid file type. Please upload PDF, JPG, JPEG, or PNG files only."
          )
        );
    }

    // Generate unique filename with original name
    const timestamp = Date.now();
    const sanitizedOriginalName = file.originalname.replace(
      /[^a-zA-Z0-9.-]/g,
      "_"
    );
    const fileName = `licenses/${companyId}/${timestamp}_${sanitizedOriginalName}`;

    // Read the file
    const fileBuffer = await fs.readFile(file.path);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("company-documents")
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype,
        upsert: true,
        cacheControl: "3600", // Cache for 1 hour
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // Clean up local file
      await fs.unlink(file.path).catch(console.error);
      return res
        .status(500)
        .json(
          formatResponse(
            false,
            null,
            "Failed to upload license to storage. Please try again."
          )
        );
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from("company-documents")
      .getPublicUrl(fileName);

    // Update company record with license URL and additional metadata
    const { data: company, error: updateError } = await supabase
      .from("companies")
      .update({
        license_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", companyId)
      .select(
        "id, name, email, phone, country, is_verified, certificate_url, license_url, created_at, updated_at"
      )
      .single();

    if (updateError) {
      console.error("Update company error:", updateError);
      // Clean up local file
      await fs.unlink(file.path).catch(console.error);
      return res
        .status(500)
        .json(
          formatResponse(
            false,
            null,
            "Failed to update company record. Please try again."
          )
        );
    }

    // Clean up local file
    await fs.unlink(file.path).catch(console.error);

    res.json(
      formatResponse(
        true,
        {
          company,
          license: {
            url: urlData.publicUrl,
            originalName: file.originalname,
            size: file.size,
            uploadedAt: new Date().toISOString(),
          },
        },
        "License uploaded successfully!"
      )
    );
  } catch (error) {
    console.error("Upload license error:", error);

    // Clean up local file if it exists
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }

    res
      .status(500)
      .json(
        formatResponse(
          false,
          null,
          "Internal server error during license upload."
        )
      );
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

// Get certificate information
const getCertificateInfo = async (req, res) => {
  try {
    const companyId = req.companyId;

    const { data: company, error } = await supabase
      .from("companies")
      .select("certificate_url, is_verified, updated_at")
      .eq("id", companyId)
      .single();

    if (error) {
      console.error("Get certificate error:", error);
      return res
        .status(500)
        .json(
          formatResponse(
            false,
            null,
            "Failed to retrieve certificate information"
          )
        );
    }

    const certificateInfo = {
      hasUploadedCertificate: !!company.certificate_url,
      certificateUrl: company.certificate_url,
      isVerified: company.is_verified,
      lastUpdated: company.updated_at,
      verificationStatus: company.is_verified
        ? "verified"
        : company.certificate_url
        ? "pending_review"
        : "no_certificate",
    };

    res.json(
      formatResponse(
        true,
        { certificate: certificateInfo },
        "Certificate information retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Get certificate info error:", error);
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

// Delete/Remove certificate
const removeCertificate = async (req, res) => {
  try {
    const companyId = req.companyId;

    // Get current certificate URL to delete from storage
    const { data: company, error: getError } = await supabase
      .from("companies")
      .select("certificate_url")
      .eq("id", companyId)
      .single();

    if (getError) {
      console.error("Get company error:", getError);
      return res
        .status(500)
        .json(
          formatResponse(false, null, "Failed to retrieve company information")
        );
    }

    if (!company.certificate_url) {
      return res
        .status(404)
        .json(formatResponse(false, null, "No certificate found to remove"));
    }

    // Extract file path from URL for deletion
    const urlParts = company.certificate_url.split("/");
    const bucketPath = urlParts.slice(-3).join("/"); // Get certificates/companyId/filename

    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from("company-documents")
      .remove([bucketPath]);

    if (deleteError) {
      console.warn("Storage deletion warning:", deleteError);
      // Continue even if storage deletion fails
    }

    // Update company record to remove certificate URL
    const { data: updatedCompany, error: updateError } = await supabase
      .from("companies")
      .update({
        certificate_url: null,
        is_verified: false, // Reset verification status
        updated_at: new Date().toISOString(),
      })
      .eq("id", companyId)
      .select("id, name, email, is_verified, certificate_url")
      .single();

    if (updateError) {
      console.error("Update company error:", updateError);
      return res
        .status(500)
        .json(
          formatResponse(
            false,
            null,
            "Failed to remove certificate from records"
          )
        );
    }

    res.json(
      formatResponse(
        true,
        { company: updatedCompany },
        "Certificate removed successfully. You can upload a new one anytime."
      )
    );
  } catch (error) {
    console.error("Remove certificate error:", error);
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

module.exports = {
  uploadCertificate,
  uploadLicense,
  getCertificateInfo,
  removeCertificate,
  getCompanyInfo,
  getVerificationStatus,
};
