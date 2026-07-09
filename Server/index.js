import "dotenv/config";
import express from "express";

// (Removed temporary network instrumentation)
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import requestRoutes from "./routes/request.js";
import offerRoutes from "./routes/offer.js";
import match from "./routes/match.js";
import messageRoutes from "./routes/message.js";
import emailRoutes from "./routes/email.js";
import adminRoutes from "./routes/admin.js";
import aiRoutes from "./routes/ai.js";
import passport from "passport";
import "./config/passport.js";

import { startWorkers } from "./queues/workers.js";
import { createBullBoardRouter } from "./queues/dashboard.js";
import { requireAdmin } from "./middleware/adminAuth.js";
import {
  urgentNotificationQueue,
  donorMatchingQueue,
  emailQueue,
  smsQueue,
} from "./queues/config.js";
const DEFAULT_CLIENT_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://blood-donor-smoky.vercel.app",
];

const getClientOrigins = () => {
  const configuredOrigins = (
    process.env.CLIENT_URLS ||
    process.env.CLIENT_URL ||
    ""
  )
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, "")) // Remove trailing slash
    .filter(Boolean);

  return [...new Set([...DEFAULT_CLIENT_ORIGINS, ...configuredOrigins])];
};

const clientOrigins = getClientOrigins();

console.log("✅ Allowed CORS Origins:", clientOrigins);

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no Origin (Postman, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, "");

    console.log("🌐 Incoming Origin:", normalizedOrigin);

    if (clientOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.log("❌ Blocked Origin:", normalizedOrigin);

    return callback(
      new Error(`Origin ${normalizedOrigin} not allowed by CORS`),
    );
  },

  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

// Startup

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions,
});

app.set("io", io);

app.set("urgentNotificationQueue", urgentNotificationQueue);
app.set("donorMatchingQueue", donorMatchingQueue);
app.set("emailQueue", emailQueue);
app.set("smsQueue", smsQueue);

io.on("connection", (socket) => {
  console.log("🧠 New client connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);

    const room = io.sockets.adapter.rooms.get(roomId);
    const users = room ? Array.from(room).map((id) => ({ id })) : [];
    io.to(roomId).emit("room-users", users);
  });

  socket.on("leave-room", (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.id} left room: ${roomId}`);

    const room = io.sockets.adapter.rooms.get(roomId);
    const users = room ? Array.from(room).map((id) => ({ id })) : [];
    io.to(roomId).emit("room-users", users);
  });

  socket.on("typing", (data) => {
    const { roomId, userId, name, isTyping } = data;
    socket.to(roomId).emit("user-typing", { userId, name, isTyping });
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

try {
  const { router: bullBoardRouter } = createBullBoardRouter();
  app.use("/admin/queues", requireAdmin, bullBoardRouter);
  console.log("✅ Bull Board dashboard mounted at /admin/queues (admin-only)");
} catch (err) {
  console.error("❌ Bull Board dashboard error:", err);
  console.log("⚠️ Continuing without queue dashboard...");
}

app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/request", requestRoutes);
app.use("/api/offer", offerRoutes);
app.use("/api/match", match);
app.use("/api/message", messageRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);

const connectDB = async () => {
  console.log("🔄 Starting database connection...");

  // Accept multiple common env var names to avoid deployment mistakes
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL;

  if (!mongoUri) {
    console.error(
      "❌ No MongoDB connection string found. Set MONGO_URI (or MONGODB_URI / DATABASE_URL) in your environment.",
    );
    throw new Error("MongoDB connection string missing");
  }

  try {
    // Use conservative timeouts to fail fast and provide useful diagnostics
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // prefer IPv4 — helps in some cloud DNS setups
    });

    console.log("✅ MongoDB connected");
  } catch (err) {
    // Provide a concise error message
    console.error(
      "❌ MongoDB connection error:",
      err && err.message ? err.message : err,
    );
    throw err; // Stop execution if DB connection fails
  }

  console.log("🔄 Starting queue workers...");
  try {
    startWorkers();
    console.log("✅ BullMQ workers started");
  } catch (err) {
    console.error("❌ BullMQ workers error:", err);
    console.log("⚠️ Continuing without queue workers...");
  }
};

app.get("/", (req, res) =>
  res.send("Blood Donor API is working - Queue Dashboard: /admin/queues"),
);

export { io };

const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`Server running on ${PORT}`));
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
