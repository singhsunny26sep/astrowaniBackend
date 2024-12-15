const express = require("express");
const connectDB = require("./config/dbConnection.js");
const userRoutes = require("./routes/userRoutes.js");
const categoryRoutes = require("./routes/categoryRoutes.js");
const blogRoutes = require("./routes/blogRoutes.js");
const astrologerRoutes = require("./routes/astrologerRoutes.js");
const reviewRoutes = require("./routes/reviewRoutes.js");
const supportRoutes = require("./routes/supportRoutes.js");
const callHistoryRoutes = require("./routes/callHistoryRoutes.js");
const favoriteAstrologerRoutes = require("./routes/favoriteAstrologerRoutes");
const vendorRoutes = require("./routes/vendorRoutes.js");
const sessionRoutes = require("./routes/sessionRoutes.js");
const appointmentRoutes = require('./routes/appointmentRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const walletRoutes = require('./routes/walletRoutes.js');
const notificationRoutes = require('./routes/notificationRoutes');
const thoughtRoutes = require('./routes/thoughtRoutes.js');
const plansRoutes = require('./routes/plansRoutes');
const bannerRoutes = require('./routes/bannerRoutes.js');
const navgrahRoutes = require('./routes/navgrahRoutes.js');
const horoscopeRoutes = require('./routes/horoscopeRoutes.js');
const chatRoutes = require('./routes/chatRoutes.js');
const feedbackRoutes = require('./routes/feedbackRoutes.js');
const astrologerRequestRoutes = require('./routes/astrologerRequestRoutes.js');
const freeServicesRoutes = require("./routes/FreeServices/freeServicesRoutes.js");
const astroServicesRoutes = require("./routes/astroServices/astroServicesRoutes.js");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const chatModel = require("./models/chatModel.js");
const { protect, socketAuthenticator } = require("./middleware/authMiddleware.js");
const enquiryRouter = require("./routes/enquiry.js");

const app = express();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});
// Connect to database
connectDB();

// Use CORS middleware
app.use(cors());
// Middleware
app.use(express.json());

// Routes
app.use("/api/blogs", blogRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/astrologers", astrologerRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/favoriteAstrologer", favoriteAstrologerRoutes);
app.use("/api/free-services", freeServicesRoutes);
app.use("/api/astro-services", astroServicesRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/call", callHistoryRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/sessions", sessionRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/thoughts', thoughtRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/navgrah', navgrahRoutes);
app.use('/api/horoscopes', horoscopeRoutes);
app.use('/api/astrologer-requests', astrologerRequestRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/enquiry", enquiryRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Something went wrong" });
});

const PORT = process.env.PORT || 5000;

app.get("/", async (req, res) => {
  res.send("ASTROLOGY APP");
});

// Middleware for WebSocket Authentication
io.use((socket, next) => {
  socketAuthenticator(socket, next);
});


// io.on("connection", (socket) => {
//   console.log(`Socket-Id: ${socket.id}`);
//   console.log(`User connected: ${socket.user.email}`);
//   // console.log(`User: ${socket.user}`);

//   // Join a chat session room
//   socket.on("joinSession", (sessionId) => {
//     socket.join(sessionId);
//     console.log(`User ${socket.user.email} joined session ${sessionId}`);
//   });

//   // Handle sending messages
//   socket.on("sendMessage", async ({ sessionId,receiver, message }) => {
//     if (!sessionId || !receiver || !message) {
//       return console.error("Invalid sessionId, receiver, or message");
//     }
//     try {
//       const chat = new chatModel({
//         sessionId,
//         sender: socket.user.id,
//         receiver,
//         message,
//       });
//       await chat.save();

//       // Broadcast the message to all users in the session room
//       io.to(sessionId).emit("receiveMessage", chat);
//     } catch (error) {
//       console.error("Error saving chat message:", error);
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log(`User disconnected: ${socket.user.email}`);
//   });
// });

// Generate room ID
const generateRoomId = (user1, user2) => {
  return [user1, user2].sort().join('_');
};

// Endpoint to get or create room
app.post('/api/getRoomId', protect, (req, res) => {
  const { recipientId } = req.body;

  if (!recipientId) {
    return res.status(400).json({ success: false, message: 'User IDs are required' });
  }
  const userId = req.user._id
  const roomId = generateRoomId(userId, recipientId);
  res.status(200).json({ success: true, roomId });
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined users room-id ${roomId}`);
  });

  // Handle message
  socket.on("sendMessage", async ({ roomId, sessionId, receiver, message }) => {
    if (!receiver || !message) {
      return console.error("Invalid receiverId, or message");
    }
    try {
      const chat = new chatModel({
        sessionId,
        sender: socket.user.id,
        receiver,
        message,
      });
      await chat.save();

      // Broadcast the message to all users in the session room
      io.to(roomId).emit("receiveMessage", chat);
    } catch (error) {
      console.error("Error saving chat message:", error);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});


// Replace app.listen with httpServer.listen
httpServer.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
