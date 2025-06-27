import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import http from "http"; // ✅ Needed to create server for Socket.io
import { Server } from "socket.io";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import requestRoutes from "./routes/request.js";
import offerRoutes from "./routes/offer.js";
import match from "./routes/match.js";
import messageRoutes from "./routes/message.js";
import googleAuthRoutes from "./routes/googleAuth.js";
import emailRoutes from "./routes/email.js";
import adminRoutes from "./routes/admin.js"; // Add admin routes
import passport from "passport";
import "./config/passport.js"; // 👈 initialize passport config

// Import BullMQ queue system
import { startWorkers } from "./queues/workers.js";
import { createBullBoardRouter } from "./queues/dashboard.js";
import {
  urgentNotificationQueue,
  donorMatchingQueue,
  emailQueue,
  smsQueue,
} from "./queues/config.js";

// Config
dotenv.config();
console.log("🔄 Starting Blood Donor API...");
console.log("📊 Environment:", process.env.NODE_ENV || "development");
console.log(
  "️ Mongo URI:",
  process.env.MONGO_URI ? "✅ Configured" : "❌ Missing"
);

const app = express();

// Create server for `socket`.io
const server = http.createServer(app);

// ✅ Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Store io instance so we can use it in routes
app.set("io", io);

// Store queue instances so we can use them in routes
app.set("urgentNotificationQueue", urgentNotificationQueue);
app.set("donorMatchingQueue", donorMatchingQueue);
app.set("emailQueue", emailQueue);
app.set("smsQueue", smsQueue);

io.on("connection", (socket) => {
  console.log("🧠 New client connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);

    // Get room users and emit to room
    const room = io.sockets.adapter.rooms.get(roomId);
    const users = room ? Array.from(room).map((id) => ({ id })) : [];
    io.to(roomId).emit("room-users", users);
  });

  socket.on("leave-room", (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.id} left room: ${roomId}`);

    // Update room users after leaving
    const room = io.sockets.adapter.rooms.get(roomId);
    const users = room ? Array.from(room).map((id) => ({ id })) : [];
    io.to(roomId).emit("room-users", users);
  });

  socket.on("send-message", (data) => {
    const { roomId, message } = data;
    socket.to(roomId).emit("receive-message", message);
    console.log(
      `Message sent to room ${roomId}:`,
      message.text?.substring(0, 50) + "..."
    );
  });

  socket.on("typing", (data) => {
    const { roomId, userId, name, isTyping } = data;
    socket.to(roomId).emit("user-typing", { userId, name, isTyping });
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Mount Bull Board dashboard (before other routes)
try {
  const { router: bullBoardRouter } = createBullBoardRouter();
  app.use("/admin/queues", bullBoardRouter);
  console.log("✅ Bull Board dashboard mounted at /admin/queues");
} catch (err) {
  console.error("❌ Bull Board dashboard error:", err);
  console.log("⚠️ Continuing without queue dashboard...");
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/request", requestRoutes);
app.use("/api/offer", offerRoutes);
app.use("/api/match", match);
app.use("/api/message", messageRoutes);
app.use("/api/google-auth", googleAuthRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/admin", adminRoutes); // Add admin routes
app.use(passport.initialize());

// MongoDB connection
const connectDB = async () => {
  console.log("🔄 Starting database connection...");
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("✅ MongoDB connected");
    } else {
      console.log("⚠️ No MONGO_URI provided, running without database");
    }
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    console.log("⚠️ Continuing without database connection...");
  }
  // Always try to start workers (even if DB fails)
  console.log("🔄 Starting queue workers...");
  try {
    startWorkers();
    console.log("✅ BullMQ workers started");
  } catch (err) {
    console.error("❌ BullMQ workers error:", err);
    console.log("⚠️ Continuing without queue workers...");
  }
};

// Connect to database
connectDB();

// Sample route
app.get("/", (req, res) =>
  res.send("Blood Donor API is working - Queue Dashboard: /admin/queues")
);

// Start server
export { io }; // optional, in case needed elsewhere

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
