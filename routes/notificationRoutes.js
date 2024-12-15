// routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

// Send Notification Route
router.post('/send',protect, notificationController.sendNotification);
router.get('/get-all-notifications', protect,notificationController.getUserNotifications);


module.exports = router;
