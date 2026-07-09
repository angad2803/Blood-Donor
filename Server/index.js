import express from "express";
import dotenv from "dotenv";
const dotenvResult = dotenv.config();
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
  const connectDB = async () => {
    console.log("🔄 Starting database connection...");

    // Diagnostic: dotenv loaded?
    console.log(
      "DOTENV LOADED:",
      dotenvResult && dotenvResult.parsed ? true : dotenvResult && dotenvResult.error ? `ERROR: ${dotenvResult.error.message}` : false,
    );

    // Accept multiple common env var names to avoid deployment mistakes
    const mongoUri =
      process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

    // Diagnostic: presence of MONGO_URI
    console.log("MONGO_URI present:", !!process.env.MONGO_URI);

    // Diagnostic: Node version and cwd
    console.log("Node version:", process.version);
    console.log("CWD:", process.cwd());

    // Helper: extract hostname only from Mongo URI without credentials
    const extractMongoHost = (uri) => {
      try {
        if (!uri) return null;
        // remove scheme
        let s = uri.replace(/^mongodb\+srv:\/\//i, "").replace(/^mongodb:\/\//i, "");
        // if credentials present, strip everything before '@'
        if (s.includes("@")) s = s.split("@").pop();
        // hostname is before the first '/'
        s = s.split("/")[0];
        // drop any query params
        s = s.split("?")[0];
        return s;
      } catch (e) {
        return null;
      }
    };

    const hostOnly = extractMongoHost(mongoUri);
    console.log("Mongo host (extracted, no creds):", hostOnly || "(none)");

    if (!mongoUri) {
      console.error("ERROR: MONGO_URI is undefined. Check Render Environment Variables.");
      throw new Error("MongoDB connection string missing");
    }

    try {
      // Use conservative timeouts to fail fast and provide useful diagnostics
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4, // prefer IPv4 — helps in some cloud DNS setups
      });

      console.log("MongoDB Connected");
      console.log("mongoose.connection.host:", mongoose.connection.host);
      console.log("mongoose.connection.name:", mongoose.connection.name);

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
      // Detailed diagnostics without leaking credentials
      console.error("MongoDB connection failed — diagnostics follows:");
      try {
        console.error("err.message:", err && err.message ? err.message : undefined);
        console.error("err.name:", err && err.name ? err.name : undefined);
        console.error("err.code:", err && err.code ? err.code : undefined);
        console.error("err.cause:", err && err.cause ? err.cause : undefined);
        console.error("err.reason:", err && err.reason ? err.reason : undefined);
        console.error("err.stack:", err && err.stack ? err.stack : undefined);
      } catch (inner) {
        console.error("Error while printing diagnostics:", inner);
      }

      try {
        console.error("Attempted Mongo host:", hostOnly || "(unknown)");
      } catch (e) {
        // ignore
      }

      console.error("Check: correct MONGO_URI in environment, Atlas user/credentials, DNS/SRV resolution, or network/DNS from host.");
      throw err; // Stop execution if DB connection fails
    }
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
