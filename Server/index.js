import express from "express";
import dotenv from "dotenv";
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
import {
  urgentNotificationQueue,
  donorMatchingQueue,
  emailQueue,
  smsQueue,
} from "./queues/config.js";



dotenv.config();
console.log("🔄 Starting Blood Donor API...");
console.log("📊 Environment:", process.env.NODE_ENV || "development");
console.log(
  "️ Mongo URI:",
  process.env.MONGO_URI ? "✅ Configured" : "❌ Missing"
);

const app = express();


const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
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


app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());


try {
  const { router: bullBoardRouter } = createBullBoardRouter();
  app.use("/admin/queues", bullBoardRouter);
  console.log("✅ Bull Board dashboard mounted at /admin/queues");
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
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("✅ MongoDB connected");
      console.log("Mongo Host:", mongoose.connection.host);
      console.log("Mongo DB:", mongoose.connection.name);
      console.log("Mongo URI:", process.env.MONGO_URI);

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
    } else {
      console.log("⚠️ No MONGO_URI provided, running without database");
    }
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    console.log("⚠️ Continuing without database connection...");
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


connectDB();


app.get("/", (req, res) =>
  res.send("Blood Donor API is working - Queue Dashboard: /admin/queues")
);


export { io };

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
