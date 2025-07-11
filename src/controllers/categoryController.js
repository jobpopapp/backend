const { supabase } = require("../config/supabase");
const { formatResponse } = require("../utils/helpers");

// List all categories
const listCategories = async (req, res) => {
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
  } catch (err) {
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

// Create a new category
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res
        .status(400)
        .json(formatResponse(false, null, "Category name is required"));
    }
    const { data, error } = await supabase
      .from("categories")
      .insert([{ name, description }])
      .select("*")
      .single();
    if (error) {
      return res
        .status(500)
        .json(formatResponse(false, null, "Failed to create category"));
    }
    res
      .status(201)
      .json(
        formatResponse(
          true,
          { category: data },
          "Category created successfully"
        )
      );
  } catch (err) {
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

// Update a category
const updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name, description } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (description) updates.description = description;
    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json(formatResponse(false, null, "No valid fields to update"));
    }
    const { data, error } = await supabase
      .from("categories")
      .update(updates)
      .eq("id", categoryId)
      .select("*")
      .single();
    if (error) {
      return res
        .status(500)
        .json(formatResponse(false, null, "Failed to update category"));
    }
    res.json(
      formatResponse(true, { category: data }, "Category updated successfully")
    );
  } catch (err) {
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

// Delete a category
const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId);
    if (error) {
      return res
        .status(500)
        .json(formatResponse(false, null, "Failed to delete category"));
    }
    res.json(formatResponse(true, null, "Category deleted successfully"));
  } catch (err) {
    res.status(500).json(formatResponse(false, null, "Internal server error"));
  }
};

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
