const { supabase } = require("../config/supabase");
const { formatResponse } = require("../utils/helpers");

// Get all jobs for the authenticated company
const getMyJobs = async (req, res) => {
  try {
    const companyId = req.companyId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const { count, error: countError } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    if (countError) {
      console.error("Count error:", countError);
      return res
        .status(500)
        .json(formatResponse(false, null, "Failed to get job count"));
    }

    // Get jobs with pagination
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Get jobs error:", error);
      return res
        .status(500)
        .json(formatResponse(false, null, "Failed to retrieve jobs"));
    }

    const totalPages = Math.ceil(count / limit);

    res.json(
      formatResponse(
        true,
        {
          jobs,
          pagination: {
            page,
            limit,
            total: count,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
        "Jobs retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Get my jobs error:", error);
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

// Create a new job
const createJob = async (req, res) => {
  try {
    const companyId = req.companyId;
    const {
      title,
      description,
      category_id,
      country,
      salary,
      deadline,
      is_foreign,
      email,
      phone,
      whatsapp,
      application_link,
    } = req.body;

    // Get company name for the job
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      return res
        .status(400)
        .json(formatResponse(false, null, "Company not found"));
    }

    // Create job data object
    const jobData = {
      title,
      job_description: description, // Map description to job_description for database
      category_id,
      country,
      deadline: new Date(deadline).toISOString(),
      company_id: companyId,
      company: company.name, // Add company name
      created_at: new Date().toISOString(),
    };

    // Add optional fields if provided
    if (salary) jobData.salary = salary;
    if (is_foreign !== undefined) jobData.is_foreign = is_foreign;
    if (email) jobData.email = email;
    if (phone) jobData.phone = phone;
    if (whatsapp) jobData.whatsapp = whatsapp;
    if (application_link) jobData.application_link = application_link;

    // Insert job into database
    const { data: job, error } = await supabase
      .from("jobs")
      .insert([jobData])
      .select("*")
      .single();

    if (error) {
      console.error("Create job error:", error);
      return res
        .status(500)
        .json(formatResponse(false, null, "Failed to create job"));
    }

    res
      .status(201)
      .json(formatResponse(true, { job }, "Job created successfully"));
  } catch (error) {
    console.error("Create job error:", error);
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

// Update an existing job
const updateJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const companyId = req.companyId;
    const {
      title,
      description,
      category_id,
      country,
      salary,
      deadline,
      is_foreign,
      email,
      phone,
      whatsapp,
      application_link,
    } = req.body;

    // Check if job exists and belongs to the company
    const { data: existingJob, error: checkError } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", jobId)
      .eq("company_id", companyId)
      .single();

    if (checkError || !existingJob) {
      return res
        .status(404)
        .json(formatResponse(false, null, "Job not found or access denied"));
    }

    // Build update object with only provided fields
    const updates = {};
    if (title) updates.title = title;
    if (description) updates.job_description = description; // Map description to job_description
    if (category_id) updates.category_id = category_id;
    if (country) updates.country = country;
    if (salary) updates.salary = salary;
    if (deadline) updates.deadline = new Date(deadline).toISOString();
    if (is_foreign !== undefined) updates.is_foreign = is_foreign;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    if (whatsapp) updates.whatsapp = whatsapp;
    if (application_link) updates.application_link = application_link;

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json(formatResponse(false, null, "No valid fields to update"));
    }

    // Update the job
    const { data: job, error } = await supabase
      .from("jobs")
      .update(updates)
      .eq("id", jobId)
      .eq("company_id", companyId)
      .select("*")
      .single();

    if (error) {
      console.error("Update job error:", error);
      return res
        .status(500)
        .json(formatResponse(false, null, "Failed to update job"));
    }

    res.json(formatResponse(true, { job }, "Job updated successfully"));
  } catch (error) {
    console.error("Update job error:", error);
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

// Delete a job
const deleteJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const companyId = req.companyId;

    // Check if job exists and belongs to the company
    const { data: existingJob, error: checkError } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", jobId)
      .eq("company_id", companyId)
      .single();

    if (checkError || !existingJob) {
      return res
        .status(404)
        .json(formatResponse(false, null, "Job not found or access denied"));
    }

    // Delete the job
    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", jobId)
      .eq("company_id", companyId);

    if (error) {
      console.error("Delete job error:", error);
      return res
        .status(500)
        .json(formatResponse(false, null, "Failed to delete job"));
    }

    res.json(formatResponse(true, null, "Job deleted successfully"));
  } catch (error) {
    console.error("Delete job error:", error);
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

// Get job categories
const getJobCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, description")
      .order("name", { ascending: true });
    if (error) {
      return res
        .status(500)
        .json(formatResponse(false, null, "Failed to fetch categories"));
    }
    res.json(
      formatResponse(
        true,
        { categories: data },
        "Categories retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

// Get a single job by ID
const getJobById = async (req, res) => {
  try {
    const jobId = req.params.id;
    const companyId = req.companyId;

    const { data: job, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("company_id", companyId)
      .single();

    if (error || !job) {
      return res
        .status(404)
        .json(formatResponse(false, null, "Job not found or access denied"));
    }

    res.json(formatResponse(true, { job }, "Job retrieved successfully"));
  } catch (error) {
    console.error("Get job by ID error:", error);
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

// Get job statistics for the authenticated company
const getJobStats = async (req, res) => {
  try {
    const companyId = req.companyId;

    // Get total jobs count
    const { count: totalJobs, error: totalError } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);

    if (totalError) {
      console.error("Total jobs count error:", totalError);
      return res
        .status(500)
        .json(formatResponse(false, null, "Failed to get job statistics"));
    }

    // Get jobs created this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const { count: monthlyJobs, error: monthlyError } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .gte("created_at", thisMonth.toISOString());

    if (monthlyError) {
      console.error("Monthly jobs count error:", monthlyError);
      return res
        .status(500)
        .json(
          formatResponse(false, null, "Failed to get monthly job statistics")
        );
    }

    // Get active jobs (not expired)
    const { count: activeJobs, error: activeError } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .gte("deadline", new Date().toISOString());

    if (activeError) {
      console.error("Active jobs count error:", activeError);
      return res
        .status(500)
        .json(
          formatResponse(false, null, "Failed to get active job statistics")
        );
    }

    const stats = {
      totalJobs: totalJobs || 0,
      monthlyJobs: monthlyJobs || 0,
      activeJobs: activeJobs || 0,
      expiredJobs: (totalJobs || 0) - (activeJobs || 0),
    };

    res.json(
      formatResponse(true, { stats }, "Job statistics retrieved successfully")
    );
  } catch (error) {
    console.error("Get job stats error:", error);
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

// Get all jobs (public route with pagination)
const getAllJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const { count, error: countError } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .gte("deadline", new Date().toISOString()); // Only active jobs

    if (countError) {
      console.error("Count error:", countError);
      return res
        .status(500)
        .json(formatResponse(false, null, "Failed to get job count"));
    }

    // Get jobs with pagination
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("*")
      .gte("deadline", new Date().toISOString()) // Only active jobs
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Get all jobs error:", error);
      return res
        .status(500)
        .json(formatResponse(false, null, "Failed to retrieve jobs"));
    }

    const totalPages = Math.ceil(count / limit);

    res.json(
      formatResponse(
        true,
        {
          jobs,
          pagination: {
            page,
            limit,
            total: count,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        },
        "Jobs retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Get all jobs error:", error);
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

module.exports = {
  getMyJobs,
  createJob,
  updateJob,
  deleteJob,
  getJobCategories,
  getJobById,
  getJobStats,
  getAllJobs,
};
