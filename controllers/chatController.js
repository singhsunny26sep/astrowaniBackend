const { updateSessionActivity } = require("../helpers/updateSessionActivity");
const Chat = require("../models/chatModel");
const Session = require("../models/sessionModel");
const userModel = require("../models/userModel");
const { logger } = require("../utils/logger/logger");

exports.getChatHistory = async (req, res) => {
  try {
    const { receiver } = req.query;
    const page = parseInt(req.query.page, 1) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const userId = req.user._id;
    // console.log("userId:", userId);
    const skip = (page - 1) * limit;

    const chatHistory = await Chat.find({ $or: [{ sender: userId, receiver }, { sender: receiver, receiver: userId },] }).sort({ createdAt: 1 }).skip(skip).limit(limit);
    const totalChats = await Chat.countDocuments({ $or: [{ sender: userId, receiver }, { sender: receiver, receiver: userId },] });
    res.status(200).json({ success: true, data: chatHistory, pagination: { totalChats, currentPage: page, totalPages: Math.ceil(totalChats / limit), }, });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ success: false, message: "Error fetching chat history" });
  }
};

exports.getChatHistoryUser = async (req, res) => {
  try {
    const { receiver, sessionId } = req.query;
    const userId = req.user._id;

    const matchCondition = {
      $or: [
        { sender: userId, receiver },
        { sender: receiver, receiver: userId }
      ]
    };

    if (sessionId) {
      matchCondition.sessionId = sessionId;
    }

    const chatHistory = await Chat.find(matchCondition).sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: chatHistory });
  } catch (error) {
    console.error("Error fetching chat getChatHistoryUser:", error);
    res.status(500).json({ success: false, message: "Error fetching chat history" });
  }
};


exports.getAllChatHistory = async (req, res) => {
  const astrologerId = req.user._id; // Assuming the logged-in astrologer's ID is in req.user._id
  console.log("astrologerId: ", astrologerId);

  try {
    // Find all chats where the astrologer is either the sender or receiver
    const chats = await Chat.find({ $or: [{ sender: astrologerId }, { receiver: astrologerId }], })
      .populate("sender", "name email firstName lastName profilePic") // Populate sender details
      .populate("receiver", "name email  firstName lastName profilePic") // Populate receiver details
      .exec();

    // Use a Map to extract unique users chatting with the astrologer
    /* const uniqueUsers = Array.from(
      chats.reduce((map, chat) => {
        const otherUser = chat.sender._id.toString() === astrologerId.toString() ? chat.receiver : chat.sender; // Identify the other party in the chat
        console.log("otherUser: ", otherUser);

        if (!map.has(otherUser?._id?.toString())) {
          map.set(otherUser?._id?.toString(), otherUser); // Add unique user to the Map
        }
        return map;
      }, new Map()).values()
    ); */
    const uniqueUsers = Array.from(
      chats.reduce((map, chat) => {
        const otherUser = chat.sender?._id?.toString() === astrologerId?.toString() ? chat.receiver : chat.sender;
        // ✅ Handle null and undefined values
        if (otherUser && otherUser._id && !map.has(otherUser._id.toString())) {
          map.set(otherUser._id.toString(), otherUser);
        }

        return map;
      }, new Map()).values()
    );

    console.log("uniqueUsers: ", uniqueUsers);

    return res.status(200).json({ success: true, message: "Unique users chatting with astrologer retrieved successfully.", data: uniqueUsers, });
  } catch (error) {
    console.error("Error on getAllChatHistory:", error);
    res.status(500).json({ success: false, message: error.message, error });
  }
};


exports.updateChatDetails = async (req, res, next) => {
  try {
    const { earnings, paid, status } = req.body;
    const chatId = req.params.chatId;

    const updatedChat = await Chat.findByIdAndUpdate(chatId, { earnings, paid, status }, { new: true, runValidators: true });

    if (!updatedChat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    res.status(200).json({ success: true, data: updatedChat, });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


exports.createChatMessage = async (req, res, next) => {
  const { sessionId, receiver, message } = req.body;
  const sender = req.user._id; // Assuming authenticated user's ID is the sender
  // const sender = "6728a2ab0729a58cf740fd74"
  try {
    const messageSize = message.length / 1024;
    const updateResult = await updateSessionActivity(sessionId, sender, messageSize);

    if (!updateResult.success) {
      return res.status(500).json({ message: "Failed to update session." });
    }

    if (updateResult.isPlanExceeded) {
      return res.status(403).json({ message: "Plan limits exceeded." });
    }
    // Fetch the receiver user by ID
    const user = await userModel.findById(receiver);
    if (!user) {
      return res.status(404).json({ success: false, message: "Receiver user not found", });
    }
    const newChat = await Chat.create({ sessionId, sender, receiver: user._id, message, });

    res.status(201).json({ success: true, data: newChat, });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
