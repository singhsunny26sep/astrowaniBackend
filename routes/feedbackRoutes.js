const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect)

// Feedback Routes
router.post("/", feedbackController.createFeedback); 
router.get("/", feedbackController.getAllFeedback); 

router.get("/top-rated", feedbackController.getTopRatedFeedback);

router.get("/:id", feedbackController.getFeedbackById); 
router.put("/:id", feedbackController.updateFeedback); 
router.delete("/:id", feedbackController.deleteFeedback); 


module.exports = router;
