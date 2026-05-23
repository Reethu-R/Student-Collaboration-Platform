const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const groupRoutes = require("./routes/groups");
const messageRoutes = require("./routes/messages");
const pollRoutes = require("./routes/polls");
const resourceRoutes = require("./routes/resources");
const analyticsRoutes = require("./routes/analytics");
const announcementRoutes = require("./routes/announcements");
const contributionRoutes = require("./routes/contributions");
const aiRoutes = require("./routes/ai");
const { verifyToken } = require("./middleware/auth");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] } });

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/groups", verifyToken, groupRoutes);
app.use("/api/messages", verifyToken, messageRoutes);
app.use("/api/polls", verifyToken, pollRoutes);
app.use("/api/resources", verifyToken, resourceRoutes);
app.use("/api/analytics", verifyToken, analyticsRoutes);
app.use("/api/announcements", verifyToken, announcementRoutes);
app.use("/api/contributions", verifyToken, contributionRoutes);
app.use("/api/ai", verifyToken, aiRoutes);

const Message = require("./models/Message");
const User = require("./models/User");
const onlineUsers = new Map();

// Whiteboard state per group
const whiteboards = new Map();

io.on("connection", (socket) => {
  socket.on("user_online", ({ userId, username }) => {
    onlineUsers.set(userId, { username, socketId: socket.id });
    io.emit("online_users", Array.from(onlineUsers.keys()));
  });

  socket.on("join_room", (groupId) => {
    socket.join(groupId);
    // Send existing whiteboard state
    if (whiteboards.has(groupId)) {
      socket.emit("whiteboard_state", whiteboards.get(groupId));
    }
  });

  socket.on("leave_room", (groupId) => socket.leave(groupId));

  socket.on("typing", ({ groupId, username, isTyping }) => {
    socket.to(groupId).emit("user_typing", { username, isTyping });
  });

  socket.on("send_message", async (data) => {
    try {
      const { groupId, message, userId, username } = data;
      const newMessage = await Message.create({ group: groupId, sender: userId, senderName: username, content: message });
      // Update user points
      await User.findByIdAndUpdate(userId, { $inc: { points: 2 }, lastActive: new Date() });
      io.to(groupId).emit("receive_message", {
        _id: newMessage._id, content: newMessage.content,
        senderName: newMessage.senderName, sender: newMessage.sender, createdAt: newMessage.createdAt,
      });
    } catch (err) { console.error(err); }
  });

  socket.on("pin_message", ({ groupId, message, pinnedBy }) => {
    io.to(groupId).emit("message_pinned", { message, pinnedBy });
  });

  socket.on("new_announcement", ({ groupId, announcement }) => {
    io.to(groupId).emit("receive_announcement", announcement);
  });

  // Whiteboard events
  socket.on("whiteboard_draw", ({ groupId, drawData }) => {
    if (!whiteboards.has(groupId)) whiteboards.set(groupId, []);
    whiteboards.get(groupId).push(drawData);
    socket.to(groupId).emit("whiteboard_draw", drawData);
  });

  socket.on("whiteboard_clear", ({ groupId }) => {
    whiteboards.set(groupId, []);
    io.to(groupId).emit("whiteboard_cleared");
  });

  // Voice/Video signaling
  socket.on("call_user", ({ groupId, signal, callerId, callerName }) => {
    socket.to(groupId).emit("incoming_call", { signal, callerId, callerName, socketId: socket.id });
  });

  socket.on("accept_call", ({ signal, to }) => {
    io.to(to).emit("call_accepted", signal);
  });

  socket.on("end_call", ({ groupId }) => {
    socket.to(groupId).emit("call_ended");
  });

  socket.on("disconnect", () => {
    for (const [userId, data] of onlineUsers.entries()) {
      if (data.socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit("online_users", Array.from(onlineUsers.keys()));
        break;
      }
    }
  });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
  })
  .catch((err) => console.error("MongoDB error:", err));
