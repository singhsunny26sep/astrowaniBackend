const admin = require('../firebase/firebaseAdmin');
const Notification  = require('../models/notificationModel');

// Send FCM Message
exports.sendMessage = async (title, message, fcmToken) => {
  const messageData = {
    notification: {
      title: title,
      body: message,
    },
    token: fcmToken,
  };

  try {
    const response = await admin.messaging().send(messageData);
    console.log("Notification sent successfully: ", response);
  } catch (error) {
    console.error("Error sending notification: ", error);
    throw new Error('FCM Notification failed');
  }
};

// exports.sendMessage = async (title, message, fcmToken, firebaseAdmin) => {
//   console.log("TOKEN_FROM sendMessage",fcmToken);
//   console.log("ROLE FROM sendMessage",firebaseAdmin);
  
//   const messagePayload = {
//     notification: {
//       title,
//       body: message,
//     },
//     token: fcmToken,
//   };

//   try {
//     const response = await firebaseAdmin.messaging().send(messagePayload);
//     console.log("Notification sent successfully:", response);
//   } catch (error) {
//     console.error("Error sending notification:", error);
//     throw error;
//   }
// };


// Mark Notification as Read
exports.markAsRead = async (notificationId) => {
  try {
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
  } catch (error) {
    console.error("Error marking notification as read: ", error);
    throw new Error('Failed to update notification status');
  }
};
