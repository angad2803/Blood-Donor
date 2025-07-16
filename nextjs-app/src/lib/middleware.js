import { verifyToken, getTokenFromHeaders } from "./auth.js";
import connectDB from "./mongodb.js";
import User from "../models/User.js";

export async function authenticateUser(request) {
  try {
    const token = getTokenFromHeaders(request);

    if (!token) {
      return { error: "No token provided", status: 401 };
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return { error: "Invalid token", status: 401 };
    }

    await connectDB();
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return { error: "User not found", status: 401 };
    }

    return { user };
  } catch (error) {
    console.error("Authentication error:", error);
    return { error: "Authentication failed", status: 500 };
  }
}

export function createAuthResponse(error, status) {
  return new Response(JSON.stringify({ message: error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
