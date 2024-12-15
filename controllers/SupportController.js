const Support = require("../models/support");

// POST: Create a new support request
exports.createSupportRequest = async (req, res) => {
  try {
    const { name, email, issueType, message,supportType } = req.body;

    // Create a new support request
    const supportRequest = new Support({
      name,
      email,
      issueType,
      message,
      supportType
    });

    await supportRequest.save();

    res.status(201).json({ success: true, data: supportRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// // GET: Get all support requests
// exports.getSupportRequests = async (req, res) => {
//   try {
//     const supportRequests = await Support.find().sort({ createdAt: -1 });
//     res.status(200).json({ success: true, data: supportRequests });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Server error", error });
//   }
// };

// GET: Get all support requests with optional pagination
exports.getSupportRequests = async (req, res) => {
  try {
    // Get page and limit from query parameters, and set default values if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate skip value to determine how many documents to skip
    const skip = (page - 1) * limit;

    // Fetch support requests with pagination and sorting by createdAt
    const supportRequests = await Support.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total number of support requests for pagination metadata
    const total = await Support.countDocuments();

    res.status(200).json({
      success: true,
      data: supportRequests,
      pagination: {
        total, // Total number of documents
        currentPage: page, // Current page number
        totalPages: Math.ceil(total / limit), // Total number of pages
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// DELETE: Delete a specific support request by ID
exports.deleteSupportRequest = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the support request exists
    const supportRequest = await Support.findById(id);
    if (!supportRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Support request not found" });
    }

    await supportRequest.remove();
    res.status(200).json({ success: true, message: "Support request deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};
