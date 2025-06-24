import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import http from "http"; // ✅ Needed to create server for Socket.io
import { Server } from "socket.io";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import requestRoutes from "./routes/request.js";
import matchRoutes from "./routes/match.js";
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

// Socket events
io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/request", requestRoutes);
api.use("/api/match", matchRoutes);
// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Sample route
app.get("/", (req, res) => res.send("API is working"));

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
