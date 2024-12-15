// planRoutes.js
const express = require("express");
const router = express.Router();
const { createPlan, getAllPlans, getPlanById, updatePlan, deletePlan } = require("../controllers/plansController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Get all plans
router.get("/get-all-plans", getAllPlans);

router.use(protect, authorize('admin'));

// Create a new plan
router.post("/create-plans", createPlan);



// Get a single plan by ID
router.get("/:planId", getPlanById);

// Update a plan by ID
router.put("/:planId", updatePlan);

// Delete a plan by ID
router.delete("/:planId", deletePlan);

module.exports = router;
