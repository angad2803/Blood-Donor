import { connectMongoDB } from "../../../lib/mongodb";
import Message from "../../../models/Message";
import jwt from "jsonwebtoken";
import User from "../../../models/User";

export const dynamic = "force-dynamic";

export async function GET(req) {
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

    const url = new URL(req.url);
    const roomId =
      url.searchParams.get("roomId") || url.searchParams.get("requestId");

    if (!roomId) {
      return Response.json(
        { message: "Room ID or Request ID required" },
        { status: 400 }
      );
    }

    // Get messages for the room/request
    const messages = await Message.find({ requestId: roomId })
      .populate("sender", "name")
      .sort({ createdAt: 1 });

    return Response.json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

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
    const { requestId, message, roomId } = body;

    const finalRequestId = requestId || roomId;

    if (!finalRequestId || !message) {
      return Response.json(
        { message: "Request ID and message required" },
        { status: 400 }
      );
    }

    // Create new message
    const newMessage = new Message({
      requestId: finalRequestId,
      sender: decoded.userId,
      message: message,
      createdAt: new Date(),
    });

    await newMessage.save();
    await newMessage.populate("sender", "name");

    return Response.json(newMessage);
  } catch (error) {
    console.error("Send message error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
