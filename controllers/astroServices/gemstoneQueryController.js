const GemstoneQuery = require("../../models/astroServices/gemstoneQuery");

// Create a new query
exports.createGemstoneQuery = async (req, res) => {
  try {
    const { userId, gemstoneId, queryType, message } = req.body;

    const newQuery = new GemstoneQuery({
      userId:req.user._id,
      gemstoneId,
      queryType,
      message,
    });

    const savedQuery = await newQuery.save();

    res.status(201).json({
      success: true,
      message: "Query submitted successfully.",
      data: savedQuery,
    });
  } catch (error) {
    console.error("Error creating gemstone query:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit query.",
    });
  }
};

// Get all queries
exports.getAllQueries = async (req, res) => {
  try {
    const queries = await GemstoneQuery.find().populate("userId gemstoneId");
    res.status(200).json({
      success: true,
      data: queries,
    });
  } catch (error) {
    console.error("Error fetching queries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch queries.",
    });
  }
};

// Get queries by user
exports.getQueriesByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const userQueries = await GemstoneQuery.find({ userId }).populate("gemstoneId");

    res.status(200).json({
      success: true,
      data: userQueries,
    });
  } catch (error) {
    console.error("Error fetching user's queries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch queries for user.",
    });
  }
};

// Update query
exports.updateQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response } = req.body;

    const updatedQuery = await GemstoneQuery.findByIdAndUpdate(
      id,
      {
        status,
        response,
        respondedAt: response ? new Date() : undefined,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Query updated successfully.",
      data: updatedQuery,
    });
  } catch (error) {
    console.error("Error updating query:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update query.",
    });
  }
};

// Delete a query
exports.deleteQuery = async (req, res) => {
  try {
    const { id } = req.params;

    await GemstoneQuery.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Query deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting query:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete query.",
    });
  }
};
