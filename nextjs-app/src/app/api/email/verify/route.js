import { connectMongoDB } from "../../../../lib/mongodb";
import User from "../../../../models/User";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    await connectMongoDB();

    // Get token from headers
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return Response.json({ message: "No token provided" }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { email } = body;

    if (!email) {
      return Response.json({ message: "Email is required" }, { status: 400 });
    }

    // Mock email verification process
    // In a real implementation, you would:
    // 1. Generate a verification token
    // 2. Send verification email
    // 3. Store token in database

    const verificationToken = Math.random().toString(36).substring(2, 15);

    console.log(`Mock Email Verification sent to: ${email}`);
    console.log(`Verification token: ${verificationToken}`);

    // For demo purposes, we'll simulate success
    return Response.json({
      message: "Verification email sent successfully",
      email: email,
      verificationToken: verificationToken, // Don't include this in production
      success: true,
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
