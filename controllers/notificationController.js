const Notification  = require('../models/notificationModel');
const notificationService = require('../helpers/notificationService');
const { initializeFirebaseAdmin } = require('../firebase/firebaseAdmin');

// // Create and Send Notification
exports.sendNotification = async (req, res) => {
  const {title, message, fcmToken, priority, metadata } = req.body;
  try {
    const notification = await Notification.create({
      userId:req.user._id,
      title,
      message,
      priority,
      metadata,
    });

    if (notification) {
      // Send FCM Notification
      await notificationService.sendMessage(title, message, fcmToken);
      res.status(201).json({ success: true, data: notification });
    } else {
      res.status(400).json({ success: false, message: 'Failed to create notification' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// exports.sendNotification = async (req, res) => {
//   const { title, message, priority, metadata } = req.body;

//   try {
//     // Example: Assuming the role is available in the request user object
//     const role = req.user.role; 
//     const fcmToken = req.user.fcm;
//     console.log("FCM_TOKEN",fcmToken);
//     console.log("ROLE",role);
    
//     // const firebaseAdmin = initializeFirebaseAdmin(role);

//     const notification = await Notification.create({
//       userId: req.user._id,
//       title,
//       message,
//       priority,
//       metadata,
//     });

//     if (notification) {
//       // Use Firebase Admin for sending notifications
//       await notificationService.sendMessage(title, message, fcmToken, initializeFirebaseAdmin(role));
//       res.status(201).json({ success: true, data: notification });
//     } else {
//       res.status(400).json({ success: false, message: "Failed to create notification" });
//     }
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

exports.getUserNotifications = async (req, res) => {
    try {
        // Fetch notifications for the user sorted by creation date (most recent first)
        const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });

        // Respond with the fetched notifications
        res.status(200).json({
            success: true,
            data: notifications,
        });
    } catch (error) {
        // Log the error and respond with a generic error message
        console.error("Error fetching notifications:", error);

        // Send a 500 error response to the client
        res.status(500).json({
            success: false,
            message: "Failed to fetch notifications. Please try again later.",
        });
    }
};

