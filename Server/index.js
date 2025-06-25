import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import http from "http"; // ✅ Needed to create server for Socket.io
import { Server } from "socket.io";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import requestRoutes from "./routes/request.js";
import match from "./routes/match.js";
import messageRoutes from "./routes/message.js";
import googleAuthRoutes from "./routes/googleAuth.js";
import emailRoutes from "./routes/email.js";
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
const app = express();

// Create server for socket.io
const server = http.createServer(app);

// ✅ Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // Change this to your frontend URL in production
    methods: ["GET", "POST", "PUT", "DELETE"],
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
    console.log(`User joined room: ${roomId}`);
  });

  socket.on("send-message", (data) => {
    const { roomId, message } = data;
    socket.to(roomId).emit("receive-message", message);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// Mount Bull Board dashboard (before other routes)
const { router: bullBoardRouter } = createBullBoardRouter();
app.use("/admin/queues", bullBoardRouter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/request", requestRoutes);
app.use("/api/match", match);
app.use("/api/message", messageRoutes);
app.use("/api/google-auth", googleAuthRoutes);
app.use("/api/email", emailRoutes);
app.use(passport.initialize());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB connected");

    // Start BullMQ workers after database connection
    startWorkers();
    console.log("✅ BullMQ workers started");
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Sample route
app.get("/", (req, res) =>
  res.send("Blood Donor API is working - Queue Dashboard: /admin/queues")
);

// Start server
export { io }; // optional, in case needed elsewhere

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
