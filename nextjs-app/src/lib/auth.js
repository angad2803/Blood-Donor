import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../app/api/auth/[...nextauth]/route";
import User from "../models/User";
import connectDB from "./mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const getTokenFromHeaders = (request) => {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
};

export async function getAuthenticatedUser(req) {
  try {
    await connectDB();

    // Method 1: Try NextAuth session first
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const user = await User.findOne({ email: session.user.email });
      if (user) {
        return user;
      }
    }

    // Method 2: Fallback to JWT token from headers (for backward compatibility)
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (user) {
          return user;
        }
      } catch (jwtError) {
        console.log("JWT verification failed:", jwtError.message);
      }
    }

    return null;
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

export function createAuthResponse(
  message = "Authentication required",
  status = 401
) {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
