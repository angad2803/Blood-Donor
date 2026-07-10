import { io } from "socket.io-client";
import { getApiOrigin } from "./runtimeConfig.js";

// Singleton socket instance shared across the entire app.
// This prevents duplicate connections when multiple components import socket.
let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(getApiOrigin(), {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("🔌 Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("⚠️ Socket connection error:", err.message);
    });
  }
  return socket;
};

export default getSocket;
