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
];

const getClientOrigins = () => {
  const configuredOrigins = (
    process.env.CLIENT_URLS ||
    process.env.CLIENT_URL ||
    ""
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configuredOrigins.length > 0
    ? configuredOrigins
    : DEFAULT_CLIENT_ORIGINS;
};

const clientOrigins = getClientOrigins();

console.log("🔄 Starting Blood Donor API...");
console.log("📊 Environment:", process.env.NODE_ENV || "development");
console.log(
  "️ Mongo URI:",
  process.env.MONGO_URI ? "✅ Configured" : "❌ Missing",
);

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: clientOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
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

  socket.on("send-message", (data) => {
    const { roomId, message } = data;

    io.to(roomId).emit("receive-message", message);

    console.log(
      `Message sent to room ${roomId}:`,
      message.text?.substring(0, 50) + "...",
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

app.use(
  cors({
    origin: clientOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
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
    try {
      console.log("Mongo Host:", mongoose.connection.host);
      console.log("Mongo DB:", mongoose.connection.name);
    } catch (e) {
      // ignore
    }

    try {
      const User = (await import("./models/User.js")).default;
      const BloodRequest = (await import("./models/BloodRequest.js")).default;
      const Offer = (await import("./models/Offer.js")).default;

      console.log("Users:", await User.countDocuments());
      console.log("Requests:", await BloodRequest.countDocuments());
      console.log("Offers:", await Offer.countDocuments());
    } catch (err) {
      console.error("Error fetching counts:", err);
    }
  } catch (err) {
    // Provide diagnostics without leaking credentials
    console.error(
      "❌ MongoDB connection error:",
      err && err.message ? err.message : err,
    );
    try {
      // Try to extract host from SRV URI safely
      const host = mongoUri.replace(/^mongodb\+srv:\/\//, "").split("/")[0];
      console.error("Attempted Mongo host:", host);
    } catch (e) {
      // ignore
    }
    console.error(
      "Check: correct MONGO_URI in environment, Atlas user/credentials, DNS/SRV resolution, or network/DNS from host.",
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
