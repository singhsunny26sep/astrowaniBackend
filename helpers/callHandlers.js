const admin = require("firebase-admin");
const notificationService = require("../helpers/notificationService");
const Session = require("../models/sessionModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const CallHistory = require("../models/CallHistory");
const Astrologer = require("../models/astrologerModel");

const vcxroom = require("../enableX/vcxroom");
// const generateAgoraToken = require("./agoraToken");

const creatToken = (body) => {
  try {
    console.log(body);
    vcxroom.getToken(body, async (status, data) => {
      console.log(data, "token data");
      return data;
    });
  } catch (error) {
    console.error(error);
  }
};

// Initiate a call
const initiateCall = async (req, res) => {
  try {
    const { receiverId, callType, roomId } = req.body;
    const callerId = req.user._id;
    const callerRole = req.user.role;

    // Validate call type
    if (!["video", "voice"].includes(callType)) {
      return res.status(400).json({
        success: false,
        message: "Call type must be either video or voice",
      });
    }

    // Determine astrologer and client based on caller's role
    let astrologerId, clientId;
    let astrologer;

    if (callerRole === "customer") {
      clientId = callerId;
      astrologerId = receiverId;

      astrologer = await Astrologer.findOne({
        userId: receiverId,
        isAvailable: true,
      });

      if (!astrologer) {
        return res.status(404).json({
          success: false,
          message: "Astrologer not found or is currently unavailable",
        });
      }

      if (callType === "video" && !astrologer.isCallEnabled) {
        return res.status(400).json({
          success: false,
          message: "Video calls are not enabled for this astrologer",
        });
      }

      if (callType === "voice" && !astrologer.isChatEnabled) {
        return res.status(400).json({
          success: false,
          message: "Voice calls are not enabled for this astrologer",
        });
      }
    } else if (callerRole === "astrologer") {
      astrologerId = callerId;
      clientId = receiverId;

      const customer = await User.findOne({
        _id: receiverId,
        role: "customer",
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      astrologer = await Astrologer.findOne({ _id: callerId });
    } else {
      return res.status(403).json({
        success: false,
        message: "Only customers and astrologers can initiate calls",
      });
    }

    // Check for active calls with proper error handling
    let activeCallerSession = await Session.findOne({
      $or: [{ clientId: callerId }, { astrologerId: callerId }],
      status: "ongoing",
      endTime: null,
    }).lean();

    let activeReceiverSession = await Session.findOne({
      $or: [{ clientId: receiverId }, { astrologerId: receiverId }],
      status: "ongoing",
      endTime: null,
    }).lean();

    // Auto-end any stale sessions that are more than 2 hours old
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    if (activeCallerSession && activeCallerSession.startTime < twoHoursAgo) {
      await Session.findByIdAndUpdate(activeCallerSession._id, {
        status: "completed",
        endTime: new Date(),
      });
      activeCallerSession = null;
    }

    if (
      activeReceiverSession &&
      activeReceiverSession.startTime < twoHoursAgo
    ) {
      await Session.findByIdAndUpdate(activeReceiverSession._id, {
        status: "completed",
        endTime: new Date(),
      });
      activeReceiverSession = null;
    }

    // Now check for active sessions after cleaning up stale ones
    if (activeCallerSession) {
      return res.status(400).json({
        success: false,
        message: "You already have an active call",
      });
    }

    if (activeReceiverSession) {
      return res.status(400).json({
        success: false,
        message: "Receiver is currently in another call",
      });
    }

    // Generate call credentials
    const credentials = {
      channelName: `${Date.now()}`,
      uid: `${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
    };
    // Generate Agora token
    // const token = generateAgoraToken(credentials.channelName, credentials.uid);

    const data = {
      name: req.user.firstName || "Guest",
      role: "moderator",
      user_ref: callerId.toString(),
      roomId: roomId,
    };

    const token = creatToken(data);
    // Create session record
    const session = await Session.create({
      sessionType: callType === "video" ? "videoCall" : "audioCall",
      astrologerId,
      clientId,
      startTime: new Date(),
      status: "ongoing",
    });

    // Get receiver's FCM token
    const receiver = await User.findById(receiverId);
    if (!receiver?.fcm) {
      await Session.findByIdAndUpdate(session._id, {
        status: "failed",
        endTime: new Date(),
      });
      return res.status(400).json({
        success: false,
        message: "Receiver is not available for calls",
      });
    }

    // Send FCM notification
    const title = `Incoming ${callType} Call`;
    const message = `${req.user.firstName || "Someone"} is calling you`;

    await notificationService.sendCallMessage(title, message, receiver.fcm, {
      channelName: credentials.channelName,
      uid: credentials.uid,
      callType,
      sessionId: session._id.toString(),
      type: "call_invitation",
      callerName: req.user.firstName || "",
      callerRole: callerRole,
      roomId,
      receiverId,
    });

    // Create notification record
    await Notification.create({
      userId: receiverId,
      title,
      message,
      metadata: {
        sessionId: session._id,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        ...credentials,
        callType,
        sessionId: session._id,
        receiver: {
          name: receiver.firstName,
          role: receiver.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Call initiation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to initiate call",
    });
  }
};

// End a call
const endCall = async (req, res) => {
  try {
    const { sessionId, duration, rating, feedback } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "Session ID is required", });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found", });
    }

    if (session.status !== "ongoing") {
      return res.status(400).json({ success: false, message: "Call is not ongoing", });
    }
    const astrologer = await Astrologer.findOne({
      userId: session.astrologerId,
    });
    console.log(astrologer.callChargePerMinute);

    // Calculate call charges
    const callDuration = duration || Math.ceil((Date.now() - session.startTime) / 60000); // in minutes
    const totalCharge = callDuration * astrologer.callChargePerMinute;
    console.log(totalCharge);

    // Update session
    session.status = "completed";
    session.endTime = new Date();
    session.duration = callDuration;
    session.totalCharge = totalCharge;

    if (rating) session.rating = rating;
    if (feedback) session.feedback = feedback;
    await session.save();

    // Create call history record
    await CallHistory.create({
      astrologerId: session.astrologerId,
      clientId: session.clientId,
      callStartTime: session.startTime,
      callEndTime: session.endTime,
      callDuration,
      callStatus: "completed",
      rating,
      comments: feedback,
    });

    astrologer.callCount = astrologer.callCount + 1;

    await astrologer.save()

    // Notify users about call completion
    const users = await User.find({
      _id: { $in: [session.astrologerId, session.clientId] },
    });

    for (const user of users) {
      if (user.fcm) {
        const title = "Call Ended";
        const message = `Call duration: ${callDuration} minutes`;

        await notificationService.sendCallMessage(title, message, user.fcm, {
          type: "call_ended",
          sessionId: sessionId.toString(),
          duration: callDuration.toString(),
          totalCharge: totalCharge.toString(),
        });
      }
    }

    res.status(200).json({ success: true, data: { duration: callDuration, totalCharge, sessionId: session._id, }, });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to end call", });
  }
};
// Handle missed call
const handleMissedCall = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "Session ID is required", });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found", });
    }

    if (session.status !== "ongoing") {
      return res.status(400).json({ success: false, message: "Call is not ongoing", });
    }

    const astrologer = await Astrologer.findOne({
      userId: session.astrologerId,
    });

    // Update session
    session.status = "missed";
    session.endTime = new Date();
    await session.save();

    // Create call history record
    await CallHistory.create({
      astrologerId: session.astrologerId,
      clientId: session.clientId,
      callStartTime: session.startTime,
      callEndTime: session.endTime,
      callStatus: "missed",
    });

    astrologer.callCount = astrologer.callCount + 1;

    await astrologer.save()

    // Notify client about missed call
    const client = await User.findById(session.clientId);
    if (client?.fcm) {
      const title = "Missed Call";
      const message = "The astrologer was unavailable";

      await notificationService.sendCallMessage(title, message, client.fcm, {
        type: "missed_call",
        sessionId: sessionId.toString(),
      });
    }

    res.status(200).json({ success: true, message: "Missed call handled successfully", });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to handle missed call", });
  }
};

const acceptCall = async (req, res) => {
  try {
    const { sessionId, receiverId, roomId } = req.body;

    // Fetch session details
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Generate token for User 2
    const data = {
      name: req.user.firstName || "Guest",
      role: "participant",
      user_ref: receiverId.toString(),
      roomId: roomId,
    };

    const token = creatToken(data);

    res.status(200).json({
      success: true,
      data: {
        roomId,
        sessionId: session._id,
        token,
      },
    });
  } catch (error) {
    console.error("Call acceptance error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to accept call",
    });
  }
};

module.exports = {
  initiateCall,
  acceptCall,
  endCall,
  handleMissedCall,
};
