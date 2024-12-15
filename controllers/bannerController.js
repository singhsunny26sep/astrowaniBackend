const Banner = require("../models/BannerModel");

// Get the current banner
exports.getCurrentBanner = async (req, res) => {
  try {
    const banner = await Banner.findOne({ isActive: true });
    if (!banner) {
      return res.status(404).json({ message: "No active banner found" });
    }
    res.status(200).json(banner);
  } catch (error) {
    console.error("Error fetching the current banner:", error);
    res.status(500).json({ message: "Failed to fetch banner" });
  }
};

// Create or update a banner
exports.setBanner = async (req, res) => {
  const { title, description, imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ message: "Image URL is required" });
  }

  try {
    // Deactivate existing banners
    await Banner.updateMany({ isActive: true }, { isActive: false });

    // Create a new banner
    const newBanner = new Banner({ title, description, imageUrl, isActive: true });
    await newBanner.save();

    res.status(201).json({
      message: "Banner set successfully",
      banner: newBanner,
    });
  } catch (error) {
    console.error("Error setting banner:", error);
    res.status(500).json({ message: "Failed to set banner" });
  }
};

// Delete a banner by ID
exports.deleteBanner = async (req, res) => {
  const { id } = req.params;

  try {
    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    res.status(200).json({
      message: "Banner deleted successfully",
      banner,
    });
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json({ message: "Failed to delete banner" });
  }
};

// Get all banners (for management) with optional pagination
exports.getAllBanners = async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10 if not provided
  
      // Convert to integers for pagination calculations
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);
  
      // Calculate skip value for pagination
      const skip = (pageNumber - 1) * limitNumber;
  
      // Fetch banners with pagination
      const banners = await Banner.find()
        .sort({ createdAt: -1 }) // Sort banners by most recent
        .skip(skip)
        .limit(limitNumber);
  
      // Total count for banners
      const totalBanners = await Banner.countDocuments();
  
      // Response with pagination details
      res.status(200).json({
        data: banners,
        totalBanners,
        totalPages: Math.ceil(totalBanners / limitNumber),
        currentPage: pageNumber,
        hasNextPage: pageNumber * limitNumber < totalBanners,
        hasPrevPage: pageNumber > 1,
      });
    } catch (error) {
      console.error("Error fetching all banners:", error);
      res.status(500).json({ message: "Failed to fetch banners" });
    }
  };
  