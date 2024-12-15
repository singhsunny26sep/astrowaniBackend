const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");

// Category routes
router.post("/", categoryController.createCategory);
router.get("/", categoryController.getAllCategories);
router.get("/selection/category", categoryController.getCategoriesForSelection);
router.get("/:id", categoryController.getCategoryById);
router.put("/:id", categoryController.updateCategory);
router.delete("/:id", categoryController.deleteCategory);

module.exports = router;
